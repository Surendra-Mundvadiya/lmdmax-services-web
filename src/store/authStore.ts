import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserProfile, Station } from "../types/auth";
import { setAuthToken } from "../api/axiosClient";
import AuthAPI from "../api/auth";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  accessDeniedModalOpen: boolean;
  stations: Station[];
  allStations: Station[];
  switchingStationId: string | null;
  isLoadingProfile: boolean;

  setSession: (token: string, user: UserProfile) => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setAccessDenied: (open: boolean) => void;
  fetchProfile: () => Promise<void>;
  switchStation: (companyId: string | number) => Promise<boolean>;
  setStations: (stations: Station[], allStations: Station[]) => void;
  logout: () => void;
}

const defaultStations: Station[] = [
  {
    company_id: "566",
    station_code: "QUE2",
    address: "Address 2",
    zipcode: "87283",
    country: "USA",
    state: "CO",
    city: "Denver",
    active: true,
    pending: false,
    request_id: null,
    current: true,
  },
  {
    company_id: "568",
    station_code: "QUE4",
    address: "Address 4",
    zipcode: "87283",
    country: "USA",
    state: "CO",
    city: "Denver",
    active: true,
    pending: false,
    request_id: null,
    current: false,
  },
  {
    company_id: "1206",
    station_code: "1206",
    address: "Address 1206",
    zipcode: "87283",
    country: "USA",
    state: "CO",
    city: "Denver",
    active: false,
    pending: false,
    request_id: null,
    current: false,
  },
];

export const defaultStagingUser: UserProfile = {
  id: "43219518",
  account_id: "43219518",
  name: "Queen Admin",
  email: "Queen@gmail.com",
  phone: "3232126654",
  role: "owner",
  company_id: "566",
  station_code: "QUE2",
  company: {
    company_id: "566",
    company_name: "QQQQ",
    owner_name: "Queen Admin",
    station_code: "QUE2",
    address: "Address 2",
    city: "",
    state: "",
    zipcode: "87283",
    country: "",
    timezone: "America/Denver",
    netradyne_customer_name: "HUDR",
    forward_call_number: "+919672661207",
    forward_call_enable: true,
    auto_coaching_enable: false,
    dsp_short_code: "PAYA",
    performance_twilio_number: "+17328723833",
  },
  stations: defaultStations,
  allStations: defaultStations,
};

