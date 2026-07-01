"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartData {
  name: string;
  [key: string]: any;
}

export function AdminAreaChart({
  data,
  dataKey,
  xAxisKey = "name",
  color = "#9025F2",
}: {
  data: ChartData[];
  dataKey: string;
  xAxisKey?: string;
  color?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              color: "#0F172A",
              fontSize: "11px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#color-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminBarChart({
  data,
  dataKey,
  xAxisKey = "name",
  color = "#9025F2",
}: {
  data: ChartData[];
  dataKey: string;
  xAxisKey?: string;
  color?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey={xAxisKey}
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              color: "#0F172A",
              fontSize: "11px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ["#9025F2", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#64748b"];

export function AdminPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              color: "#0F172A",
              fontSize: "11px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            iconType="circle"
            formatter={(value: any) => <span className="text-[11px] text-slate-500 font-semibold">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
