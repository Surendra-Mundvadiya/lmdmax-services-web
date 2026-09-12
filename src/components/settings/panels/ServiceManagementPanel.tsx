import React, { FC, useState } from "react";
import {
  Wrench,
  Gauge,
  Calendar,
  AlertTriangle,
  Save,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface ServiceManagementPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const ServiceManagementPanel: FC<ServiceManagementPanelProps> = ({ onNotification }) => {
  const [oilChangeInterval, setOilChangeInterval] = useState("5000");
  const [tireRotationInterval, setTireRotationInterval] = useState("7500");
  const [brakeInspectionInterval, setBrakeInspectionInterval] = useState("10000");
  const [dotAnnualReminderDays, setDotAnnualReminderDays] = useState("30");
  const [transmissionFlushInterval, setTransmissionFlushInterval] = useState("30000");
  const [autoGenerateWorkOrders, setAutoGenerateWorkOrders] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Schedule service management rules updated successfully!",
        type: "success",
      });
    }, 450);
  };

  return (
    <div className="settings-panel-scroll">
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Configure preventive maintenance (PM) service intervals, routine inspection rules, and annual DOT safety thresholds
        </p>
      </div>

      {/* 1. Preventive Maintenance (PM) Intervals */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Wrench size={17} />
            <span>Preventive Maintenance (PM) Schedules & Mileage Intervals</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Automated mileage triggers and calendar thresholds that flag maintenance service work orders on the Fleet Dashboard.
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
              Transmission & Coolant System Flush (Miles)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={transmissionFlushInterval}
              step="1000"
              onChange={(e) => setTransmissionFlushInterval(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Annual Compliance & Inspection Rules */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Calendar size={17} />
            <span>Annual DOT & Registration Compliance Alerts</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Advance notification windows for expiring vehicle registrations, annual DOT certifications, and emissions tests.
        </p>

        <div className="settings-form-grid-2">
          <div className="settings-form-field">
            <label className="settings-form-label">
              Annual DOT Safety Inspection Notice (Days Prior)
            </label>
            <input
              type="number"
              className="settings-form-input"
              value={dotAnnualReminderDays}
              min="7"
              max="90"
              onChange={(e) => setDotAnnualReminderDays(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">Automated PM Work Order Generation</span>
            <span className="settings-toggle-desc">
              Automatically trigger a scheduled service ticket when odometer reaches within 500 miles of threshold
            </span>
          </div>
          <label className="custom-blue-switch" title="Toggle automated work orders">
            <input
              type="checkbox"
              checked={autoGenerateWorkOrders}
              onChange={() => setAutoGenerateWorkOrders(!autoGenerateWorkOrders)}
            />
            <span className="switch-slider" />
          </label>
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Service Rules"}</span>
        </button>
      </div>
    </div>
  );
};

export default ServiceManagementPanel;
