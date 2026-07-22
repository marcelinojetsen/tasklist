"use client";

import { useState } from "react";
import type { TeamMember } from "@/lib/types";
import { AVATAR_COLORS, initials } from "@/lib/util";

export default function TeamModal({
  team,
  onClose,
  onAdd,
  onDelete,
}: {
  team: TeamMember[];
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  function add() {
    if (name.trim()) {
      onAdd(name.trim(), color);
      setName("");
      setColor(AVATAR_COLORS[(team.length + 1) % AVATAR_COLORS.length]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Team members</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4 space-y-2">
            {team.length === 0 && (
              <p className="text-sm text-gray-400">No team members yet.</p>
            )}
            {team.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {initials(m.name)}
                  </span>
                  <span className="text-sm text-gray-700">{m.name}</span>
                </div>
                <button
                  onClick={() => onDelete(m.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Remove"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Add member name"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <button
                onClick={add}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition ${
                    color === c ? "ring-2 ring-gray-400 ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
