import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { SessionGuard, type AuthedRequest } from './session.guard';
import { CurrentUser } from './current-user.decorator';
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
} from './auth.utils';
import type { User } from '../entities/user.entity';

function setSessionCookie(res: Response, raw: string) {
  res.cookie(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 3600 * 1000,
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, sessionToken, verification } =
      await this.auth.register(dto);
    setSessionCookie(res, sessionToken);
    return { user, verification };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, sessionToken } = await this.auth.login(dto);
    setSessionCookie(res, sessionToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw: string | undefined = (req as AuthedRequest).cookies?.[SESSION_COOKIE];
    await this.auth.logout(raw);
    clearSessionCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  async me(@CurrentUser() user: User) {
    return { user };
  }

  @Patch('onboarding')
  @UseGuards(SessionGuard)
  async onboarding(
    @CurrentUser() user: User,
    @Body() dto: OnboardingDto,
  ) {
    const updated = await this.auth.completeOnboarding(user.id, dto);
    return { user: updated };
  }

  @Patch('profile')
  @UseGuards(SessionGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.auth.updateProfile(user.id, dto);
    return { user: updated };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async changePassword(
    @CurrentUser() user: User,
    @Req() req: AuthedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      req.sessionToken,
    );
  }

  @Get('sessions')
  @UseGuards(SessionGuard)
  async listSessions(
    @CurrentUser() user: User,
    @Req() req: AuthedRequest,
  ) {
    const sessions = await this.auth.listSessions(user.id, req.sessionToken);
    return { sessions };
  }

  @Delete('sessions/others')
  @UseGuards(SessionGuard)
  async revokeOthers(
    @CurrentUser() user: User,
    @Req() req: AuthedRequest,
  ) {
    const revoked = await this.auth.revokeOtherSessions(
      user.id,
      req.sessionToken,
    );
    return { ok: true, revoked };
  }

  @Delete('sessions/:id')
  @UseGuards(SessionGuard)
  async revokeSession(
    @CurrentUser() user: User,
    @Req() req: AuthedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.auth.revokeSession(user.id, id, req.sessionToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    return this.auth.verifyEmail(body.token);
  }

  @Get('verify-email')
  async verifyEmailGet(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async resend(@CurrentUser() user: User) {
    return this.auth.resendVerification(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  /** Google OAuth is architected (Account entity) but needs OAuth credentials. */
  @Get('google')
  googleTodo() {
    return {
      ok: false,
      code: 'OAUTH_NOT_CONFIGURED',
      message:
        'Continue with Google requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. ' +
        'Set them and implement the OAuth callback against the Account entity (provider=google).',
    };
  }
}
