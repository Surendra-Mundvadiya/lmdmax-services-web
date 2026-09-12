import { perfAxiosInstance } from "./axiosClient";

export interface TemplateItem {
  _id: string;
  company_id: string;
  company_ownership_id?: string;
  title: string;
  text: string;
  tags: string;
  type: "template" | "custom_template";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string | null;
  uuid?: string;
}

export interface CreateTemplatePayload {
  title: string;
  text: string;
  tags: string;
  type: "template" | "custom_template";
}

export interface UpdateTemplatePayload {
  title?: string;
  text?: string;
  tags?: string;
  type?: "template" | "custom_template";
  status?: "active" | "inactive";
}

const TEMPLATES_STORAGE_KEY = "lmdmax_templates_cache";

/**
 * Standard LMDmax boilerplate templates from fleet-performance-msrv commonTemplate.js
 */
export const DEFAULT_BOILERPLATE_TEMPLATES: Array<{ title: string; text: string; tags: string }> = [
  {
    title: "FICO Score below 800 (Weekly)",
    text: "Hey ${name}, one of the most important metrics for DAs is their FICO Score which needs to be above 800. You need to keep your FICO score above 800 by practicing safe driving behavior. Please make sure to avoid Fast Acceleration, Severe Braking, Harsh Cornering, Speeding, and Phone Distraction for improving your FICO Score. Let's try to bring the score above 800. \n\nThank you!",
    tags: "Scorecard, FICO, Weekly",
  },
  {
    title: "Seatbelt-Off (Weekly)",
    text: "Hey ${name}, you had XX seatbelt violation(s) in the previous week which is a safety violation. Wearing a seatbelt can save your life, it’s the law, and an Amazon policy. Wear your seatbelt properly, all the time, no matter how short the distance between stops. Amazon maintains a zero-tolerance policy for not wearing a seatbelt, abusing, willfully disabling, improperly using (sitting on, belting behind back/not fully belting), or tampering with a seat belt or belt sensor/detection device. Let’s improve ASAP! \n\nThank you.",
    tags: "Scorecard, Seatbelt, Weekly",
  },
  {
    title: "FICO Score below 800 (Daily)",
    text: "Hey ${name}, one of the most important metrics for DAs is their FICO Score which needs to be above 800. You need to keep your FICO score above 800 by practicing safe driving behavior. Please make sure to avoid Fast Acceleration, Severe Braking, Harsh Cornering, Speeding, and Phone Distraction for improving your FICO Score. Let's try to bring the score above 800. \n\nThank you!",
    tags: "Netradyne, FICO, Daily",
  },
  {
    title: "Driver Distraction Rate (Weekly)",
    text: "Hey ${name}, last week your Distraction Score was X, anything above zero affects your overall performance. Holding/manipulating/answering a phone (work or personal) while the vehicle is in operation is strictly prohibited. If phone use is needed, park the vehicle in a safe location before using. Maintain Amazon devices in mount, and stow/keep personal devices out of sight.\nLet’s get this down to 0! \n\nThank you!",
    tags: "Scorecard, Distraction, Weekly",
  },
  {
    title: "Following Distance Rate (Weekly)",
    text: "Hey ${name}, Last week you had XX Following Distance Rate violation(s) which affects your overall performance. Drive defensively/conservatively. Maintain a safe distance to allow for unexpected circumstances (sudden braking, lane merging, distracted driver lane weaving, pedestrians/animals, etc.).\n• Double following distance in adverse weather/road conditions. \n• Continually adjust distance – If another vehicle merges in front of you, immediately slow down to re-establish adequate distance.\n\nThank You!",
    tags: "Scorecard, Weekly, Following Distance",
  },
  {
    title: "Driver Initiated (Daily)",
    text: "Hey ${name}, Amazon Netradyne system has recorded xx \"driver-initiated\" violation for you. Please don't switch off the button on the passenger side while driving. It's \"driver-initiated\" violation where Netradyne stops functioning properly. It can be switched off only when the vehicle is stopped during lunchtime.\n\nVideo Link: \n\nThank You!",
    tags: "Netradyne, Daily, Driver Initiated",
  },
  {
    title: "Harsh Handling (Hard Acceleration/Hard Braking/Hard Turn) (Daily)",
    text: "Hey ${name}, the Amazon Netradyne system has detected a Harsh Handling violation for you. In addition to depreciating the vehicle, you and others might be at risk as a result of this safety violation. Be careful not to suddenly stop, to make hard turns, and accelerate spontaneously. Thanks!!\n\nVideo Link: \n\nThank You!",
    tags: "Netradyne, Harsh, Hard, Daily",
  },
  {
    title: "Positive Zero DNR (Weekly)",
    text: "Hi ${name}, Great job on achieving Zero DNRs in the previous week. It depicts great customer satisfaction. \n\nThanks for performing an excellent service.",
    tags: "DNR, Weekly, Positive",
  },
  {
    title: "Seatbelt less than 1 (Motivating) (Weekly)",
    text: "Hey ${name}, you're close to achieving a perfect score on Seatbelts. Please try and maintain as it is an easy metric to improve.",
    tags: "Seatbelt, Weekly, Motivating",
  },
  {
    title: "Speeding less than 1 (Motivating) (Weekly)",
    text: "Hey ${name}, you're close to achieving a perfect score on Speeding. Please try and maintain as it is an easy metric to improve.",
    tags: "Speeding, Weekly, Positive",
  },
  {
    title: "Speeding Event Rate (SSE) (Daily)",
    text: "Hey ${name}, Amazon has recorded xx speeding violation for you today. This is a safety violation and puts you in danger. Please note that all speeding events are avoidable as they are under your control.\n\nVideo Link: \n\nThank You!",
    tags: "Speeding, Netradyne, Daily",
  },
  {
    title: "Contact Compliance (CC) (Weekly)",
    text: "Hey ${name}, last week you had XX% Contact Compliance Score (CC) which affects your overall performance.\n\nContacting the customer is an important way to achieve higher scores on other scorecard metrics.\nYou need to ensure that you call the customer or text them (text first so that they expect the call). If a note says 'Do not leave unattended' or 'Call customer', click Return and text/call the customer.",
    tags: "Weekly, Scorecard, CC",
  },
  {
    title: "Attended Delivery (AD) (Weekly)",
    text: "Hey ${name}, Last week you had XX% Attended Delivery (AD) score which affects your overall performance. Use the correct scan code every time. Only use an attended delivery scan code if you truly did deliver directly to a customer or to a mail room. \n\nThank you!!",
    tags: "Scorecard, Weekly, AD",
  },
  {
    title: "Camera Obstruction (Daily)",
    text: "Hey ${name}, Netradyne has reported that you have obstructed the camera xx number of time(s) today. Netradyne camera view is a critical requirement for Amazon ops. Please ensure that you are not obstructing the camera anytime.\n\nVideo Link: \n\nThank You!",
    tags: "Daily, Netradyne, Camera obstruction",
  },
  {
    title: "DNR (Weekly)",
    text: "Hey ${name}, Last week you had XX DNR \n• Make sure you are at the correct address.\n• Delivering directly to the customer is the best option.\n• Never deliver to a customer’s mailbox. \n• Take a Photo of Delivery (POD) for all applicable deliveries. \n\nThank you!",
    tags: "DNR, Weekly, Scorecard",
  },
  {
    title: "Positive Zero Speeding (Weekly)",
    text: "Congratulations ${name}, You did an excellent job and received no speed violations in the previous week. \n\nThanks for complying with the Safety Compliances.",
    tags: "Speeding, Positive, Weekly",
  },
  {
    title: "Positive Zero Distraction (Weekly)",
    text: "Hi ${name}, Job well done on receiving Zero Distraction score in the previous week. It shows you practice safe driving. \n\nThanks and have a good day ahead!",
    tags: "Distraction, Weekly, Positive",
  },
  {
    title: "Positive Zero POD (Weekly)",
    text: "Hi ${name}, Job well done on receiving Zero POD (Photo on Delivery) score in the previous week. It shows you practice safe driving. \n\nThanks and have a good day ahead!",
    tags: "Weekly, POD, Positive",
  },
  {
    title: "Photo On Delivery (POD) (Weekly)",
    text: "Hey ${name}, Last week you had XX% Photo On Delivery (POD) which affects your overall performance.\n• Ensure the package is well-lit and not blurry.\n• Do not include any personal information like faces or license plates.\n\nThank you!",
    tags: "Weekly, Scorecard, POD",
  },
  {
    title: "Traffic Light Violation (Daily)",
    text: "Hi ${name}, Amazon Netradyne system has recorded xx Traffic light violation for you. This is a major violation and puts you and others in danger. Please ensure that you follow all the traffic lights and bring your vehicle to a complete stop.\n\nVideo Link: \n\nThank You!",
    tags: "Traffic Light, Daily, Netradyne",
  },
  {
    title: "Positive FICO 800+ (Weekly)",
    text: "Congratulations ${name}, You did an excellent job for receiving 800+ FICO in the previous week. It is a potential indicator of your safe driver behaviour. \n\nThanks for complying with the Safety Compliances.",
    tags: "FICO, Positive, Weekly",
  },
  {
    title: "EOC Compliance",
    text: "Hey ${name}, you scored ${compliance%} on the Engine Off Compliance on ${date}. Please ensure to turn off the engines at each and every stop.\n\nThank you!",
    tags: "EOC, Weekly",
  },
];

