import { axiosInstance } from "./axiosClient";

export interface SupportTicket {
  _id?: string;
  id?: string | number;
  subject: string;
  description?: string;
  description_text?: string;
  status: number; // 2: Open, 3: Pending, 4: Resolved, 5: Closed
  priority?: number;
  created_at: string;
  updated_at?: string;
  attachments?: string[];
  attachment?: string[];
  user_id?: string | number;
  company_id?: string | number;
  from?: string;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  priority?: number;
  attachments?: string[];
  from?: string;
}

export interface SupportApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  status?: number;
}

export class SupportApi {
  /**
   * Fetch user's previous support queries/tickets from live fleet microservice
   * Endpoint: GET /lmd/usrsrv/helpSupp/v1/getAllTickets?from=fleet
   */
  static async getTickets(): Promise<SupportTicket[]> {
    const res = await axiosInstance.get<SupportApiResponse<SupportTicket[]>>(
      "/helpSupp/v1/getAllTickets?from=fleet"
    );
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  }

  /**
   * Submit a new support query/ticket to the live fleet microservice
   * Endpoint: POST /lmd/usrsrv/helpSupp/v1/createTicket
   */
  static async createTicket(payload: CreateTicketPayload): Promise<SupportApiResponse> {
    const res = await axiosInstance.post<SupportApiResponse>(
      "/helpSupp/v1/createTicket",
      {
        subject: payload.subject,
        description: payload.description,
        priority: payload.priority ?? 2,
        attachments: payload.attachments ?? [],
        from: payload.from ?? "fleet",
      }
    );
    return res.data;
  }

  /**
   * Upload an image attachment for a support ticket
   * Endpoint: PUT /lmd/usrsrv/damages/v1/images
   */
  static async uploadAttachment(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axiosInstance.put("/damages/v1/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data?.data || "";
  }
}
