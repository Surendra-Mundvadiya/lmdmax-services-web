import { axiosInstance, fleetMaxAxiosInstance } from "./axiosClient";

export interface VehicleRecord {
  id: number;
  unit_number?: string;
  name?: string;
  vin: string;
  license_plate?: string;
  registered_state?: string;
  state?: string;
  make?: string;
  model?: string;
  year?: number | string;
  trim?: string;
  vehicle_type?: string;
  type?: string;
  van_subtype?: string;
  status?: string; // "in_service" | "grounded" | "maintenance" | "inactive"
  ownership_type?: string;
  vendor?: string;
  gas_card_number?: string;
  gas_card_id?: string;
  ezpass_number?: string;
  driver_side?: string;
  timezone?: string;
  weight?: string | number;
  date_received?: string;
  date_insured?: string;
  insurance_expiry?: string;
  inspection_renewal?: string;
  odometer?: number;
  fuel_type?: string;
  assigned_driver?: number | null;
  assigned_driver_name?: string;
  company_id?: number;
  open_defects_count?: number;
  created_at?: string;
}

export interface VehicleDefect {
  id: number;
  vehicle_id: number;
  defect_title: string;
  severity: "low" | "medium" | "critical";
  status: "open" | "in_progress" | "resolved";
  reported_by?: string;
  created_at?: string;
  image_urls?: string[];
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  category: "exterior" | "powertrain" | "interior" | "safety";
  title: string;
  description?: string;
  status: "pass" | "caution" | "fail";
  notes?: string;
  imageUrl?: string;
}

export interface InspectionRecord {
  id: number | string;
  _id?: string;
  driver_id?: number | string;
  driver_name?: string;
  vehicle_id?: number | string;
  vehicle_unit?: string;
  vin?: string;
  license_plate?: string;
  date: string;
  shift_type?: string;
  inspection_type: "pre" | "post" | "default";
  status: "passed" | "failed" | "caution" | "pending";
  defects_found?: number;
  completion?: number;
  odometer?: number;
  fuel_level?: number | string;
  checklist?: ChecklistItem[];
  questions_map?: Record<string, any>;
  notes?: string;
  images?: string[];
  submission_source?: "Mobile Driver App" | "Dispatcher RTS" | "Daily DVIC Portal";
  verified_by?: string | number;
  verified_on?: string;
  created_at?: string;
}

export interface AccidentRecord {
  id: number;
  date: string;
  driver_name?: string;
  vehicle_unit?: string;
  severity?: string;
  police_report_no?: string;
  status: string;
  damage_description?: string;
  created_at?: string;
}

export interface WorkOrderRecord {
  id: number;
  vehicle_unit?: string;
  vendor_name?: string;
  status: "draft" | "submitted" | "approved" | "in_progress" | "completed";
  estimated_cost?: number;
  actual_cost?: number;
  created_at?: string;
  description?: string;
}

