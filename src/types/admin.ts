export type AdminRole = "owner" | "dispatcher" | "station_admin" | "safety_coordinator" | "manager";

export interface ModulePermission {
  enabled: boolean;
  view: boolean;
  add: boolean;
  edit: boolean;
  download: boolean;
  delete: boolean;
}

export interface AdminPermissions {
  fleet: ModulePermission;
  drivers: ModulePermission;
  rts_checkout: ModulePermission;
  inspections: ModulePermission;
  reports: ModulePermission;
  dispatch: ModulePermission;
}

export interface AdminUser {
  id: number;
  account_id?: number | string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  stations: string[]; // e.g. ["DDF4", "DDF6"]
  company_ids?: (string | number)[];
  type?: string;
  login_permission?: { enabled: boolean; permission: string[] } | null;
  login_perf?: boolean;
  allow_login: boolean;
  permission_upgraded?: boolean;
  last_login?: string;
  created_at?: string;
  permissions: AdminPermissions;
}

export interface AdminFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
  stations: string[];
  password?: string;
  confirmPassword?: string;
  allow_login: boolean;
}

export type AdminStatusFilter = "all" | "active" | "inactive";
export type AdminRoleFilter = "all" | AdminRole;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "alert" | "warning" | "info" | "success";
  category: "dispatch" | "dvic" | "checkout" | "system";
  timestamp: string;
  read: boolean;
  station_code?: string;
  action_label?: string;
  action_url?: string;
}
