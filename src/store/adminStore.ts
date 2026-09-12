import { create } from "zustand";
import { axiosInstance } from "../api/axiosClient";
import type {
  AdminUser,
  AdminRole,
  AdminPermissions,
  AdminStatusFilter,
  AdminRoleFilter,
  AdminFormValues,
} from "../types/admin";

import { useAuthStore } from "./authStore";

export const DEFAULT_PERMISSIONS: AdminPermissions = {
  fleet: { enabled: true, view: true, add: true, edit: true, download: true, delete: false },
  drivers: { enabled: true, view: true, add: true, edit: true, download: true, delete: false },
  rts_checkout: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  inspections: { enabled: true, view: true, add: true, edit: true, download: false, delete: false },
  reports: { enabled: true, view: true, add: false, edit: false, download: true, delete: false },
  dispatch: { enabled: true, view: true, add: true, edit: true, download: true, delete: false },
};

export const OWNER_PERMISSIONS: AdminPermissions = {
  fleet: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  drivers: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  rts_checkout: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  inspections: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  reports: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
  dispatch: { enabled: true, view: true, add: true, edit: true, download: true, delete: true },
};

const INITIAL_ADMINS: AdminUser[] = [];

interface AdminStoreState {
  admins: AdminUser[];
  isLoading: boolean;
  searchQuery: string;
  selectedStationFilter: string;
  statusFilter: AdminStatusFilter;
  roleFilter: AdminRoleFilter;

  // Actions
  fetchAdmins: (targetCompanyId?: string | number) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedStationFilter: (station: string) => void;
  setStatusFilter: (status: AdminStatusFilter) => void;
  setRoleFilter: (role: AdminRoleFilter) => void;

  // CRUD & Operations
  addAdmin: (form: AdminFormValues) => AdminUser;
  createAdminApi: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    station_code: string[];
  }) => Promise<{ success: boolean; message?: string }>;
  updateAdminApi: (
    id: number | string,
    payload: {
      name: string;
      email: string;
      phone: string;
      station_code: string[];
    }
  ) => Promise<{ success: boolean; message?: string }>;
  deleteAdminApi: (id: number | string) => Promise<{ success: boolean; message?: string }>;
  resetAdminPasswordApi: (
    id: number | string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateAdmin: (id: number, form: Partial<AdminFormValues>) => void;
  deleteAdmin: (id: number) => void;
  toggleAdminLogin: (id: number) => void;
  updateAdminPermissions: (id: number, permissions: AdminPermissions) => void;
  resetAdminPassword: (id: number, newPassword: string) => void;
  fetchAdminPermissionsApi: (userId: number | string) => Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }>;
  saveAdminPermissionsApi: (
    userId: number | string,
    permissionJson: any
  ) => Promise<{ success: boolean; message?: string }>;
}

