import { perfAxiosInstance, inAppAxiosInstance } from "./axiosClient";

export type ChatChannelType = "sms" | "payroll" | "short_code" | "direct" | "secondary_sms";

export interface ChatThreadItem {
  id: string;
  driver_id: string;
  name: string;
  phone?: string;
  transporter_id?: string;
  email?: string;
  status?: string;
  message: string;
  message_time: string | null;
  unread_count: number;
  type: "chat" | "broadcast" | "group";
  is_pinned: boolean;
  channel: ChatChannelType;
  station_code?: string;
  stations?: string[];
  attachments?: any[];
}

export interface ChatMessageItem {
  _id: string;
  id: string;
  sender_type: "dispatcher" | "driver" | "system";
  is_driver: boolean;
  sender_name?: string;
  message: string;
  created_at: string;
  timestamp?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  attachments?: Array<{ url: string; type: string; name?: string }> | string[];
  category?: string;
  error_message?: string | null;
}

export interface SendMessagePayload {
  to: string; // driver_id
  message: string;
  attachment?: File | null;
  reply_id?: string;
  station_ids?: string[];
}

export interface BroadcastPayload {
  message: string;
  broadcastName?: string;
  driverList: Array<{ driver_id: string; name: string; stations?: string[] }>;
  attachment?: File | null;
  station_ids?: string[];
}

