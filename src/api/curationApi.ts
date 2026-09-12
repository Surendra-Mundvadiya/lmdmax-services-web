import { perfAxiosInstance, axiosInstance } from "./axiosClient";

export interface RemainingCuration {
  _id: string;
  company_id: string;
  name: string;
  transporter_id: string;
  curation_type: string;
  curation_from: string;
  created_at: string;
  updated_at: string;
}

export interface UnifiedCurationResponse {
  processedCount: number;
  removedCount: number;
  remainingCurations: RemainingCuration[];
}

export interface UnresolvedReport {
  report_id: string;
  target_collection: string;
  _id: string;
  added_at: string;
}

export interface UnresolvedNetradyneCuration {
  _id: string;
  company_ownership_id: string;
  driver_name: string;
  created_at: string;
  netradyne_id: string | null;
  reason: string;
  resolved: boolean;
  company_id: string;
  unresolved_reports: UnresolvedReport[];
  updated_at: string;
}

export interface NetradyneCurationResponse {
  processedCount: number;
  resolvedCount: number;
  updatedCurations: UnresolvedNetradyneCuration[];
}

export interface EmentorCurationItem {
  _id: string;
  name: string;
  driver_id?: string | null;
  company_id?: string;
  curation_type?: string;
  curation_from?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CurationCounts {
  transporter_id: number;
  ementor: number;
  netradyne: number;
  autocoaching: number;
  secondary_channel_name?: string;
  dashboard_version?: string;
  total: number;
}

export interface DriverFromCurationPayload {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  transporter_id?: string;
  netradyne_id?: string;
  address?: string | null;
  hire_date?: string | null;
  date_of_birth?: string | null;
  work_anniversary?: string | null;
  status: "active" | "inactive";
  allow_signin: boolean;
  allow_inspections: boolean;
  station_code: string[];
  fromMainCreation?: boolean;
}

export const curationApi = {
  /**
   * Fetch total pending curations count across all categories.
   * Real endpoint: GET /curation/v3/get-curation-count (performance microservice)
   */
  getCurationCount: async (): Promise<CurationCounts> => {
    try {
      const res = await perfAxiosInstance.get("/curation/v3/get-curation-count");
      const raw = res.data?.data || res.data || {};
      const transporter_id = Number(raw.transporter_id || 0);
      const netradyne = Number(raw.netradyne || 0);
      const ementor = Number(raw.ementor || 0);
      const autocoaching = Number(raw.autocoaching || 0);
      const total =
        raw.total !== undefined
          ? Number(raw.total)
          : transporter_id + netradyne + ementor + autocoaching;

      return {
        transporter_id,
        netradyne,
        ementor,
        autocoaching,
        secondary_channel_name: raw.secondary_channel_name,
        dashboard_version: raw.dashboard_version,
        total,
      };
    } catch (err: any) {
      console.warn("curationApi.getCurationCount note:", err?.message);
      return {
        transporter_id: 0,
        netradyne: 0,
        ementor: 0,
        autocoaching: 0,
        total: 0,
      };
    }
  },

  /**
   * Fetch pending Unified (Transporter ID) curations.
   * Real endpoint: GET /curation/v3/get_curation
   */
  getUnifiedCurations: async (): Promise<UnifiedCurationResponse> => {
    const res = await perfAxiosInstance.get("/curation/v3/get_curation");
    const data = res.data?.data || res.data || {};
    return {
      processedCount: Number(data.processedCount || 0),
      removedCount: Number(data.removedCount || 0),
      remainingCurations: Array.isArray(data.remainingCurations) ? data.remainingCurations : [],
    };
  },

  /**
   * Fetch pending Netradyne alert driver curations.
   * Real endpoint: GET /curation/v3/get-netradyne-curation
   */
  getNetradyneCurations: async (): Promise<NetradyneCurationResponse> => {
    const res = await perfAxiosInstance.get("/curation/v3/get-netradyne-curation");
    const data = res.data?.data || res.data || {};
    return {
      processedCount: Number(data.processedCount || 0),
      resolvedCount: Number(data.resolvedCount || 0),
      updatedCurations: Array.isArray(data.updatedCurations) ? data.updatedCurations : [],
    };
  },

  /**
   * Fetch pending eMentor curations.
   * Real endpoint: GET /curation/v2/get_curation?curation_type=driver_id&curation_from=e_mentor_report
   */
  getEmentorCurations: async (): Promise<EmentorCurationItem[]> => {
    try {
      const res = await perfAxiosInstance.get("/curation/v2/get_curation", {
        params: {
          curation_type: "driver_id",
          curation_from: "e_mentor_report",
        },
      });
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      console.warn("curationApi.getEmentorCurations note:", err?.message);
      return [];
    }
  },

  /**
   * Update / Associate eMentor driver list.
   * Real endpoint: POST /curation/v1/update_ementor
   */
  updateEmentor: async (updateList: { _id: string; name: string; driver_id: string }[]): Promise<any> => {
    const res = await perfAxiosInstance.post("/curation/v1/update_ementor", {
      update_list: updateList,
    });
    return res.data;
  },

  /**
   * Delete / dismiss a curation record.
   * Real endpoint: DELETE /curation/v2/delete_curation?_id={id}&curation_type={type}
   */
  deleteCuration: async (id: string, curationType?: string): Promise<any> => {
    const params: Record<string, string> = { _id: id };
    if (curationType) params.curation_type = curationType;
    const res = await perfAxiosInstance.delete("/curation/v2/delete_curation", { params });
    return res.data;
  },

  /**
   * Associate driver name with performance profile.
   * Real endpoint: PATCH perf_driver/v2/update_associated_names
   */
  addAssociatedNames: async (name: string, id: string | number, autoCoaching?: any): Promise<any> => {
    const payload: any = { name, id };
    if (autoCoaching) payload.auto_coaching = autoCoaching;
    const res = await perfAxiosInstance.patch("perf_driver/v2/update_associated_names", payload);
    return res.data;
  },

  /**
   * Add a new driver directly into the fleet backend roster.
   * Real endpoint: POST /drivers/v1/driver (fleet-users microservice)
   */
  addDriver: async (payload: DriverFromCurationPayload): Promise<any> => {
    const res = await axiosInstance.post("drivers/v1/driver", payload);
    return res.data;
  },
};