export const useAdminStore = create<AdminStoreState>((set, get) => ({
  admins: INITIAL_ADMINS,
  isLoading: false,
  searchQuery: "",
  selectedStationFilter: "ALL",
  statusFilter: "all",
  roleFilter: "all",

  createAdminApi: async (payload) => {
    try {
      const res = await axiosInstance.post("users/v2/admin", payload);
      if (res.status >= 200 && res.status < 300) {
        await useAdminStore.getState().fetchAdmins();
        return {
          success: true,
          message: res.data?.message || "Admin created successfully",
        };
      }
      return {
        success: false,
        message: res.data?.message || "Failed to create administrator",
      };
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to create administrator";
      return { success: false, message: msg };
    }
  },

  fetchAdmins: async (targetCompanyId?: string | number) => {
    set({ isLoading: true });
    try {
      // 1. Primary endpoint from performance app: user_permissions/v1/all_user_permissions
      let list: any[] = [];
      try {
        const permRes = await axiosInstance.get("user_permissions/v1/all_user_permissions?limit=500");
        const rawPerm = permRes.data?.data || permRes.data;
        if (Array.isArray(rawPerm) && rawPerm.length > 0) {
          list = rawPerm;
        }
      } catch {
        // Fallback if needed
      }

      // 2. Fallback endpoint if all_user_permissions returned empty
      if (list.length === 0) {
        try {
          const res = await axiosInstance.get("users/v1/list_all_active_user_of_company");
          const rawData = res.data?.data || res.data || [];
          list = Array.isArray(rawData) ? rawData : rawData?.users || [];
        } catch {
          // ignore
        }
      }

      // Resolve current selected station's company_id
      const currentCompanyId = String(
        targetCompanyId ||
          useAuthStore.getState().user?.company?.company_id ||
          useAuthStore.getState().user?.company_id ||
          "566"
      );

      // Performance Application Exact Filtering Logic:
      // - !ele.is_deleted
      // - !(ele.type === '4' && ele.permission_upgraded === null)
      // - ele.type !== '3'
      // - Number(ele.type) <= 4
      // - ele.company_ids.some(c => c == currentCompanyId)
      const filtered = list.filter((ele: any) => {
        if (ele.is_deleted) return false;
        if (String(ele.type) === "4" && !ele.permission_upgraded) return false;
        if (String(ele.type) === "3") return false;
        if (ele.type && Number(ele.type) > 4) return false;

        if (Array.isArray(ele.company_ids) && ele.company_ids.length > 0) {
          return ele.company_ids.some(
            (cId: any) => String(cId) === String(currentCompanyId)
          );
        }
        return true;
      });

      // Sort: owner (type 1) first, then admins (type 2), then type 4
      filtered.sort((a: any, b: any) => {
        const typeA = parseInt(a.type || (a.role === "owner" ? "1" : "2"), 10);
        const typeB = parseInt(b.type || (b.role === "owner" ? "1" : "2"), 10);
        return typeA - typeB;
      });

      const mapped: AdminUser[] = filtered.map((item: any) => {
        const firstName = item.first_name || item.name?.split(" ")[0] || "";
        const lastName = item.last_name || item.name?.split(" ").slice(1).join(" ") || "";
        const fullName = item.name || `${firstName} ${lastName}`.trim() || `Admin #${item.id || item.account_id}`;

        const rawType = String(item.type || "");
        const role: AdminRole =
          rawType === "1" || item.role === "owner"
            ? "owner"
            : rawType === "2"
            ? "station_admin"
            : rawType === "3"
            ? "safety_coordinator"
            : "dispatcher";

        const stations = Array.isArray(item.company_ids)
          ? item.company_ids.map(String)
          : [];

        // Performance App: checked: list.login_permission === null ? true : list.login_permission.enabled
        const allowLogin =
          item.login_permission === null
            ? true
            : item.login_permission?.enabled !== undefined
            ? Boolean(item.login_permission.enabled)
            : item.allow_login !== false && item.login_fleet !== false;

        return {
          id: Number(item.id || item.account_id) || Date.now(),
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          email: item.email && item.email !== "*****" ? item.email : "—",
          phone: item.phone && item.phone !== "*****" ? item.phone : "—",
          role: role,
          stations: stations,
          company_ids: item.company_ids,
          type: String(item.type || (role === "owner" ? "1" : "2")),
          login_permission: item.login_permission,
          login_perf: item.login_perf,
          allow_login: allowLogin,
          permission_upgraded: Boolean(item.permission_upgraded),
          last_login: item.last_login || item.updated_at || undefined,
          created_at: item.created_at || item.createdAt || new Date().toISOString(),
          permissions: item.permissions || (role === "owner" ? OWNER_PERMISSIONS : DEFAULT_PERMISSIONS),
        };
      });

      set({ admins: mapped, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedStationFilter: (station) => set({ selectedStationFilter: station }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setRoleFilter: (role) => set({ roleFilter: role }),

  addAdmin: (form) => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    const newAdmin: AdminUser = {
      id: Date.now(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      name: fullName,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.replace(/\D/g, ""),
      role: form.role,
      stations: form.stations.length > 0 ? form.stations : ["QUE2"],
      allow_login: form.allow_login,
      permission_upgraded: false,
      created_at: new Date().toISOString().split("T")[0],
      permissions: DEFAULT_PERMISSIONS,
    };

    set((state) => ({
      admins: [...state.admins, newAdmin],
    }));

    return newAdmin;
  },

  updateAdmin: async (id, form) => {
    // Optimistic local state update
    set((state) => ({
      admins: state.admins.map((admin) => {
        if (admin.id !== id) return admin;
        const firstName = form.firstName !== undefined ? form.firstName.trim() : admin.first_name;
        const lastName = form.lastName !== undefined ? form.lastName.trim() : admin.last_name;
        const fullName = `${firstName} ${lastName}`.trim();

        return {
          ...admin,
          first_name: firstName,
          last_name: lastName,
          name: fullName,
          email: form.email !== undefined ? form.email.trim().toLowerCase() : admin.email,
          phone: form.phone !== undefined ? form.phone.replace(/\D/g, "") : admin.phone,
          role: form.role !== undefined ? form.role : admin.role,
          stations: form.stations !== undefined ? form.stations : admin.stations,
          allow_login: form.allow_login !== undefined ? form.allow_login : admin.allow_login,
        };
      }),
    }));

    try {
      const admin = get().admins.find((a) => a.id === id);
      const fullName = form.firstName && form.lastName ? `${form.firstName.trim()} ${form.lastName.trim()}` : admin?.name;
      await axiosInstance.patch(`users/v1/admin/${id}`, {
        name: fullName,
        email: form.email,
        phone: form.phone ? form.phone.replace(/\D/g, "") : undefined,
        station_code: form.stations,
      });
    } catch {
      await get().fetchAdmins();
    }
  },

  deleteAdmin: async (id) => {
    const admin = get().admins.find((a) => a.id === id);
    if (!admin || admin.role === "owner" || admin.type === "1") return;

    // Optimistic delete
    set((state) => ({
      admins: state.admins.filter((a) => a.id !== id),
    }));

    try {
      await axiosInstance.delete(`users/v1/admin/${id}`);
    } catch {
      await get().fetchAdmins();
    }
  },

  toggleAdminLogin: async (id) => {
    const admin = get().admins.find((a) => a.id === id);
    if (!admin || admin.role === "owner" || admin.type === "1") return;

    const nextStatus = !admin.allow_login;

    // Optimistic toggle
    set((state) => ({
      admins: state.admins.map((a) =>
        a.id === id ? { ...a, allow_login: nextStatus } : a
      ),
    }));

    try {
      await axiosInstance.post("user_permissions/v1/update_allow_signin", {
        user: String(id),
        allow_login: nextStatus,
      });
    } catch {
      // Revert if API failed
      set((state) => ({
        admins: state.admins.map((a) =>
          a.id === id ? { ...a, allow_login: !nextStatus } : a
        ),
      }));
    }
  },

  updateAdminApi: async (id, payload) => {
    try {
      const res = await axiosInstance.patch(`users/v1/admin/${id}`, payload);
      if (res.status >= 200 && res.status < 300) {
        await useAdminStore.getState().fetchAdmins();
        return {
          success: true,
          message: res.data?.message || "Administrator updated successfully",
        };
      }
      return {
        success: false,
        message: res.data?.message || "Failed to update administrator",
      };
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to update administrator";
      return { success: false, message: msg };
    }
  },

  deleteAdminApi: async (id) => {
    try {
      const res = await axiosInstance.delete(`users/v1/admin/${id}`);
      if (res.status >= 200 && res.status < 300) {
        await useAdminStore.getState().fetchAdmins();
        return {
          success: true,
          message: "Administrator removed successfully",
        };
      }
      return {
        success: false,
        message: res.data?.message || "Failed to remove administrator",
      };
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to remove administrator";
      return { success: false, message: msg };
    }
  },

  resetAdminPasswordApi: async (id, newPassword) => {
    try {
      const res = await axiosInstance.patch("users/v1/alter_password", {
        user_id: String(id),
        password: newPassword,
      });
      if (res.status >= 200 && res.status < 300) {
        return {
          success: true,
          message: "Password updated successfully",
        };
      }
      return {
        success: false,
        message: res.data?.message || "Failed to update password",
      };
    } catch (err: any) {
      try {
        const res2 = await axiosInstance.post("/users/v1/user/credentials/reset", {
          user_id: String(id),
          password: newPassword,
        });
        if (res2.status >= 200 && res2.status < 300) {
          return { success: true, message: "Password updated successfully" };
        }
      } catch {
        // ignore
      }
      const msg =
        err.response?.data?.message || err.message || "Failed to update password";
      return { success: false, message: msg };
    }
  },

  updateAdminPermissions: (id, permissions) => {
    set((state) => ({
      admins: state.admins.map((admin) => {
        if (admin.id !== id) return admin;
        return {
          ...admin,
          permissions,
          permission_upgraded: true,
        };
      }),
    }));
  },

  resetAdminPassword: (id, _newPassword) => {
    // In live system, triggers API. Here updates state timestamp
    set((state) => ({
      admins: state.admins.map((admin) => {
        if (admin.id !== id) return admin;
        return {
          ...admin,
          last_login: new Date().toISOString(),
        };
      }),
    }));
  },

  fetchAdminPermissionsApi: async (userId: number | string) => {
    try {
      // 1. Direct get_user_permission from RTS Checkout microservice
      const res = await axiosInstance.get(`users/v1/get_user_permission?user=${userId}`);
      if (res.status >= 200 && res.status < 300) {
        return {
          success: true,
          data: res.data?.data?.[0] || res.data?.data || res.data,
        };
      }
    } catch {
      try {
        const res2 = await axiosInstance.get(`user_permissions/v1/user_permissions?user=${userId}`);
        if (res2.status >= 200 && res2.status < 300) {
          return {
            success: true,
            data: res2.data?.data?.[0] || res2.data?.data || res2.data,
          };
        }
      } catch {
        // ignore
      }
    }
    return { success: false, message: "Could not fetch permissions from RTS Checkout" };
  },

  saveAdminPermissionsApi: async (userId: number | string, permissionJson: any) => {
    try {
      const res = await axiosInstance.post("ubac/v1/add_permissions", {
        user: Number(userId),
        permission_json: permissionJson,
      });
      if (res.status >= 200 && res.status < 300) {
        await useAdminStore.getState().fetchAdmins();
        return { success: true, message: "Permissions saved successfully" };
      }
      return { success: false, message: res.data?.message || "Failed to save permissions" };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || "Failed to save permissions",
      };
    }
  },
}));
