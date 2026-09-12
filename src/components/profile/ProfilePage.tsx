import React, { FC, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import AuthAPI from "../../api/auth";
import type { ProfileData, ProfileFormState, CompanyAccess } from "../../types/profile";
import { ProfileSidebar } from "./ProfileSidebar";
import { UserDetailsSection } from "./UserDetailsSection";
import { CompanyDetailsSection } from "./CompanyDetailsSection";
import { StationDetailsSection } from "./StationDetailsSection";
import ChangePasswordModal from "./ChangePasswordModal";
import GlassAppLayout from "../layout/GlassAppLayout";
import LoadingSpinner from "../common/LoadingSpinner";
import { validateName, validatePhoneNumber } from "../../utils/validators";
import AppLayoutSettingsPanel from "../settings/panels/AppLayoutSettingsPanel";

// ProfilePage - Unified LMDmax User & Company Operations Profile
interface ProfilePageProps {
  onBackToDashboard?: () => void;
}

function buildInitialFormValues(data: ProfileData): ProfileFormState {
  const fwd = data?.company?.forward_call_number || "";
  let countryCode = "+1";
  let remainingNumber = "";

  if (fwd.startsWith("+")) {
    const cleaned = fwd.replace(/[^\d+]/g, "");
    if (cleaned.length > 10) {
      remainingNumber = cleaned.slice(-10);
      countryCode = cleaned.slice(0, -10);
    } else {
      remainingNumber = cleaned.replace(/\D/g, "");
    }
  } else {
    remainingNumber = fwd.replace(/\D/g, "");
  }

  const s = (val: string) => ({ value: val, error: false, helperText: "" });
  const b = (val: boolean) => ({ value: val, error: false, helperText: "" });

  return {
    userName: s(data.name || ""),
    phoneNumber: s(data.phone || ""),
    companyName: s(data.company?.company_name || ""),
    ownerName: s(data.company?.owner_name || ""),
    stationCode: s(String(data.company?.station_code || "DDF4")),
    zipCode: s(String(data.company?.zipcode || "75001")),
    address: s(data.company?.address || "100 Express Way, Suite 400"),
    city: s(data.company?.city || "Dallas"),
    state: s(data.company?.state || "TX"),
    country: s(data.company?.country || "United States"),
    timezone: s(data.company?.timezone || "America/Chicago (CST)"),
    netradyneCustomerName: s(data.company?.netradyne_customer_name || ""),
    callForwardingCountryCode: s(countryCode || "+1"),
    callForwardingNo: s(remainingNumber),
    callForwarding: b(data.company?.forward_call_enable || false),
    autoCoachingEnable: b(data.company?.auto_coaching_enable || false),
  };
}

export const ProfilePage: FC<ProfilePageProps> = ({ onBackToDashboard }) => {
  const navigate = useNavigate();
  const sessionUser = useAuthStore((state) => state.user);
  const handleBack = onBackToDashboard || (() => navigate("/dashboard"));
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [formState, setFormState] = useState<ProfileFormState | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const isOwner =
    profileData?.role === "owner" || sessionUser?.role === "owner" || true;

  // Fetch or initialize profile
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await AuthAPI.getProfile();
        if (isMounted && res.status >= 200 && res.status < 300) {
          const apiData = res.data?.data || res.data;
          setProfileData(apiData);
          setFormState(buildInitialFormValues(apiData));
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to load profile from API, using current session:", err);
      }

      if (isMounted) {
        const fallbackData: ProfileData = {
          name: sessionUser?.name || "User",
          phone: sessionUser?.phone || "",
          email: sessionUser?.email || "",
          role: sessionUser?.role || "owner",
          company: {
            company_id: sessionUser?.company?.company_id || sessionUser?.company_id || "",
            company_name: sessionUser?.company?.company_name || "",
            owner_name: sessionUser?.company?.owner_name || sessionUser?.name || "",
            station_code: sessionUser?.station_code || sessionUser?.company?.station_code || "",
            zipcode: sessionUser?.company?.zipcode || "",
            address: sessionUser?.company?.address || "",
            city: sessionUser?.company?.city || "",
            state: sessionUser?.company?.state || "",
            country: sessionUser?.company?.country || "",
            timezone: sessionUser?.company?.timezone || "",
            netradyne_customer_name: sessionUser?.company?.netradyne_customer_name || "",
            forward_call_number: sessionUser?.company?.forward_call_number || "",
            forward_call_enable: sessionUser?.company?.forward_call_enable || false,
            auto_coaching_enable: sessionUser?.company?.auto_coaching_enable || false,
            dsp_short_code: sessionUser?.company?.dsp_short_code || "",
            performance_twilio_number: sessionUser?.company?.performance_twilio_number || "",
            company_type: sessionUser?.company?.company_type || "lmd",
          },
          company_access: sessionUser?.company_access || [],
        };

        setProfileData(fallbackData);
        setFormState(buildInitialFormValues(fallbackData));
        setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [sessionUser]);

  const handleFieldChange = (
    field: keyof ProfileFormState,
    value: string | boolean
  ) => {
    if (!formState) return;
    setFormState({
      ...formState,
      [field]: {
        ...formState[field],
        value,
        error: false,
        helperText: "",
      },
    });
  };

  const handleFieldError = (field: keyof ProfileFormState, error: string) => {
    if (!formState) return;
    setFormState({
      ...formState,
      [field]: {
        ...formState[field],
        error: Boolean(error),
        helperText: error,
      },
    });
  };

  const validateAllFields = (): boolean => {
    if (!formState) return false;
    let isValid = true;
    const nextState = { ...formState };

    // 1. User Name
    const nameRes = validateName(formState.userName.value, "Full Name", 2, 50);
    if (!nameRes.isValid) {
      nextState.userName = {
        ...nextState.userName,
        error: true,
        helperText: nameRes.error,
      };
      isValid = false;
    }

    // 2. Phone Number
    if (formState.phoneNumber.value) {
      const phoneRes = validatePhoneNumber(formState.phoneNumber.value);
      if (!phoneRes.isValid) {
        nextState.phoneNumber = {
          ...nextState.phoneNumber,
          error: true,
          helperText: phoneRes.error,
        };
        isValid = false;
      }
    }

    // 3. Company Name
    if (isOwner) {
      const compRes = validateName(
        formState.companyName.value,
        "Company Name",
        2,
        60
      );
      if (!compRes.isValid) {
        nextState.companyName = {
          ...nextState.companyName,
          error: true,
          helperText: compRes.error,
        };
        isValid = false;
      }

      const ownerRes = validateName(
        formState.ownerName.value,
        "Owner Name",
        2,
        50
      );
      if (!ownerRes.isValid) {
        nextState.ownerName = {
          ...nextState.ownerName,
          error: true,
          helperText: ownerRes.error,
        };
        isValid = false;
      }

      // Call forwarding phone
      if (
        formState.callForwarding.value &&
        formState.callForwardingNo.value.length !== 10
      ) {
        nextState.callForwardingNo = {
          ...nextState.callForwardingNo,
          error: true,
          helperText: "Call forwarding number must be 10 digits",
        };
        isValid = false;
      }
    }

    setFormState(nextState);
    return isValid;
  };

  const handleSaveChanges = async () => {
    if (!profileData || !formState) return;

    if (!validateAllFields()) {
      setNotification({
        text: "Please correct the highlighted errors before saving.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    setNotification(null);

    try {
      const savePromises: Promise<any>[] = [];

      // 1. User details update
      const userPayload = {
        name: formState.userName.value.trim(),
        phone: formState.phoneNumber.value.trim(),
      };
      savePromises.push(AuthAPI.editUserDetail(userPayload));

      // 2. Company details update
      if (isOwner) {
        let fullFwdNo = "";
        if (
          formState.callForwarding.value &&
          formState.callForwardingNo.value.trim()
        ) {
          fullFwdNo = `${formState.callForwardingCountryCode.value}${formState.callForwardingNo.value.trim()}`;
        }

        const companyPayload = {
          company_name: formState.companyName.value.trim(),
          owner_name: formState.ownerName.value.trim(),
          forward_call_number: fullFwdNo,
          forward_call_enable: formState.callForwarding.value,
          auto_coaching_enable: formState.autoCoachingEnable.value,
          netradyne_customer_name: formState.netradyneCustomerName.value.trim(),
          address: formState.address.value.trim(),
          city: formState.city.value.trim(),
          state: formState.state.value.trim(),
          country: formState.country.value.trim(),
          timezone: formState.timezone.value.trim(),
          zipcode: formState.zipCode.value.trim(),
          station_code: formState.stationCode.value.trim(),
        };

        const companyId = profileData.company?.company_id || "comp_ddf4";
        savePromises.push(AuthAPI.editCompanyDetail(companyId, companyPayload));
      }

      // 3. Logo update
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        savePromises.push(AuthAPI.saveCompanyLogo(fd));
      }

      await Promise.allSettled(savePromises);

      // Update local profile state
      const updatedProfile: ProfileData = {
        ...profileData,
        name: formState.userName.value.trim(),
        phone: formState.phoneNumber.value.trim(),
        company: {
          ...profileData.company,
          company_name: formState.companyName.value.trim(),
          owner_name: formState.ownerName.value.trim(),
          address: formState.address.value.trim(),
          city: formState.city.value.trim(),
          state: formState.state.value.trim(),
          country: formState.country.value.trim(),
          timezone: formState.timezone.value.trim(),
          zipcode: formState.zipCode.value.trim(),
          station_code: formState.stationCode.value.trim(),
          forward_call_number: formState.callForwardingNo.value
            ? `${formState.callForwardingCountryCode.value}${formState.callForwardingNo.value}`
            : "",
          forward_call_enable: formState.callForwarding.value,
          auto_coaching_enable: formState.autoCoachingEnable.value,
          netradyne_customer_name: formState.netradyneCustomerName.value.trim(),
          company_logo: logoFile
            ? URL.createObjectURL(logoFile)
            : profileData.company?.company_logo,
        },
      };

      setProfileData(updatedProfile);
      setLogoFile(null);
      setIsEditing(false);
      setNotification({
        text: "Profile and company information updated successfully!",
        type: "success",
      });
    } catch {
      setNotification({
        text: "Failed to save profile changes. Please check network and try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFormState(buildInitialFormValues(profileData));
    }
    setLogoFile(null);
    setIsEditing(false);
    setNotification(null);
  };

  if (isLoading || !profileData) {
    return (
      <div
        className="profile-loading-screen"
        style={{ backgroundColor: "var(--ads-canvas)" }}
      >
        <LoadingSpinner size="lg" color="#0071E3" />
        <span
          className="profile-loading-text"
          style={{ color: "var(--ads-blue)", letterSpacing: "-0.01em" }}
        >
          Loading LMDmax Profile...
        </span>
      </div>
    );
  }

  return (
    <GlassAppLayout
      currentRoute="profile"
      activeBreadcrumb={{ section: "Account", page: "Profile" }}
    >
      {/* Main Profile Body */}
      <div className="profile-outer-shell">
        {/* Dynamic Notification Toast */}
        {notification && (
          <div
            className={`notification-banner ${notification.type}`}
            role="status"
            style={{
              backgroundColor:
                notification.type === "success"
                  ? "var(--ads-green-tint)"
                  : "var(--ads-red-tint)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-md)",
              color: "var(--ads-ink)",
              boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
              backdropFilter: "var(--ads-blur-sm)",
              WebkitBackdropFilter: "var(--ads-blur-sm)",
              letterSpacing: "-0.01em",
            }}
          >
            {notification.type === "success" ? (
              <CheckCircle2
                size={18}
                style={{ color: "var(--ads-green)", flexShrink: 0 }}
              />
            ) : (
              <AlertCircle
                size={18}
                style={{ color: "var(--ads-red)", flexShrink: 0 }}
              />
            )}
            <span
              className="notification-message"
              style={{ color: "var(--ads-ink)" }}
            >
              {notification.text}
            </span>
            <button
              type="button"
              className="close-notif-btn"
              onClick={() => setNotification(null)}
              title="Dismiss"
              aria-label="Dismiss notification"
              style={{
                color: "var(--ads-ink-tertiary)",
                borderRadius: "var(--ads-r-xs)",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), opacity var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="profile-split-container">
          {/* Left Column: Sidebar with Avatar & Logo */}
          <ProfileSidebar
            isEditing={isEditing}
            isOwner={isOwner}
            profileData={profileData}
            formState={formState}
            onUserNameChange={(val) => handleFieldChange("userName", val)}
            onLogoFileSelect={(file) => setLogoFile(file)}
            onToggleEdit={() =>
              isEditing ? handleCancelEdit() : setIsEditing(true)
            }
            onNotification={(n) => setNotification(n)}
          />

          {/* Right Column: User, Company & Station Sections */}
          <main className="profile-sections-column">
            {/* 1. User Contact & Account Section (with Change Password & Edit Profile buttons) */}
            <UserDetailsSection
              isEditing={isEditing}
              profileData={profileData}
              formState={formState}
              onFieldChange={handleFieldChange}
              onFieldError={handleFieldError}
              onChangePassword={() => setIsPasswordModalOpen(true)}
              onStartEdit={() => setIsEditing(true)}
              onCancelEdit={handleCancelEdit}
              onSaveChanges={handleSaveChanges}
              isSaving={isSaving}
            />

            {/* 2. DSP Company & Operations Section */}
            <CompanyDetailsSection
              isEditing={isEditing}
              isOwner={isOwner}
              profileData={profileData}
              formState={formState}
              onFieldChange={handleFieldChange}
              onFieldError={handleFieldError}
            />

            {/* 3. Station Authorizations Section */}
            <StationDetailsSection
              isEditing={isEditing}
              isOwner={isOwner}
              companyAccess={
                (profileData?.company_access && profileData.company_access.length > 0)
                  ? profileData.company_access
                  : (sessionUser?.allStations && sessionUser.allStations.length > 0)
                  ? sessionUser.allStations.map((s) => ({
                      company_id: s.company_id,
                      station_code: s.station_code,
                      address: s.address,
                      zipcode: s.zipcode,
                      is_active: s.active,
                      is_pending: s.pending,
                      request_id: s.request_id || undefined,
                    }))
                  : []
              }
              onStationsUpdate={(updated) => {
                if (profileData) {
                  setProfileData({
                    ...profileData,
                    company_access: updated,
                  });
                }
                useAuthStore.getState().fetchProfile();
              }}
              onNotification={(n) => setNotification(n)}
            />

            {/* 4. Application Layout Preferences */}
            <AppLayoutSettingsPanel />
          </main>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => {
          setNotification({
            text: "Password changed successfully!",
            type: "success",
          });
        }}
      />
    </GlassAppLayout>
  );
};

export default ProfilePage;
