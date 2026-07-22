"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Column, Project, Task, TeamMember } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import * as api from "@/lib/api";
import ColumnView from "./ColumnView";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import TeamModal from "./TeamModal";
import { PRIORITIES, labelColor } from "@/lib/util";

export default function Board() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string>(""); // "" = All
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [showTeam, setShowTeam] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [fLabels, setFLabels] = useState<string[]>([]);
  const [fAssignee, setFAssignee] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [hideDone, setHideDone] = useState(false);

  // keep a synchronous reference to tasks for drag handlers
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const teamById = useMemo(() => new Map(team.map((m) => [m.id, m])), [team]);

  const allLabels = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => t.labels?.forEach((l) => s.add(l)));
    return Array.from(s).sort();
  }, [tasks]);

  const filtersActive =
    search.trim() !== "" ||
    fLabels.length > 0 ||
    fAssignee !== "" ||
    fPriority !== "" ||
    hideDone;

  const matchesFilters = useCallback(
    (t: Task) => {
      if (activeProject && t.project_id !== activeProject) return false;
      if (hideDone && t.done) return false;
      if (fPriority && t.priority !== fPriority) return false;
      if (fAssignee === "none" && t.assignee_id) return false;
      if (fAssignee && fAssignee !== "none" && t.assignee_id !== fAssignee)
        return false;
      if (fLabels.length && !fLabels.every((l) => t.labels?.includes(l)))
        return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = (t.title + " " + (t.description ?? "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    },
    [activeProject, hideDone, fPriority, fAssignee, fLabels, search]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ---------- initial load ----------
  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured) {
        setError(
          "Supabase environment variables are not set. Create .env.local (see .env.local.example) and restart the dev server."
        );
        setLoading(false);
        return;
      }
      try {
        const [cols, tsk, tm, prj] = await Promise.all([
          api.fetchColumns(),
          api.fetchTasks(),
          api.fetchTeam(),
          api.fetchProjects(),
        ]);
        setColumns(cols);
        setTasks(tsk);
        setTeam(tm);
        setProjects(prj);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tasksInColumn = useCallback(
    (colId: string) =>
      tasks
        .filter((t) => t.column_id === colId && matchesFilters(t))
        .sort((a, b) => a.position - b.position),
    [tasks, matchesFilters]
  );

  function findContainer(id: string): string | null {
    if (columns.some((c) => c.id === id)) return id;
    const t = tasksRef.current.find((x) => x.id === id);
    return t?.column_id ?? null;
  }

  // ---------- drag handlers ----------
  function handleDragStart(e: DragStartEvent) {
    const t = tasksRef.current.find((x) => x.id === e.active.id);
    setActiveTask(t ?? null);
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer)
      return;

    setTasks((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      if (activeIndex < 0) return prev;
      let arr = prev.map((t) =>
        t.id === activeId ? { ...t, column_id: overContainer } : t
      );
      const moved = arr[activeIndex];
      arr = arr.filter((t) => t.id !== activeId);

      let insertAt: number;
      if (overId === overContainer) {
        const lastIdx = arr.reduce(
          (acc, t, i) => (t.column_id === overContainer ? i : acc),
          -1
        );
        insertAt = lastIdx + 1;
      } else {
        insertAt = arr.findIndex((t) => t.id === overId);
        if (insertAt < 0) insertAt = arr.length;
      }
      arr.splice(insertAt, 0, moved);
      return arr;
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const overContainer = findContainer(overId);
    if (!overContainer) return;

    const prev = tasksRef.current;
    let arr = prev.map((t) =>
      t.id === activeId ? { ...t, column_id: overContainer } : t
    );

    if (activeId !== overId && overId !== overContainer) {
      const activeIndex = arr.findIndex((t) => t.id === activeId);
      const overIndex = arr.findIndex((t) => t.id === overId);
      if (activeIndex !== -1 && overIndex !== -1) {
        arr = arrayMove(arr, activeIndex, overIndex);
      }
    }

    // recompute positions per column and persist
    const changed: { id: string; column_id: string; position: number }[] = [];
    for (const col of columns) {
      const inCol = arr
        .filter((t) => t.column_id === col.id)
        .sort((a, b) => arr.indexOf(a) - arr.indexOf(b));
      inCol.forEach((t, i) => {
        const position = (i + 1) * 1000;
        if (t.position !== position || t.column_id !== col.id) {
          t.position = position;
          changed.push({ id: t.id, column_id: col.id, position });
        }
      });
    }

    setTasks(arr.map((t) => ({ ...t })));
    if (changed.length) api.updateTaskPositions(changed).catch(console.error);
  }

  // ---------- task ops ----------
  async function addTask(columnId: string, title: string) {
    const inCol = tasksInColumn(columnId);
    const position = (inCol.length + 1) * 1000;
    try {
      const created = await api.createTask({
        title,
        column_id: columnId,
        position,
        project_id: activeProject || null,
      });
      setTasks((p) => [...p, created]);
    } catch (e: any) {
      alert("Could not add task: " + e.message);
    }
  }

  async function toggleDone(task: Task) {
    setTasks((p) =>
      p.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
    );
    try {
      await api.updateTask(task.id, { done: !task.done });
    } catch (e) {
      // revert on failure
      setTasks((p) =>
        p.map((t) => (t.id === task.id ? { ...t, done: task.done } : t))
      );
    }
  }

  async function saveTask(id: string, patch: Partial<Task>) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try {
      await api.updateTask(id, patch);
    } catch (e: any) {
      alert("Could not save: " + e.message);
    }
  }

  async function removeTask(id: string) {
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (e: any) {
      alert("Could not delete: " + e.message);
    }
  }

  // ---------- column ops ----------
  async function addColumn() {
    const name = prompt("Column name?");
    if (!name?.trim()) return;
    const position = (columns.length + 1) * 1000;
    try {
      const col = await api.createColumn(name.trim(), position);
      setColumns((p) => [...p, col]);
    } catch (e: any) {
      alert("Could not add column: " + e.message);
    }
  }

  async function renameColumn(id: string, name: string) {
    setColumns((p) => p.map((c) => (c.id === id ? { ...c, name } : c)));
    await api.renameColumn(id, name).catch(console.error);
  }

  async function deleteColumn(id: string) {
    setColumns((p) => p.filter((c) => c.id !== id));
    setTasks((p) => p.filter((t) => t.column_id !== id));
    await api.deleteColumn(id).catch(console.error);
  }

  async function addProject() {
    const name = prompt("Project name?");
    if (!name?.trim()) return;
    const position = (projects.length + 1) * 1000;
    try {
      const p = await api.createProject(name.trim(), position);
      setProjects((prev) => [...prev, p]);
      setActiveProject(p.id);
    } catch (e: any) {
      alert("Could not add project: " + e.message);
    }
  }

  // ---------- team ops ----------
  async function addMember(name: string, color: string) {
    try {
      const m = await api.createMember(name, color);
      setTeam((p) => [...p, m]);
    } catch (e: any) {
      alert("Could not add member: " + e.message);
    }
  }

  async function removeMember(id: string) {
    setTeam((p) => p.filter((m) => m.id !== id));
    setTasks((p) =>
      p.map((t) => (t.assignee_id === id ? { ...t, assignee_id: null } : t))
    );
    await api.deleteMember(id).catch(console.error);
  }

  // ---------- render ----------
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading board…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="mb-2 font-semibold">Could not connect to Supabase.</p>
          <p className="mb-3">{error}</p>
          <p className="text-red-600">
            Check that <code>.env.local</code> has your{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and that you ran{" "}
            <code>supabase/schema.sql</code> in the SQL editor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="11" rx="1" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800">My Backlog</h1>
            <p className="text-xs text-gray-400">
              {tasks.length} tasks · {tasks.filter((t) => t.done).length} done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex -space-x-2">
            {team.slice(0, 5).map((m) => (
              <span
                key={m.id}
                title={m.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.name.trim().slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowTeam(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Team
          </button>
          <button
            onClick={addColumn}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Column
          </button>
        </div>
      </header>

      {/* project tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-6 pt-1">
        <ProjectTab
          label="All"
          count={tasks.length}
          active={activeProject === ""}
          onClick={() => setActiveProject("")}
        />
        {projects.map((p) => (
          <ProjectTab
            key={p.id}
            label={p.name}
            count={tasks.filter((t) => t.project_id === p.id).length}
            active={activeProject === p.id}
            onClick={() => setActiveProject(p.id)}
          />
        ))}
        <button
          onClick={addProject}
          className="ml-1 rounded px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Add project"
        >
          + Project
        </button>
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-6 py-2.5">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-56 rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <select
          value={fPriority}
          onChange={(e) => setFPriority(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 outline-none focus:border-indigo-400"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          value={fAssignee}
          onChange={(e) => setFAssignee(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 outline-none focus:border-indigo-400"
        >
          <option value="">All assignees</option>
          <option value="none">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {allLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {allLabels.map((l) => {
              const active = fLabels.includes(l);
              const c = labelColor(l);
              return (
                <button
                  key={l}
                  onClick={() =>
                    setFLabels((prev) =>
                      prev.includes(l)
                        ? prev.filter((x) => x !== l)
                        : [...prev, l]
                    )
                  }
                  className={`rounded px-1.5 py-0.5 text-xs font-semibold transition ${
                    active ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    color: c.color,
                    backgroundColor: c.bg,
                    // @ts-expect-error css var for ring color
                    "--tw-ring-color": c.color,
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}

        <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Hide completed
        </label>

        {filtersActive && (
          <button
            onClick={() => {
              setSearch("");
              setFLabels([]);
              setFAssignee("");
              setFPriority("");
              setHideDone(false);
            }}
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board-scroll group flex flex-1 gap-4 overflow-x-auto p-6">
          {columns.map((col) => (
            <ColumnView
              key={col.id}
              column={col}
              tasks={tasksInColumn(col.id)}
              team={team}
              onOpenTask={setOpenTask}
              onToggleDone={toggleDone}
              onAddTask={addTask}
              onRename={renameColumn}
              onDelete={deleteColumn}
            />
          ))}
          {columns.length === 0 && (
            <div className="text-sm text-gray-400">
              No columns yet — click “+ Column” to start.
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3">
              <TaskCard
                task={activeTask}
                assignee={
                  activeTask.assignee_id
                    ? teamById.get(activeTask.assignee_id)
                    : undefined
                }
                onOpen={() => {}}
                onToggleDone={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTask && (
        <TaskModal
          task={openTask}
          columns={columns}
          team={team}
          projects={projects}
          onClose={() => setOpenTask(null)}
          onSave={saveTask}
          onDelete={removeTask}
          allLabels={allLabels}
        />
      )}

      {showTeam && (
        <TeamModal
          team={team}
          onClose={() => setShowTeam(false)}
          onAdd={addMember}
          onDelete={removeMember}
        />
      )}
    </div>
  );
}

function ProjectTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs ${
          active ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
