'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { Heart, Dumbbell, Droplets, ChevronLeft, ChevronRight, Plus, Sparkles, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { healthLogs, performanceInsights } from '@/lib/data';

function Ring({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }} />
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, max, unit, color }: { icon: ElementType; label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span style={{ color: '#888', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
        <div className="relative">
          <Ring value={value} max={max} color={color} size={44} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color }}>{pct}%</div>
        </div>
      </div>
      <div>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, lineHeight: 1 }}>{value.toLocaleString()}<span style={{ fontSize: '11px', color: '#888', fontWeight: 400, marginLeft: 2 }}>{unit}</span></div>
        <div style={{ color: '#666', fontSize: '10px', marginTop: 2 }}>Goal: {max.toLocaleString()} {unit}</div>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
    </div>
  );
}

// Derive a simple readiness score (0-100) from today's log
function computeReadiness(log: typeof healthLogs[0]): { score: number; label: string; color: string; factors: string[] } {
  let score = 50;
  const factors: string[] = [];

  const sleepPct = log.sleep / log.sleepGoal;
  if (sleepPct >= 0.9) { score += 20; factors.push('Good sleep ✓'); }
  else if (sleepPct >= 0.75) { score += 8; factors.push('Adequate sleep'); }
  else { score -= 10; factors.push('Sleep deficit — consider caffeine strategy'); }

  if (log.workout) { score += 15; factors.push('Workout complete ✓'); }
  else { score -= 5; factors.push('No workout logged yet today'); }

  const proteinPct = log.protein / log.proteinGoal;
  if (proteinPct >= 0.5) { score += 8; } else { factors.push('Protein low — energy dip risk by 3 PM'); }

  const waterPct = log.water / log.waterGoal;
  if (waterPct >= 0.4) { score += 7; } else { score -= 5; factors.push('Hydration low'); }

  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? 'Peak Ready' : score >= 60 ? 'Good' : score >= 45 ? 'Moderate' : 'Low';
  const color = score >= 80 ? '#4caf82' : score >= 60 ? '#4a9ed6' : score >= 45 ? '#e09a44' : '#e05252';
  return { score, label, color, factors };
}

// Compute burn risk (0-100)
function computeBurnout(logs: typeof healthLogs): { risk: number; label: string; color: string } {
  const avgSleep = logs.reduce((s, l) => s + l.sleep, 0) / logs.length;
  const workoutDays = logs.filter(l => l.workout).length;
  let risk = 30;
  if (avgSleep < 6.5) risk += 25;
  if (workoutDays === 0) risk += 20;
  if (logs[0].steps && logs[0].steps < 3000) risk += 10;
  risk = Math.min(risk, 95);
  const label = risk >= 70 ? 'High Risk' : risk >= 45 ? 'Moderate' : 'Low';
  const color = risk >= 70 ? '#e05252' : risk >= 45 ? '#e09a44' : '#4caf82';
  return { risk, label, color };
}

