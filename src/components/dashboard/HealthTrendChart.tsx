'use client';

import type { HealthLog } from '@/lib/data';

type ChartMetric = 'protein' | 'water' | 'workout';

function formatDayLabel(dateStr: string, rangeDays: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  if (rangeDays <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Denver' });
  }
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', timeZone: 'America/Denver' });
}

function metricValue(log: HealthLog, metric: ChartMetric): number {
  if (metric === 'protein') return log.protein;
  if (metric === 'water') return log.water;
  return log.workout?.duration ?? 0;
}

function metricGoal(log: HealthLog, metric: ChartMetric): number | undefined {
  if (metric === 'protein') return log.proteinGoal;
  if (metric === 'water') return log.waterGoal;
  return 60;
}

export default function HealthTrendChart({
  title,
  unit,
  metric,
  color,
  logs,
  rangeDays,
}: {
  title: string;
  unit: string;
  metric: ChartMetric;
  color: string;
  logs: HealthLog[];
  rangeDays: number;
}) {
  const goal = logs[logs.length - 1] ? metricGoal(logs[logs.length - 1], metric) : undefined;
  const maxVal = Math.max(
    goal ?? 0,
    ...logs.map((l) => metricValue(l, metric)),
    metric === 'workout' ? 1 : 10,
  );

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '12px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{title}</span>
        {goal != null && metric !== 'workout' && (
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Goal {goal}{unit}</span>
        )}
      </div>
      <div className="flex items-end gap-1" style={{ height: 100 }}>
        {logs.map((log) => {
          const val = metricValue(log, metric);
          const pct = maxVal > 0 ? Math.min(val / maxVal, 1) : 0;
          const hitGoal = goal != null && metric !== 'workout' && val >= goal;
          return (
            <div
              key={log.date}
              className="flex-1 flex flex-col items-center justify-end min-w-0"
              title={`${log.date}: ${val}${unit}${log.workout && metric === 'workout' ? ` (${log.workout.type})` : ''}`}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${Math.max(pct * 88, val > 0 ? 6 : 2)}px`,
                  background: hitGoal ? color : `${color}99`,
                  borderRadius: '4px 4px 0 0',
                  border: metric === 'workout' && val > 0 ? `1px solid ${color}` : 'none',
                }}
              />
              <span
                style={{
                  color: 'var(--text-faint)',
                  fontSize: rangeDays <= 7 ? 9 : 8,
                  marginTop: 4,
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                {formatDayLabel(log.date, rangeDays)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2" style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        <span>
          Total: {logs.reduce((s, l) => s + metricValue(l, metric), 0).toLocaleString()}
          {unit}
        </span>
        <span>
          Avg:{' '}
          {logs.length
            ? Math.round(logs.reduce((s, l) => s + metricValue(l, metric), 0) / logs.length)
            : 0}
          {unit}/day
        </span>
      </div>
    </div>
  );
}
