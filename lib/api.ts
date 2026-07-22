import { supabase } from "./supabase";
import type { Column, Project, Task, TeamMember } from "./types";

// ---------- Projects ----------
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(name: string, position: number) {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, position })
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

// ---------- Columns ----------
export async function fetchColumns(): Promise<Column[]> {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createColumn(name: string, position: number) {
  const { data, error } = await supabase
    .from("columns")
    .insert({ name, position })
    .select()
    .single();
  if (error) throw error;
  return data as Column;
}

export async function renameColumn(id: string, name: string) {
  const { error } = await supabase.from("columns").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteColumn(id: string) {
  const { error } = await supabase.from("columns").delete().eq("id", id);
  if (error) throw error;
}

export async function updateColumnPositions(cols: { id: string; position: number }[]) {
  await Promise.all(
    cols.map((c) =>
      supabase.from("columns").update({ position: c.position }).eq("id", c.id)
    )
  );
}

// ---------- Tasks ----------
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(input: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, patch: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTaskPositions(
  tasks: { id: string; column_id: string; position: number }[]
) {
  await Promise.all(
    tasks.map((t) =>
      supabase
        .from("tasks")
        .update({ column_id: t.column_id, position: t.position })
        .eq("id", t.id)
    )
  );
}

// ---------- Team ----------
export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createMember(name: string, color: string) {
  const { data, error } = await supabase
    .from("team_members")
    .insert({ name, color })
    .select()
    .single();
  if (error) throw error;
  return data as TeamMember;
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) throw error;
}
