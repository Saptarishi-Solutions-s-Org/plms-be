export function formatLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function sortRoleMatrix(roleMap: Record<string, any>) {
  return Object.values(roleMap)
    .map((role: any) => ({
      ...role,
      modules: Object.fromEntries(
        Object.entries(role.modules).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      ),
    }))
    .sort((a: any, b: any) => a.role.localeCompare(b.role));
}