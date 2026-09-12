export interface Station {
  company_id: string;
  station_code: string;
  address: string;
  zipcode: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  active: boolean;
  pending: boolean;
  request_id?: string | null;
  current: boolean;
  company_name?: string;
  name?: string;
}

export interface UserProfile {
  account_id?: number | string;
  id?: number | string;
  email: string;
  name: string;
  phone?: string;
  token?: string;
  sessionToken?: string;
  role?: string;
  access_code?: string;
  company_id?: number | string;
  station_code?: string;
  company?: {
    id?: number | string;
    company_id?: number | string;
    name?: string;
    company_name?: string;
    owner_name?: string;
    company_type?: "lmd" | "mmd" | string;
    station_code?: string;
    [key: string]: any;
  };
  permissions?: Record<string, boolean>;
  company_access?: any[];
  companies?: any[];
  stations?: Station[];
  allStations?: Station[];
}

export interface BackendResponse<T = any> {
  status: number;
  data: {
    message?: string;
    status_code?: number;
    data?: T;
    token?: string;
    needOTP?: boolean;
    Gtoken?: string;
    id?: number;
    company?: any;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  access_code: string;
}

export interface OtpRequestPayload {
  field: string;
}

export interface OtpVerifyPayload {
  token: string;
  identifier: string;
  otp: string;
}

export interface OAuthSignInPayload {
  google_code?: string;
  apple_code?: string;
  app_name?: string;
  provider?: "google" | "apple";
}

export interface AccountLinkPayload {
  token: string;
  identifier: string;
  otp?: string;
  password?: string;
  provider_id: "google" | "apple";
  Gtoken?: string;
  id?: number;
}

export interface ForgotPasswordRequestPayload {
  identifier: string;
  provider_id?: string;
}

export interface ForgotPasswordVerifyPayload {
  token: string;
  otp: string;
}

export interface ResetPasswordPayload {
  token: string;
  otp: string;
  new_password?: string;
  password?: string;
}

export interface ControlTowerSignInPayload {
  login_id: string;
  company_id: string;
  app_name?: string;
}
