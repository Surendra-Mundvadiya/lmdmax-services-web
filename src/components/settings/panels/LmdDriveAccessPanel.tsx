import React, { FC, useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  QrCode,
  KeyRound,
  Info,
  Save,
  CheckCircle2,
  Building,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface LmdDriveAccessPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const LmdDriveAccessPanel: FC<LmdDriveAccessPanelProps> = ({ onNotification }) => {
  const user = useAuthStore((state) => state.user);
  const company = user?.company;
  const stations = useAuthStore((state) => state.stations);

  const [allowSignIn, setAllowSignIn] = useState<boolean>(true);
  const [allowInspection, setAllowInspection] = useState<boolean>(true);
  const [allowVinScan, setAllowVinScan] = useState<boolean>(false);
  const [passwordType, setPasswordType] = useState<string>("default");
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setAllowInspection(company.allow_driver_inspections ?? true);
      setAllowVinScan(company.allow_vin_scan ?? false);
      if (company.driver_password_type) {
        setPasswordType(company.driver_password_type);
      }
    }
  }, [company]);

  const handleStationToggle = (stationId: string) => {
    setSelectedStationIds((prev) =>
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "LMD Drive APP Access settings updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure driver mobile application sign-in, DVIC vehicle inspection permissions, and VIN scanner access
        </p>
      </div>

      {/* 1. Mobile App Sign-In Defaults */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Smartphone size={17} />
            <span>Driver Mobile Sign-in Permissions</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Controls whether delivery drivers can authenticate and log into the LMD Drive mobile application.
        </p>

        <div className="settings-stack">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title">Enable LMD Drive Sign-in by Default</span>
              <span className="settings-toggle-desc">
                Allow drivers to log into the mobile app upon addition without manual individual approval
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle driver sign-in">
              <input
                type="checkbox"
                checked={allowSignIn}
                onChange={() => setAllowSignIn(!allowSignIn)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-form-field mt-2">
            <label className="settings-form-label flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-600" />
              <span>Driver Initial Password Provisioning</span>
            </label>
            <select
              className="settings-form-select max-w-md"
              value={passwordType}
              onChange={(e) => setPasswordType(e.target.value)}
            >
              <option value="default">Default Company Passcode (First 4 of Phone + Station)</option>
              <option value="random">Auto-Generated Secure PIN via Welcome SMS</option>
              <option value="custom">Driver Self-Registration & Phone OTP Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. DVIC Inspection Permissions */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <ShieldCheck size={17} />
            <span>Driver Vehicle Inspection (DVIC) Access</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Mandatory safety inspection workflows completed on mobile before launch and after return.
        </p>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">Allow Driver In-App Inspections</span>
            <span className="settings-toggle-desc">
              Require drivers to complete pre-trip and post-trip vehicle inspection forms directly in the LMD Drive app
            </span>
          </div>
          <label className="custom-blue-switch" title="Toggle driver inspections">
            <input
              type="checkbox"
              checked={allowInspection}
              onChange={() => setAllowInspection(!allowInspection)}
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>

      {/* 3. VIN Scanner Permission */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <QrCode size={17} />
            <span>VIN Barcode Scanner Permission</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Enable optical VIN barcode scanning on driver smartphones for fast vehicle verification.
        </p>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">Allow VIN Scanner for Unassigned Vehicles</span>
            <span className="settings-toggle-desc">
              Driver will inspect the vehicle by scanning its VIN barcode regardless of whether they have been pre-assigned
            </span>
          </div>
          <label className="custom-blue-switch" title="Toggle VIN scan">
            <input
              type="checkbox"
              checked={allowVinScan}
              onChange={() => setAllowVinScan(!allowVinScan)}
            />
            <span className="switch-slider" />
          </label>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--ads-s2)",
            padding: "var(--ads-s3) var(--ads-s4)",
            fontSize: "0.75rem",
            lineHeight: 1.5,
            color: "var(--ads-ink-secondary)",
            background: "var(--ads-blue-tint)",
            border: "1px solid transparent",
            borderRadius: "var(--ads-r-md)",
          }}
        >
          <Info size={15} style={{ color: "var(--ads-blue)", flexShrink: 0, marginTop: "2px" }} />
          <span>
            When enabled, drivers can scan the door-jamb or windshield VIN barcode directly on mobile to instantly pair with unassigned vans during wave dispatch.
          </span>
        </div>
      </div>

      {/* 4. Station Auto-Enrollment */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Building size={17} />
            <span>Station Auto Sign-in Applicability</span>
          </h3>
          <span className="ads-badge ads-badge--neutral">
            {stations.length} Delivery Stations
          </span>
        </div>
        <p className="settings-card-desc">
          Select delivery station locations where drivers automatically receive mobile app access upon roster import.
        </p>

        <div className="settings-grid">
          {stations.map((st) => {
            const isChecked = selectedStationIds.includes(String(st.company_id)) || st.current;
            return (
              <label
                key={st.company_id || st.station_code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--ads-s3)",
                  padding: "var(--ads-s3)",
                  cursor: "pointer",
                  background: isChecked ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                  border: isChecked
                    ? "1px solid var(--ads-blue)"
                    : "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-sm)",
                  transition:
                    "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleStationToggle(String(st.company_id))}
                  aria-label={`Auto sign-in for station ${st.station_code}`}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--ads-blue)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--ads-ink)",
                    }}
                  >
                    Station {st.station_code}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)" }}>
                    {st.current ? "Current Station" : st.active ? "Active Station" : "Backup"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="settings-footer-actions">
        <button
          type="button"
          className="btn-blue-primary"
          disabled={isSaving}
          onClick={handleSave}
          style={{ color: "#FFFFFF" }}
        >
          <Save size={15} style={{ color: "#FFFFFF" }} />
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save LMD Drive Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default LmdDriveAccessPanel;
