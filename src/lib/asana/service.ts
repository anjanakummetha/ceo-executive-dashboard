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

/** Kory's own tasks only — the boards also carry the rest of the team's work. */
const KORY_ASSIGNEE = /\bkory\b/i;

function isKorysTask(task: AsanaApiTask): boolean {
  return KORY_ASSIGNEE.test(task.assignee?.name ?? '');
}

/** Every project in the workspace, so nothing of Kory's stays invisible. */
export async function listWorkspaceProjects(): Promise<AsanaProjectRef[]> {
  const workspaces = await executeComposioTool<{ data: Array<{ gid: string; name: string }> }>(
    'ASANA_GET_MULTIPLE_WORKSPACES',
    { limit: 50 },
    'asana',
  );
  const out: AsanaProjectRef[] = [];
  for (const ws of workspaces?.data ?? []) {
    const projects = await executeComposioTool<{ data: Array<{ gid: string; name: string }> }>(
      'ASANA_GET_WORKSPACE_PROJECTS',
      { workspace_gid: ws.gid, limit: 100, opt_fields: PROJECT_OPT_FIELDS },
      'asana',
    );
    for (const project of projects?.data ?? []) {
      if (project?.gid && !out.some((p) => p.gid === project.gid)) {
        out.push({ gid: project.gid, name: project.name });
      }
    }
  }
  return out;
}

async function fetchTasksForProject(project: AsanaProjectRef): Promise<AsanaTask[]> {
  const collected: AsanaApiTask[] = [];
  let offset: string | undefined;

  do {
    const args: Record<string, unknown> = {
      project_gid: project.gid,
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
    collected.push(...batch.filter((t) => !t.completed && isKorysTask(t)));
    offset = page?.next_page?.offset;
  } while (offset);

  return collected.map((task) => mapAsanaTaskToDashboard(task, project.name));
}

export async function fetchAsanaTasksFromProject(): Promise<AsanaTask[]> {
  if (shouldUseMockData()) {
    const { asanaTasks } = await import('@/lib/data');
    return asanaTasks;
  }

  // Reading only the personal board hid more than half of Kory's open tasks —
  // IFG Tasks, AI ideas and Marketing Content Calendar were all invisible.
  // ASANA_PROJECT_GID now names his personal board for ordering rather than
  // restricting what gets read; set ASANA_SINGLE_PROJECT=true to pin again.
  if (process.env.ASANA_SINGLE_PROJECT === 'true') {
    const gid = await resolveProjectGid();
    const meta = await fetchAsanaProjectMeta();
    return sortAsanaTasks(await fetchTasksForProject({ gid, name: meta.name }));
  }

  const projects = await listWorkspaceProjects();
  const perProject = await Promise.all(
    projects.map(async (project) => {
      try {
        return await fetchTasksForProject(project);
      } catch {
        return [] as AsanaTask[]; // one unreadable board must not empty the tab
      }
    }),
  );
  return sortAsanaTasks(perProject.flat());
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
