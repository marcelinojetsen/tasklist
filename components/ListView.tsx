"use client";

import type { Column, Project, Task, TeamMember } from "@/lib/types";
import { formatDate, getPriority, initials, isOverdue, labelColor } from "@/lib/util";

export default function ListView({
  columns,
  projects,
  tasks,
  team,
  tab,
  onOpenTask,
  onToggleDone,
}: {
  columns: Column[];
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  tab: "ongoing" | "done";
  onOpenTask: (t: Task) => void;
  onToggleDone: (t: Task) => void;
}) {
  const teamById = new Map(team.map((m) => [m.id, m]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // Ongoing = not done, grouped by column in column order.
  // Done    = done, flat list.
  const visible = tasks.filter((t) => (tab === "done" ? t.done : !t.done));

  const groups =
    tab === "ongoing"
      ? columns
          .map((c) => ({
            key: c.id,
            label: c.name,
            rows: visible
              .filter((t) => t.column_id === c.id)
              .sort((a, b) => a.position - b.position),
          }))
          .filter((g) => g.rows.length > 0)
      : [
          {
            key: "done",
            label: "Completed",
            rows: visible.slice().sort((a, b) => a.position - b.position),
          },
        ];

  if (visible.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        {tab === "done" ? "No completed tasks yet." : "Nothing on your plate here 🎉"}
      </div>
    );
  }

  return (
    <div className="board-scroll flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-4">
        {groups.map((g) => (
          <div key={g.key} className="mb-6">
            <div className="mb-1.5 flex items-center gap-2 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {g.label}
              </h3>
              <span className="rounded-full bg-gray-100 px-1.5 text-xs text-gray-400">
                {g.rows.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {g.rows.map((t, i) => (
                <Row
                  key={t.id}
                  task={t}
                  first={i === 0}
                  project={t.project_id ? projectById.get(t.project_id) : undefined}
                  assignee={t.assignee_id ? teamById.get(t.assignee_id) : undefined}
                  onOpen={() => onOpenTask(t)}
                  onToggleDone={() => onToggleDone(t)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  task,
  first,
  project,
  assignee,
  onOpen,
  onToggleDone,
}: {
  task: Task;
  first: boolean;
  project?: Project;
  assignee?: TeamMember;
  onOpen: () => void;
  onToggleDone: () => void;
}) {
  const prio = getPriority(task.priority);
  const overdue = isOverdue(task.due_date, task.done);

  return (
    <div
      onClick={onOpen}
      className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-gray-50 ${
        first ? "" : "border-t border-gray-100"
      }`}
    >
      {/* done toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone();
        }}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          task.done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-gray-300 text-transparent hover:border-emerald-500"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* title */}
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          task.done ? "text-gray-400 line-through" : "text-gray-800"
        }`}
      >
        {task.title}
      </span>

      {/* labels */}
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        {task.labels?.slice(0, 3).map((l) => {
          const c = labelColor(l);
          return (
            <span
              key={l}
              className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ color: c.color, backgroundColor: c.bg }}
            >
              {l}
            </span>
          );
        })}
      </div>

      {/* project */}
      {project && (
        <span className="hidden shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 md:inline">
          {project.name}
        </span>
      )}

      {/* priority */}
      {prio && (
        <span
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ color: prio.color, backgroundColor: prio.bg }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: prio.dot }} />
          {prio.label}
        </span>
      )}

      {/* due date */}
      {task.due_date && (
        <span
          className={`hidden shrink-0 text-xs sm:inline ${
            overdue ? "font-semibold text-red-500" : "text-gray-400"
          }`}
        >
          {formatDate(task.due_date)}
        </span>
      )}

      {/* assignee */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        {assignee ? (
          <span
            title={assignee.name}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{ backgroundColor: assignee.color }}
          >
            {initials(assignee.name)}
          </span>
        ) : null}
      </span>
    </div>
  );
}
