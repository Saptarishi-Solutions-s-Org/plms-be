// srv/types/withAuth.types.ts

export type ModulePermissions = Record<string, string[]>;

export type WithAuthTokenPayload = {
  userId:       string;
  orgId:        string;
  role?:        string;
  roles?:       string[];
  permissions?: ModulePermissions; 
};

export type WithAuthRequirements = {
  roles?:   string[];
  modules?: ModulePermissions;
};