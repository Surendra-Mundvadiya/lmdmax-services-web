import { perfAxiosInstance, extractAxiosInstance, schAxiosInstance } from "./axiosClient";

export interface ReportQueryParams {
  company_id?: string | number;
  station_id?: string | number;
  week_number?: string | number;
  date?: string;
  start_week?: string | number;
  end_week?: string | number;
  search?: string;
  driver_id?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface GenericReportResponse<T = any> {
  success?: boolean;
  message?: string;
  data: T[];
  metadata?: any;
  status?: number;
  week_number?: number | string;
  has_data?: {
    daWeekly?: boolean;
    [key: string]: any;
  };
  total?: number;
}

const buildQueryString = (params: ReportQueryParams): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
};

export class ReportsApi {
  // ==========================================
  // WEEKLY REPORTS
  // ==========================================

  // 1. Current Week Scorecard
  static async getCurrentScorecard(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/scorecard/v2/current${qs}`);
    return res.data;
  }

  // 2. Trailing Scorecard Report
  static async getTrailingScorecard(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/scorecard/v2/trailing${qs}`);
    return res.data;
  }

  // 3. Compare Scorecard Report
  static async getCompareScorecard(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/scorecard/v2/compare${qs}`);
    return res.data;
  }

  // 4. Negative Customer Feedback Report
  static async getNegativeCDF(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/negative_customer_feedback/v2/negative_customer_feedback_report${qs}`);
    return res.data;
  }

  // 5. Photo on Delivery (POD) Quality Report
  static async getPODReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/pod/v2/pod_report${qs}`);
    return res.data;
  }

  // 6. Proper Parking Sequence (PPS) Report
  static async getPPSReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/pps/v2/pps_report${qs}`);
    return res.data;
  }

  // 7. Work Hour Compliance (WHC) Report
  static async getWHCReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/whc/v2/whc_report${qs}`);
    return res.data;
  }

  // 8. DSP Scorecards
  static async getDspScorecards(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/scorecard/v2/dsp${qs}`);
    return res.data;
  }

  // 9. DA Weekly Overview
  static async getDAWeeklyOverview(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/da_weekly_overview/v2/da_weekly_overview_report${qs}`);
    return res.data;
  }

  // 10. Driver Rating Report
  static async getDriverRating(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/driver_rating/v2/get_ratings_report${qs}`);
    return res.data;
  }

  // 11. Average of Acceptance (MMD)
  static async getAverageOfAcceptance(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/acceptance_mmd_report/v2/acceptance_report${qs}`);
    return res.data;
  }

  // 12. DVIR Completion (MMD)
  static async getDvirCompletion(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/completion_mmd_report/v2/completion_report${qs}`);
    return res.data;
  }

  // 13. Weekly Roster Data
  static async getWeeklyRoster(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    try {
      const res = await perfAxiosInstance.get(`/sechduling/v1/roster_data${qs}`);
      return res.data;
    } catch {
      try {
        const res2 = await schAxiosInstance.get(`/scheduling/v1/roster_data${qs}`);
        return res2.data;
      } catch (err: any) {
        return { data: [], message: err?.message || "No roster data available", success: false };
      }
    }
  }


  // Latest Week for Scorecard
  static async getLatestWeekScorecard(params: ReportQueryParams): Promise<any> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/scorecard/v2/get_latest_week${qs}`);
    return res.data;
  }

  // ==========================================
  // DAILY REPORTS
  // ==========================================

  // 13. Daily Driver Scorecard
  static async getDailyDriverScorecard(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/daily_scorecard/v2/daily_scorecard${qs}`);
    return res.data;
  }

  // 14. All Alert Report
  static async getAllAlertReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/all_alert/v2/all_alert_report${qs}`);
    return res.data;
  }

  // 15. Netradyne Driver Report
  static async getNetradyneDriverReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/netradyne_driver/v2/driver_report${qs}`);
    return res.data;
  }

  // 16. Callouts Report
  static async getCallOuts(params: ReportQueryParams): Promise<GenericReportResponse> {
    const queryParams: any = { ...params };
    if (queryParams.date && !queryParams.start && !queryParams.end) {
      queryParams.start = queryParams.date;
      queryParams.end = queryParams.date;
    }
    const qs = buildQueryString(queryParams);
    const res = await perfAxiosInstance.get(`/call_out/v2/call_out${qs}`);
    return res.data;
  }

  // 17. Attendance and Extras Report
  static async getAttendance(params: ReportQueryParams): Promise<GenericReportResponse> {
    const queryParams: any = { ...params };
    if (queryParams.date && !queryParams.start && !queryParams.end) {
      queryParams.start = queryParams.date;
      queryParams.end = queryParams.date;
    }
    const qs = buildQueryString(queryParams);
    const res = await perfAxiosInstance.get(`/call_out/v2/attendance${qs}`);
    return res.data;
  }

  // 18. Rescue Report
  static async getRescue(params: ReportQueryParams): Promise<GenericReportResponse> {
    const queryParams: any = { ...params };
    if (queryParams.date && !queryParams.start && !queryParams.end) {
      queryParams.start = queryParams.date;
      queryParams.end = queryParams.date;
    }
    const qs = buildQueryString(queryParams);
    const res = await perfAxiosInstance.get(`/rescue/v2/rescue${qs}`);
    return res.data;
  }

  // 19. Ementor Report
  static async getEMentor(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/ementor/v2/ementor_report${qs}`);
    return res.data;
  }

  // 20. Driver Safety
  static async getDriverSafety(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/safety/v2/safety_report${qs}`);
    return res.data;
  }

  // 21. Driver Delivery
  static async getDriverDelivery(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/delivery/v2/delivery_report${qs}`);
    return res.data;
  }

  // 22. Quality Report
  static async getQuality(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/quality/v2/quality_report${qs}`);
    return res.data;
  }

  // 23. E-Signature Report
  static async getESignature(params: ReportQueryParams): Promise<GenericReportResponse> {
    const queryParams: any = { ...params };
    if (queryParams.date && !queryParams.start && !queryParams.end) {
      queryParams.start = queryParams.date;
      queryParams.end = queryParams.date;
    }
    const qs = buildQueryString(queryParams);
    const res = await perfAxiosInstance.get(`/e-signature/v1/get_report${qs}`);
    return res.data;
  }

  // 24. Inventory Report
  static async getInventoryReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/inventory/v2/inventory_report${qs}`);
    return res.data;
  }

  // 25. EOC Report
  static async getEocReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/eoc/v2/eoc_report${qs}`);
    return res.data;
  }

  // 26. Suspended Driver Report
  static async getSuspendedDrivers(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/suspended/v3/get_suspended_drivers${qs}`);
    return res.data;
  }

  // 27. Daily Negative CDF Report
  static async getDailyNegativeCDF(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/negative_customer_feedback_daily/v2/negative_customer_feedback_daily_report${qs}`);
    return res.data;
  }

  // 28. Delivery Concessions Report
  static async getDeliveryConcessions(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/delivery_concessions/v2/delivery_concessions${qs}`);
    return res.data;
  }

  // 29. DVIC Report
  static async getDVICReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/dvic_report/v2/dvic_report${qs}`);
    return res.data;
  }

  // 30. Working Device Report
  static async getWorkingDeviceReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/working_device_report/v2/working_device_report${qs}`);
    return res.data;
  }

  // 31. Quality RTS / Delivery Completion DPMO
  static async getQualityRTSReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/quality_rts/v1/quality_rts_report${qs}`);
    return res.data;
  }

  // 32. Positive Customer Feedback (Daily)
  static async getDailyPositiveCDF(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/positive_customer_feedback_daily/v2/positive_customer_feedback_daily_report${qs}`);
    return res.data;
  }

  // ==========================================
  // ARCHIVED REPORTS
  // ==========================================

  // 33. Customer Feedback (Weekly)
  static async getCustomerFeedback(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/customer_feedback/v2/customer_feedback_report${qs}`);
    return res.data;
  }

  // 34. Operation Report
  static async getOperationReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/operation/v2/operation_report${qs}`);
    return res.data;
  }

  // 35. Netradyne Auto Coaching
  static async getAutoCoachingReport(params: ReportQueryParams): Promise<GenericReportResponse> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/auto_coaching/v2/live_alert_report${qs}`);
    return res.data;
  }

  // ==========================================
  // EXTRACTION APIS (FastAPI & Performance MSRV)
  // ==========================================

  /**
   * Upload & Extract Scorecard / Report
   * Posts to /extract/v3/{type} on prfsrv, or directly to /extract/v2/{type} on FastAPI extractor
   */
  static async uploadAndExtractReport(
    formData: FormData,
    type: "weekly" | "daily" = "weekly"
  ): Promise<any> {
    try {
      // Primary route through performance msrv extract/v3
      const res = await perfAxiosInstance.post(`/extract/v3/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch {
      // Fallback directly to FastAPI extractor proxy /extract/v2/{type}
      const fallbackRes = await extractAxiosInstance.post(`/v2/${type}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return fallbackRes.data;
    }
  }

  /**
   * Get Missing Daily Reports
   */
  static async getDailyMissingReports(params: ReportQueryParams): Promise<any> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/upload_summary/v2/daily_missing_reports${qs}`);
    return res.data;
  }

  /**
   * Get Missing Weekly Reports
   */
  static async getWeeklyMissingReports(params: ReportQueryParams): Promise<any> {
    const qs = buildQueryString(params);
    const res = await perfAxiosInstance.get(`/upload_summary/v2/weekly_missing_reports${qs}`);
    return res.data;
  }

  /**
   * Generic report fetcher by reportKey
   */
  static async fetchReportData(reportKey: string, params: ReportQueryParams): Promise<GenericReportResponse> {
    switch (reportKey) {
      // Weekly
      case "current_week_scorecard":
        return this.getCurrentScorecard(params);
      case "trailing_week_scorecard":
        return this.getTrailingScorecard(params);
      case "compare_scorecard_report":
        return this.getCompareScorecard(params);
      case "negative_customer_feedback_report":
        return this.getNegativeCDF(params);
      case "photo_on_delivery_quality_report":
        return this.getPODReport(params);
      case "proper_parking_sequence_report":
        return this.getPPSReport(params);
      case "dsp_scorecards":
        return this.getDspScorecards(params);
      case "da_weekly_overview_report":
        return this.getDAWeeklyOverview(params);
      case "driver_rating_report":
        return this.getDriverRating(params);
      case "average_of_acceptance_mmd_report":
        return this.getAverageOfAcceptance(params);
      case "completion_and_miss_mmd_report":
        return this.getDvirCompletion(params);
      case "weekly_roster_report":
        return this.getWeeklyRoster(params);

      // Daily
      case "daily_driver_scorecard":
        return this.getDailyDriverScorecard(params);
      case "all_alert_report":
      case "all_alert_report_mmd":
        return this.getAllAlertReport(params);
      case "driver_report":
      case "netradyne_driver_report_mmd":
        return this.getNetradyneDriverReport(params);
      case "callouts_report":
        return this.getCallOuts(params);
      case "attendance_and_extras_report":
        return this.getAttendance(params);
      case "rescue_report":
        return this.getRescue(params);
      case "e_mentor_report":
        return this.getEMentor(params);
      case "driver_safety":
        return this.getDriverSafety(params);
      case "driver_delivery":
        return this.getDriverDelivery(params);
      case "quality_report":
        return this.getQuality(params);
      case "e_signature_report":
        return this.getESignature(params);
      case "inventory_report":
      case "inventory_assignment":
        return this.getInventoryReport(params);
      case "eoc_report":
        return this.getEocReport(params);
      case "suspended_driver_report":
        return this.getSuspendedDrivers(params);
      case "negative_customer_feedback":
        return this.getDailyNegativeCDF(params);
      case "delivery_concessions":
        return this.getDeliveryConcessions(params);
      case "dvic_report":
        return this.getDVICReport(params);
      case "working_device_report":
        return this.getWorkingDeviceReport(params);
      case "quality_rts_report":
        return this.getQualityRTSReport(params);
      case "positive_customer_feedback":
        return this.getDailyPositiveCDF(params);

      // Archive
      case "customer_feedback_report":
        return this.getCustomerFeedback(params);
      case "work_hour_compliance_report":
        return this.getWHCReport(params);
      case "operation_report":
        return this.getOperationReport(params);
      case "netradyne_auto_coaching":
        return this.getAutoCoachingReport(params);

      default:
        // Default to current scorecard if unknown
        return this.getCurrentScorecard(params);
    }
  }
}
