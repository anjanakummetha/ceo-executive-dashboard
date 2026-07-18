/** Raw Asana task shape from Composio (partial). */
export interface AsanaApiTask {
  gid: string;
  name: string;
  completed?: boolean;
  due_on?: string | null;
  due_at?: string | null;
  permalink_url?: string;
  assignee?: { name?: string; gid?: string } | null;
  memberships?: Array<{
    project?: { gid?: string; name?: string };
    section?: { gid?: string; name?: string };
  }>;
  custom_fields?: Array<{
    name?: string;
    display_value?: string | null;
    enum_value?: { name?: string } | null;
    number_value?: number | null;
  }>;
  num_subtasks?: number;
  num_completed_subtasks?: number;
}

export interface AsanaProjectRef {
  gid: string;
  name: string;
  workspace_gid?: string;
  workspace_name?: string;
}
