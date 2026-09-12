import { schAxiosInstance } from "./axiosClient";

export interface ShiftRecord {
  id: number;
  driver_id: number;
  driver_name: string;
  date: string;
  start_time: string;
  end_time: string;
  wave_time?: string;
  vehicle_type?: string;
  status: "scheduled" | "confirmed" | "standby" | "completed" | "callout" | "vto";
  is_published?: boolean;
}

export interface TimeOffRecord {
  id: number;
  driver_id: number;
  driver_name: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

export interface VtoRecord {
  id: number;
  date: string;
  shift_time?: string;
  available_slots: number;
  claimed_count: number;
  status: "open" | "closed";
  created_at?: string;
}

export interface AiVoiceCallLog {
  id: number;
  driver_name: string;
  call_timestamp: string;
  reason_category: string;
  transcription?: string;
  duration_seconds?: number;
  replaced_driver_name?: string;
  replacement_status: "pending" | "replaced" | "not_needed";
}

/* =========================================================================
   Live Scheduler Workspace Interfaces
   ========================================================================= */

export interface SchedulerShiftItem {
  id: number;
  schedule_rule_id?: number;
  assign_to: number | null;
  driver_name?: string;
  transporter_id?: string;
  schedule_date: string; // YYYY-MM-DD
  shift_duration_start: string; // e.g. "09:30:00" or "09:30"
  shift_duration_end: string;   // e.g. "19:30:00" or "19:30"
  break_time?: number;          // minutes, e.g. 30
  is_published: boolean;
  sch_status?: string;          // "scheduled", "draft", "backup", etc.
  is_backup?: boolean;
  call_out_id?: string | null;
  driver_action_status?: string; // "pending" | "accept" | "reject"
  user_action_status?: string;   // "pending" | "accept" | "reject"
  vto_status?: string;           // "offered" | "accept" | "decline" | "expired"
  direct_acceptance?: boolean;
  route_code?: string;          // e.g. "CX101"
  wave?: string;                // e.g. "Wave 1"
  total_hours?: string;         // e.g. "10.0"
  company_id?: number;
  vehicle_type?: string;
  message?: string;
  isConflict?: boolean;
  conflictReason?: string;
}

export type ShiftDisplayStatus =
  | "unpublished"
  | "published"
  | "confirmed"
  | "pending"
  | "declined"
  | "backup"
  | "extras"
  | "vto"
  | "open";

export function getShiftStatusBadge(s: SchedulerShiftItem): ShiftDisplayStatus {
  if (s.call_out_id) return "extras";
  if (s.is_backup || s.sch_status === "backup") return "backup";
  if (s.vto_status && ["offered", "accept"].includes(s.vto_status)) return "vto";

  if (!s.is_published) {
    if (s.sch_status === "empty" && s.assign_to === null) return "open";
    return "unpublished";
  }

  if (s.direct_acceptance) return "confirmed";
  if (s.user_action_status === "accept" || s.driver_action_status === "accept") return "confirmed";
  if (
    s.user_action_status === "reject" ||
    s.driver_action_status === "reject" ||
    s.driver_action_status === "declined"
  )
    return "declined";
  if (
    s.driver_action_status === "pending" ||
    s.user_action_status === "pending" ||
    s.sch_status === "pending"
  )
    return "pending";

  if (s.sch_status === "open" || s.assign_to === null) return "open";
  return "published";
}

export interface SchedulerDriverItem {
  id: number;
  driver_id?: number;
  name: string;
  transporter_id?: string;
  target_hours: number;
  weekly_hours?: number;
  rating?: string | number;
  mobile_number?: string;
  availability?: Record<string, boolean> | null;
  driver_type?: string;
  status?: string;
}

export interface SchedulerTimeOffItem {
  id: number;
  driver_id: number;
  driver_name?: string;
  start_date: string;
  end_date: string;
  duration?: string;
  leave_status: "approved" | "pending" | "rejected";
  status?: "approved" | "pending" | "rejected";
  request_type?: string;
  reason?: string;
}

export interface CreateShiftPayload {
  schedule_rule_id?: number;
  company_id?: number | string;
  schedules: Array<{
    assign_to: number | null;
    schedule_date: string;
    shift_duration_start: string;
    shift_duration_end: string;
    break_time?: number;
    is_published?: boolean;
    total_hours?: string;
    route_code?: string;
    wave?: string;
    vehicle_type?: string;
    message?: string;
  }>;
}

export interface UpdateBulkShiftPayload {
  schedules: Array<{
    id?: number;
    assign_to?: number | null;
    schedule_date?: string;
    shift_duration_start?: string;
    shift_duration_end?: string;
    break_time?: number;
    is_published?: boolean;
    total_hours?: string;
    route_code?: string;
    wave?: string;
  }>;
}

export interface ScheduleRuleItem {
  id: number;
  name: string;
  color?: string;
  working_hours?: Array<{
    shift_duration_start: string;
    shift_duration_end: string;
    total_hours: string;
    vehicle_type?: string;
  }> | any;
  message_templates?: any[];
  preferred_driver?: number[] | string;
  break_time?: number;
  set_break?: boolean;
  break_duration_start?: string;
  reminder_time?: any;
  company_id?: number;
  type?: "lmd" | "mmd" | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateScheduleRulePayload {
  name: string;
  working_hours: any;
  color?: string;
  break_time?: number;
  set_break?: boolean;
  break_duration_start?: string;
  preferred_driver?: number[];
  message_templates?: any[];
  reminder_time?: any;
  type?: string;
}

export interface UpdateScheduleRulePayload {
  name?: string;
  working_hours?: any;
  color?: string;
  break_time?: number;
  set_break?: boolean;
  break_duration_start?: string;
  preferred_driver?: number[];
  uncheck_pref_drivers?: number[];
  message_templates?: any[];
  reminder_time?: any;
  type?: string;
}

export interface ScheduleTemplateItem {
  id: number;
  name: string;
  company_id: number;
  temp_data?: any;
  created_at?: string;
}

export const schedulerApi = {
  /* -----------------------------------------------------------------------
     Live Shifts Endpoints
     ----------------------------------------------------------------------- */
  getSchedules: async (
    companyId: number | string,
    startDate: string,
    endDate: string
  ): Promise<SchedulerShiftItem[]> => {
    try {
      const res = await schAxiosInstance.get(`schedule/v1/get_all_schedule/${companyId}`, {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      const raw = res.data?.data || res.data || [];
      const list = Array.isArray(raw) ? raw : (raw.shifts || raw.schedules || []);

      return list.map((item: any) => ({
        id: Number(item.id || item.schedule_id || Date.now()),
        schedule_rule_id: item.schedule_rule_id ? Number(item.schedule_rule_id) : undefined,
        assign_to: item.assign_to != null ? Number(item.assign_to) : null,
        driver_name: item.driver_name || item.name || (item.driver ? `${item.driver.first_name || ""} ${item.driver.last_name || ""}`.trim() : "Unassigned"),
        transporter_id: item.transporter_id || item.driver?.transporter_id || "",
        schedule_date: item.schedule_date || item.date || startDate,
        shift_duration_start: item.shift_duration_start || item.start_time || "09:30:00",
        shift_duration_end: item.shift_duration_end || item.end_time || "19:30:00",
        break_time: item.break_time != null ? Number(item.break_time) : 30,
        is_published: item.is_published === true || item.is_published === "true" || item.sch_status === "published",
        sch_status: item.sch_status || (item.is_published ? "published" : "draft"),
        is_backup: item.backup === true || item.sch_status === "backup" || item.is_backup === true || item.backup === "true",
        call_out_id: item.call_out_id || null,
        driver_action_status: item.driver_action_status || undefined,
        user_action_status: item.user_action_status || undefined,
        vto_status: item.vto_status || undefined,
        direct_acceptance: Boolean(item.direct_acceptance),
        route_code: item.route_code || item.route || "",
        wave: item.wave || item.wave_time || "",
        total_hours: item.total_hours ? String(item.total_hours) : "10.0",
        company_id: item.company_id ? Number(item.company_id) : undefined,
        vehicle_type: item.vehicle_type || "Cargo Van",
        message: item.message || "",
      }));
    } catch {
      return [];
    }
  },

  createShift: async (payload: CreateShiftPayload) => {
    const res = await schAxiosInstance.post("schedule/v1/ind_schedule", {
      schedule_rule_id: payload.schedule_rule_id || 1,
      ...payload,
    });
    return res.data;
  },

  updateShift: async (ruleId: number | string, payload: UpdateBulkShiftPayload) => {
    const res = await schAxiosInstance.put(`schedule/v1/ind_schedule/${ruleId}`, payload);
    return res.data;
  },

  rescheduleShift: async (
    shiftId: number | string,
    payload: { assign_to?: number | null; schedule_date?: string; approved_drivers?: string }
  ) => {
    const res = await schAxiosInstance.patch(`schedule/v1/reschedule/${shiftId}`, payload);
    return res.data;
  },

  copyShift: async (
    shiftId: number | string,
    payload: { assign_to?: number | null; schedule_date?: string }
  ) => {
    const res = await schAxiosInstance.post(`schedule/v1/copy_shift/${shiftId}`, payload);
    return res.data;
  },

  updateBackup: async (shiftId: number | string, backup: boolean, message?: boolean) => {
    const res = await schAxiosInstance.patch(
      "schedule/v2/update_backup",
      null,
      {
        params: {
          shift_id: shiftId,
          backup: backup ? "true" : "false",
          ...(message !== undefined ? { message: message ? "true" : "false" } : {}),
        },
      }
    );
    return res.data;
  },

  dspShiftAction: async (
    shiftId: number | string,
    action: "accept" | "reject" | "pending"
  ) => {
    const res = await schAxiosInstance.post(`schedule/v2/dsp_shift_action/${shiftId}`, {
      action,
    });
    return res.data;
  },

  publishShifts: async (ids: (number | string)[]) => {
    const idParam = ids.join(",");
    const res = await schAxiosInstance.patch(
      "schedule/v1/schedule_published",
      null,
      { params: { id: idParam } }
    );
    return res.data;
  },

  deleteShifts: async (ids: (number | string)[]) => {
    const idParam = ids.join(",");
    const res = await schAxiosInstance.delete("schedule/v1/delete_schedule", {
      params: { ids: idParam },
    });
    return res.data;
  },

  autoSchedule: async (payload: {
    route_count: Record<string, number>;
    schedule_start_date: string;
    schedule_end_date: string;
  }) => {
    const res = await schAxiosInstance.post("auto_sch/v1/perform", payload);
    return res.data;
  },

  /* -----------------------------------------------------------------------
     Live Drivers & Availability
     ----------------------------------------------------------------------- */
  getSchedulerDrivers: async (params?: Record<string, any>): Promise<SchedulerDriverItem[]> => {
    try {
      const res = await schAxiosInstance.get("scheduler_driver/v3/drivers", {
        params: { limit: 350, offset: 0, ...params },
      });
      const raw = res.data?.data || res.data || [];
      const list = Array.isArray(raw) ? raw : [];

      return list.map((d: any) => ({
        id: Number(d.id || d.driver_id || Date.now()),
        driver_id: Number(d.driver_id || d.id),
        name: d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Driver",
        transporter_id: d.transporter_id || d.badge_id || "",
        target_hours: d.target_hours ? Number(d.target_hours) : 40,
        weekly_hours: d.weekly_hours ? Number(d.weekly_hours) : 0,
        rating: d.rating || 5.0,
        mobile_number: d.mobile_number || d.phone || "",
        availability: d.availability || null,
        driver_type: d.driver_type || "Standard",
        status: d.status || "active",
      }));
    } catch {
      return [];
    }
  },

  /* -----------------------------------------------------------------------
     Live Time Off
     ----------------------------------------------------------------------- */
  getTimeOffRequests: async (params?: Record<string, any>): Promise<SchedulerTimeOffItem[]> => {
    try {
      const res = await schAxiosInstance.get("time_off/v1/get_time_off", { params });
      const raw = res.data?.data || res.data || [];
      const list = Array.isArray(raw) ? raw : [];

      return list.map((t: any) => ({
        id: Number(t.id || Date.now()),
        driver_id: Number(t.driver_id || 0),
        driver_name: t.driver_name || (t.driver ? `${t.driver.first_name || ""} ${t.driver.last_name || ""}`.trim() : "Driver"),
        start_date: t.start_date || "",
        end_date: t.end_date || "",
        duration: t.duration || "Full Day",
        leave_status: (t.leave_status || t.status || "approved") as any,
        status: (t.leave_status || t.status || "approved") as any,
        request_type: t.request_type || "Time Off",
        reason: t.reason || "",
      }));
    } catch {
      return [];
    }
  },

  updateTimeOffStatus: async (id: number | string, status: "approved" | "rejected", reason?: string) => {
    const res = await schAxiosInstance.post("time_off/action", { id, status, reason });
    return res.data;
  },

  /* -----------------------------------------------------------------------
     VTO & Voice Logs (Legacy & Additional Features)
     ----------------------------------------------------------------------- */
  getShifts: async (params?: Record<string, any>): Promise<ShiftRecord[]> => {
    try {
      const res = await schAxiosInstance.get("schedule", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  deleteShift: async (id: number | string) => {
    const res = await schAxiosInstance.delete(`schedule/${id}`);
    return res.data;
  },

  getVtoBroadcasts: async (params?: Record<string, any>): Promise<VtoRecord[]> => {
    try {
      const res = await schAxiosInstance.get("drivers_vto", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  createVtoBroadcast: async (payload: Partial<VtoRecord>) => {
    const res = await schAxiosInstance.post("drivers_vto", payload);
    return res.data;
  },

  getAiCallLogs: async (params?: Record<string, any>): Promise<AiVoiceCallLog[]> => {
    try {
      const res = await schAxiosInstance.get("voice_assistant", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  /* -----------------------------------------------------------------------
     Live Schedule Rules Endpoints (CRUD)
     ----------------------------------------------------------------------- */
  getScheduleRules: async (companyId?: number | string): Promise<ScheduleRuleItem[]> => {
    try {
      const res = await schAxiosInstance.get("schedule_rule/v1/all/schedule_rule");
      const raw = res.data?.data || res.data || [];
      if (Array.isArray(raw)) return raw;
      if (raw.lmd && Array.isArray(raw.lmd)) {
        return [...raw.lmd, ...(Array.isArray(raw.mmd) ? raw.mmd : [])];
      }
      return [];
    } catch {
      return [];
    }
  },

  getScheduleRuleById: async (id: number | string): Promise<ScheduleRuleItem | null> => {
    try {
      const res = await schAxiosInstance.get(`schedule_rule/v1/schedule_rule/${id}`);
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },

  createScheduleRule: async (payload: CreateScheduleRulePayload) => {
    const res = await schAxiosInstance.post("schedule_rule/v1/schedule_rule", {
      ...payload,
      message_templates: payload.message_templates || [],
      preferred_driver: payload.preferred_driver || [],
      type: payload.type || "lmd",
    });
    return res.data;
  },

  updateScheduleRule: async (id: number | string, payload: UpdateScheduleRulePayload) => {
    const res = await schAxiosInstance.patch(`schedule_rule/v1/schedule_rule/${id}`, payload);
    return res.data;
  },

  deleteScheduleRule: async (id: number | string) => {
    const res = await schAxiosInstance.delete(`schedule_rule/v1/schedule_rule/${id}`);
    return res.data;
  },

  /* -----------------------------------------------------------------------
     Live Shift Exports & Templates (Scheduler "Others" Actions)
     ----------------------------------------------------------------------- */
  exportScheduleExcel: async (
    companyId: number | string,
    params: { date?: string; start_date?: string; end_date?: string }
  ) => {
    const res = await schAxiosInstance.get(`schedule/v1/daily_sch_download/${companyId}`, {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  exportSchedulePdf: async (
    companyId: number | string,
    params: { date?: string; start_date?: string; end_date?: string }
  ) => {
    const res = await schAxiosInstance.get(`schedule/v1/export_as_pdf/${companyId}`, {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  exportScheduleCsv: async (
    companyId: number | string,
    payload: { start_date: string; end_date: string; is_backup?: boolean; schedule_rule_id?: string }
  ) => {
    const res = await schAxiosInstance.post(`schedule/v1/csv/download/${companyId}`, payload, {
      responseType: "blob",
    });
    return res.data;
  },

  getScheduleTemplates: async (companyId: number | string): Promise<ScheduleTemplateItem[]> => {
    try {
      const res = await schAxiosInstance.get(`schedule_template/v1/schedule_template/${companyId}`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  saveScheduleTemplate: async (payload: { name: string; company_id: number | string; temp_data: any }) => {
    const res = await schAxiosInstance.post("schedule_template/v1/schedule_template", payload);
    return res.data;
  },

  loadScheduleTemplate: async (payload: {
    template_id: number | string;
    start_date: string;
    end_date: string;
    company_id: number | string;
  }) => {
    const res = await schAxiosInstance.post("schedule_template/v1/load_template", payload);
    return res.data;
  },

  getCompanyMessageTemplates: async (): Promise<any[]> => {
    try {
      const res = await schAxiosInstance.get("template/v1/company_template");
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};

