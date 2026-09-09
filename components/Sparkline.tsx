interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 74,
  height = 30,
  className = "",
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const pad = 3;

  // Generate polyline points
  const points = data
    .map((value, index) => {
      const x = pad + index * ((width - 2 * pad) / (data.length - 1));
      const y =
        height - pad - ((value - min) / (max - min || 1)) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Last point for the circle
  const lastPoint = points.split(" ").pop()?.split(",") || ["0", "0"];

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r="2.1"
        fill="var(--ink)"
      />
    </svg>
  );
}
