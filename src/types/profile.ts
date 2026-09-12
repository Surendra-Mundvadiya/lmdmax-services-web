export interface CompanyAccess {
  company_id?: string;
  request_id?: string;
  created_at?: string;
  status?: "pending" | "approved" | "rejected";
  is_pending: boolean;
  is_active: boolean;
  station_code: string;
  address: string;
  zipcode: string | number;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CompanyData {
  company_id: string | number;
  company_name: string;
  company_type?: string;
  owner_name: string;
  station_code: string;
  zipcode: string | number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  netradyne_customer_name: string;
  forward_call_number: string;
  forward_call_enable: boolean;
  auto_coaching_enable: boolean;
  message_routing?: string;
  secondary_twilio_number?: string;
  dsp_short_code: string;
  performance_twilio_number?: string;
  company_logo?: string;
}

export interface ProfileData {
  name: string;
  phone: string;
  email?: string;
  role?: string;
  company: CompanyData;
  company_access?: CompanyAccess[];
}

export interface ProfileFieldState<T = string> {
  value: T;
  error: boolean;
  helperText: string;
}

export interface ProfileFormState {
  userName: ProfileFieldState<string>;
  phoneNumber: ProfileFieldState<string>;
  companyName: ProfileFieldState<string>;
  ownerName: ProfileFieldState<string>;
  stationCode: ProfileFieldState<string>;
  zipCode: ProfileFieldState<string>;
  address: ProfileFieldState<string>;
  city: ProfileFieldState<string>;
  state: ProfileFieldState<string>;
  country: ProfileFieldState<string>;
  timezone: ProfileFieldState<string>;
  netradyneCustomerName: ProfileFieldState<string>;
  callForwardingCountryCode: ProfileFieldState<string>;
  callForwardingNo: ProfileFieldState<string>;
  callForwarding: ProfileFieldState<boolean>;
  autoCoachingEnable: ProfileFieldState<boolean>;
}