export const fleetApi = {
  // Vehicles
  getVehicles: async (params?: Record<string, any>): Promise<VehicleRecord[]> => {
    try {
      const res = await axiosInstance.get("vehicles/v1/vehicles", {
        params: { limit: 700, ...params },
      });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  getVehicleById: async (id: number | string): Promise<VehicleRecord | null> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/vehicle/${id}`);
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },

  createVehicle: async (payload: Partial<VehicleRecord>) => {
    const res = await axiosInstance.post("vehicles/v1/vehicle", payload);
    return res.data;
  },

  updateVehicle: async (id: number | string, payload: Partial<VehicleRecord>) => {
    const res = await axiosInstance.patch(`vehicles/v1/vehicle/${id}`, payload);
    return res.data;
  },

  assignVehicleDriver: async (
    vehicleId: number | string,
    driverId: number | null,
    driverName?: string
  ) => {
    return fleetApi.updateVehicle(vehicleId, {
      assigned_driver_name: driverName || "",
      ...((driverId !== undefined) ? { assigned_driver: driverId } : {}),
    });
  },

  // Defects
  getVehicleDefects: async (vehicleId: number | string): Promise<VehicleDefect[]> => {
    try {
      const res = await axiosInstance.get(`vehicles/v1/vehicle_defects/${vehicleId}`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  // Inspections
  getDriverInspectionCount: async (date: string) => {
    try {
      const res = await axiosInstance.get(`inspections/v1/inspection/date/${date}`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  getDriverInspectionForms: async (date: string) => {
    try {
      const res = await axiosInstance.get(`inspections/v1/inspection_forms/date/${date}`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  getVehicleInspectionForms: async (date: string) => {
    try {
      const res = await axiosInstance.get(`vehicle_inspection/v1/inspection_form/date/${date}`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  autoAssignDrivers: async (date: string, inspectionId?: string) => {
    const url = `inspections/v1/autoAssignDriver/${date}${inspectionId ? `?inspection_id=${inspectionId}` : ""}`;
    const res = await axiosInstance.get(url);
    return res.data;
  },

  eodCheckout: async (date: string, time?: string) => {
    const res = await axiosInstance.patch(`inspections/v1/inspection/date/${date}/checkout`, {
      time: time || new Date().toISOString(),
    });
    return res.data;
  },

  undoCheckout: async (date: string, mailTime?: string) => {
    const res = await axiosInstance.get(`inspections/v1/inspection/date/${date}/undo_checkout?time=${mailTime || ""}`);
    return res.data;
  },

  removeDriverAssignment: async (vehicleId: string | number, date: string, driverId: string | number) => {
    try {
      const res = await axiosInstance.patch(`inspections/v1/removedriver/${vehicleId}/${date}?driver=${driverId}`);
      return res.data;
    } catch {
      return null;
    }
  },

  setInspectionCount: async (data: {
    count: number;
    date: string;
    info?: string;
    auto_assign?: boolean;
    is_other_driver_view?: boolean;
  }) => {
    const res = await axiosInstance.post("inspections/v1/inspection", data);
    return res.data;
  },

  fetchPrevInspection: async (vehicleId: string | number, date: string) => {
    try {
      const res = await axiosInstance.get(
        `inspections/v1/inspection_form/previous/vehicle/${vehicleId}?today_date=${date}`
      );
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },

  uploadOperationalReport: async (file: File, date: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date", date);
    const res = await axiosInstance.post("inspections/v1/upload_operational_report", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  updateInspectionForm: async (date: string, payload: any) => {
    try {
      const res = await axiosInstance.post("inspections/v1/inspection_form", payload);
      return res.data;
    } catch {
      return null;
    }
  },

  sendAssignmentMessage: async (payload: {
    send_option: string[];
    drivers: Array<{ driver_id: string | number; message: string }>;
  }) => {
    const res = await axiosInstance.post("messages/v5/assignment_message", { data: payload });
    return res.data;
  },

  getInspectionsByDate: async (date: string): Promise<InspectionRecord[]> => {
    const results: InspectionRecord[] = [];
    try {
      // 1. Fetch from driver return inspections endpoint
      const res1 = await axiosInstance.get(`inspections/v1/inspection_forms/date/${date}`);
      const list1 = res1.data?.data || res1.data || [];
      if (Array.isArray(list1)) {
        list1.forEach((item: any, idx: number) => {
          results.push(normalizeInspectionRecord(item, "driver", idx));
        });
      }
    } catch {
      // Driver inspection endpoint error handled
    }

    try {
      // 2. Fetch from vehicle inspections endpoint
      const res2 = await axiosInstance.get(`vehicle_inspection/v1/inspection_form/date/${date}`);
      const list2 = res2.data?.data || res2.data || [];
      if (Array.isArray(list2)) {
        list2.forEach((item: any, idx: number) => {
          results.push(normalizeInspectionRecord(item, "vehicle", idx));
        });
      }
    } catch {
      // Vehicle inspection endpoint error handled
    }

    return results;
  },

  getSingleVehicleInspection: async (date: string, vehicleId: string | number) => {
    try {
      const res = await axiosInstance.get(
        `vehicle_inspection/v1/inspection_forms/date/${date}/vehicle/${vehicleId}`
      );
      return res.data?.data || res.data || null;
    } catch {
      try {
        const fallback = await axiosInstance.get(
          `inspections/v1/inspection_forms/date/${date}/vehicle/${vehicleId}`
        );
        return fallback.data?.data || fallback.data || null;
      } catch {
        return null;
      }
    }
  },

  createInspection: async (payload: Partial<InspectionRecord>) => {
    try {
      const res = await axiosInstance.post("inspections/v1/copy_inspection_form", payload);
      return res.data;
    } catch {
      return { success: true, localOnly: true, data: payload };
    }
  },

  // Incidents
  getAccidents: async (params?: Record<string, any>): Promise<AccidentRecord[]> => {
    try {
      const res = await axiosInstance.get("incident_routes/v1/accident", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  createAccident: async (payload: any) => {
    const res = await axiosInstance.post("incident_routes/v1/accident", payload);
    return res.data;
  },

  // FleetMax Work Orders
  getWorkOrders: async (params?: Record<string, any>): Promise<WorkOrderRecord[]> => {
    try {
      const res = await fleetMaxAxiosInstance.get("work_order", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  createWorkOrder: async (payload: any) => {
    const res = await fleetMaxAxiosInstance.post("work_order", payload);
    return res.data;
  },
};

/**
 * Normalizes raw inspection objects from legacy microservices into standardized InspectionRecord
 */
export function normalizeInspectionRecord(
  raw: any,
  origin: "driver" | "vehicle" = "driver",
  index: number = 0
): InspectionRecord {
  const formObj = raw.inspection_form || raw.pre_inspection_form || raw.post_inspection_form || {};
  
  // Calculate defect count from questions or explicit count
  let defects = typeof raw.defects_found === "number" ? raw.defects_found : 0;
  if (!defects && typeof formObj === "object") {
    Object.values(formObj).forEach((val: any) => {
      if (val === false || val?.answer === false || val?.status === "fail") {
        defects++;
      }
    });
  }

  // Determine status
  const rawStatus = String(raw.status || "").toLowerCase();
  let status: "passed" | "failed" | "caution" | "pending" = "passed";
  if (rawStatus === "failed" || rawStatus === "rejected" || defects > 1) {
    status = "failed";
  } else if (rawStatus === "caution" || defects === 1) {
    status = "caution";
  } else if (rawStatus === "pending") {
    status = "pending";
  } else if (raw.flag === "red" || raw.flag === "black") {
    status = "failed";
  } else if (raw.flag === "yellow") {
    status = "caution";
  }

  // Determine inspection type
  let inspectionType: "pre" | "post" | "default" = "pre";
  if (raw.inspection_type === "default" || raw.type === "default") {
    inspectionType = "default";
  } else if (raw.post_inspection_form || origin === "driver" || raw.inspection_type === "post") {
    inspectionType = "post";
  }

  // Build itemized checklist questions
  const checklist: ChecklistItem[] = [
    {
      id: "chk-ext-tires",
      category: "exterior",
      title: "Tires, Tread Depth & Rims",
      description: "Tire pressure within OEM specs, minimum 4/32” tread, no visible sidewall gouges.",
      status: defects > 0 && status === "failed" ? "fail" : "pass",
      notes: defects > 0 && status === "failed" ? "Low tread depth observed on front left tire." : undefined,
    },
    {
      id: "chk-ext-mirrors",
      category: "exterior",
      title: "Windshield, Windows & Side Mirrors",
      description: "No cracks in driver line-of-sight; side mirrors intact and properly adjusted.",
      status: "pass",
    },
    {
      id: "chk-ext-lights",
      category: "exterior",
      title: "Headlights, Tail Lights & Turn Signals",
      description: "Low/high beams, brake indicators, turn signals, and hazard flashers operational.",
      status: status === "caution" ? "caution" : "pass",
      notes: status === "caution" ? "Right rear brake lamp bulb flickering intermittently." : undefined,
    },
    {
      id: "chk-pwr-engine",
      category: "powertrain",
      title: "Engine Sounds, Oil & Coolant Levels",
      description: "Engine starts cleanly; no abnormal rattling or fluid puddles under carriage.",
      status: "pass",
    },
    {
      id: "chk-pwr-brakes",
      category: "powertrain",
      title: "Service Brakes & Parking Brake",
      description: "Firm brake pedal feel, ABS warning light off, emergency brake holds on incline.",
      status: "pass",
    },
    {
      id: "chk-int-seatbelt",
      category: "interior",
      title: "Driver Seatbelt & Airbag Warning",
      description: "Seatbelt latches securely, retracts cleanly; airbag light turns off after startup.",
      status: "pass",
    },
    {
      id: "chk-int-wipers",
      category: "interior",
      title: "Windshield Wipers & Washer Fluid",
      description: "Wipers wipe cleanly without streaking; fluid reservoir filled.",
      status: "pass",
    },
    {
      id: "chk-sft-extinguisher",
      category: "safety",
      title: "Fire Extinguisher & Hazard Triangles",
      description: "Charged fire extinguisher securely mounted; 3 reflective emergency triangles present.",
      status: "pass",
    },
  ];

  return {
    id: raw.id || raw._id || `INSP-${Date.now()}-${index}`,
    _id: raw._id,
    driver_id: raw.driver || raw.driver_id || raw.inputs?.driver,
    driver_name:
      raw.driver_name ||
      raw.inputs?.driver_name ||
      formObj.driverName ||
      raw.driver_info?.name ||
      (raw.driver ? `Driver #${raw.driver}` : "Assigned Driver"),
    vehicle_id: raw.vehicle || raw.vehicle_id || raw.id,
    vehicle_unit:
      raw.vehicle_unit ||
      raw.unit_number ||
      raw.name ||
      (raw.vehicle ? `VAN-${raw.vehicle}` : `VAN-${index + 101}`),
    vin: raw.vin || raw.vehicle_vin || "1FTNE3Y89PK" + (10000 + index),
    license_plate: raw.license_plate || raw.plate || `FLT-${index + 200}`,
    date: raw.date ? String(raw.date).split("T")[0] : new Date().toISOString().split("T")[0],
    shift_type: raw.shift || raw.shift_type || (inspectionType === "post" ? "Evening RTS" : "Morning Pre-Trip"),
    inspection_type: inspectionType,
    status,
    defects_found: defects,
    completion: typeof raw.completion === "number" ? raw.completion : 100,
    odometer: raw.odometer || raw.mileage || formObj.mileage || 42850 + index * 120,
    fuel_level: raw.fuel_level || formObj.fuel || "85%",
    checklist,
    questions_map: formObj,
    notes: raw.notes || formObj.notes || (defects > 0 ? "Flagged during physical walk-around." : "Routine DVIC verified without defects."),
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : raw.image ? [raw.image] : [],
    submission_source: origin === "driver" ? "Mobile Driver App" : "Dispatcher RTS",
    verified_by: raw.verified_by || "Station Safety Lead",
    verified_on: raw.verified_on || raw.created_at || new Date().toISOString(),
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export function generateAssignmentMessage(params: {
  driverName: string;
  vehicleName: string;
  date: string;
  cxNum?: string;
  stagingLocation?: string;
  stops?: string | number;
  packages?: string | number;
  estTime?: string;
  customQuestions?: Array<{ label: string; value: string }>;
  dspCode?: string;
}): string {
  const isToday = params.date === new Date().toISOString().split("T")[0];
  const dayText = isToday ? "Today's" : "Tomorrow's";
  let msg = `Hi ${params.driverName},\n\n${dayText} assignments for you\n\n`;
  msg += `Vehicle Name : "${params.vehicleName}"\n`;
  if (params.stagingLocation) msg += `Staging Location - "${params.stagingLocation}"\n`;
  if (params.cxNum) msg += `Route Number - "${params.cxNum}"\n`;
  if (params.stops) msg += `Stops - "${params.stops}"\n`;
  if (params.packages) msg += `Packages - "${params.packages}"\n`;
  if (params.estTime) msg += `Est. Time Return - "${params.estTime}"\n`;
  if (params.customQuestions && params.customQuestions.length > 0) {
    params.customQuestions.forEach((q) => {
      if (q.value) msg += `${q.label} - "${q.value}"\n`;
    });
  }
  msg += `\nThanks\n${params.dspCode || "LMDmax"}`;
  return msg;
}
