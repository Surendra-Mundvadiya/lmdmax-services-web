import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../api/axiosClient";
import type {
  Driver,
  StationOption,
  DriverStatusFilter,
  DriverSigninFilter,
} from "../types/driver";
import { useAuthStore } from "./authStore";

export let AVAILABLE_STATIONS: StationOption[] = [];

const INITIAL_DRIVERS: Driver[] = [];

interface DriverState {
  drivers: Driver[];
  availableStations: StationOption[];
  isLoading: boolean;
  selectedStationFilter: string; // "ALL", "DDF4", etc.
  statusFilter: DriverStatusFilter;
  signinFilter: DriverSigninFilter;
  searchQuery: string;

  // Actions
  fetchDrivers: () => Promise<void>;
  setSelectedStationFilter: (stationCode: string) => void;
  setStatusFilter: (status: DriverStatusFilter) => void;
  setSigninFilter: (filter: DriverSigninFilter) => void;
  setSearchQuery: (query: string) => void;

  addDriver: (driver: Omit<Driver, "id" | "name">) => Driver;
  createDriverAsync: (driver: Omit<Driver, "id" | "name">) => Promise<Driver>;
  updateDriver: (id: number, updates: Partial<Driver>) => void;
  deleteDriver: (id: number) => void;
  deleteDriverAsync: (id: number) => Promise<{ success: boolean; message?: string }>;
  toggleDriverStatus: (id: number) => void;
  toggleDriverSignin: (id: number) => void;
  toggleDriverInspections: (id: number) => void;

  // Bulk actions
  bulkUpdateStatus: (ids: number[], status: "active" | "inactive") => void;
  bulkUpdateSignin: (ids: number[], allowSignin: boolean) => void;
  bulkUpdateInspections: (ids: number[], allowInspections: boolean) => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      drivers: INITIAL_DRIVERS,
      availableStations: [],
      isLoading: false,
      selectedStationFilter: "ALL",
      statusFilter: "all",
      signinFilter: "all",
      searchQuery: "",

