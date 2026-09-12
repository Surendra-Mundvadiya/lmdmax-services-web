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
      {/* Header */}
      <div className="settings-panel-header-block">
        <div>
          <h2 className="settings-panel-heading flex items-center gap-2">
            <Smartphone size={20} className="text-blue-600" />
            <span>LMD Drive APP Access</span>
            <span className="badge-custom blue">Operations</span>
          </h2>
          <p className="settings-panel-subheading">
            Configure driver mobile application sign-in, DVIC vehicle inspection permissions, and VIN scanner access
          </p>
        </div>
      </div>

      {/* 1. Mobile App Sign-In Defaults */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Smartphone size={17} className="text-blue-600" />
            <span>Driver Mobile Sign-in Permissions</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Controls whether delivery drivers can authenticate and log into the LMD Drive mobile application.
        </p>

        <div className="flex flex-col gap-3">
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
            <ShieldCheck size={17} className="text-blue-600" />
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
            <QrCode size={17} className="text-blue-600" />
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

        <div className="flex items-start gap-2 p-3 mt-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
          <span>
            When enabled, drivers can scan the door-jamb or windshield VIN barcode directly on mobile to instantly pair with unassigned vans during wave dispatch.
          </span>
        </div>
      </div>

      {/* 4. Station Auto-Enrollment */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Building size={17} className="text-blue-600" />
            <span>Station Auto Sign-in Applicability</span>
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
            {stations.length} Delivery Stations
          </span>
        </div>
        <p className="settings-card-desc">
          Select delivery station locations where drivers automatically receive mobile app access upon roster import.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
          {stations.map((st) => {
            const isChecked = selectedStationIds.includes(String(st.company_id)) || st.current;
            return (
              <label
                key={st.company_id || st.station_code}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  isChecked
                    ? "bg-blue-50/60 border-blue-300 text-blue-900"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleStationToggle(String(st.company_id))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-slate-900">
                    Station {st.station_code}
                  </span>
                  <span className="text-[11px] text-slate-500">
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
