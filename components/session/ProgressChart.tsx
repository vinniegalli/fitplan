"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  week: number;
  maxWeight: number;
  totalVolume: number;
  totalReps: number;
  sets: number;
}

interface Props {
  dataPoints: DataPoint[];
  exerciseName: string;
  theme: {
    primary: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
  };
}

export default function ProgressChart({
  dataPoints,
  exerciseName,
  theme,
}: Props) {
  const formatted = dataPoints.map((p) => ({
    ...p,
    label: new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "20px",
      }}
    >
      <h3
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "1.3rem",
          color: theme.primary,
          letterSpacing: "1px",
          marginBottom: "4px",
        }}
      >
        {exerciseName}
      </h3>

      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: theme.muted,
          marginBottom: "16px",
        }}
      >
        Progressão de Carga (kg) — {dataPoints.length} sessões
      </p>

      {/* Load progression line chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={formatted}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={{ stroke: theme.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "0.8rem",
              color: theme.text,
            }}
            labelStyle={{ color: theme.muted }}
            formatter={(v) => [`${v ?? 0} kg`, "Carga máx."]}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke={theme.primary}
            strokeWidth={2}
            dot={{ fill: theme.primary, r: 3 }}
            activeDot={{ r: 5 }}
            name="Carga máx. (kg)"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Volume bar chart */}
      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: theme.muted,
          margin: "16px 0 8px",
        }}
      >
        Volume Total (kg × reps)
      </p>

      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          data={formatted}
          margin={{ top: 0, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis
            dataKey="label"
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={{ stroke: theme.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              fontSize: "0.8rem",
              color: theme.text,
            }}
            formatter={(v) => [Number(v ?? 0).toFixed(0), "Volume"]}
          />
          <Bar
            dataKey="totalVolume"
            fill={theme.primary}
            opacity={0.7}
            radius={[3, 3, 0, 0]}
            name="Volume"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
