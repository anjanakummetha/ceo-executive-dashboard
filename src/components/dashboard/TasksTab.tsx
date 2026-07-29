'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flag, Clock, ExternalLink, RefreshCw, AlertCircle, ListChecks } from 'lucide-react';
import { asanaTasks as mockAsanaTasks, type AsanaTask } from '@/lib/data';
import { taskAnalytics } from '@/lib/analytics/derive';
import { StatTile, MiniBars, PanelHeading } from '@/components/dashboard/ui/StatKit';

const asanaStatusConfig = {
  overdue: { color: 'var(--danger)', bg: 'rgba(224,82,82,0.12)', label: 'OVERDUE' },
  'due-today': { color: 'var(--warning)', bg: 'rgba(224,154,68,0.12)', label: 'DUE TODAY' },
  'in-progress': { color: 'var(--info)', bg: 'rgba(74,158,214,0.12)', label: 'IN PROGRESS' },
  upcoming: { color: 'var(--success)', bg: 'rgba(76,175,130,0.12)', label: 'UPCOMING' },
};

const priorityDots = {
  critical: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--gold-light)',
  low: 'var(--success)',
};

const ASANA_PROJECT_GID = process.env.NEXT_PUBLIC_ASANA_PROJECT_GID ?? '1211141447026980';
const ASANA_PROJECT_URL = `https://app.asana.com/0/${ASANA_PROJECT_GID}/list`;

interface SyncPayload {
  tasks: AsanaTask[];
  project: { gid: string; name: string };
  syncedAt: string;
}

interface SectionGroup {
  section: string;
  tasks: AsanaTask[];
}

interface ProjectGroup {
  project: string;
  tasks: AsanaTask[];
  sections: SectionGroup[];
  overdue: number;
}

const STATUS_RANK: Record<AsanaTask['status'], number> = {
  overdue: 0,
  'due-today': 1,
  'in-progress': 2,
  upcoming: 3,
};

/** Board -> section, most urgent board first. */
function groupByProjectAndSection(tasks: AsanaTask[]): ProjectGroup[] {
  const byProject = new Map<string, AsanaTask[]>();
  for (const task of tasks) {
    const key = task.project || 'Asana';
    const bucket = byProject.get(key);
    if (bucket) bucket.push(task);
    else byProject.set(key, [task]);
  }

  const groups: ProjectGroup[] = [];
  for (const [project, projectTasks] of byProject) {
    const bySection = new Map<string, AsanaTask[]>();
    for (const task of projectTasks) {
      const key = task.section || 'General';
      const bucket = bySection.get(key);
      if (bucket) bucket.push(task);
      else bySection.set(key, [task]);
    }
    const sections = [...bySection.entries()]
      .map(([section, sectionTasks]) => ({
        section,
        tasks: [...sectionTasks].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]),
      }))
      .sort((a, b) => {
        const urgency =
          STATUS_RANK[a.tasks[0]?.status ?? 'upcoming'] -
          STATUS_RANK[b.tasks[0]?.status ?? 'upcoming'];
        return urgency !== 0 ? urgency : a.section.localeCompare(b.section);
      });
    groups.push({
      project,
      tasks: projectTasks,
      sections,
      overdue: projectTasks.filter((t) => t.status === 'overdue').length,
    });
  }

  // Boards with overdue work surface first; ties break on volume.
  return groups.sort((a, b) => b.overdue - a.overdue || b.tasks.length - a.tasks.length);
}

