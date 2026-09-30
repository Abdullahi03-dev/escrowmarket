/** SecureMarket brand mark — monochrome "held S" monogram.
 *  One component everywhere: nav, auth, dashboard, footer, favicon. */

const S_PATH =
  'M45 21c-4-5-13-7-20-3-8 4-8 11-1 14l14 6c7 3 7 10-1 14-7 4-16 2-20-3';

export function LogoMark({
  size = 28,
  inverted = false,
}: {
  size?: number;
  inverted?: boolean;
}) {
  const tile = inverted ? '#ffffff' : '#0a0a0a';
  const ink = inverted ? '#0a0a0a' : '#ffffff';
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="SecureMarket">
        <rect width="64" height="64" fill={tile} />
        <path
          d={S_PATH}
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* escrow ledger line */}
        <rect x="20" y="53" width="24" height="3" fill={ink} opacity="0.55" />
      </svg>
    </span>
  );
}

export function Logo({
  size = 28,
  inverted = false,
  withWordmark = true,
}: {
  size?: number;
  inverted?: boolean;
  withWordmark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} inverted={inverted} />
      {withWordmark && (
        <span
          className={`text-[15px] font-semibold tracking-tight ${
            inverted ? 'text-white' : ''
          }`}
        >
          SecureMarket
        </span>
      )}
    </span>
  );
}
