"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Column, Task, TeamMember } from "@/lib/types";
import TaskCard from "./TaskCard";

export default function ColumnView({
  column,
  tasks,
  team,
  onOpenTask,
  onToggleDone,
  onAddTask,
  onRename,
  onDelete,
}: {
  column: Column;
  tasks: Task[];
  team: TeamMember[];
  onOpenTask: (task: Task) => void;
  onToggleDone: (task: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(column.name);

  const teamById = new Map(team.map((m) => [m.id, m]));

  function submitNew() {
    const t = newTitle.trim();
    if (t) onAddTask(column.id, t);
    setNewTitle("");
    setAdding(false);
  }

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl bg-gray-100">
      <div className="flex items-center justify-between px-3 py-2.5">
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setEditingName(false);
              if (name.trim() && name !== column.name) onRename(column.id, name.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setName(column.name);
                setEditingName(false);
              }
            }}
            className="w-full rounded border border-indigo-300 px-1.5 py-0.5 text-sm font-semibold outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <h2
              onClick={() => setEditingName(true)}
              className="cursor-text text-sm font-semibold text-gray-700"
            >
              {column.name}
            </h2>
            <span className="rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-500">
              {tasks.length}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            if (confirm(`Delete column "${column.name}" and all its tasks?`))
              onDelete(column.id);
          }}
          className="text-gray-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          title="Delete column"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`board-scroll flex-1 space-y-2 overflow-y-auto px-2 pb-2 transition-colors ${
          isOver ? "bg-indigo-50" : ""
        }`}
        style={{ minHeight: 40 }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={task.assignee_id ? teamById.get(task.assignee_id) : undefined}
              onOpen={onOpenTask}
              onToggleDone={onToggleDone}
            />
          ))}
        </SortableContext>

        {adding ? (
          <div className="rounded-lg border border-indigo-300 bg-white p-2">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitNew();
                }
                if (e.key === "Escape") {
                  setNewTitle("");
                  setAdding(false);
                }
              }}
              placeholder="Task title..."
              rows={2}
              className="w-full resize-none text-sm outline-none"
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={submitNew}
                className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setNewTitle("");
                  setAdding(false);
                }}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="m-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add task
        </button>
      )}
    </div>
  );
}
