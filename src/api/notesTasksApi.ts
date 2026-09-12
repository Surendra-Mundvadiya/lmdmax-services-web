import { perfAxiosInstance } from "./axiosClient";

// ==================== NOTES TYPES & APIS ====================

export interface NoteItem {
  _id: string;
  title: string;
  note: string;
  date: string; // ISO or YYYY-MM-DD
  view_all: boolean;
  colour: string; // e.g. '#4F8BFF'
  company_id?: string;
  notes_type?: string;
  created_by?: string;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GetNotesParams {
  startDate?: string;
  endDate?: string;
  sort?: "new" | "old";
  createdBy?: string;
  visibleOnlyMe?: boolean;
  limit?: number;
  cursor?: string;
}

export interface GetNotesResponse {
  data: NoteItem[];
  total_count?: number;
  latest_date: string | null;
  oldest_date: string | null;
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

// ==================== TASKS (TAGS) TYPES & APIS ====================

export type TaskStatusType = "created" | "progress" | "completed";

export interface TaskComment {
  _id?: string;
  comment: string;
  tagged?: string;
  created_by?: string;
  created_at?: string;
}

export interface TaskItem {
  _id: string;
  tag_id: string | number;
  tag_message: string;
  status: TaskStatusType | string;
  tagged: string;
  tagged_by?: string;
  type?: string;
  driver_id?: string;
  account_id?: string;
  comments?: TaskComment[];
  created_at?: string;
  updated_at?: string;
}

export const notesTasksApi = {
  // ==================== NOTES APIS ====================

  getNotes: async (params: GetNotesParams = {}): Promise<GetNotesResponse> => {
    const queryParams = new URLSearchParams({
      limit: String(params.limit || 50),
      sort: params.sort || "new",
    });

    if (!params.startDate || !params.endDate) {
      queryParams.append("get_all_notes", "true");
    }
    if (params.startDate) queryParams.append("start", params.startDate);
    if (params.endDate) queryParams.append("end", params.endDate);
    if (params.createdBy) queryParams.append("created_by", params.createdBy);
    if (params.visibleOnlyMe) queryParams.append("visible_only_me", "true");
    if (params.cursor) queryParams.append("cursor", params.cursor);

    const res = await perfAxiosInstance.get(`/notes/v3/get_note?${queryParams.toString()}`);
    if (res.data?.success) {
      return {
        data: res.data.data || [],
        total_count: res.data.total_count || res.data.data?.length || 0,
        latest_date: res.data.latest_date,
        oldest_date: res.data.oldest_date,
        pagination: res.data.pagination || { next_cursor: null, has_more: false },
      };
    }
    throw new Error(res.data?.message || "Failed to fetch notes");
  },

  createNote: async (data: {
    title: string;
    note: string;
    date: string;
    view_all: boolean;
    colour: string;
  }): Promise<NoteItem> => {
    const res = await perfAxiosInstance.post("/notes/v3/create_note", {
      data: {
        notes_type: "company",
        date: data.date,
        note: data.note,
        title: data.title,
        view_all: data.view_all,
        colour: data.colour,
      },
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || "Failed to create note");
  },

  updateNote: async (data: {
    _id: string;
    title: string;
    note: string;
    view_all: boolean;
    colour: string;
  }): Promise<NoteItem> => {
    const res = await perfAxiosInstance.patch("/notes/v3/update_note", {
      update_data: {
        _id: data._id,
        note: data.note,
        title: data.title,
        view_all: data.view_all,
        colour: data.colour,
      },
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || "Failed to update note");
  },

  deleteNote: async (noteId: string): Promise<void> => {
    const res = await perfAxiosInstance.delete(`/notes/v3/delete_note?note_id=${noteId}`);
    if (!res.data?.success && res.status !== 200) {
      throw new Error(res.data?.message || "Failed to delete note");
    }
  },

  // ==================== TASKS (TAGS) APIS ====================

  getTasks: async (params: { start: string; end: string }): Promise<TaskItem[]> => {
    const res = await perfAxiosInstance.get(`/tag/v4/get_tag?start=${params.start}&end=${params.end}`);
    if (res.data?.success && res.data?.data?.tags) {
      return res.data.data.tags;
    }
    return [];
  },

  createTask: async (data: {
    tag_message: string;
    tagged: string;
    type?: string;
  }): Promise<TaskItem> => {
    const res = await perfAxiosInstance.post("/tag/v4/create", {
      data: {
        tag_message: data.tag_message,
        tagged: data.tagged,
        type: data.type || "general",
      },
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || "Failed to create task");
  },

  updateTaskStatus: async (data: {
    tag_id: string | number;
    status: TaskStatusType | string;
  }): Promise<void> => {
    const res = await perfAxiosInstance.post("/tag/v4/update", {
      data: {
        tag_id: data.tag_id,
        status: data.status,
      },
    });
    if (!res.data?.success && res.status !== 200) {
      throw new Error(res.data?.message || "Failed to update task status");
    }
  },

  deleteTask: async (tagId: string | number): Promise<void> => {
    const res = await perfAxiosInstance.delete(`/tag/v4/delete?tag_id=${tagId}`);
    if (!res.data?.success && res.status !== 200) {
      throw new Error(res.data?.message || "Failed to delete task");
    }
  },

  addTaskComment: async (data: {
    tag_id: string | number;
    comment: string;
    tagged: string;
  }): Promise<any> => {
    const res = await perfAxiosInstance.post("/tag/v4/comment", {
      data: {
        tag_id: data.tag_id,
        comment: data.comment,
        tagged: data.tagged,
      },
    });
    if (res.data?.success) {
      return res.data.data;
    }
    throw new Error(res.data?.message || "Failed to add comment");
  },
};
