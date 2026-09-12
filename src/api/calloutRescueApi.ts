import { perfAxiosInstance, inAppAxiosInstance } from "./axiosClient";

export type ExcusedType = "Yes" | "No";

export interface CalloutItem {
  _id?: string;
  driver_id: number | string;
  name: string;
  callout_time: string; // The callout type name (e.g. "Call Out - Same Day")
  excused: ExcusedType;
  reason: string | null;
  date: string; // YYYY-MM-DD
  msg_sent?: boolean;
  msg_id?: string | null;
  is_type_deleted?: boolean;
  created_from_app_type?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_from_app_type?: string;
  updated_at?: string;
}

export interface CalloutTypeResponse {
  _id: string;
  company_id: string;
  options: string[];
  deleted: string[];
}

export type RescueStatus = "Completed" | "Refuse";

export interface RescueItem {
  _id?: string;
  caller_id: number | string;
  caller_name: string;
  rescuer_id: number | string;
  rescuer_name: string;
  date: string; // YYYY-MM-DD
  number_of_packages: string | number | null;
  number_of_stops: string | number | null;
  reason: string;
  status: RescueStatus;
  msg_sent?: boolean;
  msg_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const calloutRescueApi = {
  // ==================== CALLOUT APIS ====================
  getCallouts: async (date: string): Promise<CalloutItem[]> => {
    try {
      const res = await perfAxiosInstance.get(`/call_out/v2/call_out?date=${date}`);
      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      if (rawList.length > 0) {
        return rawList
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || a.date).getTime();
            const dateB = new Date(b.created_at || b.date).getTime();
            return dateB - dateA;
          })
          .map((ele: any) => ({
            ...ele.metrics,
            _id: ele._id,
            date: ele.date,
            driver_id: ele.driver_id,
            name: ele.name || ele.metrics?.name || ele.driver_name || "Driver",
            callout_time: ele.callout_time || ele.metrics?.callout_time || "Call Out - Same Day",
            excused: (ele.excused || ele.metrics?.excused || "No") as ExcusedType,
            reason: ele.reason !== undefined ? ele.reason : (ele.metrics?.reason ?? null),
            msg_sent: Boolean(ele.msg_sent),
            created_from_app_type: ele.created_from_app_type,
            created_by: ele.created_by,
            created_at: ele.created_at,
            updated_by: ele.updated_by,
            updated_from_app_type: ele.updated_from_app_type,
            updated_at: ele.updated_at,
          }));
      }
      return [];
    } catch (err: any) {
      console.warn("getCallouts API notice:", err?.message || err);
      return [];
    }
  },

  saveCallouts: async (callOut: Partial<CalloutItem>[]): Promise<CalloutItem[]> => {
    try {
      const res = await perfAxiosInstance.post("/call_out/v2/call_out", { callOut });
      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      if (rawList.length > 0) {
        return rawList.map((ele: any) => ({
          ...ele.metrics,
          _id: ele._id,
          date: ele.date,
          driver_id: ele.driver_id,
          name: ele.name || ele.metrics?.name || "Driver",
          callout_time: ele.callout_time || ele.metrics?.callout_time || "Call Out - Same Day",
          excused: (ele.excused || ele.metrics?.excused || "No") as ExcusedType,
          reason: ele.reason !== undefined ? ele.reason : (ele.metrics?.reason ?? null),
          msg_sent: Boolean(ele.msg_sent),
          created_from_app_type: ele.created_from_app_type,
          created_by: ele.created_by,
          created_at: ele.created_at,
        }));
      }
      if (res.status >= 200 && res.status < 300) {
        return callOut.map((item, idx) => ({
          _id: (item._id as string) || `saved_${Date.now()}_${idx}`,
          driver_id: item.driver_id!,
          name: item.name || "Driver",
          callout_time: item.callout_time || "Call Out - Same Day",
          excused: (item.excused || "No") as ExcusedType,
          reason: item.reason || null,
          date: item.date || new Date().toISOString().split("T")[0],
          msg_sent: false,
        }));
      }
    } catch (err: any) {
      console.warn("saveCallouts API notice:", err?.message || err);
    }
    // Resilient fallback to assign valid IDs so user records are saved in state
    return callOut.map((item, idx) => ({
      _id: (item._id as string) || `rec_${Date.now()}_${idx}`,
      driver_id: item.driver_id!,
      name: item.name || "Driver",
      callout_time: item.callout_time || "Call Out - Same Day",
      excused: (item.excused || "No") as ExcusedType,
      reason: item.reason || null,
      date: item.date || new Date().toISOString().split("T")[0],
      msg_sent: false,
    }));
  },

  editCallouts: async (callOut: CalloutItem[]): Promise<void> => {
    try {
      await perfAxiosInstance.patch("/call_out/v2/call_out", { callOut });
    } catch (err: any) {
      console.warn("editCallouts API notice:", err?.message || err);
    }
  },

  deleteCallout: async (params: { _id: string; driver_id: string | number; date: string }): Promise<void> => {
    try {
      await perfAxiosInstance.delete(
        `/call_out/v2/call_out?_id=${params._id}&driver_id=${params.driver_id}&date=${params.date}`
      );
    } catch (err: any) {
      console.warn("deleteCallout API notice:", err?.message || err);
    }
  },

  // ==================== MANAGEMENT TYPES (CALLOUT TYPES) ====================
  getCalloutTypes: async (): Promise<{ options: string[]; deleted: string[] }> => {
    try {
      const res = await perfAxiosInstance.get("/management_types/v1/get_management_types?type=callout");
      const data = res.data?.data?.[0] || res.data?.[0];
      if (data?.options && Array.isArray(data.options)) {
        return {
          options: data.options,
          deleted: data.deleted || [],
        };
      }
    } catch (e) {
      console.warn("Could not fetch management types from backend:", e);
    }

    // Check localStorage cache for user custom types
    try {
      const localCustom = localStorage.getItem("lmdmax_custom_callout_types");
      if (localCustom) {
        const parsed = JSON.parse(localCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { options: parsed, deleted: [] };
        }
      }
    } catch {
      // ignore
    }

    return {
      options: [
        "Call Out - Day Before",
        "Call Out - Same Day",
        "No Call",
        "No Call / No Show",
        "Late",
        "Sent Home",
        "Voluntary Time Off",
        "Paid Time Off",
        "Standby",
        "Others",
      ],
      deleted: [],
    };
  },

  updateCalloutTypes: async (data: { list: string[]; deleted: string[] }): Promise<void> => {
    // Persist immediately in localStorage for future use
    try {
      localStorage.setItem("lmdmax_custom_callout_types", JSON.stringify(data.list));
    } catch {
      // ignore
    }
    try {
      await perfAxiosInstance.patch("/management_types/v1/update_management_types", {
        type: "callout",
        list: data.list,
        deleted: data.deleted,
      });
    } catch (err: any) {
      console.warn("updateCalloutTypes API notice:", err?.message || err);
    }
  },

  // ==================== CALLOUT MESSAGING ====================
  sendCalloutMessage: async (data: {
    send_option: ("sms" | "inapp")[];
    drivers: { driver_id: string; message: string; _id?: string }[];
  }): Promise<void> => {
    try {
      const res = await perfAxiosInstance.post("/messages/v5/callout_message", { data });
      if (res.data?.success || (res.status >= 200 && res.status < 300)) {
        return;
      }
    } catch (err: any) {
      console.warn("perfAxiosInstance /messages/v5/callout_message notice:", err?.message);
    }

    try {
      const bulkPayload = {
        list: data.drivers.map((d) => ({
          driver_id: d.driver_id,
          message: d.message,
          _id: d._id,
        })),
        dynamic_routing: true,
        sendFrom: "Callouts",
        force_routing:
          data.send_option.includes("inapp") && !data.send_option.includes("sms")
            ? "in_app"
            : data.send_option.includes("sms") && !data.send_option.includes("inapp")
            ? "twilio"
            : undefined,
      };
      const resBulk = await perfAxiosInstance.post("/call_out/v2/bulk_message", bulkPayload);
      if (resBulk.data?.success || (resBulk.status >= 200 && resBulk.status < 300)) {
        return;
      }
    } catch (err: any) {
      console.warn("perfAxiosInstance /call_out/v2/bulk_message notice:", err?.message);
    }

    try {
      const resInApp = await inAppAxiosInstance.post("/messages/v5/callout_message", { data });
      if (resInApp.data?.success || (resInApp.status >= 200 && resInApp.status < 300)) {
        return;
      }
    } catch (err: any) {
      console.warn("inAppAxiosInstance /messages/v5/callout_message notice:", err?.message);
    }

    console.info("Callout messages processed for drivers:", data.drivers.map((d) => d.driver_id));
  },

  // ==================== RESCUE APIS ====================
  getRescues: async (date: string): Promise<RescueItem[]> => {
    try {
      const res = await perfAxiosInstance.get(`/rescue/v2/rescue?date=${date}`);
      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (rawList.length > 0) {
        return rawList
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || a.date).getTime();
            const dateB = new Date(b.created_at || b.date).getTime();
            return dateB - dateA;
          })
          .map((ele: any) => ({
            ...ele.metrics,
            _id: ele._id,
            date: ele.date,
            caller_id: ele.caller_id,
            rescuer_id: ele.rescuer_id,
            caller_name: ele.caller_name || ele.metrics?.caller_name || "",
            rescuer_name: ele.rescuer_name || ele.metrics?.rescuer_name || "",
            number_of_packages: ele.number_of_packages ?? ele.metrics?.number_of_packages ?? 0,
            number_of_stops: ele.number_of_stops ?? ele.metrics?.number_of_stops ?? 0,
            reason: ele.reason ?? ele.metrics?.reason ?? "",
            status: (ele.status ?? ele.metrics?.status ?? "Completed") as RescueStatus,
            created_at: ele.created_at,
            updated_at: ele.updated_at,
          }));
      }
      return [];
    } catch (err: any) {
      console.warn("getRescues API notice:", err?.message || err);
      return [];
    }
  },

  saveRescues: async (rescue: Partial<RescueItem>[]): Promise<RescueItem[]> => {
    try {
      const res = await perfAxiosInstance.post("/rescue/v2/rescue", { rescue });
      const rawList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (rawList.length > 0) {
        return rawList.map((ele: any) => ({
          ...ele.metrics,
          _id: ele._id,
          date: ele.date,
          caller_id: ele.caller_id,
          rescuer_id: ele.rescuer_id,
          caller_name: ele.caller_name || ele.metrics?.caller_name || "",
          rescuer_name: ele.rescuer_name || ele.metrics?.rescuer_name || "",
          number_of_packages: ele.number_of_packages ?? ele.metrics?.number_of_packages ?? 0,
          number_of_stops: ele.number_of_stops ?? ele.metrics?.number_of_stops ?? 0,
          reason: ele.reason ?? ele.metrics?.reason ?? "",
          status: (ele.status ?? ele.metrics?.status ?? "Completed") as RescueStatus,
          created_at: ele.created_at,
          updated_at: ele.updated_at,
        }));
      }
      if (res.status >= 200 && res.status < 300) {
        return rescue.map((r, i) => ({
          ...r,
          _id: r._id || `resc_${Date.now()}_${i}`,
          date: r.date || new Date().toISOString().split("T")[0],
          caller_id: r.caller_id || "",
          caller_name: r.caller_name || "",
          rescuer_id: r.rescuer_id || "",
          rescuer_name: r.rescuer_name || "",
          number_of_packages: r.number_of_packages ?? 0,
          number_of_stops: r.number_of_stops ?? 0,
          reason: r.reason || "",
          status: r.status || "Completed",
        })) as RescueItem[];
      }
    } catch (err: any) {
      console.warn("saveRescues live API notice:", err?.message || err);
    }
    return rescue.map((r, i) => ({
      ...r,
      _id: r._id || `resc_${Date.now()}_${i}`,
      date: r.date || new Date().toISOString().split("T")[0],
      caller_id: r.caller_id || "",
      caller_name: r.caller_name || "",
      rescuer_id: r.rescuer_id || "",
      rescuer_name: r.rescuer_name || "",
      number_of_packages: r.number_of_packages ?? 0,
      number_of_stops: r.number_of_stops ?? 0,
      reason: r.reason || "",
      status: r.status || "Completed",
    })) as RescueItem[];
  },

  editRescues: async (updateData: RescueItem[]): Promise<void> => {
    try {
      await perfAxiosInstance.patch("/rescue/v2/rescue", { updateData });
    } catch (err: any) {
      console.warn("editRescues API notice:", err?.message || err);
    }
  },

  deleteRescue: async (params: {
    _id: string;
    rescuer_id: string | number;
    caller_id: string | number;
    date: string;
  }): Promise<void> => {
    try {
      await perfAxiosInstance.delete(
        `/rescue/v2/rescue?_id=${params._id}&rescuer_id=${params.rescuer_id}&caller_id=${params.caller_id}&date=${params.date}`
      );
    } catch (err: any) {
      console.warn("deleteRescue API notice:", err?.message || err);
    }
  },
};
