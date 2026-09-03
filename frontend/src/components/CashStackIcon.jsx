// Pixel-art stack of cash, drawn on a 16x16 grid so it stays crisp/blocky at small sizes.
export default function CashStackIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="12" height="1" fill="#1F5C38" />
      <rect x="2" y="2" width="12" height="1" fill="#2F8F55" />
      <rect x="2" y="3" width="12" height="1" fill="#2F8F55" />
      <rect x="6" y="3" width="4" height="1" fill="#E8C34D" />
      <rect x="2" y="4" width="12" height="1" fill="#1F5C38" />
      <rect x="1" y="5" width="14" height="1" fill="#1F5C38" />
      <rect x="1" y="6" width="14" height="1" fill="#1F5C38" />
      <rect x="1" y="7" width="14" height="1" fill="#2F8F55" />
      <rect x="1" y="8" width="14" height="1" fill="#2F8F55" />
      <rect x="1" y="9" width="14" height="1" fill="#1F5C38" />
      <rect x="0" y="10" width="16" height="1" fill="#1F5C38" />
      <rect x="0" y="11" width="16" height="1" fill="#2F8F55" />
      <rect x="0" y="12" width="16" height="1" fill="#2F8F55" />
      <rect x="0" y="13" width="16" height="1" fill="#1F5C38" />
    </svg>
  )
}
