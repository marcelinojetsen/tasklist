"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TeamMember } from "@/lib/types";
import { formatDate, initials, isOverdue } from "@/lib/util";

export default function TaskCard({
  task,
  assignee,
  onOpen,
  onToggleDone,
}: {
  task: Task;
  assignee: TeamMember | undefined;
  onOpen: (task: Task) => void;
  onToggleDone: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(task.due_date, task.done);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      className="group cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-indigo-300 hover:shadow active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone(task);
          }}
          title={task.done ? "Mark not done" : "Mark done"}
          className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition ${
            task.done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-300 hover:border-emerald-500"
          }`}
        >
          {task.done && (
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <p
          className={`text-sm leading-snug ${
            task.done ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {task.title}
        </p>
      </div>

      {(task.due_date || task.start_date || assignee) && (
        <div className="mt-2.5 flex items-center justify-between pl-6">
          <div className="flex items-center gap-1.5">
            {task.due_date && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
                  overdue
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
          {assignee && (
            <span
              title={assignee.name}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: assignee.color }}
            >
              {initials(assignee.name)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
