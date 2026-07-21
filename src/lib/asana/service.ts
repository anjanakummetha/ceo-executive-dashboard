import type { AsanaTask } from '@/lib/data';
import { executeComposioTool } from '@/lib/composio/client';
import { mapAsanaTaskToDashboard, sortAsanaTasks } from './map-task';
import type { AsanaApiTask, AsanaProjectRef } from './types';

const TASK_OPT_FIELDS = [
  'name',
  'gid',
  'completed',
  'due_on',
  'due_at',
  'permalink_url',
  'assignee.name',
  'memberships.section.name',
  'memberships.project.name',
  'custom_fields.name',
  'custom_fields.display_value',
  'custom_fields.enum_value.name',
  'num_subtasks',
];

const PROJECT_OPT_FIELDS = ['name'];

function shouldUseMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

export async function resolveProjectGid(): Promise<string> {
  const pinned = process.env.ASANA_PROJECT_GID;
  if (pinned) return pinned;

  const projectName = process.env.ASANA_PROJECT_NAME || 'Kory NON-IFG';
  const workspaces = await executeComposioTool<{ data: Array<{ gid: string; name: string }> }>(
    'ASANA_GET_MULTIPLE_WORKSPACES',
    { limit: 50 },
    'asana',
  );
  const wsList = workspaces?.data ?? [];

  for (const ws of wsList) {
    const projects = await executeComposioTool<{ data: Array<{ gid: string; name: string }> }>(
      'ASANA_GET_WORKSPACE_PROJECTS',
      {
        workspace_gid: ws.gid,
        limit: 100,
        opt_fields: PROJECT_OPT_FIELDS,
      },
      'asana',
    );
    const match = (projects?.data ?? []).find((p) => p.name === projectName);
    if (match) return match.gid;
  }

  throw new Error(
    `Asana project "${projectName}" not found. Set ASANA_PROJECT_GID in .env.local.`,
  );
}

export async function fetchAsanaProjectMeta(): Promise<AsanaProjectRef> {
  const gid = await resolveProjectGid();
  const project = await executeComposioTool<{ data: { gid: string; name: string } }>(
    'ASANA_GET_A_PROJECT',
    { project_gid: gid, opt_fields: PROJECT_OPT_FIELDS },
    'asana',
  );
  return {
    gid,
    name: project?.data?.name ?? process.env.ASANA_PROJECT_NAME ?? 'Kory NON-IFG',
  };
}

export async function fetchAsanaTasksFromProject(): Promise<AsanaTask[]> {
  if (shouldUseMockData()) {
    const { asanaTasks } = await import('@/lib/data');
    return asanaTasks;
  }

  const projectGid = await resolveProjectGid();
  const all: AsanaApiTask[] = [];
  let offset: string | undefined;

  do {
    const args: Record<string, unknown> = {
      project_gid: projectGid,
      limit: 100,
      opt_fields: TASK_OPT_FIELDS,
      completed_since: 'now',
    };
    if (offset) args.offset = offset;

    const page = await executeComposioTool<{
      data: AsanaApiTask[];
      next_page?: { offset?: string };
    }>('ASANA_GET_TASKS_FROM_A_PROJECT', args, 'asana');

    const batch = page?.data ?? [];
    all.push(...batch.filter((t) => !t.completed));
    offset = page?.next_page?.offset;
  } while (offset);

  const mapped = all.map(mapAsanaTaskToDashboard);
  return sortAsanaTasks(mapped);
}

export interface AsanaSyncResult {
  tasks: AsanaTask[];
  project: AsanaProjectRef;
  syncedAt: string;
}

export async function syncAsanaBoard(): Promise<AsanaSyncResult> {
  const [tasks, project] = await Promise.all([
    fetchAsanaTasksFromProject(),
    fetchAsanaProjectMeta(),
  ]);
  return {
    tasks,
    project,
    syncedAt: new Date().toISOString(),
  };
}