export default function TasksTab() {
  const [asanaItems, setAsanaItems] = useState<AsanaTask[]>([]);
  const [asanaFilter, setAsanaFilter] = useState<'all' | 'overdue' | 'due-today'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Kory NON-IFG');
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/asana/tasks', { cache: 'no-store' });
      const json = (await res.json()) as SyncPayload & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Failed to load Asana tasks');
      setAsanaItems(json.tasks);
      setProjectName(json.project?.name ?? 'Kory NON-IFG');
      setSyncedAt(json.syncedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
      setAsanaItems(mockAsanaTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; loadTasks() is shared with the refresh button so its setLoading must stay (no cascading render)
    loadTasks();
  }, [loadTasks]);

  const toggleAsanaFlag = (id: string) =>
    setAsanaItems((p) => p.map((t) => (t.id === id ? { ...t, flagged: !t.flagged } : t)));

  const filteredAsana = asanaItems.filter((t) => {
    if (asanaFilter === 'overdue') return t.status === 'overdue';
    if (asanaFilter === 'due-today') return t.status === 'due-today';
    return true;
  });

  // Grouped board -> section, so work and personal read separately instead of
  // arriving as one undifferentiated list across every project.
  const grouped = groupByProjectAndSection(filteredAsana);

  const overdueCount = asanaItems.filter((t) => t.status === 'overdue').length;
  const syncedLabel = syncedAt
    ? new Date(syncedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Denver',
      })
    : null;

  const taskStats = taskAnalytics(asanaItems);

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* ── Task Analytics ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(248,245,238,0.5))', backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <PanelHeading icon={<ListChecks size={16} />} title="Task Analytics" subtitle="Personal commitments — Kory NON-IFG" />
        <div style={{ padding: '16px 20px' }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Overdue" value={String(taskStats.overdue)} hint={taskStats.overdue ? `oldest ${taskStats.maxDaysOverdue}d` : 'all clear'} tone={taskStats.overdue > 0 ? 'danger' : 'good'} />
            <StatTile label="Due today" value={String(taskStats.dueToday)} hint="on the clock" tone={taskStats.dueToday > 0 ? 'warn' : 'neutral'} />
            <StatTile label="In progress" value={String(taskStats.inProgress)} hint="active now" />
            <StatTile label="Upcoming" value={String(taskStats.upcoming)} hint="on the horizon" />
          </div>
          {taskStats.byPriority.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>By priority</div>
              <MiniBars items={taskStats.byPriority} />
            </div>
          )}
          <div className="flex items-start gap-2" style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${taskStats.overdue > 0 ? 'var(--danger)' : 'var(--success)'}`, borderRadius: '0 10px 10px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.5 }}>
              {taskStats.overdue > 0 && taskStats.oldestOverdueTitle
                ? `Start with "${taskStats.oldestOverdueTitle}" — ${taskStats.maxDaysOverdue} day${taskStats.maxDaysOverdue === 1 ? '' : 's'} overdue.`
                : taskStats.dueToday > 0
                ? `${taskStats.dueToday} task${taskStats.dueToday === 1 ? '' : 's'} due today — nothing overdue.`
                : 'Nothing overdue — you’re on top of your commitments.'}
            </p>
          </div>
        </div>
      </div>
      <div className="card flex flex-col">
        <div className="p-4 border-b" style={{ borderColor: 'rgba(201,160,68,0.2)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="section-header mb-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
                style={{
                  background: 'rgba(201,160,68,0.15)',
                  border: '1px solid rgba(201,160,68,0.3)',
                  color: 'var(--gold-light)',
                }}
              >
                A
              </div>
              <div>
                <span className="section-title">Asana Tasks</span>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{projectName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {loading && (
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Syncing…</span>
              )}
              {!loading && syncedLabel && (
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Updated {syncedLabel} MT</span>
              )}
              {overdueCount > 0 && (
                <span className="badge-danger">{overdueCount} Overdue</span>
              )}
              <button
                type="button"
                onClick={() => loadTasks()}
                disabled={loading}
                title="Refresh from Asana"
                style={{
                  background: 'rgba(201,160,68,0.1)',
                  border: '1px solid rgba(201,160,68,0.25)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  color: 'var(--gold-light)',
                  fontSize: 11,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              </button>
              <a
                href={ASANA_PROJECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'rgba(201,160,68,0.1)',
                  border: '1px solid rgba(201,160,68,0.25)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  color: 'var(--gold-light)',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(224,82,82,0.08)',
                border: '1px solid rgba(224,82,82,0.25)',
              }}
            >
              <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: 'var(--danger)', fontSize: 11, lineHeight: 1.4 }}>
                {error} — showing fallback data.
              </p>
            </div>
          )}

          <div className="flex gap-1">
            {(['all', 'overdue', 'due-today'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setAsanaFilter(f)}
                style={{
                  background: asanaFilter === f ? 'rgba(201,160,68,0.2)' : 'transparent',
                  border: `1px solid ${asanaFilter === f ? 'rgba(201,160,68,0.5)' : 'var(--border-subtle)'}`,
                  borderRadius: 6,
                  padding: '3px 10px',
                  color: asanaFilter === f ? 'var(--gold-light)' : 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {f === 'due-today' ? 'Due Today' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          {!loading && filteredAsana.length === 0 && (
            <p className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              No tasks match this filter.
            </p>
          )}
          {grouped.map((group) => (
            <div key={group.project}>
              <div
                className="px-4 py-2 flex items-center justify-between sticky top-0 z-10"
                style={{
                  background: 'rgba(201,160,68,0.10)',
                  borderTop: '1px solid rgba(201,160,68,0.22)',
                  borderBottom: '1px solid rgba(201,160,68,0.22)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span
                  style={{
                    color: 'var(--gold-light)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {group.project}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  {group.overdue > 0 && (
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                      {group.overdue} overdue ·{' '}
                    </span>
                  )}
                  {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                </span>
              </div>

              {group.sections.map((sectionGroup) => (
                <div key={`${group.project}-${sectionGroup.section}`}>
                  {/* Only label sections when the board actually uses more than one. */}
                  {group.sections.length > 1 && (
                    <div
                      className="px-4 py-1.5"
                      style={{
                        background: 'rgba(0,0,0,0.02)',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {sectionGroup.section}
                        <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>
                          {' '}
                          · {sectionGroup.tasks.length}
                        </span>
                      </span>
                    </div>
                  )}

                  {sectionGroup.tasks.map((task, idx) => {
                    const sc = asanaStatusConfig[task.status];
                    return (
              <div
                key={task.id}
                style={{
                  borderBottom:
                    idx < sectionGroup.tasks.length - 1
                      ? '1px solid var(--border-subtle)'
                      : 'none',
                  transition: 'all 0.2s',
                }}
                className="px-4 py-3 hover:bg-black/[0.04]"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                    style={{
                      background: priorityDots[task.priority],
                      boxShadow: `0 0 6px ${priorityDots[task.priority]}60`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: 500,
                          lineHeight: 1.3,
                        }}
                      >
                        {task.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleAsanaFlag(task.id)}
                        className="flag-btn flex-shrink-0"
                      >
                        <Flag
                          size={11}
                          fill={task.flagged ? 'var(--gold-light)' : 'none'}
                          style={{ color: task.flagged ? 'var(--gold-light)' : 'var(--text-faint)' }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        style={{
                          background: sc.bg,
                          color: sc.color,
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: `1px solid ${sc.color}40`,
                        }}
                      >
                        {sc.label}
                      </span>
                      {/* The board and section are already the group headers. */}
                      {group.sections.length === 1 && task.section && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          {task.section}
                        </span>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <Clock size={9} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{task.dueDate}</span>
                      </div>
                    </div>
                    {task.subtasks != null && task.subtasks > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            Subtasks: {task.completedSubtasks ?? 0}/{task.subtasks}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            {Math.round(
                              ((task.completedSubtasks ?? 0) / task.subtasks) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${((task.completedSubtasks ?? 0) / task.subtasks) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(201,160,68,0.15)' }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{asanaItems.length} tasks</span>
          <a
            href={ASANA_PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--gold-light)', fontSize: '11px', fontWeight: 600 }}
          >
            Open Asana →
          </a>
        </div>
      </div>
    </div>
  );
}
