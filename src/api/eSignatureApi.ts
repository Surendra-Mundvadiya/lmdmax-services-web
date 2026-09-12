import { perfAxiosInstance } from "./axiosClient";

export type ESignatureChannel = "inapp" | "sms" | "email";
export type ESignatureDocumentType = "acknowledgement" | "write-up" | "ack" | "writeup";
export type ESignatureStatus = "draft" | "sent" | "signed" | "refused_to_sign";

export interface ESignatureReportItem {
  _id: string;
  company_id: string;
  driver_id: string;
  driver_name: string;
  created_by?: string;
  created_by_name?: string;
  title?: string;
  message?: string;
  report_url?: string | null;
  report_date: string;
  report_type: string; // 'ack' | 'write-up' | 'acknowledgement' | 'writeup'
  status: ESignatureStatus;
  refused_by?: string;
  refused_reason?: string;
  attachments?: string[];
  violation?: string[];
  notes?: string;
  reminder_dates?: string[];
  sent_from?: string;
  channels?: ESignatureChannel[];
  driver_sign_url?: string | null;
  company_logo_url?: string | null;
  company_sign_url?: string | null;
  driver_sign_date?: string | null;
  created_at: string;
  updated_at: string;
  link?: string;
}

export interface ESignatureRemainderConfig {
  _id?: string;
  company_id?: string;
  remainder_types?: string[];
  message?: string;
  acknowledgement_message?: string;
  remainder_time?: string;
  is_active?: boolean;
  stop_reminder?: boolean;
  attempts?: number;
  last_sent?: string;
}

export interface ESignatureGetReportParams {
  start?: string;
  end?: string;
  driver_id?: string;
  station_id?: string;
}

export interface ESignatureResendPayload {
  _id: string;
  channels: ESignatureChannel[];
  email?: string;
}

export class ESignatureApi {
  /**
   * Fetch live E-Signature reports list
   */
  static async getReports(params?: ESignatureGetReportParams): Promise<ESignatureReportItem[]> {
    const search = new URLSearchParams();
    if (params?.driver_id) search.set("driver_id", params.driver_id);
    if (params?.start) search.set("start", params.start);
    if (params?.end) search.set("end", params.end);
    if (params?.station_id) search.set("station_id", params.station_id);
    const query = search.toString();

    const response = await perfAxiosInstance.get(
      `/e-signature/v1/get_report${query ? `?${query}` : ""}`
    );
    const raw = response.data?.data || response.data;
    return Array.isArray(raw) ? raw : [];
  }

  /**
   * Fetch single E-Signature report details
   */
  static async getReportById(id: string): Promise<ESignatureReportItem | null> {
    const response = await perfAxiosInstance.get(`/e-signature/v1/${id}`);
    return response.data?.data || response.data || null;
  }

  /**
   * Create new E-Signature document(s) (Acknowledgement or Write-Up)
   */
  static async createReport(formData: FormData): Promise<any> {
    const response = await perfAxiosInstance.post("/e-signature/v2/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Update draft or existing E-Signature document
   */
  static async updateReport(id: string, formData: FormData): Promise<any> {
    const response = await perfAxiosInstance.post(`/e-signature/v2/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Resend notification to driver
   */
  static async resendReport(payload: ESignatureResendPayload): Promise<any> {
    const response = await perfAxiosInstance.post("/e-signature/v2/resend", payload);
    return response.data;
  }

  /**
   * Delete report
   */
  static async deleteReport(id: string): Promise<any> {
    const response = await perfAxiosInstance.delete(`/e-signature/v1/${id}`);
    return response.data;
  }

  /**
   * Download report PDF as Blob
   */
  static async downloadReportPdf(id: string): Promise<Blob> {
    const response = await perfAxiosInstance.get(`/e-signature/v1/download_report/${id}`, {
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Get reminder automation configuration
   */
  static async getRemainder(): Promise<ESignatureRemainderConfig | null> {
    try {
      const response = await perfAxiosInstance.get("/e-signature/v1/get_remainder");
      const data = response.data?.data?.remainder || response.data?.data || null;
      return data;
    } catch {
      return null;
    }
  }
}

export default ESignatureApi;
