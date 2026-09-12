export type FilterStatus = "all" | "open" | "resolved";
export type TabType = "accident" | "injury";
export type InjuryType =
  | "all"
  | "vehicle_without_injury"
  | "injury_with_vehicle"
  | "injury_without_vehicle";

export interface IncidentListItem {
  id: string;
  date: string | null;
  driver: number | null;
  vehicle: number | null;
  lawsuitFiled: boolean;
  status: string;
  addedByName: string;
  addedByType: string;
  otherFormId: string;
  driverName: string;
  vehicleName: string;
  vin: string;
  plateNumber: string;
}

export interface InjuryListItem {
  id: string;
  date: string | null;
  driver: number | string | null;
  vehicle: number | string | null;
  status: string;
  injuryType: string;
  driverName: string;
  vehicleName: string;
  vin: string;
  plateNumber: string;
  addedByName: string;
  addedByType: string;
  otherFormId: string;
}

export interface IncidentDetail {
  _id: string;
  date?: string;
  time?: string;
  driver_name?: string;
  driver?: number;
  vehicle?: number;
  vehicle_unit?: string;
  accident_location?: string;
  incident_details?: string;
  incident_detail?: string;
  police?: {
    is_police_called?: boolean;
    police_department?: string;
    report_number?: string;
    officer_name?: string;
    citation_issued?: boolean;
    phone_number?: string;
    other_details?: string;
  };
  has_third_party_lawsuit?: boolean;
  lawsuit?: {
    lawsuit_date?: string;
    lawyer_name?: string;
    adjuster_name?: string;
    notes?: string;
  };
  weather?: string;
  road_condition?: string;
  traffic?: string;
  light_condition?: string;
  road_attitude?: string;
  road_construction?: string;
  hurt?: boolean;
  called_dispatcher?: boolean;
  destination?: string;
  damage_comments?: string;
  status?: string;
  images?: string[];
  documents?: any[];
  injury_form_id?: string;
  third_party_info_driver?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    otherDriverlicense?: string;
  };
  third_party_info_vehicle?: {
    insurance?: string;
    policyNo?: string;
    year?: string;
    makeModel?: string;
    licensePlate?: string;
  };
}

export interface InjuryDetail {
  _id: string;
  date?: string;
  time?: string;
  status?: string;
  injury_type?: string;
  personal_information?: {
    driver_name?: string;
    driver_phone?: string;
    driver_email?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  incident_event_information?: {
    incident_date?: string;
    incident_time?: string;
    incident_location?: string;
    incident_details?: string;
    weather_condition?: string;
    treatment_administered?: string;
    hospital_visited?: string;
    physician_name?: string;
    restrictions_advised?: string;
  };
  vehicle_information?: {
    vehicle_name?: string;
    vin_no?: string;
    vehicle_license_plate?: string;
  };
  witness_information?: {
    witness_name?: string;
    witness_phone?: string;
  };
  supervisor_notified?: boolean;
  supervisor_name?: string;
  accident_form_id?: string;
  images?: string[];
  documents?: any[];
}
