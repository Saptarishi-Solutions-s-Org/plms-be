export type ModulePermissions = Record<string, string[]>;

export type WithAuthTokenPayload = {
  type?:        "access";
  userId:       string;
  orgId:        string;
  roleId?:      string;
  role?:        string;
  roles?:       string[];
  permissions?: ModulePermissions; 
  mustChangePassword?: boolean;
  isSuper?:     boolean;
};

export type WithAuthRequirements = {
  roles?:                     string[];
  modules?:                   ModulePermissions;
  allowForcedPasswordChange?: boolean;
};
