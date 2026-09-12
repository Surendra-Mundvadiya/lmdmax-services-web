import { axiosInstance } from "./axiosClient";
import type {
  Vehicle,
  VehicleFormData,
  VehicleNote,
  VehicleDefectItem,
  VehicleDocItem,
  VehicleFilterParams,
} from "../types/vehicle";

export const vehicleApi = {
  /**
   * Fetch vehicles list using v1 or v2 filtered endpoint
   */
  getVehicles: async (params?: VehicleFilterParams): Promise<Vehicle[]> => {
    try {
      // If advanced filters or search are provided, use v2 endpoint if available, else v1
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status && params.status !== "all") {
        queryParams.append("filters[status]", params.status);
      }
      if (params?.damage_filter && params.damage_filter.length > 0) {
        params.damage_filter.forEach((d) => queryParams.append("filters[damage_severity]", d));
      }
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.offset !== undefined) queryParams.append("offset", String(params.offset));

      const queryStr = queryParams.toString();
      const url = queryStr ? `vehicles/v2/vehicles?${queryStr}` : `vehicles/v1/vehicles?limit=700`;

      const res = await axiosInstance.get(url);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      // Fallback to v1 all_vehicles if v2 filtered vehicles fails
      try {
        const fallbackRes = await axiosInstance.get("vehicles/v1/all_vehicles?limit=500");
        const fallbackData = fallbackRes.data?.data || fallbackRes.data || [];
        return Array.isArray(fallbackData) ? fallbackData : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Fetch all vehicles (bulk list for assignment / select dropdowns)
   */
  getAllVehicles: async (): Promise<Vehicle[]> => {
    try {
      const res = await axiosInstance.get("vehicles/v1/all_vehicles?limit=500");
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch single vehicle by ID
   */
  getVehicleById: async (id: number | string): Promise<Vehicle | null> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/vehicle/${id}`);
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Create a new vehicle (POST vehicles/v1/vehicle)
   */
  createVehicle: async (data: Partial<VehicleFormData> | Partial<Vehicle>): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.post("vehicles/v1/vehicle", data);
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to create vehicle";
      return { success: false, message: msg };
    }
  },

  /**
   * Update existing vehicle (PATCH vehicles/v1/vehicle/:id)
   */
  updateVehicle: async (
    id: number | string,
    data: Partial<VehicleFormData> | Partial<Vehicle>
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.patch(`vehicles/v1/vehicle/${id}`, data);
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to update vehicle";
      return { success: false, message: msg };
    }
  },

  /**
   * Delete vehicle (DELETE vehicles/v1/vehicle/:id)
   */
  deleteVehicle: async (
    id: number | string,
    reason?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await axiosInstance.delete(`vehicles/v1/vehicle/${id}`, {
        data: { reason: reason || "Deleted via Unified Fleet Portal" },
      });
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to delete vehicle";
      return { success: false, message: msg };
    }
  },

  /**
   * Vehicle Notes
   */
  getVehicleNotes: async (vehicleId: number | string): Promise<VehicleNote[]> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/v_notes/all/${vehicleId}`);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  addVehicleNote: async (
    vehicleId: number | string,
    data: { note: string; title?: string }
  ): Promise<{ success: boolean; data?: any }> => {
    try {
      const res = await axiosInstance.post(`vehicles/v1/v_notes/${vehicleId}`, data);
      return { success: true, data: res.data?.data || res.data };
    } catch {
      return { success: false };
    }
  },

  updateVehicleNote: async (
    noteId: number | string,
    data: { note: string; title?: string }
  ): Promise<{ success: boolean; data?: any }> => {
    try {
      const res = await axiosInstance.patch(`vehicles/v1/v_notes/${noteId}`, data);
      return { success: true, data: res.data?.data || res.data };
    } catch {
      return { success: false };
    }
  },

  deleteVehicleNote: async (
    noteId: number | string,
    vehicleId: number | string
  ): Promise<{ success: boolean }> => {
    try {
      await axiosInstance.delete(`vehicles/v1/v_notes/${noteId}?vehicle_id=${vehicleId}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * Vehicle Defects
   */
  getVehicleDefects: async (vehicleId: number | string): Promise<VehicleDefectItem[]> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/vehicle_defects/${vehicleId}`);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Vehicle Documents
   */
  getVehicleDocs: async (vehicleId: number | string): Promise<VehicleDocItem[]> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/docs/${vehicleId}`);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  uploadVehicleDoc: async (
    vehicleId: number | string,
    formData: FormData
  ): Promise<{ success: boolean; data?: any }> => {
    try {
      const res = await axiosInstance.post(`vehicles/v1/docs/insert/${vehicleId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { success: true, data: res.data?.data || res.data };
    } catch {
      return { success: false };
    }
  },

  deleteVehicleDoc: async (docId: number | string): Promise<{ success: boolean }> => {
    try {
      await axiosInstance.delete(`vehicles/v1/docs/${docId}`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  /**
   * Body Damage & Mechanical Issues
   */
  getVehicleDamages: async (
    vehicleId: number | string,
    type: "body" | "mechanical" = "body"
  ): Promise<any[]> => {
    try {
      const res = await axiosInstance.get(`damages/v1/vehicle/${vehicleId}?limit=500&query=${type}`);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  addVehicleDamage: async (
    data: any,
    type: "body" | "mechanical" = "body"
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.post(
        `damages/v1/damage?query=${type}&vehicle_id=${data.vehicle_id}`,
        data
      );
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to add damage/issue record.";
      return { success: false, message: msg };
    }
  },

  updateVehicleDamage: async (
    id: number | string,
    data: any,
    type: "body" | "mechanical" = "body"
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.patch(`damages/v1/damage/${id}?query=${type}`, data);
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update damage/issue record.";
      return { success: false, message: msg };
    }
  },

  deleteVehicleDamage: async (
    id: number | string,
    vehicleId: number | string,
    type: "body" | "mechanical" = "body"
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await axiosInstance.delete(`damages/v1/damages/${id}?query=${type}&vehicle_id=${vehicleId}`);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete damage/issue.";
      return { success: false, message: msg };
    }
  },

  /**
   * Preventive Maintenance (PM)
   */
  getVehiclePreventive: async (vehicleId: number | string): Promise<any[]> => {
    try {
      const res = await axiosInstance.get(`preventive/v1/preventive/vehicle/${vehicleId}`);
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  addVehiclePreventive: async (
    data: any
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.post("preventive/v1/preventive", data);
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to add preventive maintenance log.";
      return { success: false, message: msg };
    }
  },

  updateVehiclePreventive: async (
    id: number | string,
    data: any
  ): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await axiosInstance.patch(`preventive/v1/preventive/${id}`, data);
      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update preventive maintenance log.";
      return { success: false, message: msg };
    }
  },

  deleteVehiclePreventive: async (
    id: number | string,
    vehicleId: number | string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      await axiosInstance.delete(`preventive/v1/preventive/${id}?vehicle_id=${vehicleId}`);
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete maintenance log.";
      return { success: false, message: msg };
    }
  },

  /**
   * Vehicle Timeline Logs
   */
  getVehicleTimeline: async (
    vehicleId: number | string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> => {
    try {
      const res = await axiosInstance.get(
        `vehicle_timeline/v1/timeline_logs/${vehicleId}?limit=${limit}&offset=${offset}`
      );
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
