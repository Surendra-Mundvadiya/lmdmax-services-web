import React, { FC, useState } from "react";
import {
  Truck,
  ClipboardCheck,
  Fuel,
  Camera,
  Gauge,
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react";

const VEHICLE_TH_STYLE: React.CSSProperties = {
  padding: "var(--ads-s2) var(--ads-s3)",
  fontSize: "0.6875rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--ads-ink-tertiary)",
  borderBottom: "1px solid var(--ads-hairline)",
};

const VEHICLE_TD_STYLE: React.CSSProperties = {
  padding: "var(--ads-s2) var(--ads-s3)",
  color: "var(--ads-ink-secondary)",
};

interface VehicleManagementPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

interface VehicleTypeItem {
  id: string;
  name: string;
  category: string;
  capacity: string;
  activeCount: number;
}

const INITIAL_VEHICLE_TYPES: VehicleTypeItem[] = [
  { id: "1", name: "Cargo Van - Standard", category: "Class 2 (RAM Promaster / Ford Transit)", capacity: "350 cu ft", activeCount: 24 },
  { id: "2", name: "Step Van - P1000", category: "Class 4 (Freightliner / Morgan Olson)", capacity: "850 cu ft", activeCount: 12 },
  { id: "3", name: "Electric Delivery Vehicle (EDV)", category: "Class 3 (Rivian EDV 700)", capacity: "650 cu ft", activeCount: 18 },
  { id: "4", name: "Box Truck (24-26 ft)", category: "Class 6 (Straight Truck / Hino)", capacity: "1,500 cu ft", activeCount: 4 },
];

export const VehicleManagementPanel: FC<VehicleManagementPanelProps> = ({ onNotification }) => {
  const [vehicleTypes] = useState<VehicleTypeItem[]>(INITIAL_VEHICLE_TYPES);

  // DVIC Return Inspection
  const [requireFuelCheck, setRequireFuelCheck] = useState(true);
  const [requireWalkaroundPhotos, setRequireWalkaroundPhotos] = useState(true);
  const [requireOdometerPhoto, setRequireOdometerPhoto] = useState(true);
  const [requireCleanCabinVerification, setRequireCleanCabinVerification] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Vehicle management settings updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure delivery van profiles, chassis classifications, cargo capacities, and customize driver return inspection rules
        </p>
      </div>

      {/* 1. Vehicle Types & Subtypes */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Truck size={17} />
            <span>Registered Vehicle Types & Classifications</span>
          </h3>
          <span className="ads-badge ads-badge--neutral">
            {vehicleTypes.length} Types Configured
          </span>
        </div>
        <p className="settings-card-desc">
          Vehicle profiles categorized for package cubic volume capacities and delivery station assignments.
        </p>

        <div
          style={{
            border: "1px solid var(--ads-hairline)",
            borderRadius: "var(--ads-r-md)",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              textAlign: "left",
              borderCollapse: "collapse",
              fontSize: "0.75rem",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(0, 0, 0, 0.03)" }}>
                <th style={VEHICLE_TH_STYLE}>Vehicle Type Name</th>
                <th style={VEHICLE_TH_STYLE}>Category / Chassis</th>
                <th style={VEHICLE_TH_STYLE}>Cargo Volume</th>
                <th style={{ ...VEHICLE_TH_STYLE, textAlign: "center" }}>Active Fleet Count</th>
              </tr>
            </thead>
            <tbody>
              {vehicleTypes.map((vt) => (
                <tr key={vt.id} style={{ borderTop: "1px solid var(--ads-hairline)" }}>
                  <td style={{ ...VEHICLE_TD_STYLE, fontWeight: 600, color: "var(--ads-ink)" }}>
                    {vt.name}
                  </td>
                  <td style={VEHICLE_TD_STYLE}>{vt.category}</td>
                  <td style={VEHICLE_TD_STYLE}>{vt.capacity}</td>
                  <td style={{ ...VEHICLE_TD_STYLE, textAlign: "center" }}>
                    <span className="ads-badge ads-badge--blue">{vt.activeCount} vans</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Driver Return Inspection (DVIC) Checklist Customization */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <ClipboardCheck size={17} />
            <span>Driver Return Inspection (DVIC) Checklist Requirements</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Customize required check items drivers must complete upon parking at station return.
        </p>

        <div className="settings-stack">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Fuel size={14} className="text-blue-600" />
                <span>Mandatory Return Fuel Level Verification</span>
              </span>
              <span className="settings-toggle-desc">
                Requires driver to log ending fuel level and verify at least 25% capacity for next morning wave
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle fuel check">
              <input
                type="checkbox"
                checked={requireFuelCheck}
                onChange={() => setRequireFuelCheck(!requireFuelCheck)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Camera size={14} className="text-blue-600" />
                <span>Four-Corner Vehicle Exterior Photos</span>
              </span>
              <span className="settings-toggle-desc">
                Requires driver to capture front, passenger, rear, and driver-side photos to audit parking lot damage
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle exterior photos">
              <input
                type="checkbox"
                checked={requireWalkaroundPhotos}
                onChange={() => setRequireWalkaroundPhotos(!requireWalkaroundPhotos)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Gauge size={14} className="text-blue-600" />
                <span>Odometer Mileage Entry & Verification</span>
              </span>
              <span className="settings-toggle-desc">
                Prompts driver to enter current dashboard mileage to auto-calculate route distance & PM triggers
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle odometer entry">
              <input
                type="checkbox"
                checked={requireOdometerPhoto}
                onChange={() => setRequireOdometerPhoto(!requireOdometerPhoto)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-title flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                <span>Cabin Cleanliness & Trash Removal Sign-off</span>
              </span>
              <span className="settings-toggle-desc">
                Requires driver acknowledgement confirming cargo bay and driver seat area are clean and trash-free
              </span>
            </div>
            <label className="custom-blue-switch" title="Toggle clean cabin check">
              <input
                type="checkbox"
                checked={requireCleanCabinVerification}
                onChange={() => setRequireCleanCabinVerification(!requireCleanCabinVerification)}
              />
              <span className="switch-slider" />
            </label>
          </div>
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Vehicle Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default VehicleManagementPanel;
