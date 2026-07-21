'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ElementType } from 'react';
import { Heart, Dumbbell, Droplets, Plus, Zap } from 'lucide-react';
import type { HealthLog, WorkoutLog } from '@/lib/data';
import HealthTrendChart from '@/components/dashboard/HealthTrendChart';

function Ring({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
    </svg>
  );
}

function MetricInputCard({
  icon: Icon,
  label,
  value,
  max,
  unit,
  color,
  inputValue,
  onInputChange,
  onAdd,
  onSetTotal,
  onQuickAdd,
  disabled,
}: {
  icon: ElementType;
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onSetTotal: () => void;
  onQuickAdd: (amount: number) => void;
  disabled?: boolean;
}) {
  const quickAdds = label === 'Protein' ? [20, 30, 40] : [8, 16, 24];
  const pct = Math.round((value / max) * 100);

  return (
    <div style={{ background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '12px' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div className="relative">
          <Ring value={value} max={max} color={color} size={44} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color }}>{pct}%</div>
        </div>
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 700 }}>
        {value.toLocaleString()}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: 10 }}>Goal: {max} {unit}</div>

      <div className="flex gap-2 mb-2">
        <input
          type="number"
          min={0}
          step={label === 'Protein' ? 1 : 1}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Enter ${unit}`}
          disabled={disabled}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none"
          style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAdd();
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          style={{
            background: 'rgba(201,160,68,0.15)',
            border: '1px solid rgba(201,160,68,0.35)',
            borderRadius: 6,
            padding: '8px 12px',
            color: 'var(--gold-light)',
            fontSize: 11,
            fontWeight: 700,
            cursor: disabled ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSetTotal}
          title="Set today's total to this amount"
          style={{
            background: 'var(--border-subtle)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '8px 10px',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: disabled ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Set total
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickAdds.map((amt) => (
          <button
            key={amt}
            type="button"
            disabled={disabled}
            onClick={() => onQuickAdd(amt)}
            style={{
              background: 'rgba(201,160,68,0.08)',
              border: '1px solid rgba(201,160,68,0.2)',
              borderRadius: 6,
              padding: '3px 8px',
              color: 'var(--gold-light)',
              fontSize: 10,
              fontWeight: 600,
              cursor: disabled ? 'wait' : 'pointer',
            }}
          >
            +{amt}
          </button>
        ))}
      </div>
    </div>
  );
}

function computeReadiness(log: HealthLog) {
  let score = 50;
  const factors: string[] = [];
  if (log.sleep / log.sleepGoal >= 0.75) { score += 15; factors.push('Sleep logged'); }
  if (log.workout) { score += 15; factors.push('Workout complete'); }
  else factors.push('No workout yet today');
  if (log.protein / log.proteinGoal >= 0.5) score += 10;
  else factors.push('Add protein for steady energy');
  if (log.water / log.waterGoal >= 0.4) score += 10;
  else factors.push('Hydration below target');
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? 'Peak Ready' : score >= 60 ? 'Good' : score >= 45 ? 'Moderate' : 'Low';
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--info)' : score >= 45 ? 'var(--warning)' : 'var(--danger)';
  return { score, label, color, factors };
}

type ChartRange = 'week' | 'month';

export default function HealthPanel() {
  const [log, setLog] = useState<HealthLog | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HealthLog[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>('week');
  const [saving, setSaving] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  const [waterInput, setWaterInput] = useState('');
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutType, setWorkoutType] = useState('Strength');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const rangeDays = chartRange === 'week' ? 7 : 30;

  const loadHistory = useCallback(async (days: number) => {
    const res = await fetch(`/api/health?recent=${days}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.logs) setHistoryLogs(json.logs as HealthLog[]);
  }, []);

  const loadLog = useCallback(async () => {
    const res = await fetch('/api/health', { cache: 'no-store' });
    const json = await res.json();
    if (json.log) setLog(json.log);
  }, []);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  useEffect(() => {
    loadHistory(rangeDays);
  }, [loadHistory, rangeDays, log?.protein, log?.water, log?.workout]);

  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.log) setLog(json.log);
    } finally {
      setSaving(false);
    }
  };

  const parseAmount = (raw: string): number | null => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const submitMetric = async (field: 'protein' | 'water', mode: 'add' | 'set') => {
    const raw = field === 'protein' ? proteinInput : waterInput;
    const amount = parseAmount(raw);
    if (amount == null) return;
    await save({
      [field]: amount,
      [`${field}Mode`]: mode,
    });
    if (field === 'protein') setProteinInput('');
    else setWaterInput('');
  };

  if (!log) {
    return <p style={{ color: 'var(--text-muted)', padding: 24 }}>Loading health log…</p>;
  }

  const readiness = computeReadiness(log);

  const logWorkout = async () => {
    const workout: WorkoutLog = {
      type: workoutType,
      duration: parseInt(workoutDuration, 10) || 30,
      intensity: 'moderate',
      notes: workoutNotes || undefined,
    };
    await save({ workout });
    setShowWorkoutForm(false);
    setWorkoutNotes('');
  };

  return (
    <div className="space-y-4 max-w-[960px] mx-auto">
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 12, padding: '14px 16px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <div style={{ color: 'var(--danger)', fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Health &amp; Wellness</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Today · {log.date} {saving ? '· Saving…' : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: readiness.color, fontSize: '20px', fontWeight: 800 }}>{readiness.score}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 700 }}>READINESS</div>
            </div>
            <Zap size={18} style={{ color: readiness.color }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MetricInputCard
          icon={Dumbbell}
          label="Protein"
          value={log.protein}
          max={log.proteinGoal}
          unit="g"
          color="var(--gold-light)"
          inputValue={proteinInput}
          onInputChange={setProteinInput}
          onAdd={() => submitMetric('protein', 'add')}
          onSetTotal={() => submitMetric('protein', 'set')}
          onQuickAdd={(amt) => save({ protein: amt, proteinMode: 'add' })}
          disabled={saving}
        />
        <MetricInputCard
          icon={Droplets}
          label="Water"
          value={log.water}
          max={log.waterGoal}
          unit="oz"
          color="var(--info)"
          inputValue={waterInput}
          onInputChange={setWaterInput}
          onAdd={() => submitMetric('water', 'add')}
          onSetTotal={() => submitMetric('water', 'set')}
          onQuickAdd={(amt) => save({ water: amt, waterMode: 'add' })}
          disabled={saving}
        />
      </div>

      <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(201,160,68,0.15)', borderRadius: 12, padding: '14px 16px' }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Trends</span>
          <div className="flex gap-1">
            {(['week', 'month'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setChartRange(r)}
                style={{
                  background: chartRange === r ? 'rgba(201,160,68,0.2)' : 'transparent',
                  border: `1px solid ${chartRange === r ? 'rgba(201,160,68,0.5)' : 'var(--border-subtle)'}`,
                  borderRadius: 6,
                  padding: '3px 10px',
                  color: chartRange === r ? 'var(--gold-light)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {r === 'week' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <HealthTrendChart title="Protein" unit="g" metric="protein" color="var(--gold-light)" logs={historyLogs} rangeDays={rangeDays} />
          <HealthTrendChart title="Water" unit="oz" metric="water" color="var(--info)" logs={historyLogs} rangeDays={rangeDays} />
          <HealthTrendChart title="Workouts" unit="min" metric="workout" color="var(--success)" logs={historyLogs} rangeDays={rangeDays} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-panel)', border: '1px solid rgba(201,160,68,0.15)', borderRadius: 12, padding: '14px 16px' }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Workout</span>
          {!log.workout && !showWorkoutForm && (
            <button
              type="button"
              onClick={() => setShowWorkoutForm(true)}
              style={{ background: 'rgba(201,160,68,0.12)', border: '1px solid rgba(201,160,68,0.3)', borderRadius: 6, padding: '4px 10px', color: 'var(--gold-light)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={12} /> Log workout
            </button>
          )}
        </div>

        {log.workout ? (
          <div style={{ background: 'rgba(201,160,68,0.07)', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 8, padding: '12px' }}>
            <p style={{ color: 'var(--gold-primary)', fontSize: 14, fontWeight: 600 }}>{log.workout.type}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{log.workout.duration} min · {log.workout.intensity}</p>
            {log.workout.notes && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>{log.workout.notes}</p>}
          </div>
        ) : showWorkoutForm ? (
          <div className="space-y-3">
            <input
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              placeholder="Workout type"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <input
              type="number"
              value={workoutDuration}
              onChange={(e) => setWorkoutDuration(e.target.value)}
              placeholder="Duration (min)"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <input
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full px-3 py-2 rounded-lg outline-none"
              style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: 13 }}
            />
            <div className="flex gap-2">
              <button type="button" onClick={logWorkout} disabled={saving} style={{ background: 'var(--gold-light)', color: '#ffffff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Save</button>
              <button type="button" onClick={() => setShowWorkoutForm(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No workout logged today yet.</p>
        )}
      </div>

      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Today&apos;s factors</p>
        {readiness.factors.map((f) => (
          <p key={f} style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 2 }}>· {f}</p>
        ))}
        <p style={{ color: 'var(--text-faint)', fontSize: 10, marginTop: 8 }}>AI performance insights coming later.</p>
      </div>
    </div>
  );
}
