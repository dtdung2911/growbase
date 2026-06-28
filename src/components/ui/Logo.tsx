export function LogoMark({ size = 32 }: { size?: number }) {
  const barWidth = Math.round(size * 0.14)
  const gap = Math.round(size * 0.04)
  const heights = [size * 0.5, size * 0.72, size]
  const radius = Math.max(2, Math.round(size * 0.06))

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * (barWidth + gap)}
          y={size - h}
          width={barWidth}
          height={h}
          rx={radius}
          className="fill-primary"
          opacity={[0.35, 0.68, 1][i]}
        />
      ))}
    </svg>
  )
}
