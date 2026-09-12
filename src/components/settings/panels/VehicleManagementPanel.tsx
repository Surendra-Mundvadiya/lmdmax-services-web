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
      {/* Header */}
      <div className="settings-panel-header-block">
        <div>
          <h2 className="settings-panel-heading flex items-center gap-2">
            <Truck size={20} className="text-blue-600" />
            <span>Vehicle Management</span>
            <span className="badge-custom blue">Fleet</span>
          </h2>
          <p className="settings-panel-subheading">
            Configure delivery van profiles, chassis classifications, cargo capacities, and customize driver return inspection rules
          </p>
        </div>
      </div>

      {/* 1. Vehicle Types & Subtypes */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Truck size={17} className="text-blue-600" />
            <span>Registered Vehicle Types & Classifications</span>
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
            {vehicleTypes.length} Types Configured
          </span>
        </div>
        <p className="settings-card-desc">
          Vehicle profiles categorized for package cubic volume capacities and delivery station assignments.
        </p>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Vehicle Type Name</th>
                <th className="py-2.5 px-3">Category / Chassis</th>
                <th className="py-2.5 px-3">Cargo Volume</th>
                <th className="py-2.5 px-3 text-center">Active Fleet Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleTypes.map((vt) => (
                <tr key={vt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{vt.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{vt.category}</td>
                  <td className="py-2.5 px-3 text-slate-600">{vt.capacity}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {vt.activeCount} vans
                    </span>
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
            <ClipboardCheck size={17} className="text-blue-600" />
            <span>Driver Return Inspection (DVIC) Checklist Requirements</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Customize required check items drivers must complete upon parking at station return.
        </p>

        <div className="flex flex-col gap-2.5">
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
