import React, { FC, useState } from "react";
import {
  Sliders,
  Calendar,
  Clock,
  Layout,
  FileSpreadsheet,
  Save,
  CheckCircle2,
} from "lucide-react";

interface SchedulerFormatSettingsPanelProps {
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const SchedulerFormatSettingsPanel: FC<SchedulerFormatSettingsPanelProps> = ({
  onNotification,
}) => {
  const [weekStartDay, setWeekStartDay] = useState("Sunday");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [defaultLandingPage, setDefaultLandingPage] = useState("scheduler");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [autoExportWeeklyRoster, setAutoExportWeeklyRoster] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotification({
        text: "Scheduler dashboard & format preferences updated successfully!",
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
            <Sliders size={20} className="text-blue-600" />
            <span>Dashboard & Format</span>
            <span className="badge-custom blue">Scheduler</span>
          </h2>
          <p className="settings-panel-subheading">
            Configure calendar week start day, timeline display format, scheduler default landing view, and roster export formats
          </p>
        </div>
      </div>

      {/* 1. Regional & Calendar Configuration */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Calendar size={17} className="text-blue-600" />
            <span>Calendar & Time Formatting</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Ensure operational consistency across schedule rosters, dispatch timelines, and driver punch logs.
        </p>

        <div className="settings-form-grid-3">
          <div className="settings-form-field">
            <label className="settings-form-label">Operational Week Start Day</label>
            <select
              className="settings-form-select"
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(e.target.value)}
            >
              <option value="Sunday">Sunday (Amazon DSP Standard)</option>
              <option value="Monday">Monday</option>
            </select>
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">Time Display Format</label>
            <select
              className="settings-form-select"
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
            >
              <option value="12h">12-Hour (e.g. 09:30 AM)</option>
              <option value="24h">24-Hour Military (e.g. 09:30)</option>
            </select>
          </div>

          <div className="settings-form-field">
            <label className="settings-form-label">Calendar Date Format</label>
            <select
              className="settings-form-select"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Default Landing Screen */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <Layout size={17} className="text-blue-600" />
            <span>Default Navigation Landing View</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Choose which dashboard screen opens immediately when logging in or clicking the home logo.
        </p>

        <div className="settings-form-field max-w-md">
          <label className="settings-form-label">Post-Login Default Screen</label>
          <select
            className="settings-form-select"
            value={defaultLandingPage}
            onChange={(e) => setDefaultLandingPage(e.target.value)}
          >
            <option value="scheduler">Scheduler & Shift Roster (/scheduler)</option>
            <option value="operations">Driver Operations & Directory (/operations)</option>
            <option value="performance">Performance & Scorecards (/performance)</option>
            <option value="fleet">Fleet & Vehicle Health (/fleet)</option>
            <option value="dashboard">Service Hub Overview (/dashboard)</option>
          </select>
        </div>
      </div>

      {/* 3. Report & Data Exports */}
      <div className="settings-card">
        <div className="settings-card-title-row">
          <h3 className="settings-card-title">
            <FileSpreadsheet size={17} className="text-blue-600" />
            <span>Roster Export & Data Formatting</span>
          </h3>
        </div>
        <p className="settings-card-desc">
          Define standard file format preferences for schedule roster exports and shift archives.
        </p>

        <div className="settings-form-field max-w-md">
          <label className="settings-form-label">Preferred Export File Format</label>
          <select
            className="settings-form-select"
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="xlsx">Microsoft Excel Workbook (.xlsx)</option>
            <option value="csv">Comma-Separated Values (.csv)</option>
          </select>
        </div>

        <div className="settings-toggle-row mt-1">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">Automated Roster File Backup</span>
            <span className="settings-toggle-desc">
              Automatically saves an archive copy of each published week's finalized shift schedule
            </span>
          </div>
          <label className="custom-blue-switch" title="Toggle auto-backup">
            <input
              type="checkbox"
              checked={autoExportWeeklyRoster}
              onChange={() => setAutoExportWeeklyRoster(!autoExportWeeklyRoster)}
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
          <span style={{ color: "#FFFFFF" }}>{isSaving ? "Saving..." : "Save Format Settings"}</span>
        </button>
      </div>
    </div>
  );
};

export default SchedulerFormatSettingsPanel;
