import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import Environment from "../environment";

export const getClientTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: Environment.USER_URL,
  headers: {
    "Content-Type": "application/json",
    "app-type": "1",
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

export const perfAxiosInstance: AxiosInstance = axios.create({
  baseURL: Environment.PERF_URL,
  headers: {
    "Content-Type": "application/json",
    "app-type": "2",
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

export const schAxiosInstance: AxiosInstance = axios.create({
  baseURL: Environment.SCHEDULER_URL,
  headers: {
    "Content-Type": "application/json",
    "app-type": "1",
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

export const fleetMaxAxiosInstance: AxiosInstance = axios.create({
  baseURL: Environment.FLEETMAX_URL,
  headers: {
    "Content-Type": "application/json",
    "app-type": "1",
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

export const inAppAxiosInstance: AxiosInstance = axios.create({
  baseURL: Environment.IN_APP_URL,
  headers: {
    "Content-Type": "application/json",
    "app-type": "1",
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

export const extractAxiosInstance: AxiosInstance = axios.create({
  baseURL: "/extract",
  headers: {
    client_time_zone: getClientTimeZone(),
    "client-time-zone": getClientTimeZone(),
  },
});

const allInstances = [
  axiosInstance,
  perfAxiosInstance,
  schAxiosInstance,
  fleetMaxAxiosInstance,
  inAppAxiosInstance,
  extractAxiosInstance,
];

export const setAuthToken = (token?: string, accountId?: string | number) => {
  allInstances.forEach((inst) => {
    if (token) {
      inst.defaults.headers.common["x-access-token"] = token;
      inst.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      inst.defaults.headers.common["session-token"] = token;
    } else {
      delete inst.defaults.headers.common["x-access-token"];
      delete inst.defaults.headers.common["Authorization"];
      delete inst.defaults.headers.common["session-token"];
    }

    if (accountId) {
      inst.defaults.headers.common["x-access-user"] = String(accountId);
      inst.defaults.headers.common["x-access-account-id"] = String(accountId);
    } else {
      delete inst.defaults.headers.common["x-access-user"];
      delete inst.defaults.headers.common["x-access-account-id"];
    }
  });
};

// Request interceptor to dynamically inject token from localStorage if available
const injectAuth = (config: InternalAxiosRequestConfig) => {
  const authData = localStorage.getItem("lmdmax_auth_session");
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      const token = parsed?.state?.token;
      const accountId = parsed?.state?.user?.account_id || parsed?.state?.user?.id;
      if (token) {
        config.headers["x-access-token"] = token;
        config.headers["session-token"] = token;
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      if (accountId) {
        config.headers["x-access-user"] = String(accountId);
        config.headers["x-access-account-id"] = String(accountId);
      }
    } catch {
      // ignore parse error
    }
  }
  return config;
};

allInstances.forEach((inst) => {
  inst.interceptors.request.use(injectAuth);
});

