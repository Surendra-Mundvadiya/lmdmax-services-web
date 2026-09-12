import { useAuthStore } from "../store/authStore";

/**
 * When the station the user is currently switched to (`current: true`) is
 * inactive (`active: false`), the app is in read-only mode: the user may NOT
 * perform any write operations (add / edit / delete / action).
 *
 * Mirrors fleet-web-production useStationReadOnly.ts
 */
export const STATION_READ_ONLY_MESSAGE =
  "Station is marked inactive. No actions are available for this station.";

export type StationReadOnly = {
  readOnly: boolean;
  reason: string;
  stationCode: string;
};

export const useStationReadOnly = (): StationReadOnly => {
  const stations = useAuthStore((state) => state.stations);
  const user = useAuthStore((state) => state.user);

  const currentStation = stations.find((s) => s.current) || stations[0];
  const stationCode =
    currentStation?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE2";

  const readOnly = Boolean(currentStation && currentStation.active === false);

  return {
    readOnly,
    reason: STATION_READ_ONLY_MESSAGE,
    stationCode,
  };
};

export default useStationReadOnly;