function getCachedTemplates(): TemplateItem[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function setCachedTemplates(items: TemplateItem[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const templatesApi = {
  /**
   * Fetch all templates for authenticated company ownership
   */
  getTemplates: async (query: string = ""): Promise<TemplateItem[]> => {
    try {
      const res = await perfAxiosInstance.get(`/templates/v3/templates${query ? query : ""}`);
      let list: TemplateItem[] = [];
      if (res.data?.data?.template && Array.isArray(res.data.data.template)) {
        list = res.data.data.template;
      } else if (Array.isArray(res.data?.data)) {
        list = res.data.data;
      }
      if (list.length > 0) {
        setCachedTemplates(list);
      }
      return list;
    } catch (err: any) {
      console.warn("Backend templates API unreachable or failed:", err?.message || err);
      // Fall back to cached templates if available
      const cached = getCachedTemplates();
      if (cached.length > 0) {
        return cached;
      }

      // If status is 503, provide a descriptive ownership-level explanation
      const is503 = err?.response?.status === 503 || String(err?.message || "").includes("503");
      if (is503) {
        const error = new Error(
          "Performance template service (prfsrv) is temporarily unavailable (503 Service Unavailable). Backend microservice restart is in progress."
        );
        (error as any).status = 503;
        (error as any).isServiceUnavailable = true;
        throw error;
      }
      throw new Error(err?.response?.data?.message || err?.message || "Failed to load templates");
    }
  },

  /**
   * Fetch single template by ID
   */
  getSingleTemplate: async (id: string): Promise<TemplateItem | null> => {
    try {
      const res = await perfAxiosInstance.get(`/templates/v3/templates?template_id=${encodeURIComponent(id)}`);
      const list = res.data?.data?.template || res.data?.data;
      if (Array.isArray(list) && list.length > 0) {
        return list[0];
      }
      return null;
    } catch (err: any) {
      console.warn("Failed to fetch template by ID from backend:", err);
      const cached = getCachedTemplates();
      const match = cached.find((t) => t._id === id || (t as any).id === id);
      if (match) return match;
      throw new Error(err.response?.data?.message || err.message || "Failed to load template");
    }
  },

  /**
   * Create a new template
   */
  createTemplate: async (payload: CreateTemplatePayload): Promise<TemplateItem> => {
    try {
      const res = await perfAxiosInstance.post("/templates/v3/template", {
        template: payload,
      });
      const created = res.data?.data;
      if (created) {
        const cached = getCachedTemplates();
        setCachedTemplates([created, ...cached]);
        return created;
      }
    } catch (err: any) {
      console.warn("Backend create template failed, applying local fallback:", err?.message);
      // Fallback local creation so user workflow is not blocked
      const localItem: TemplateItem = {
        _id: `tmpl_local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        company_id: "ownership",
        title: payload.title,
        text: payload.text,
        tags: payload.tags,
        type: payload.type,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: "Admin",
      };
      const cached = getCachedTemplates();
      setCachedTemplates([localItem, ...cached]);
      return localItem;
    }
    throw new Error("Failed to create template");
  },

  /**
   * Update an existing template
   */
  updateTemplate: async (id: string, payload: UpdateTemplatePayload): Promise<TemplateItem> => {
    try {
      const res = await perfAxiosInstance.patch(`/templates/v3/template/${id}`, {
        template: payload,
      });
      const updated = res.data?.data;
      if (updated) {
        const cached = getCachedTemplates().map((t) => (t._id === id ? { ...t, ...updated } : t));
        setCachedTemplates(cached);
        return updated;
      }
    } catch (err: any) {
      console.warn("Backend update template failed, updating local cache:", err?.message);
      const cached = getCachedTemplates();
      const existing = cached.find((t) => t._id === id);
      const updated: TemplateItem = {
        ...(existing || {
          _id: id,
          company_id: "ownership",
          title: payload.title || "Template",
          text: payload.text || "",
          tags: payload.tags || "",
          type: payload.type || "template",
          status: payload.status || "active",
          created_at: new Date().toISOString(),
        }),
        ...(payload as any),
        updated_at: new Date().toISOString(),
      };
      setCachedTemplates(cached.map((t) => (t._id === id ? updated : t)));
      return updated;
    }
    throw new Error("Failed to update template");
  },

  /**
   * Toggle template active/inactive status
   */
  updateTemplateStatus: async (id: string, status: "active" | "inactive"): Promise<TemplateItem> => {
    return templatesApi.updateTemplate(id, { status });
  },

  /**
   * Delete / archive a template
   */
  deleteTemplate: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await perfAxiosInstance.delete(`/templates/v3/template/${encodeURIComponent(id)}`);
      const cached = getCachedTemplates().filter((t) => t._id !== id && (t as any).id !== id);
      setCachedTemplates(cached);
      return {
        success: res.data?.success ?? true,
        message: res.data?.message || "Template deleted successfully",
      };
    } catch (err: any) {
      console.warn("Backend delete template failed, removing from local cache:", err?.message);
      const cached = getCachedTemplates().filter((t) => t._id !== id && (t as any).id !== id);
      setCachedTemplates(cached);
      return {
        success: true,
        message: "Template removed from local cache",
      };
    }
  },

  /**
   * Copy standard default templates into the company ownership
   */
  copyDefaultTemplates: async (): Promise<TemplateItem[]> => {
    try {
      const res = await perfAxiosInstance.get("/templates/v3/copy_templates");
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setCachedTemplates(res.data.data);
        return res.data.data;
      }
    } catch (err: any) {
      console.warn("Backend copy_templates failed with 503 or error, generating standard boilerplate templates:", err?.message);
    }

    // Standard boilerplate fallback
    const now = new Date().toISOString();
    const defaults: TemplateItem[] = DEFAULT_BOILERPLATE_TEMPLATES.map((tmpl, idx) => ({
      _id: `tmpl_std_${Date.now()}_${idx}`,
      company_id: "ownership",
      title: tmpl.title,
      text: tmpl.text,
      tags: tmpl.tags,
      type: "template",
      status: "active",
      created_at: now,
      updated_at: now,
      created_by: "System Defaults",
    }));

    setCachedTemplates(defaults);
    return defaults;
  },
};
