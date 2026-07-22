"use client";

import { useEffect, useState } from "react";
import type { Column, Project, Task, TeamMember } from "@/lib/types";
import { initials, labelColor, PRIORITIES } from "@/lib/util";

export default function TaskModal({
  task,
  columns,
  team,
  projects,
  onClose,
  onSave,
  onDelete,
  allLabels,
}: {
  task: Task;
  columns: Column[];
  team: TeamMember[];
  projects: Project[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  allLabels: string[];
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [columnId, setColumnId] = useState(task.column_id ?? "");
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [startDate, setStartDate] = useState(task.start_date ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [done, setDone] = useState(task.done);
  const [priority, setPriority] = useState(task.priority ?? "");
  const [labels, setLabels] = useState<string[]>(task.labels ?? []);
  const [labelInput, setLabelInput] = useState("");

  function addLabel(raw: string) {
    const l = raw.trim();
    if (l && !labels.includes(l)) setLabels([...labels, l]);
    setLabelInput("");
  }
  function removeLabel(l: string) {
    setLabels(labels.filter((x) => x !== l));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    onSave(task.id, {
      title: title.trim() || "Untitled",
      description: description.trim() || null,
      column_id: columnId || null,
      project_id: projectId || null,
      assignee_id: assigneeId || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      done,
      priority: priority || null,
      labels,
    });
    onClose();
  }

  const labelSuggestions = allLabels.filter(
    (l) => !labels.includes(l) && l.toLowerCase().includes(labelInput.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <button
            onClick={() => setDone(!done)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition ${
              done
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-gray-300 text-gray-600 hover:border-emerald-500"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {done ? "Completed" : "Mark complete"}
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full text-xl font-semibold text-gray-800 outline-none placeholder:text-gray-300"
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Project">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Column">
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Assignee">
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">None</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </Field>
          </div>

          {assigneeId && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {(() => {
                const m = team.find((x) => x.id === assigneeId);
                if (!m) return null;
                return (
                  <>
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {initials(m.name)}
                    </span>
                    Assigned to {m.name}
                  </>
                );
              })()}
            </div>
          )}

          <Field label="Labels">
            <div className="rounded-lg border border-gray-200 px-2 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {labels.map((l) => {
                  const c = labelColor(l);
                  return (
                    <span
                      key={l}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold"
                      style={{ color: c.color, backgroundColor: c.bg }}
                    >
                      {l}
                      <button
                        onClick={() => removeLabel(l)}
                        className="opacity-60 hover:opacity-100"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addLabel(labelInput);
                    }
                    if (e.key === "Backspace" && !labelInput && labels.length) {
                      removeLabel(labels[labels.length - 1]);
                    }
                  }}
                  placeholder={labels.length ? "" : "Add label, press Enter"}
                  className="min-w-[120px] flex-1 text-sm outline-none"
                />
              </div>
              {labelInput && labelSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2">
                  {labelSuggestions.slice(0, 8).map((l) => {
                    const c = labelColor(l);
                    return (
                      <button
                        key={l}
                        onClick={() => addLabel(l)}
                        className="rounded px-1.5 py-0.5 text-xs font-medium hover:opacity-80"
                        style={{ color: c.color, backgroundColor: c.bg }}
                      >
                        + {l}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail..."
              rows={5}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <button
            onClick={() => {
              if (confirm("Delete this task?")) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="text-sm font-medium text-red-500 hover:text-red-600"
          >
            Delete task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}
