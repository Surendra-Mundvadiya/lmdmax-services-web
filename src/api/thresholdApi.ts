import { perfAxiosInstance } from "./axiosClient";

export type ThresholdType =
  | "weekly"
  | "daily"
  | "eoc"
  | "overview_report"
  | "pps_report"
  | "dvic_report"
  | "pod"
  | "cdf"
  | "delivery_concessions";

export type ScorecardSendOptions = "scorecard_image" | "scorecard_link" | "scorecard_lmd";

export interface ThresholdValue {
  value: string | number;
}

export interface ThresholdField {
  field: string;
  enable: boolean;
  order: "normal" | "reverse";
  values: ThresholdValue[];
}

export interface UpdateThresholdFields {
  threshold?: any;
  is_active?: boolean;
  scorecard_type?: ScorecardSendOptions;
  template?: string;
}

export interface DailyThreshold {
  previous_day: ThresholdField[];
  "2_days_before": ThresholdField[];
}

export interface EocThresholdField extends ThresholdField {
  template?: string;
}

export interface CompanionThreshold {
  is_active: boolean;
  type: "pod" | "cdf" | "delivery_concessions";
  threshold: ThresholdField[];
}

export interface ThresholdResponse<T = any> {
  data: {
    _id?: string;
    uuid?: string;
    company_id?: string;
    is_active?: boolean;
    type?: ThresholdType;
    scorecard_type?: ScorecardSendOptions;
    template?: string;
    threshold: T;
  };
  metadata?: {
    data?: CompanionThreshold[];
  };
}

export const thresholdApi = {
  /**
   * Fetch threshold configuration for a specific report type (v3 endpoint)
   */
  getThreshold: async <T = any>(type: ThresholdType): Promise<ThresholdResponse<T>> => {
    const res = await perfAxiosInstance.get(`/threshold/v3/threshold/${type}`);
    return res.data;
  },

  /**
   * Update threshold values or options for a specific report type (v3 endpoint)
   */
  updateThreshold: async (
    type: ThresholdType,
    fields: UpdateThresholdFields
  ): Promise<any> => {
    const res = await perfAxiosInstance.post("/threshold/v3/threshold", {
      data: {
        type,
        fields,
      },
    });
    return res.data;
  },

  /**
   * Enable or disable a threshold or update scorecard delivery mode (v2 patch)
   */
  enableDisableThreshold: async (data: {
    type: ThresholdType;
    enable?: boolean;
    scorecard_type?: ScorecardSendOptions;
    template?: string;
  }): Promise<any> => {
    const res = await perfAxiosInstance.patch("/threshold/v2/enable", data);
    return res.data;
  },

  /**
   * Specific legacy fallback for DA overview threshold if needed
   */
  getDaOverviewThreshold: async (): Promise<any> => {
    try {
      const res = await perfAxiosInstance.get("/threshold/v2/da_overview_threshold");
      return res.data;
    } catch {
      return thresholdApi.getThreshold("overview_report");
    }
  },

  /**
   * Specific legacy fallback for EOC threshold
   */
  getEocThreshold: async (): Promise<any> => {
    try {
      const res = await perfAxiosInstance.get("/eoc/v2/threshold");
      return res.data;
    } catch {
      return thresholdApi.getThreshold("eoc");
    }
  },

  /**
   * Specific legacy fallback for saving EOC threshold
   */
  saveEocThreshold: async (threshold: EocThresholdField[]): Promise<any> => {
    try {
      const res = await perfAxiosInstance.post("/eoc/v2/save_threshold", {
        threshold,
      });
      return res.data;
    } catch {
      return thresholdApi.updateThreshold("eoc", { threshold });
    }
  },
};

export default thresholdApi;
