export type TeamMember = {
  id: string;
  name: string;
  color: string;
  created_at: string;
};

export type Column = {
  id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  column_id: string | null;
  assignee_id: string | null;
  position: number;
  start_date: string | null;
  due_date: string | null;
  done: boolean;
  created_at: string;
};
