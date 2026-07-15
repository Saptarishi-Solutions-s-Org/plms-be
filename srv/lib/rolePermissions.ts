export const canUpdateRoles = (permissions: Record<string, string[]> = {}) => {
  const rolePermissions = [
    ...(permissions.permission ?? []),
    ...(permissions.permissions ?? []),
  ].map((permission) => String(permission).toLowerCase());

  return rolePermissions.some((permission) =>
    ["*", "update", "edit", "updation"].includes(permission),
  );
};