export default function HealthPanel() {
  const [dayIdx, setDayIdx] = useState(0);
  const [tab, setTab] = useState<'logs' | 'insights'>('logs');
  const log = healthLogs[dayIdx];
  const readiness = computeReadiness(healthLogs[0]);
  const burnout = computeBurnout(healthLogs);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div style={{ background: '#3d3d3d', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 12, padding: '14px 16px' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} style={{ color: '#e05252' }} />
            </div>
            <div>
              <div style={{ color: '#e05252', fontSize: '10px', fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' }}>Health &amp; Wellness</div>
              <div style={{ color: '#888', fontSize: '11px' }}>Personal performance tracking</div>
            </div>
          </div>

          {/* Deep work readiness */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: readiness.color, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{readiness.score}</div>
              <div style={{ color: '#666', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Readiness</div>
            </div>
            <div className="relative">
              <Ring value={readiness.score} max={100} color={readiness.color} size={50} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} style={{ color: readiness.color }} />
              </div>
            </div>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-3 gap-2">
          <div style={{ background: `${readiness.color}12`, border: `1px solid ${readiness.color}30`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: readiness.color, fontSize: '12px', fontWeight: 800 }}>{readiness.label}</div>
            <div style={{ color: '#666', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Deep Work</div>
          </div>
          <div style={{ background: `${burnout.color}12`, border: `1px solid ${burnout.color}30`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: burnout.color, fontSize: '12px', fontWeight: 800 }}>{burnout.label}</div>
            <div style={{ color: '#666', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Burnout Risk</div>
          </div>
          <div style={{ background: 'rgba(201,160,68,0.1)', border: '1px solid rgba(201,160,68,0.25)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ color: '#c9a044', fontSize: '12px', fontWeight: 800 }}>{log.sleep}h</div>
            <div style={{ color: '#666', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>Last Sleep</div>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ background: '#2e2e2e', border: '1px solid rgba(201,160,68,0.15)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '0 12px' }}>
          {([
            { key: 'logs', label: 'Daily Logs', icon: Heart },
            { key: 'insights', label: 'AI Insights', icon: Sparkles },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: tab === key ? 700 : 500, color: tab === key ? '#c9a044' : '#666', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #c9a044' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}>
              <Icon size={12} />
              {label}
            </button>
          ))}

          {/* Day navigation */}
          <div className="flex items-center gap-1 ml-auto mr-2">
            <button onClick={() => setDayIdx(p => Math.min(p + 1, healthLogs.length - 1))} disabled={dayIdx >= healthLogs.length - 1} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dayIdx >= healthLogs.length - 1 ? 'not-allowed' : 'pointer', opacity: dayIdx >= healthLogs.length - 1 ? 0.4 : 1 }}>
              <ChevronLeft size={11} style={{ color: '#888' }} />
            </button>
            <span style={{ color: '#c9a044', fontSize: '10px', fontWeight: 700, minWidth: 52, textAlign: 'center' }}>{log.date}</span>
            <button onClick={() => setDayIdx(p => Math.max(p - 1, 0))} disabled={dayIdx <= 0} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dayIdx <= 0 ? 'not-allowed' : 'pointer', opacity: dayIdx <= 0 ? 0.4 : 1 }}>
              <ChevronRight size={11} style={{ color: '#888' }} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'logs' && (
            <div className="slide-in space-y-3">
              {/* Quick stats */}
              <div style={{ background: 'rgba(201,160,68,0.06)', border: '1px solid rgba(201,160,68,0.18)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: 'Weight', value: log.weight ? `${log.weight} lbs` : '—', color: '#c9a044' },
                  { label: 'Sleep', value: `${log.sleep}h`, color: '#4caf82' },
                  { label: 'Steps', value: log.steps?.toLocaleString() ?? '—', color: '#4a9ed6' },
                  { label: 'Calories', value: log.calories.toString(), color: '#e09a44' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div style={{ color: s.color, fontSize: '14px', fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Readiness factors */}
              {dayIdx === 0 && (
                <div style={{ background: `${readiness.color}08`, border: `1px solid ${readiness.color}25`, borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ color: readiness.color, fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Deep Work Readiness Factors</p>
                  {readiness.factors.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: readiness.color, flexShrink: 0 }} />
                      <span style={{ color: '#bbb', fontSize: '11px' }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <MetricCard icon={Dumbbell} label="Protein" value={log.protein} max={log.proteinGoal} unit="g" color="#c9a044" />
                <MetricCard icon={Droplets} label="Water" value={log.water} max={log.waterGoal} unit="oz" color="#4a9ed6" />
              </div>

              {/* Workout log */}
              {log.workout ? (
                <div style={{ background: 'rgba(201,160,68,0.07)', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 10, padding: '10px 12px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell size={12} style={{ color: '#c9a044' }} />
                      <span style={{ color: '#c9a044', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{log.workout.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ background: log.workout.intensity === 'intense' ? 'rgba(224,82,82,0.15)' : 'rgba(201,160,68,0.15)', color: log.workout.intensity === 'intense' ? '#e05252' : '#c9a044', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{log.workout.intensity}</span>
                      <span style={{ color: '#888', fontSize: '11px' }}>{log.workout.duration} min</span>
                    </div>
                  </div>
                  {log.workout.exercises && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {log.workout.exercises.map(ex => (
                        <span key={ex} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px 6px', color: '#bbb', fontSize: '10px' }}>{ex}</span>
                      ))}
                    </div>
                  )}
                  {log.workout.notes && <p style={{ color: '#d0c090', fontSize: '11px', fontStyle: 'italic' }}>🏆 {log.workout.notes}</p>}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
                  <Plus size={13} style={{ color: '#666' }} />
                  <span style={{ color: '#666', fontSize: '12px' }}>Log today&apos;s workout</span>
                </div>
              )}
            </div>
          )}

          {tab === 'insights' && (
            <div className="slide-in space-y-3">
              {performanceInsights.map(insight => {
                const TrendIcon = insight.trend === 'positive' ? TrendingUp : insight.trend === 'negative' ? TrendingDown : Minus;
                const trendColor = insight.trend === 'positive' ? '#4caf82' : insight.trend === 'negative' ? '#e05252' : '#888';
                return (
                  <div key={insight.id} style={{ background: 'linear-gradient(135deg, rgba(18,18,28,0.95) 0%, rgba(30,26,45,0.95) 100%)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={11} style={{ color: '#8b5cf6' }} />
                        <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 700 }}>{insight.title}</span>
                      </div>
                      <TrendIcon size={13} style={{ color: trendColor, flexShrink: 0 }} />
                    </div>
                    <p style={{ color: '#c0b8e0', fontSize: '12px', lineHeight: 1.5, marginBottom: 6 }}>{insight.correlation}</p>
                    <p style={{ color: '#888', fontSize: '11px', lineHeight: 1.4, fontStyle: 'italic', marginBottom: 6 }}>{insight.dataPoints}</p>
                    <div style={{ background: 'rgba(201,160,68,0.08)', border: '1px solid rgba(201,160,68,0.2)', borderRadius: 6, padding: '6px 8px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: '#c9a044', fontSize: '10px', flexShrink: 0, marginTop: 1 }}>→</span>
                      <p style={{ color: '#d0c080', fontSize: '11px', lineHeight: 1.4 }}>{insight.recommendation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
