import type { AsanaTask, Priority } from '@/lib/data';
import type { AsanaApiTask } from './types';

const AVATAR_COLORS = ['#c9a044', '#4a9ed6', '#4caf82', '#e09a44', '#9b59b6', '#e05252'];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function todayMt(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
}

function parsePriority(task: AsanaApiTask): Priority {
  const field = task.custom_fields?.find(
    (f) => f.name?.toLowerCase() === 'priority',
  );
  const raw =
    field?.enum_value?.name?.toLowerCase() ??
    field?.display_value?.toLowerCase() ??
    '';
  if (raw.includes('critical') || raw.includes('urgent')) return 'critical';
  if (raw.includes('high')) return 'high';
  if (raw.includes('low')) return 'low';
  return 'medium';
}

function formatDueLabel(dueOn: string | null | undefined, status: AsanaTask['status']): string {
  if (!dueOn) return 'No due date';
  const today = todayMt();
  if (dueOn === today) return 'Today';
  const due = new Date(`${dueOn}T12:00:00`);
  const now = new Date(`${today}T12:00:00`);
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 1) return `In ${diffDays} days`;
  return dueOn;
}

function resolveStatus(
  completed: boolean | undefined,
  dueOn: string | null | undefined,
): AsanaTask['status'] {
  if (completed) return 'upcoming';
  const today = todayMt();
  if (!dueOn) return 'in-progress';
  if (dueOn < today) return 'overdue';
  if (dueOn === today) return 'due-today';
  return 'upcoming';
}

function sectionName(task: AsanaApiTask): string {
  const section = task.memberships?.find((m) => m.section?.name)?.section?.name;
  return section ?? 'General';
}

export function mapAsanaTaskToDashboard(task: AsanaApiTask): AsanaTask {
  const status = resolveStatus(task.completed, task.due_on ?? null);
  const assignee = task.assignee?.name ?? 'Unassigned';
  const initials = assignee
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: task.gid,
    title: task.name,
    project: sectionName(task),
    assignee,
    dueDate: formatDueLabel(task.due_on, status),
    priority: parsePriority(task),
    status: task.completed ? 'upcoming' : status,
    flagged: false,
    subtasks: task.num_subtasks ?? undefined,
    completedSubtasks: task.num_completed_subtasks ?? undefined,
    // stash for UI links — extend type later if needed
    ...(task.permalink_url ? { permalinkUrl: task.permalink_url } : {}),
    assigneeInitials: initials,
    assigneeColor: hashColor(assignee),
  } as AsanaTask & { permalinkUrl?: string; assigneeInitials?: string; assigneeColor?: string };
}

/** Sort: overdue → due today → in progress → upcoming; then by due date. */
export function sortAsanaTasks(tasks: AsanaTask[]): AsanaTask[] {
  const order: Record<AsanaTask['status'], number> = {
    overdue: 0,
    'due-today': 1,
    'in-progress': 2,
    upcoming: 3,
  };
  return [...tasks].sort((a, b) => {
    const sd = order[a.status] - order[b.status];
    if (sd !== 0) return sd;
    return a.title.localeCompare(b.title);
  });
}
