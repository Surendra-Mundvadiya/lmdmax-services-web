import React, { FC, useState } from "react";
import { Truck, Wrench, ClipboardCheck, Plus, Trash2, Save, Camera, Fuel, Gauge } from "lucide-react";

interface FleetVehicleSettingsPanelProps {
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
  { id: "1", name: "Cargo Van - Standard", category: "Class 2 (RAM / Transit)", capacity: "350 cu ft", activeCount: 24 },
  { id: "2", name: "Step Van - P1000", category: "Class 4 (Freightliner)", capacity: "850 cu ft", activeCount: 12 },
  { id: "3", name: "Electric Delivery Vehicle (EDV)", category: "Class 3 (Rivian EDV 700)", capacity: "650 cu ft", activeCount: 18 },
  { id: "4", name: "Box Truck (24-26 ft)", category: "Class 6 (Straight Truck)", capacity: "1,500 cu ft", activeCount: 4 },
];

export const FleetVehicleSettingsPanel: FC<FleetVehicleSettingsPanelProps> = ({ onNotification }) => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeItem[]>(INITIAL_VEHICLE_TYPES);

  // PM intervals
  const [oilChangeInterval, setOilChangeInterval] = useState("5000");
  const [tireRotationInterval, setTireRotationInterval] = useState("7500");
  const [brakeInspectionInterval, setBrakeInspectionInterval] = useState("10000");
  const [dotAnnualReminderDays, setDotAnnualReminderDays] = useState("30");

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
            <span>Vehicle & Fleet Management</span>
          </h2>
          <p className="settings-panel-subheading">
            Manage fleet vehicle types, preventive maintenance service rules, and customize post-trip return inspection requirements
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
          Vehicle profiles categorized for route package cubic capacity and delivery station assignments.
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

      {/* 2. Preventive Maintenance (PM) Intervals */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Wrench size={17} className="text-blue-600" />
            <span>Preventive Maintenance (PM) Schedules & Alert Rules</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Automated mileage triggers and calendar thresholds that flag work orders on the Fleet Dashboard.
        </p>

        <div className="settings-form-grid-2">
          <div className="settings-form-field">
            <label className="settings-form-label">
              Engine Oil & Filter Service Interval (Miles)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={oilChangeInterval}
              step="500"
              onChange={(e) => setOilChangeInterval(e.target.value)}
            />
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">
              Tire Rotation & Tread Depth Check (Miles)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={tireRotationInterval}
              step="500"
              onChange={(e) => setTireRotationInterval(e.target.value)}
            />
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">
              Brake Pad & Rotor Inspection Threshold (Miles)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={brakeInspectionInterval}
              step="500"
              onChange={(e) => setBrakeInspectionInterval(e.target.value)}
            />
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">
              Annual DOT Safety Inspection Notice (Days Prior)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={dotAnnualReminderDays}
              min="7"
              max="60"
              onChange={(e) => setDotAnnualReminderDays(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 3. Driver Return Inspection (DVIC) Checklist Customization */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <ClipboardCheck size={17} className="text-blue-600" />
            <span>Driver Return Inspection (DVIC) Mandatory Steps</span>
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
              <span className="settings-toggle-title">Cabin Cleanliness & Trash Removal Sign-off</span>
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Fleet Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default FleetVehicleSettingsPanel;