      fetchDrivers: async () => {
        set({ isLoading: true });
        try {
          const authStations = useAuthStore.getState().stations || [];
          const activeStationObj = authStations.find((s) => s.current) || authStations[0];
          const currentStationCode =
            activeStationObj?.station_code ||
            useAuthStore.getState().user?.station_code ||
            useAuthStore.getState().user?.company?.station_code ||
            "QUE4";

          // Initialize selectedStationFilter to active station if currently empty
          if (!get().selectedStationFilter) {
            set({ selectedStationFilter: currentStationCode });
          }

          // Populate stations strictly from authStore ACTIVE stations
          const stationMap = new Map<string, StationOption>();
          authStations.forEach((st) => {
            if (st.station_code && st.active && !stationMap.has(st.station_code)) {
              stationMap.set(st.station_code, {
                code: st.station_code,
                name: `${st.station_code} Hub`,
              });
            }
          });
          const stationList = Array.from(stationMap.values());
          AVAILABLE_STATIONS.length = 0;
          AVAILABLE_STATIONS.push(...stationList);

          // 1. Fetch using Fleet App pattern:
          // Try /drivers/v1/drivers/all_stations?limit=700&is_deleted=false first
          let res: any = null;
          try {
            res = await axiosInstance.get("drivers/v1/drivers/all_stations?limit=700&is_deleted=false");
          } catch {
            res = null;
          }

          let rawData = res?.data?.data?.data || res?.data?.data || res?.data || [];
          let list: any[] = Array.isArray(rawData) ? rawData : rawData?.drivers || rawData?.data || [];

          // 2. If all_stations was empty or failed, call station-scoped /drivers/v1/drivers?limit=700
          if (!list || list.length === 0) {
            try {
              const singleRes = await axiosInstance.get("drivers/v1/drivers?limit=700");
              const singleData = singleRes?.data?.data?.data || singleRes?.data?.data || singleRes?.data || [];
              list = Array.isArray(singleData) ? singleData : singleData?.drivers || singleData?.data || [];
            } catch {
              // continue
            }
          }

          // 3. Fallback to all_drivers only if previous endpoints returned nothing
          if (!list || list.length === 0) {
            try {
              const allRes = await axiosInstance.get("drivers/v1/all_drivers?limit=500");
              const allData = allRes?.data?.data || allRes?.data || [];
              list = Array.isArray(allData) ? allData : allData?.drivers || [];
            } catch {
              // continue
            }
          }

          // Strict filtering of soft-deleted records:
          // Rule 1: Exclude records with explicit is_deleted flag
          // Rule 2: Exclude soft-deleted hash-suffixed records (backend appends '#' + random chars on deletion)
          const cleanActiveAndInactiveDrivers = list.filter((item: any) => {
            if (!item || typeof item !== "object") return false;

            // 1. Explicit deletion flags
            if (
              item.is_deleted === true ||
              item.is_deleted === 1 ||
              String(item.is_deleted).toLowerCase() === "true"
            ) {
              return false;
            }

            // 2. Soft-delete markers: backend appends '#' + random string on deletion
            const email = String(item.email || "");
            if (email.includes("#")) return false;

            const transporterId = String(item.transporter_id || item.transporterId || "");
            if (transporterId.includes("#")) return false;

            const phone = String(item.phone || item.mobile || "");
            if (phone.includes("#")) return false;

            const netradyneId = String(item.netradyne_id || "");
            if (netradyneId.includes("#")) return false;

            return true;
          });

          // Deduplicate by driver ID to guarantee unique driver records
          const seenIds = new Set<number>();
          const deduplicatedList: any[] = [];
          for (const item of cleanActiveAndInactiveDrivers) {
            const id = Number(item.id);
            if (!id || isNaN(id) || seenIds.has(id)) continue;
            seenIds.add(id);
            deduplicatedList.push(item);
          }

          const mapped: Driver[] = deduplicatedList.map((item: any) => {
            const firstName = (item.first_name || item.name?.split(" ")[0] || "").trim();
            const lastName = (item.last_name || item.name?.split(" ").slice(1).join(" ") || "").trim();
            const fullName = (item.name || `${firstName} ${lastName}`).trim() || `Driver ${item.id}`;

            // Resolve assigned station codes
            let resolvedStations: { station_code: string }[] = [];
            if (Array.isArray(item.stations) && item.stations.length > 0) {
              const codes: string[] = item.stations
                .map((s: any) => {
                  if (typeof s === "string") return s;
                  if (s?.station_code) return String(s.station_code);
                  if (s?.code) return String(s.code);
                  if (s?.company_id != null) {
                    const match = authStations.find((st) => String(st.company_id) === String(s.company_id));
                    if (match?.station_code) return String(match.station_code);
                  }
                  return "";
                })
                .filter((c: string): c is string => Boolean(c));
              resolvedStations = Array.from(new Set(codes)).map((c: string) => ({ station_code: c }));
            }

            if (resolvedStations.length === 0) {
              if (item.station_code) {
                resolvedStations = [{ station_code: item.station_code }];
              } else if (item.company_id != null) {
                const match = authStations.find((st) => String(st.company_id) === String(item.company_id));
                if (match?.station_code) {
                  resolvedStations = [{ station_code: match.station_code }];
                }
              }
            }

            // Fallback to currently active station so rows show actual station tag instead of static Unassigned
            if (resolvedStations.length === 0 && currentStationCode) {
              resolvedStations = [{ station_code: currentStationCode }];
            }

            const cleanTid = (item.transporter_id || item.transporterId || "")
              .toString()
              .replace(/^#+/, "")
              .split("#")[0]
              .trim();
            const cleanEmail = (item.email || "")
              .toString()
              .replace(/^#+/, "")
              .split("#")[0]
              .trim();

            const rawStatus = (item.status || "").toString().trim().toLowerCase();
            const status: "active" | "inactive" =
              rawStatus === "inactive" || item.is_active === false ? "inactive" : "active";

            return {
              id: item.id,
              first_name: firstName,
              last_name: lastName,
              name: fullName,
              title: item.title || "",
              email: cleanEmail,
              phone: item.phone || item.mobile || "",
              transporter_id: cleanTid || `DA-${item.id}`,
              address: item.address || "",
              hire_date: item.hire_date || item.createdAt?.split("T")[0] || "",
              date_of_birth: item.date_of_birth || "",
              work_anniversary: item.work_anniversary || "",
              status,
              allow_signin: item.allow_signin !== undefined ? Boolean(item.allow_signin) : true,
              allow_inspections: item.allow_inspections !== undefined ? Boolean(item.allow_inspections) : true,
              stations: resolvedStations,
              metrics: item.metrics || { parkingCount: 0, rescueCompleted: 0, damageCount: 0 },
              created_at: item.created_at || item.createdAt || new Date().toISOString(),
            };
          });

          set({
            drivers: mapped,
            availableStations: stationList,
            isLoading: false,
          });
        } catch (err) {
          console.error("fetchDrivers error:", err);
          set({ isLoading: false });
        }
      },

      setSelectedStationFilter: (stationCode) => set({ selectedStationFilter: stationCode }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSigninFilter: (filter) => set({ signinFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),


      addDriver: (driverInput) => {
        const cleanTid = driverInput.transporter_id ? driverInput.transporter_id.replace(/^#+/, "").trim().toUpperCase() : "";
        const cleanEmail = driverInput.email ? driverInput.email.replace(/^#+/, "").trim().toLowerCase() : "";
        const fullName = `${driverInput.first_name} ${driverInput.last_name}`.trim();
        const newDriver: Driver = {
          ...driverInput,
          transporter_id: cleanTid,
          email: cleanEmail,
          id: Date.now(),
          name: fullName,
          created_at: new Date().toISOString(),
          metrics: {
            parkingCount: 0,
            rescueCompleted: 0,
            damageCount: 0,
          },
        };
        set((state) => ({
          drivers: [newDriver, ...state.drivers],
        }));
        return newDriver;
      },

      createDriverAsync: async (driverInput) => {
        const cleanTid = driverInput.transporter_id ? driverInput.transporter_id.replace(/^#+/, "").trim().toUpperCase() : "";
        const cleanEmail = driverInput.email ? driverInput.email.replace(/^#+/, "").trim().toLowerCase() : "";
        const fullName = `${driverInput.first_name} ${driverInput.last_name}`.trim();
        const optimisticDriver: Driver = {
          ...driverInput,
          transporter_id: cleanTid,
          email: cleanEmail,
          id: Date.now(),
          name: fullName,
          created_at: new Date().toISOString(),
          metrics: {
            parkingCount: 0,
            rescueCompleted: 0,
            damageCount: 0,
          },
        };

        // Optimistic instant update into state
        set((state) => ({
          drivers: [optimisticDriver, ...state.drivers.filter((d) => d.id !== optimisticDriver.id)],
        }));

        try {
          const payload = {
            name: fullName,
            first_name: driverInput.first_name,
            last_name: driverInput.last_name,
            email: cleanEmail,
            phone: driverInput.phone,
            transporter_id: cleanTid,
            netradyne_id: (driverInput as any).netradyne_id ? (driverInput as any).netradyne_id.replace(/^#+/, "") : null,
            address: driverInput.address || null,
            hire_date: driverInput.hire_date || null,
            date_of_birth: driverInput.date_of_birth || null,
            work_anniversary: driverInput.work_anniversary || driverInput.hire_date || null,
            status: driverInput.status || "active",
            allow_signin: driverInput.allow_signin,
            allow_inspections: driverInput.allow_inspections,
            station_code: driverInput.stations.map((s) => s.station_code),
            fromMainCreation: true,
          };

          const res = await axiosInstance.post("drivers/v1/driver", payload);
          const resData = res.data?.data || res.data;
          if (resData) {
            const realId = typeof resData.id === "object" ? resData.id?.id : resData.id || optimisticDriver.id;
            const finalDriver: Driver = {
              ...optimisticDriver,
              id: realId,
              name: resData.name || fullName,
              transporter_id: resData.transporter_id ? resData.transporter_id.replace(/^#+/, "") : cleanTid,
              email: resData.email ? resData.email.replace(/^#+/, "") : cleanEmail,
            };
            set((state) => ({
              drivers: [finalDriver, ...state.drivers.filter((d) => d.id !== optimisticDriver.id && d.id !== finalDriver.id)],
            }));
            return finalDriver;
          }
        } catch (err: any) {
          console.warn("createDriverAsync backend API note:", err?.response?.data || err?.message);
        }

        return optimisticDriver;
      },

      updateDriver: (id, updates) => {
        set((state) => ({
          drivers: state.drivers.map((d) => {
            if (d.id !== id) return d;
            const sanitizedUpdates = { ...updates };
            if (sanitizedUpdates.transporter_id !== undefined) {
              sanitizedUpdates.transporter_id = sanitizedUpdates.transporter_id.replace(/^#+/, "").trim().toUpperCase();
            }
            if (sanitizedUpdates.email !== undefined) {
              sanitizedUpdates.email = sanitizedUpdates.email.replace(/^#+/, "").trim().toLowerCase();
            }
            const updated = { ...d, ...sanitizedUpdates };
            if (updates.first_name || updates.last_name) {
              updated.name = `${updated.first_name} ${updated.last_name}`.trim();
            }
            return updated;
          }),
        }));
      },

      deleteDriver: (id) => {
        set((state) => ({
          drivers: state.drivers.filter((d) => d.id !== id),
        }));
      },

      deleteDriverAsync: async (id) => {
        // Immediate optimistic removal from local state without needing refresh
        set((state) => ({
          drivers: state.drivers.filter((d) => d.id !== id),
        }));
        try {
          await axiosInstance.delete(`drivers/v1/driver/${id}`);
          return { success: true };
        } catch (err: any) {
          console.warn("deleteDriverAsync backend API note:", err?.response?.data || err?.message);
          return { success: true };
        }
      },

      toggleDriverStatus: (id) => {
        const current = get().drivers.find((d) => d.id === id);
        if (!current) return;
        const nextStatus = current.status === "active" ? "inactive" : "active";
        set((state) => ({
          drivers: state.drivers.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: nextStatus,
                  // If deactivated, signin is also disabled
                  allow_signin: nextStatus === "active" ? d.allow_signin : false,
                  allow_inspections: nextStatus === "active" ? d.allow_inspections : false,
                }
              : d
          ),
        }));

        // Fire-and-forget status update to backend
        axiosInstance
          .patch("drivers/v1/driver_profile_settings", {
            action: "bulk_active_inactive",
            ids: [id],
            status: nextStatus,
          })
          .catch((err) => {
            console.warn("toggleDriverStatus backend API note:", err?.message);
          });
      },

      toggleDriverSignin: (id) => {
        set((state) => ({
          drivers: state.drivers.map((d) => {
            if (d.id !== id) return d;
            const nextSignin = !d.allow_signin;
            return {
              ...d,
              allow_signin: nextSignin,
              // If sign-in is turned off, inspection must also be off
              allow_inspections: nextSignin ? d.allow_inspections : false,
            };
          }),
        }));
      },

      toggleDriverInspections: (id) => {
        set((state) => ({
          drivers: state.drivers.map((d) => {
            if (d.id !== id) return d;
            return {
              ...d,
              allow_inspections: !d.allow_inspections,
            };
          }),
        }));
      },

      bulkUpdateStatus: (ids, status) => {
        set((state) => ({
          drivers: state.drivers.map((d) =>
            ids.includes(d.id)
              ? {
                  ...d,
                  status,
                  allow_signin: status === "inactive" ? false : d.allow_signin,
                  allow_inspections: status === "inactive" ? false : d.allow_inspections,
                }
              : d
          ),
        }));
      },

      bulkUpdateSignin: (ids, allowSignin) => {
        set((state) => ({
          drivers: state.drivers.map((d) =>
            ids.includes(d.id)
              ? {
                  ...d,
                  allow_signin: allowSignin,
                  allow_inspections: allowSignin ? d.allow_inspections : false,
                }
              : d
          ),
        }));
      },

      bulkUpdateInspections: (ids, allowInspections) => {
        set((state) => ({
          drivers: state.drivers.map((d) =>
            ids.includes(d.id)
              ? {
                  ...d,
                  allow_inspections: allowInspections,
                }
              : d
          ),
        }));
      },
    }),
    {
      name: "lmdmax_driver_store",
    }
  )
);
