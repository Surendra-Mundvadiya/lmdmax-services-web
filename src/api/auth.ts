import { axiosInstance } from "./axiosClient";
import type {
  LoginPayload,
  SignUpPayload,
  OtpRequestPayload,
  OtpVerifyPayload,
  OAuthSignInPayload,
  AccountLinkPayload,
  ForgotPasswordRequestPayload,
  ForgotPasswordVerifyPayload,
  ResetPasswordPayload,
  ControlTowerSignInPayload,
} from "../types/auth";

export class AuthAPI {
  /** Standard Email & Password Fleet/Services Login */
  static async login(payload: LoginPayload) {
    return axiosInstance.post("users/v1/user/fleet_login", payload);
  }

  /** Performance App Login variant */
  static async perfLogin(payload: LoginPayload) {
    return axiosInstance.post("users/v1/user/perf_login", payload);
  }

  /** User Registration */
  static async signup(payload: SignUpPayload) {
    return axiosInstance.post("users/v2/user", payload);
  }

  /** Request OTP for Phone or Email Login */
  static async otpLogin(payload: OtpRequestPayload) {
    return axiosInstance.post("users/v1/login/otp", payload);
  }

  /** Verify OTP for Login */
  static async otpVerify(payload: OtpVerifyPayload) {
    return axiosInstance.post("users/v1/verify/otp", payload);
  }

  /** Resend OTP for Login */
  static async otpResend(payload: { token: string; identifier: string }) {
    return axiosInstance.post("users/v1/resend/otp", payload);
  }

  /** Request OTP for Forgotten Password */
  static async forgotPasswordRequest(payload: ForgotPasswordRequestPayload) {
    return axiosInstance.post("users/v1/user/credentials/request", payload);
  }

  /** Resend OTP for Forgotten Password */
  static async forgotPasswordResend(payload: { token: string; identifier: string }) {
    return axiosInstance.post("users/v1/user/credentials/resend", payload);
  }

  /** Verify OTP for Forgotten Password */
  static async forgotPasswordVerify(payload: ForgotPasswordVerifyPayload) {
    return axiosInstance.post("users/v1/user/credentials/verify", payload);
  }

  /** Reset Password with OTP + Token */
  static async forgotPasswordReset(payload: ResetPasswordPayload) {
    return axiosInstance.post("users/v1/user/credentials/reset", payload);
  }

  /** Federated OAuth Sign In (Google / Apple) */
  static async oAuthSignin(payload: OAuthSignInPayload) {
    return axiosInstance.post("users/v1/login/auth/fleet_login", payload);
  }

  /** Account Linking for OAuth when existing account requires verification */
  static async linkAccountForOAuth(payload: AccountLinkPayload) {
    return axiosInstance.post("users/v1/link/auth/fleet_login", payload);
  }

  /** SSO / Sign in by Login ID from Control Tower */
  static async signInByLoginId(payload: ControlTowerSignInPayload) {
    return axiosInstance.post("control_tower/v1/sign_in_by_login_id", payload);
  }

  /** User Log Out */
  static async logOut() {
    return axiosInstance.post("users/v1/user/logout");
  }

  /** Get current authenticated user profile */
  static async getProfile() {
    return axiosInstance.get("users/v1/user");
  }

  /** Edit User Profile Details (Name, Phone) */
  static async editUserDetail(data: { name: string; phone?: string }) {
    return axiosInstance.patch("users/v1/user", data);
  }

  /** Edit Company Profile Details */
  static async editCompanyDetail(companyId: string | number, data: Record<string, any>) {
    return axiosInstance.patch(`companies/v1/company/id=${companyId}`, data);
  }

  /** Upload Company Logo */
  static async saveCompanyLogo(formData: FormData) {
    return axiosInstance.post("perf_driver/v2/company_logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  /** Verify Old/Current Password */
  static async verifyPassword(current_password: string) {
    return axiosInstance.post("users/v1/confirm_password", { current_password });
  }

  /** Alter/Change Password */
  static async changePassword(payload: { current_password: string; confirm_password: string; password: string }) {
    return axiosInstance.patch("users/v1/alter_password", payload);
  }

  /** Request Station Addition */
  static async stationAdditionRequest(data: { station_code: string; zipcode: string | number; address: string }) {
    return axiosInstance.post("companies/v1/station_addition_request", data);
  }

  /** Update Station Status (Active / Inactive) */
  static async stationStatusUpdate(data: { action: "active" | "inactive"; company_id: string | number }) {
    return axiosInstance.patch("companies/v1/change_company_status", data);
  }

  /** Get company permissions */
  static async getCompanyPermissions() {
    return axiosInstance.get("company_permissions/v1/get_company_permissions_v1");
  }

  /** Switch active company station */
  static async switchCompany(companyId: string | number) {
    return axiosInstance.get(`users/v1/switch_company/${companyId}`);
  }

  /** Get all companies for ownership */
  static async getAllCompanies(ownershipId: string | number) {
    return axiosInstance.get(`companies/v1/ownership_companies/${ownershipId}`);
  }
}

export default AuthAPI;
