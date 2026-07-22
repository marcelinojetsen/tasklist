export const AVATAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** true if due date is in the past (and not today) */
export function isOverdue(due: string | null, done: boolean): boolean {
  if (!due || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due + "T00:00:00") < today;
}

// ---------- Priority ----------
export type PriorityMeta = {
  value: string;
  label: string;
  color: string; // text color
  bg: string; // badge background
  dot: string; // solid accent
};

export const PRIORITIES: PriorityMeta[] = [
  { value: "high", label: "High", color: "#b91c1c", bg: "#fef2f2", dot: "#dc2626" },
  { value: "medium", label: "Medium", color: "#c2410c", bg: "#fff7ed", dot: "#ea580c" },
  { value: "low", label: "Low", color: "#15803d", bg: "#f0fdf4", dot: "#16a34a" },
  { value: "research", label: "Research", color: "#1e40af", bg: "#eff6ff", dot: "#3b82f6" },
];

export function getPriority(value: string | null): PriorityMeta | undefined {
  if (!value) return undefined;
  return PRIORITIES.find((p) => p.value === value);
}

// ---------- Labels ----------
const LABEL_PALETTE = [
  { color: "#3730a3", bg: "#e0e7ff" },
  { color: "#9d174d", bg: "#fce7f3" },
  { color: "#92400e", bg: "#fef3c7" },
  { color: "#065f46", bg: "#d1fae5" },
  { color: "#1e40af", bg: "#dbeafe" },
  { color: "#991b1b", bg: "#fee2e2" },
  { color: "#5b21b6", bg: "#ede9fe" },
  { color: "#115e59", bg: "#ccfbf1" },
];

export function labelColor(name: string): { color: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return LABEL_PALETTE[hash % LABEL_PALETTE.length];
}
