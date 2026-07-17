export const REPORT_STATUSES = {
  active: "active",
  inactive: "inactive",
  qualified: "qualified",
} as const;

export const normalizeReportFilter = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const isValidReportDate = (value: string | null) => {
  if (value === null) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
