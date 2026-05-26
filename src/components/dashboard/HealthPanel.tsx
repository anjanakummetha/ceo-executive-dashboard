'use client';

import { useState } from 'react';
import { Heart, Dumbbell, Droplets, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { healthLogs } from '@/lib/data';

function Ring({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

function MetricCard({
  icon: Icon, label, value, max, unit, color, subtitle,
}: {
  icon: React.ElementType; label: string; value: number; max: number; unit: string; color: string; subtitle?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <div className="relative">
          <Ring value={value} max={max} color={color} size={44} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color,
            }}
          >
            {pct}%
          </div>
        </div>
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>
          {value.toLocaleString()}<span style={{ fontSize: '11px', color: '#888', fontWeight: 400, marginLeft: 2 }}>{unit}</span>
        </div>
        <div style={{ color: '#666', fontSize: '10px', marginTop: 2 }}>
          Goal: {max.toLocaleString()} {unit}
        </div>
        {subtitle && <div style={{ color: '#888', fontSize: '10px', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

export default function HealthPanel() {
  const [dayIdx, setDayIdx] = useState(0);
  const log = healthLogs[dayIdx];

  return (
    <div className="card flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="section-header mb-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.3)' }}
            >
              <Heart size={13} style={{ color: '#e05252' }} />
            </div>
            <span className="section-title">Health &amp; Wellness</span>
          </div>

          {/* Day navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDayIdx(prev => Math.min(prev + 1, healthLogs.length - 1))}
              disabled={dayIdx >= healthLogs.length - 1}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: dayIdx >= healthLogs.length - 1 ? 'not-allowed' : 'pointer',
                opacity: dayIdx >= healthLogs.length - 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={12} style={{ color: '#888' }} />
            </button>
            <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
              {log.date}
            </span>
            <button
              onClick={() => setDayIdx(prev => Math.max(prev - 1, 0))}
              disabled={dayIdx <= 0}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: dayIdx <= 0 ? 'not-allowed' : 'pointer',
                opacity: dayIdx <= 0 ? 0.4 : 1,
              }}
            >
              <ChevronRight size={12} style={{ color: '#888' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Quick stats row */}
        <div
          style={{
            background: 'rgba(201,160,68,0.06)',
            border: '1px solid rgba(201,160,68,0.18)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          {log.weight && (
            <div className="text-center">
              <div style={{ color: '#c9a044', fontSize: '14px', fontWeight: 700 }}>{log.weight} lbs</div>
              <div style={{ color: '#888', fontSize: '10px' }}>Weight</div>
            </div>
          )}
          <div className="text-center">
            <div style={{ color: '#4caf82', fontSize: '14px', fontWeight: 700 }}>{log.sleep}h</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Sleep</div>
          </div>
          <div className="text-center">
            <div style={{ color: '#4a9ed6', fontSize: '14px', fontWeight: 700 }}>
              {log.steps?.toLocaleString() ?? '—'}
            </div>
            <div style={{ color: '#888', fontSize: '10px' }}>Steps</div>
          </div>
          <div className="text-center">
            <div style={{ color: '#e05252', fontSize: '14px', fontWeight: 700 }}>{log.calories}</div>
            <div style={{ color: '#888', fontSize: '10px' }}>Calories</div>
          </div>
        </div>

        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetricCard
            icon={Dumbbell}
            label="Protein"
            value={log.protein}
            max={log.proteinGoal}
            unit="g"
            color="#c9a044"
          />
          <MetricCard
            icon={Droplets}
            label="Water"
            value={log.water}
            max={log.waterGoal}
            unit="oz"
            color="#4a9ed6"
          />
        </div>

        {/* Workout log */}
        {log.workout ? (
          <div
            style={{
              background: 'rgba(201,160,68,0.07)',
              border: '1px solid rgba(201,160,68,0.2)',
              borderRadius: 10,
              padding: '10px 12px',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Dumbbell size={12} style={{ color: '#c9a044' }} />
                <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {log.workout.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    background: log.workout.intensity === 'intense' ? 'rgba(224,82,82,0.15)' : 'rgba(201,160,68,0.15)',
                    color: log.workout.intensity === 'intense' ? '#e05252' : '#c9a044',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {log.workout.intensity}
                </span>
                <span style={{ color: '#888', fontSize: '11px' }}>{log.workout.duration} min</span>
              </div>
            </div>

            {log.workout.exercises && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {log.workout.exercises.map(ex => (
                  <span
                    key={ex}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      color: '#bbb',
                      fontSize: '10px',
                    }}
                  >
                    {ex}
                  </span>
                ))}
              </div>
            )}

            {log.workout.notes && (
              <p style={{ color: '#d0c090', fontSize: '11px', fontStyle: 'italic' }}>🏆 {log.workout.notes}</p>
            )}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} style={{ color: '#666' }} />
            <span style={{ color: '#666', fontSize: '12px' }}>Log today&apos;s workout</span>
          </div>
        )}
      </div>
    </div>
  );
}
