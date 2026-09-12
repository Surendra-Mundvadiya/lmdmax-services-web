export type VehicleStatus = "active" | "grounded" | "maintenance" | "inactive";

export interface VehicleStation {
  id?: number | string;
  company_id?: number | string;
  station_code?: string;
  name?: string;
}

export interface Vehicle {
  id: number;
  name: string; // Unit number, e.g. "VAN-101"
  vin: string;
  plate: string;
  state: string;
  make: string;
  model: string;
  year?: number | string;
  trim?: string;
  vehicle_type?: string | number;
  vehicle_sub_type?: string | number;
  ownership_type?: string | number;
  vendor?: string;
  status: VehicleStatus;
  assigned_driver?: number | null;
  assigned_driver_name?: string;
  recieved?: string; // Date received (API spelled "recieved")
  date_received?: string;
  insured?: string;
  date_insured?: string;
  insurance_expires?: string;
  insurance_expiry?: string;
  insp_renewal_date?: string;
  inspection_renewal?: string;
  gas_card_id?: string;
  gas_card?: string;
  ez_pass?: string;
  ezpass_number?: string;
  driver_side?: string;
  timezone?: string;
  weight?: string | number;
  stations?: VehicleStation[];
  station_code?: string;
  company_id?: number | string;
  flags?: string;
  flag?: string; // "green" | "yellow" | "red" | "black"
  open_defects_count?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleFormData {
  name: string;
  vin: string;
  plate: string;
  state: string;
  make: string;
  model: string;
  year: string;
  trim: string;
  vehicle_type: string;
  vehicle_sub_type: string;
  ownership_type: string;
  vendor: string;
  status: VehicleStatus;
  station_code: string;
  recieved: string;
  insured: string;
  insurance_expires: string;
  insp_renewal_date: string;
  gas_card_id: string;
  ez_pass: string;
}

export interface VehicleNote {
  id: number;
  vehicle_id?: number;
  note: string;
  title?: string;
  created_at?: string;
  created_by?: string;
  user_name?: string;
}

export interface VehicleDefectItem {
  id: number;
  vehicle_id: number;
  defect_title?: string;
  defect_type?: string;
  severity: "low" | "medium" | "critical" | "high";
  status: "open" | "in_progress" | "resolved" | "fixed";
  reported_by?: string;
  driver_name?: string;
  description?: string;
  image_urls?: string[];
  created_at?: string;
}

export interface VehicleDocItem {
  id: number;
  vehicle_id?: number;
  doc_name: string;
  doc_url?: string;
  file_type?: string;
  created_at?: string;
}

export interface VehicleFilterParams {
  search?: string;
  status?: string;
  damage_filter?: string[];
  van_type_filter?: number[] | string[];
  station?: string;
  limit?: number;
  offset?: number;
}

export type DamageFlagColor = "green" | "yellow" | "red" | "black";

export interface DamageRecord {
  id: number;
  vehicle_id: number;
  driver?: number | string | null;
  driver_name?: string;
  flag: DamageFlagColor;
  detail: string;
  description?: string;
  created_at: string;
  damage_date?: string;
  is_fault?: boolean;
  category?: string;
  location?: string;
  estimated_cost?: string | number;
  images?: string[];
  incident_report?: string;
  partially_resolved?: boolean;
  status?: string;
}

export interface PreventiveRecord {
  id: number;
  vehicle: number;
  vehicle_id?: number;
  vendor: string;
  service_type: string | number;
  service_type_name?: string;
  miles?: number | string;
  hours?: number | string;
  notes?: string;
  date: string;
  attachments?: Array<{ name: string; url: string }>;
  images?: string[];
  status?: string;
  created_at?: string;
}

export interface VehicleTimelineItem {
  id: number;
  vehicle_id: number;
  action: "update" | "add" | "delete" | "resolve" | "inspect";
  created_at: string;
  created_by?: number | string;
  user_name?: string;
  title: string;
  message: string;
  type:
    | "vehicles"
    | "preventive_maintenance"
    | "mechanical"
    | "body_damage"
    | "work_order"
    | "notes"
    | "task_management"
    | "accident_report"
    | "pre_inspection"
    | "default_inspection"
    | "post_inspection"
    | string;
  data?: Record<string, any>;
  reference_id?: string | number;
}

