export interface StationOption {
  code: string;
  name: string;
  city?: string;
  state?: string;
}

export interface DriverStation {
  station_code: string;
  allow_signin?: boolean;
  permission_upgraded?: string | null;
}

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  name: string; // computed or combined
  title?: string;
  email: string;
  phone: string;
  transporter_id: string; // Amazon / DSP badge ID
  netradyne_id?: string | null;
  associated_names?: string;
  address: string;
  hire_date: string; // YYYY-MM-DD
  date_of_birth: string; // YYYY-MM-DD
  work_anniversary: string; // YYYY-MM-DD
  status: "active" | "inactive";
  is_deleted?: boolean;
  allow_signin: boolean;
  allow_inspections: boolean;
  stations: DriverStation[];
  // Fleet metrics
  metrics?: {
    parkingCount: number;
    rescueCompleted: number;
    damageCount: number;
  };
  created_at?: string;
}

export interface DriverFormState {
  firstName: { value: string; error: string };
  lastName: { value: string; error: string };
  title?: { value: string; error: string };
  transporterId: { value: string; error: string };
  email: { value: string; error: string };
  phone: { value: string; error: string };
  address: { value: string; error: string };
  hireDate: { value: string; error: string };
  dateOfBirth: { value: string; error: string };
  workAnniversary: { value: string; error: string };
  stations: { value: string[]; error: string };
  allowSignin: boolean;
  allowInspections: boolean;
  status: "active" | "inactive";
}

export type DriverStatusFilter = "all" | "active" | "inactive";
export type DriverSigninFilter = "all" | "signin_enabled" | "signin_disabled";