export const chatsApi = {
  /**
   * 1. SMS Chat: Fetch message heads (conversation threads)
   * GET /messages/v5/get_message_head
   */
  getSMSMessageHeads: async (params?: {
    station_ids?: string[];
    keyword?: string;
    filter?: string;
    offset?: number;
    limit?: number;
  }): Promise<ChatThreadItem[]> => {
    try {
      const offset = params?.offset ?? 0;
      const limit = params?.limit ?? 30;
      let query = `?offset=${offset}&limit=${limit}`;

      if (params?.station_ids && params.station_ids.length > 0) {
        query += params.station_ids.map((id) => `&station_ids=${encodeURIComponent(id)}`).join("");
      }
      if (params?.keyword && params.keyword.trim().length > 0) {
        query += `&keyword=${encodeURIComponent(params.keyword.trim())}`;
      }
      if (params?.filter && params.filter !== "all") {
        query += `&filter=${encodeURIComponent(params.filter)}`;
      }

      const res = await perfAxiosInstance.get(`/messages/v5/get_message_head${query}`);
      const rawList = res.data?.data || res.data || [];

      if (!Array.isArray(rawList)) return [];

      return rawList.map((item: any) => ({
        id: String(item.driver_id || item._id || item.id),
        driver_id: String(item.driver_id || item._id || item.id),
        name: item.name || "Unknown Driver",
        phone: item.phone || item.phone_number || "",
        transporter_id: item.transporter_id || "",
        email: item.email || "",
        status: item.status || "active",
        message: item.message || "",
        message_time: item.message_time || item.updated_at || item.created_at || null,
        unread_count: Number(item.unread_count) || 0,
        type: item.type === "broadcast" ? "broadcast" : item.type === "group" ? "group" : "chat",
        is_pinned: Boolean(item.is_pinned),
        channel: "sms",
        stations: Array.isArray(item.stations) ? item.stations : [],
        attachments: item.attachments || [],
      }));
    } catch {
      return [];
    }
  },

  /**
   * 2. SMS Chat: Fetch messages in a specific driver conversation
   * GET /messages/v3/get_message?driver_id=...
   */
  getSMSMessages: async (driverId: string, offset = 0, limit = 40): Promise<ChatMessageItem[]> => {
    try {
      const query = `?driver_id=${encodeURIComponent(driverId)}&offset=${offset}&limit=${limit}`;
      const res = await perfAxiosInstance.get(`/messages/v3/get_message${query}`);
      const rawMsgs = res.data?.data || res.data || [];

      if (!Array.isArray(rawMsgs)) return [];

      return rawMsgs
        .filter((m: any) => !m.is_update) // Filter out metadata audit records
        .map((m: any) => {
          const isDriver = Boolean(m.is_driver);
          return {
            _id: String(m._id || m.id || Math.random()),
            id: String(m._id || m.id || Math.random()),
            sender_type: (isDriver ? "driver" : "dispatcher") as "driver" | "dispatcher",
            is_driver: isDriver,
            sender_name: isDriver ? "Driver" : "Dispatch",
            message: m.message || "",
            created_at: m.created_at || new Date().toISOString(),
            timestamp: m.created_at || new Date().toISOString(),
            status: (m.error_message ? "failed" : "delivered") as "failed" | "delivered",
            attachments: m.attachments || [],
            category: m.category || "",
            error_message: m.error_message || null,
          };
        })
        .reverse(); // Chronological order
    } catch {
      return [];
    }
  },

  /**
   * 3. SMS Chat: Send live message to a driver
   * POST /messages/v3/send_message
   */
  sendSMSMessage: async (payload: SendMessagePayload): Promise<boolean> => {
    const formData = new FormData();
    formData.append("to", payload.to);
    formData.append("message", payload.message);

    if (payload.reply_id) {
      formData.append("reply_id", payload.reply_id);
    }
    if (payload.attachment) {
      formData.append("attachment", payload.attachment);
    }

    const headers: Record<string, string> = {};
    if (payload.station_ids && payload.station_ids.length > 0) {
      headers["x-stations-check"] = payload.station_ids.join(",");
    }

    const res = await perfAxiosInstance.post("/messages/v3/send_message", formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.status >= 200 && res.status < 300;
  },

  /**
   * 4. SMS Chat: Create & send broadcast to multiple drivers
   * POST /messages/v3/create_broadcast
   */
  createSMSBroadcast: async (payload: BroadcastPayload): Promise<boolean> => {
    const formData = new FormData();
    formData.append("message", payload.message);

    if (payload.broadcastName?.trim()) {
      formData.append("broadcastName", payload.broadcastName.trim());
    }

    const formattedReceivers = payload.driverList.map((d) => ({
      driver_id: d.driver_id,
      name: d.name,
      stations: d.stations || [],
    }));
    formData.append("receiverList", JSON.stringify(formattedReceivers));

    if (payload.attachment) {
      formData.append("attachment", payload.attachment);
    }

    const headers: Record<string, string> = {};
    if (payload.station_ids && payload.station_ids.length > 0) {
      headers["x-stations-check"] = payload.station_ids.join(",");
    }

    const res = await perfAxiosInstance.post("/messages/v3/create_broadcast", formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.status >= 200 && res.status < 300;
  },

  /**
   * 5. SMS Chat: Toggle Pin status
   * PATCH /messages/v5/pin_chat
   */
  togglePinChat: async (driverId: string, isPinned: boolean): Promise<boolean> => {
    try {
      const res = await perfAxiosInstance.patch("/messages/v5/pin_chat", {
        data: {
          id: driverId,
          is_pinned: isPinned,
        },
      });
      return res.status >= 200 && res.status < 300;
    } catch {
      return false;
    }
  },

  /**
   * 6. SMS Chat: Update last seen
   * GET /messages/v3/update_last_seen_v3
   */
  markAsSeen: async (driverId: string): Promise<void> => {
    try {
      await perfAxiosInstance.get(`/messages/v3/update_last_seen_v3?driver_id=${encodeURIComponent(driverId)}`);
    } catch {
      // ignore
    }
  },

  /**
   * 7. SMS Chat: Unread messages counter
   * GET /messages/v3/new_message_count
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await perfAxiosInstance.get("/messages/v3/new_message_count");
      return Number(res.data?.data?.unread) || 0;
    } catch {
      return 0;
    }
  },

  /**
   * 8. In-App Chat: Get conversation rooms
   * Supports Short Code (company mode) and Direct Messages (individual mode)
   */
  getInAppRooms: async (
    chatMode: "company" | "individual" = "company",
    companyId?: string,
    offset = 0,
    limit = 30
  ): Promise<ChatThreadItem[]> => {
    try {
      const endpoint =
        chatMode === "company" && companyId
          ? `/lmd/twms/company-chat/${companyId}/chathead/v5/chat_head`
          : `/lmd/twms/chathead/v5/chat_head`;

      const res = await inAppAxiosInstance.get(`${endpoint}?offset=${offset}&limit=${limit}`);
      const rawRooms = res.data?.data || res.data || [];

      if (!Array.isArray(rawRooms)) return [];

      return rawRooms.map((r: any) => ({
        id: String(r.room_id || r.id || r.user_id),
        driver_id: String(r.user_id || r.room_id || r.id),
        name: r.room_name || r.name || (chatMode === "company" ? "DSP Team Member" : "Driver Contact"),
        phone: r.phone || "",
        message: r.last_message?.content || r.last_message || "",
        message_time: r.last_message_at || r.updated_at || null,
        unread_count: Number(r.count) || 0,
        type: r.room_type === "broadcast" ? "broadcast" : "chat",
        is_pinned: Boolean(r.is_pinned),
        channel: chatMode === "company" ? "short_code" : "direct",
      }));
    } catch {
      return [];
    }
  },

  /**
   * 9. In-App Chat: Get room messages
   */
  getInAppMessages: async (roomId: string, offset = 0, limit = 40): Promise<ChatMessageItem[]> => {
    try {
      const res = await inAppAxiosInstance.get(`/lmd/twms/chathead/v3/get_messages?room_id=${encodeURIComponent(roomId)}&offset=${offset}&limit=${limit}`);
      const rawMsgs = res.data?.data || res.data || [];

      if (!Array.isArray(rawMsgs)) return [];

      return rawMsgs.map((m: any) => ({
        _id: String(m.id || m._id || Math.random()),
        id: String(m.id || m._id || Math.random()),
        sender_type: (m.is_sender ? "dispatcher" : "driver") as "dispatcher" | "driver",
        is_driver: !m.is_sender,
        sender_name: m.sender_name || (m.is_sender ? "Dispatcher" : "Driver"),
        message: m.content || m.message || "",
        created_at: m.created_at || new Date().toISOString(),
        status: "delivered" as const,
        attachments: m.attachments || [],
      })).reverse();
    } catch {
      return [];
    }
  },

  /**
   * 10. In-App Chat: Send in-app message
   */
  sendInAppMessage: async (roomId: string, content: string): Promise<boolean> => {
    try {
      const res = await inAppAxiosInstance.post(`/lmd/twms/chat/v1/send_message`, {
        room_id: roomId,
        content,
      });
      return res.status >= 200 && res.status < 300;
    } catch {
      return false;
    }
  },

  /**
   * 11. Payroll Chat: Get payroll support queues
   */
  getPayrollThreads: async (): Promise<ChatThreadItem[]> => {
    try {
      const res = await perfAxiosInstance.get(`/payroll/v1/get_messages`);
      const raw = res.data?.data || res.data || [];

      if (!Array.isArray(raw)) return [];

      return raw.map((item: any) => ({
        id: String(item.payroll_id || item.id || item.driver_id),
        driver_id: String(item.driver_id || item.payroll_id || item.id),
        name: item.name || "Payroll Inquirer",
        phone: item.phone || "",
        message: item.last_message || "Payroll inquiry ticket",
        message_time: item.updated_at || null,
        unread_count: Number(item.unread_count) || 0,
        type: "chat" as const,
        is_pinned: false,
        channel: "payroll" as const,
      }));
    } catch {
      return [];
    }
  },
};

