'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type ChartDataPoint = {
  name: string
  value: number
}

type DashboardChartsProps = {
  membersByRole: ChartDataPoint[]
  hoursByProject: ChartDataPoint[]
  projectLabel?: string
}

const ROLE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b']

function PieTooltip({
  active,
  payload,
  projectLabel,
}: {
  active?: boolean
  payload?: { name?: string; value?: number }[]
  projectLabel?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 shadow-xl">
      <div className="text-zinc-400">
        Project: {projectLabel || 'All Projects'}
      </div>
      <div className="text-zinc-400">Role: {item.name || 'N/A'}</div>
      <div className="mt-1 font-semibold">{item.value ?? 0} members</div>
    </div>
  )
}

export default function DashboardCharts({
  membersByRole,
  hoursByProject,
  projectLabel,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Team Composition</h3>
          <span className="text-xs text-zinc-400">By role</span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={membersByRole}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={4}
              >
                {membersByRole.map((entry, index) => (
                  <Cell key={entry.name} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip projectLabel={projectLabel} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Hours Logged</h3>
          <span className="text-xs text-zinc-400">By project</span>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hoursByProject}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis stroke="#71717a" />
              <Tooltip
                cursor={{ fill: 'rgba(39, 39, 42, 0.4)' }}
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  color: '#e4e4e7',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value) => [`${value ?? 0} hours`, 'Hours']}
                labelFormatter={(label) => `Project: ${label}`}
              />
              <Bar
                dataKey="value"
                name="Hours"
                barSize={28}
                radius={[8, 8, 0, 0]}
                fill="#10b981"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
