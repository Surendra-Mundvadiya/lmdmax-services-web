export const GLOBAL_RELEASE_VERSION = "7.3.0";
export const GOOGLE_CLIENT_ID =
  "819321757777-haj2gtfouk6cl5vmuptoidb3ebbj25ju.apps.googleusercontent.com";
export const CLOUDFRONT_URL = "https://d2jilumhwuwrmw.cloudfront.net";

export type EnvKey =
  | "localhost"
  | "development"
  | "staging"
  | "betastaging"
  | "production";

export type EnvironmentConfig = {
  env: EnvKey;
  USER_URL: string;
  BASE_URL: string;
  IN_APP_URL: string;
  AI_DAMAGE_URL: string;
  VIEWER_URL: string;
  OCR_URL: string;
  SCHEDULER_URL: string;
  FLEETMAX_URL: string;
  PERF_URL: string;
  RELEASE: string;
  LOGS: boolean;
};

const Environments: Record<EnvKey, EnvironmentConfig> = {
  production: {
    env: "production",
    USER_URL: "https://production-api.fleet.lmdmax.com/lmd/usrsrv",
    BASE_URL: "https://production-api.fleet.lmdmax.com",
    IN_APP_URL: "https://production-messaging.fleet.lmdmax.com/lmd/twms",
    AI_DAMAGE_URL: "https://production-api.fleet-ai-proxy.lmdmax.com/aiproxy",
    VIEWER_URL: "https://production-api.viewer.prr.ai",
    OCR_URL: "https://production-fastapi.fleet.lmdmax.com",
    SCHEDULER_URL: "https://production-api.fleet.lmdmax.com/lmd/schsrv",
    FLEETMAX_URL: "https://production-api.fleet.lmdmax.com/lmd/maxsrv",
    PERF_URL: "https://production-api.fleet.lmdmax.com/lmd/prfsrv",
    RELEASE: GLOBAL_RELEASE_VERSION,
    LOGS: false,
  },
  staging: {
    env: "staging",
    USER_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/usrsrv",
    BASE_URL: "https://betastaging-api.fleet.lmdmax.com",
    IN_APP_URL: "https://betastaging-messaging.fleet.lmdmax.com/lmd/twms",
    AI_DAMAGE_URL: "https://betastaging-api.fleet.lmdmax.com",
    VIEWER_URL: "https://staging-api.viewer.prr.ai",
    OCR_URL: "https://staging-fastapi.fleet.lmdmax.com",
    SCHEDULER_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/schsrv",
    FLEETMAX_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/maxsrv",
    PERF_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/prfsrv",
    RELEASE: GLOBAL_RELEASE_VERSION,
    LOGS: true,
  },
  betastaging: {
    env: "betastaging",
    USER_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/usrsrv",
    BASE_URL: "https://betastaging-api.fleet.lmdmax.com",
    IN_APP_URL: "https://betastaging-messaging.fleet.lmdmax.com/lmd/twms",
    AI_DAMAGE_URL: "https://staging-api.fleet.lmdmax.com",
    VIEWER_URL: "https://staging-api.viewer.prr.ai",
    OCR_URL: "https://staging-fastapi.fleet.lmdmax.com",
    SCHEDULER_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/schsrv",
    FLEETMAX_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/maxsrv",
    PERF_URL: "https://betastaging-api.fleet.lmdmax.com/lmd/prfsrv",
    RELEASE: GLOBAL_RELEASE_VERSION,
    LOGS: true,
  },
  development: {
    env: "development",
    USER_URL: "https://development-api.fleet.lmdmax.com/lmd/usrsrv",
    BASE_URL: "https://development-api.fleet.lmdmax.com",
    IN_APP_URL: "https://development-messaging.fleet.lmdmax.com/lmd/twms",
    AI_DAMAGE_URL: "https://staging-api.fleet.lmdmax.com",
    VIEWER_URL: "https://staging-api.viewer.prr.ai",
    OCR_URL: "https://staging-fastapi.fleet.lmdmax.com",
    SCHEDULER_URL: "https://development-api.fleet.lmdmax.com/lmd/schsrv",
    FLEETMAX_URL: "https://development-api.fleet.lmdmax.com/lmd/maxsrv",
    PERF_URL: "https://development-api.fleet.lmdmax.com/lmd/prfsrv",
    RELEASE: GLOBAL_RELEASE_VERSION,
    LOGS: true,
  },
  localhost: {
    env: "localhost",
    USER_URL: "/lmd/usrsrv",
    BASE_URL: "",
    IN_APP_URL: "/lmd/twms",
    AI_DAMAGE_URL: "/aiproxy",
    VIEWER_URL: "https://staging-api.viewer.prr.ai",
    OCR_URL: "https://staging-fastapi.fleet.lmdmax.com",
    SCHEDULER_URL: "/lmd/schsrv",
    FLEETMAX_URL: "/lmd/maxsrv",
    PERF_URL: "/lmd/prfsrv",
    RELEASE: GLOBAL_RELEASE_VERSION,
    LOGS: true,
  },
};

export function getEnvKey(): EnvKey {
  if (typeof window === "undefined") return "localhost";
  const host = window.location.hostname;
  if (host.includes("localhost") || host.includes("127.0.0.1")) return "localhost";
  if (host.startsWith("staging")) return "staging";
  if (host.startsWith("betastaging")) return "betastaging";
  if (host.startsWith("dev")) return "development";
  return "production";
}

const Environment = Environments[getEnvKey()];
export default Environment;