// Sanitize any previously persisted switchingStationId from localStorage to immediately unstick state
try {
  const existing = localStorage.getItem("lmdmax_auth_session");
  if (existing) {
    const parsed = JSON.parse(existing);
    if (parsed?.state?.switchingStationId) {
      parsed.state.switchingStationId = null;
      localStorage.setItem("lmdmax_auth_session", JSON.stringify(parsed));
    }
  }
} catch {
  // ignore storage parse errors
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: defaultStagingUser,
      token: "staging_token_queen_admin",
      isAuthenticated: true,
      accessDeniedModalOpen: false,
      stations: defaultStations,
      allStations: defaultStations,
      switchingStationId: null,
      isLoadingProfile: false,

      setSession: (token: string, user: UserProfile) => {
        setAuthToken(token, user.account_id || user.id);
        set({
          token,
          user,
          isAuthenticated: true,
          accessDeniedModalOpen: false,
        });
        // Immediately fetch live profile so company_access stations are populated
        get().fetchProfile();
      },

      updateUser: (partialUser: Partial<UserProfile>) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partialUser } });
        }
      },

      setAccessDenied: (open: boolean) => {
        set({ accessDeniedModalOpen: open });
      },

      setStations: (stations: Station[], allStations: Station[]) => {
        set({ stations, allStations });
      },

      fetchProfile: async () => {
        const currentToken = get().token;
        if (!currentToken) return;

        set({ isLoadingProfile: true });
        try {
          const res = await AuthAPI.getProfile();
          const profileData = res.data?.data || res.data;
          if (!profileData) return;

          const current_company_id = String(
            profileData.company?.company_id || get().user?.company_id || ""
          );

          const allStations: Station[] = (profileData.company_access || []).map(
            (s: any) => {
              const cId = String(s.company_id || "");
              return {
                id: cId,
                company_id: cId,
                station_code: String(s.station_code || ""),
                address: String(s.address || ""),
                zipcode: String(s.zipcode || ""),
                country: s.country ? String(s.country) : null,
                state: s.state ? String(s.state) : null,
                city: s.city ? String(s.city) : null,
                active: s.is_active !== undefined ? Boolean(s.is_active) : true,
                pending: Boolean(s.is_pending),
                request_id: s.request_id ? String(s.request_id) : null,
                current: cId === current_company_id,
              };
            }
          );

          // Accessible stations for switcher and app views (includes active and inactive stations, sorted active first)
          const stations: Station[] = allStations
            .filter((s) => !s.pending && s.company_id)
            .sort((a, b) => Number(b.active) - Number(a.active));

          const currentUser = get().user;
          const updatedUser: UserProfile = {
            ...(currentUser || {}),
            id: profileData.account_id || profileData.id || currentUser?.id,
            account_id: profileData.account_id || currentUser?.account_id,
            name: profileData.name || currentUser?.name || "Queen Admin",
            email: profileData.email || currentUser?.email || "Queen@gmail.com",
            phone: profileData.phone || currentUser?.phone,
            role: profileData.role || currentUser?.role || "owner",
            company_id: current_company_id,
            station_code:
              profileData.company?.station_code || currentUser?.station_code || "QUE2",
            company: {
              ...(currentUser?.company || {}),
              ...(profileData.company || {}),
            },
            company_access: profileData.company_access || [],
            stations,
            allStations,
          };

          set({
            user: updatedUser,
            stations,
            allStations,
            isLoadingProfile: false,
          });
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          set({ isLoadingProfile: false });
        }
      },

      switchStation: async (companyId: string | number) => {
        const strCompanyId = String(companyId);
        const currentStation = get().stations.find((s) => s.current);
        if (strCompanyId === currentStation?.company_id) {
          return false;
        }
        if (get().switchingStationId) {
          return false;
        }

        set({ switchingStationId: strCompanyId });
        try {
          // Attempt API switch company call (mirrors fleet-web Auth.switchCompany)
          let newToken: string | undefined;
          try {
            const res = await AuthAPI.switchCompany(strCompanyId);
            const switchData = res.data?.data || res.data;
            newToken = switchData?.token || res.data?.token;
          } catch (apiErr) {
            console.warn("Backend switchCompany call failed, falling back to local station switch:", apiErr);
          }

          const accountId = get().user?.account_id || get().user?.id;
          if (newToken) {
            setAuthToken(newToken, accountId);
          }

          // Update active station flags across state
          const targetStation = get().stations.find((s) => String(s.company_id) === strCompanyId);
          const updatedStations = get().stations.map((s) => ({
            ...s,
            current: String(s.company_id) === strCompanyId,
          }));
          const updatedAllStations = get().allStations.map((s) => ({
            ...s,
            current: String(s.company_id) === strCompanyId,
          }));

          const currentUser = get().user;
          const newStationCode = targetStation?.station_code || currentUser?.station_code || "QUE2";

          set({
            ...(newToken ? { token: newToken } : {}),
            stations: updatedStations,
            allStations: updatedAllStations,
            user: currentUser
              ? {
                  ...currentUser,
                  company_id: strCompanyId,
                  station_code: newStationCode,
                  company: {
                    ...currentUser.company,
                    company_id: strCompanyId,
                    station_code: newStationCode,
                  },
                  stations: updatedStations,
                  allStations: updatedAllStations,
                }
              : null,
            switchingStationId: null,
          });

          // Fetch updated profile if token was swapped
          if (newToken) {
            try {
              await get().fetchProfile();
            } catch {
              // ignore secondary profile error
            }
          }

          // Clear switchingStationId explicitly before reloading so persisted state stays clean
          set({ switchingStationId: null });
          window.location.reload();
          return true;
        } catch (err) {
          console.error("Failed to switch company/station:", err);
          return false;
        } finally {
          set({ switchingStationId: null });
        }
      },

      logout: () => {
        setAuthToken(undefined, undefined);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          accessDeniedModalOpen: false,
          stations: [],
          allStations: [],
          switchingStationId: null,
        });
      },
    }),
    {
      name: "lmdmax_auth_session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        stations: state.stations,
        allStations: state.allStations,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.switchingStationId = null;
          state.isLoadingProfile = false;
        }
        if (state?.token && state?.user) {
          setAuthToken(state.token, state.user.account_id || state.user.id);
          // If authenticated, refresh stations in background on rehydrate
          setTimeout(() => {
            useAuthStore.getState().fetchProfile();
          }, 100);
        }
      },
    }
  )
);
