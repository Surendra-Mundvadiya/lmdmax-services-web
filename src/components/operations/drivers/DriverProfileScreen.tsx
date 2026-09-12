import React, { FC, useState } from "react";
import {
  ArrowLeft,
  User,
  BarChart3,
  CalendarDays,
  Truck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Edit2,
  Clock,
  Smartphone,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore, AVAILABLE_STATIONS } from "../../../store/driverStore";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";
import "./drivers.css";

interface DriverProfileScreenProps {
  driver: Driver;
  onBack: () => void;
  onEdit: (driver: Driver) => void;
  onNotification?: (msg: { text: string; type: "success" | "error" }) => void;
}

type ProfileTab = "overview" | "performance" | "scheduler" | "fleet";

export const DriverProfileScreen: FC<DriverProfileScreenProps> = ({
  driver: initialDriver,
  onBack,
  onEdit,
  onNotification,
}) => {
  const drivers = useDriverStore((state) => state.drivers);
  const toggleDriverStatus = useDriverStore((state) => state.toggleDriverStatus);
  const toggleDriverSignin = useDriverStore((state) => state.toggleDriverSignin);
  const toggleDriverInspections = useDriverStore((state) => state.toggleDriverInspections);

  // Keep driver synced with store
  const driver = drivers.find((d) => d.id === initialDriver.id) || initialDriver;

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");


  const formatPhone = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, "");
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phoneStr;
  };

  const getYearsCompleted = () => {
    const dateStr = driver.work_anniversary || driver.hire_date;
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    const m = now.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) {
      years--;
    }
    return years > 0 ? years : null;
  };

  const yearsCompleted = getYearsCompleted();

  const handleStatusToggle = () => {
    toggleDriverStatus(driver.id);
    if (onNotification) {
      onNotification({
        text: "Driver status updated successfully!",
        type: "success",
      });
    }
  };

  const handleSigninToggle = () => {
    toggleDriverSignin(driver.id);
    if (onNotification) {
      onNotification({
        text: "Driver sign-in permission updated successfully!",
        type: "success",
      });
    }
  };

  const handleInspectionToggle = () => {
    toggleDriverInspections(driver.id);
    if (onNotification) {
      onNotification({
        text: "Driver inspection permission updated successfully!",
        type: "success",
      });
    }
  };

  return (
    <div className="driver-profile-screen-container">
      {/* 1. Top Navigation Bar with Back & Breadcrumb */}
      <div className="profile-screen-nav-bar">
        <div className="nav-bar-left">
          <button
            type="button"
            className="back-btn"
            onClick={onBack}
            title="Back to All Drivers"
          >
            <ArrowLeft size={16} />
            <span>Back to Drivers</span>
          </button>
          <div className="screen-title-divider" />
          <div className="profile-breadcrumbs">
            <span className="crumb-item" onClick={onBack}>Operations</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-item" onClick={onBack}>Drivers</span>
            <span className="crumb-separator">/</span>
            <span className="crumb-current">{driver.name}</span>
          </div>
        </div>

        <div className="nav-bar-right" style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-blue-outline btn-sm"
            onClick={() => onEdit(driver)}
            title="Edit Driver Details"
          >
            <Edit2 size={14} />
            <span>Edit Profile</span>
          </button>

          <div
            className="header-status-toggle"
            title={`Toggle status: currently ${driver.status}`}
          >
            <label className="custom-blue-switch">
              <input
                type="checkbox"
                checked={driver.status === "active"}
                onChange={handleStatusToggle}
              />
              <span className="switch-slider" />
            </label>
            <span className={`status-text-pill ${driver.status}`}>
              {driver.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Driver Identity Summary Hero Banner */}
      <div className="profile-hero-banner">
        <div className="hero-banner-main">
          <div
            className="hero-avatar-large"
            style={{ background: getAvatarColor(driver.name, "driver") }}
          >
            <span>{getInitials(driver.name)}</span>
          </div>
          <div className="hero-meta-details">
            <div className="hero-name-row">
              <h1 className="hero-driver-name">{driver.name}</h1>
              <div className="hero-transporter-badge">
                <span>{driver.transporter_id ? driver.transporter_id.replace(/^#+/, "") : "—"}</span>
              </div>
              <span className={`hero-status-pill ${driver.status}`}>
                {driver.status === "active" ? "Active Driver" : "Inactive"}
              </span>
            </div>

            <div className="hero-submeta-row">
              <span className="submeta-item">
                <Mail size={13} className="text-slate-400" />
                {driver.email ? driver.email.replace(/^#+/, "") : "—"}
              </span>
              <span className="submeta-bullet">&bull;</span>
              <span className="submeta-item">
                <Phone size={13} className="text-slate-400" />
                {formatPhone(driver.phone)}
              </span>
              <span className="submeta-bullet">&bull;</span>
              <span className="submeta-item">
                <Building size={13} className="text-slate-400" />
                {driver.stations.map((s) => s.station_code).join(", ")}
              </span>
              {yearsCompleted !== null && (
                <>
                  <span className="submeta-bullet">&bull;</span>
                  <span className="celebration-badge">
                    🎉 {yearsCompleted} Year{yearsCompleted > 1 ? "s" : ""} Completed
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="hero-kpi-strip">
          <div className="kpi-mini-card">
            <span className="kpi-mini-label">Rescues</span>
            <span className="kpi-mini-value">{driver.metrics?.rescueCompleted ?? 0}</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-label">Tickets</span>
            <span className="kpi-mini-value">{driver.metrics?.parkingCount ?? 0}</span>
          </div>
          <div className="kpi-mini-card">
            <span className="kpi-mini-label">Damages</span>
            <span className="kpi-mini-value">{driver.metrics?.damageCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* 3. Modular Tab Navigation Bar */}
      <div className="profile-tabs-header">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <User size={15} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === "performance" ? "active" : ""}`}
          onClick={() => setActiveTab("performance")}
        >
          <BarChart3 size={15} />
          <span>Performance</span>
          <span className="tab-pill-badge tier">Fantastic Plus</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === "scheduler" ? "active" : ""}`}
          onClick={() => setActiveTab("scheduler")}
        >
          <CalendarDays size={15} />
          <span>Scheduler</span>
          <span className="tab-pill-badge blue">4 Shifts</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === "fleet" ? "active" : ""}`}
          onClick={() => setActiveTab("fleet")}
        >
          <Truck size={15} />
          <span>Fleet & Assets</span>
          <span className="tab-pill-badge emerald">Compliant</span>
        </button>
      </div>

      {/* 4. Tab Content Area (Clutter-Free, Extensible Modular Layout) */}
      <div className="profile-tab-body">
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === "overview" && (
          <div className="modular-tab-grid">
            {/* Card 1: Personal & Identification */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box blue">
                  <User size={16} />
                </div>
                <h3 className="card-title">Personal & Identification</h3>
              </div>
              <div className="card-fields-grid">
                <div className="info-field-unit">
                  <span className="field-unit-label">First Name</span>
                  <span className="field-unit-value">{driver.first_name}</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Last Name</span>
                  <span className="field-unit-value">{driver.last_name}</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Transporter ID</span>
                  <span className="field-unit-value font-mono text-blue-700 font-semibold">
                    {driver.transporter_id ? driver.transporter_id.replace(/^#+/, "") : "—"}
                  </span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Date of Birth</span>
                  <span className="field-unit-value">
                    {driver.date_of_birth
                      ? new Date(driver.date_of_birth).toLocaleDateString()
                      : "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Contact & Address */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box green">
                  <Phone size={16} />
                </div>
                <h3 className="card-title">Contact & Location</h3>
              </div>
              <div className="card-fields-grid">
                <div className="info-field-unit">
                  <span className="field-unit-label">Email Address</span>
                  <span className="field-unit-value font-medium">
                    {driver.email ? driver.email.replace(/^#+/, "") : "—"}
                  </span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Phone Number</span>
                  <span className="field-unit-value font-medium">US +1 {formatPhone(driver.phone)}</span>
                </div>
                <div className="info-field-unit col-span-2">
                  <span className="field-unit-label">Residential Address</span>
                  <div className="address-display-box">
                    <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>{driver.address || "No residential address provided on file"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Employment Milestones */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box gold">
                  <Calendar size={16} />
                </div>
                <h3 className="card-title">Employment & Milestones</h3>
              </div>
              <div className="card-fields-grid">
                <div className="info-field-unit">
                  <span className="field-unit-label">Hire Date</span>
                  <span className="field-unit-value font-semibold">
                    {new Date(driver.hire_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Work Anniversary</span>
                  <div className="flex items-center gap-2">
                    <span className="field-unit-value font-semibold">
                      {new Date(driver.work_anniversary).toLocaleDateString()}
                    </span>
                    {yearsCompleted !== null && (
                      <span className="celebration-badge">
                        🎉 {yearsCompleted}y
                      </span>
                    )}
                  </div>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Roster Status</span>
                  <span className={`status-badge-inline ${driver.status}`}>
                    {driver.status === "active" ? "Active Roster" : "Inactive Roster"}
                  </span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">DSP Onboarding</span>
                  <span className="field-unit-value text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Complete & Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Delivery Stations & Hubs */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box blue">
                  <Building size={16} />
                </div>
                <h3 className="card-title">Assigned Delivery Stations</h3>
              </div>
              <div className="stations-detail-list">
                {driver.stations.map((st) => {
                  const meta = AVAILABLE_STATIONS.find((s) => s.code === st.station_code) || {
                    name: `${st.station_code} Hub`,
                    city: "Texas",
                    state: "TX",
                  };
                  return (
                    <div key={st.station_code} className="station-hub-card">
                      <div className="hub-code-badge">{st.station_code}</div>
                      <div className="hub-info-text">
                        <strong className="hub-name">{meta.name}</strong>
                        <span className="hub-subtext">
                          {meta.city ? `${meta.city}, ${meta.state}` : "Authorized Delivery Hub"}
                        </span>
                      </div>
                      <span className="hub-active-tag">Authorized</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 5: App Access & Security Permissions */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box indigo">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="card-title">Mobile Access & Permissions</h3>
              </div>
              <div className="permissions-settings-list">
                <div className="perm-setting-row">
                  <div className="perm-meta">
                    <strong className="perm-name">Driver Sign In (LMD Drive)</strong>
                    <span className="perm-desc">
                      Allows driver to authenticate and sign in to the mobile delivery app
                    </span>
                  </div>
                  <label className="custom-blue-switch">
                    <input
                      type="checkbox"
                      checked={driver.allow_signin}
                      onChange={handleSigninToggle}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                <div className="perm-setting-row">
                  <div className="perm-meta">
                    <strong className="perm-name">Driver Vehicle Inspection (DVIC)</strong>
                    <span className="perm-desc">
                      Enables mandatory pre-trip and post-trip electronic vehicle inspections
                    </span>
                  </div>
                  <label className="custom-blue-switch">
                    <input
                      type="checkbox"
                      checked={driver.allow_inspections}
                      disabled={!driver.allow_signin}
                      onChange={handleInspectionToggle}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 6: Extensible Future Fields / Notes Slot */}
            <div className="modular-info-card extensible-slot-card">
              <div className="card-header-row">
                <div className="header-icon-box purple">
                  <Sparkles size={16} />
                </div>
                <h3 className="card-title">Future Custom Information & Notes</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-2">
                This modular section is architected for seamless expansion. Additional DSP-specific fields, emergency contacts, or onboarding certifications can be attached here with zero layout clutter.
              </p>
              <div className="notes-box-placeholder">
                <span className="text-xs text-slate-400 font-medium">
                  Driver profile verified for DSP delivery operations. No disciplinary flags recorded.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: PERFORMANCE ===================== */}
        {activeTab === "performance" && (
          <div className="modular-tab-grid">
            {/* KPI Cards Strip */}
            <div className="modular-info-card col-span-2">
              <div className="card-header-row">
                <div className="header-icon-box blue">
                  <Award size={16} />
                </div>
                <h3 className="card-title">Amazon Logistics Scorecard Metrics</h3>
                <span className="celebration-badge ml-auto">Fantastic Plus Quality Tier</span>
              </div>
              <div className="kpi-quad-grid">
                <div className="kpi-stat-box">
                  <span className="kpi-box-title">Safe Driving Score</span>
                  <span className="kpi-box-value text-blue-600">942</span>
                  <span className="kpi-box-sub">Top 5% of DSP fleet (+18 pts)</span>
                </div>
                <div className="kpi-stat-box">
                  <span className="kpi-box-title">Delivery Completion (DCR)</span>
                  <span className="kpi-box-value text-emerald-600">99.8%</span>
                  <span className="kpi-box-sub">1,482 packages delivered</span>
                </div>
                <div className="kpi-stat-box">
                  <span className="kpi-box-title">Customer Feedback (CDF)</span>
                  <span className="kpi-box-value text-blue-600">99.2%</span>
                  <span className="kpi-box-sub">Positive delivery reviews</span>
                </div>
                <div className="kpi-stat-box">
                  <span className="kpi-box-title">Defects (DPMO)</span>
                  <span className="kpi-box-value text-indigo-600">120</span>
                  <span className="kpi-box-sub">Benchmark: &lt; 250</span>
                </div>
              </div>
            </div>

            {/* Netradyne Events */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box green">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="card-title">Netradyne Safety Intelligence</h3>
              </div>
              <div className="netradyne-events-list">
                <div className="event-item-row">
                  <span className="event-name">Speeding Violations</span>
                  <span className="event-count-pill zero">0 Events</span>
                </div>
                <div className="event-item-row">
                  <span className="event-name">Distracted Driving / Phone</span>
                  <span className="event-count-pill zero">0 Events</span>
                </div>
                <div className="event-item-row">
                  <span className="event-name">Stop Sign / Light Infractions</span>
                  <span className="event-count-pill zero">0 Events</span>
                </div>
                <div className="event-item-row">
                  <span className="event-name">Seatbelt Compliance</span>
                  <span className="event-count-pill good">100% Compliant</span>
                </div>
              </div>
            </div>

            {/* Fleet Track Record */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box gold">
                  <Truck size={16} />
                </div>
                <h3 className="card-title">Operational Track Record</h3>
              </div>
              <div className="track-record-grid">
                <div className="track-metric-cell">
                  <span className="track-label">Rescues Completed</span>
                  <strong className="track-value text-blue-600">
                    {driver.metrics?.rescueCompleted ?? 6}
                  </strong>
                  <span className="track-hint">Assisted peer drivers</span>
                </div>
                <div className="track-metric-cell">
                  <span className="track-label">Parking Citations</span>
                  <strong className="track-value text-slate-700">
                    {driver.metrics?.parkingCount ?? 0}
                  </strong>
                  <span className="track-hint">Zero city tickets</span>
                </div>
                <div className="track-metric-cell">
                  <span className="track-label">Damage Reports</span>
                  <strong className="track-value text-slate-700">
                    {driver.metrics?.damageCount ?? 0}
                  </strong>
                  <span className="track-hint">Clean inspection record</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: SCHEDULER ===================== */}
        {activeTab === "scheduler" && (
          <div className="modular-tab-grid">
            {/* Weekly Schedule Summary */}
            <div className="modular-info-card col-span-2">
              <div className="card-header-row">
                <div className="header-icon-box blue">
                  <Clock size={16} />
                </div>
                <h3 className="card-title">Current Weekly Shift Schedule (Mon - Sun)</h3>
                <span className="badge-pill blue ml-auto">40.0 Total Hours</span>
              </div>
              <div className="week-schedule-grid">
                {[
                  { day: "Mon", date: "Sep 7", shift: "09:45 AM - 07:45 PM", route: "Route D14", status: "confirmed" },
                  { day: "Tue", date: "Sep 8", shift: "09:45 AM - 07:45 PM", route: "Route D08", status: "confirmed" },
                  { day: "Wed", date: "Sep 9", shift: "OFF", route: "-", status: "off" },
                  { day: "Thu", date: "Sep 10", shift: "09:45 AM - 07:45 PM", route: "Route D22", status: "confirmed" },
                  { day: "Fri", date: "Sep 11", shift: "09:45 AM - 07:45 PM", route: "Route D11", status: "confirmed" },
                  { day: "Sat", date: "Sep 12", shift: "OFF", route: "-", status: "off" },
                  { day: "Sun", date: "Sep 13", shift: "OFF", route: "-", status: "off" },
                ].map((s) => (
                  <div key={s.day} className={`schedule-day-cell ${s.status}`}>
                    <span className="day-name">{s.day}</span>
                    <span className="day-date">{s.date}</span>
                    <span className="shift-hours">{s.shift}</span>
                    <span className="shift-route">{s.route}</span>
                    <span className={`shift-status-tag ${s.status}`}>
                      {s.status === "confirmed" ? "Scheduled" : "Off Duty"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Preferences */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box purple">
                  <CalendarDays size={16} />
                </div>
                <h3 className="card-title">Availability & Wave Preferences</h3>
              </div>
              <div className="card-fields-grid">
                <div className="info-field-unit">
                  <span className="field-unit-label">Wave Departure</span>
                  <span className="field-unit-value font-semibold text-blue-700">Wave 1 (09:45 AM)</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Weekly Hours Target</span>
                  <span className="field-unit-value font-semibold">40 Hours (Full-Time)</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Weekend Standby</span>
                  <span className="field-unit-value text-emerald-700 font-semibold">Flexible / Available</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Overtime Status</span>
                  <span className="field-unit-value">Eligible (0.0 OT this week)</span>
                </div>
              </div>
            </div>

            {/* Time-Off Requests */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box gold">
                  <Calendar size={16} />
                </div>
                <h3 className="card-title">Time-Off & Swap Requests</h3>
              </div>
              <div className="timeoff-status-box">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <div>
                  <strong className="text-xs text-slate-800 block">No Pending Time-Off Requests</strong>
                  <span className="text-xs text-slate-500">
                    Last approved PTO: Aug 14 - Aug 16, 2026 (Annual Leave)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: FLEET & ASSETS ===================== */}
        {activeTab === "fleet" && (
          <div className="modular-tab-grid">
            {/* Assigned Van */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box blue">
                  <Truck size={16} />
                </div>
                <h3 className="card-title">Assigned Fleet Vehicle</h3>
                <span className="status-badge-inline active ml-auto">In Service</span>
              </div>
              <div className="card-fields-grid">
                <div className="info-field-unit">
                  <span className="field-unit-label">Van Number</span>
                  <span className="field-unit-value font-bold text-blue-700">Van #104</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">Model & Year</span>
                  <span className="field-unit-value font-semibold">2024 Ford Transit 250</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">License Plate</span>
                  <span className="field-unit-value font-mono">TX-7482K</span>
                </div>
                <div className="info-field-unit">
                  <span className="field-unit-label">VIN Number</span>
                  <span className="field-unit-value font-mono text-xs">1FTBR1Y85PKB29104</span>
                </div>
              </div>
            </div>

            {/* DVIC Inspection Status */}
            <div className="modular-info-card">
              <div className="card-header-row">
                <div className="header-icon-box green">
                  <CheckCircle2 size={16} />
                </div>
                <h3 className="card-title">Daily DVIC Inspection Compliance</h3>
              </div>
              <div className="dvic-logs-list">
                <div className="dvic-item-row passed">
                  <div className="dvic-meta">
                    <strong className="dvic-title">Pre-Trip Electronic Inspection</strong>
                    <span className="dvic-timestamp">Today at 09:15 AM &bull; Van #104</span>
                  </div>
                  <span className="dvic-status-pill passed">PASSED</span>
                </div>
                <div className="dvic-item-row passed">
                  <div className="dvic-meta">
                    <strong className="dvic-title">Post-Trip Electronic Inspection</strong>
                    <span className="dvic-timestamp">Yesterday at 07:35 PM &bull; Van #104</span>
                  </div>
                  <span className="dvic-status-pill passed">PASSED</span>
                </div>
              </div>
            </div>

            {/* Issued Delivery Devices */}
            <div className="modular-info-card col-span-2">
              <div className="card-header-row">
                <div className="header-icon-box purple">
                  <Smartphone size={16} />
                </div>
                <h3 className="card-title">Assigned Devices & Gear</h3>
              </div>
              <div className="issued-assets-grid">
                <div className="asset-unit-card">
                  <Smartphone size={16} className="text-blue-600" />
                  <div className="asset-meta">
                    <strong>Zebra TC57 Scanner</strong>
                    <span>Rabbit Device #08 &bull; Serial: ZB-84920</span>
                  </div>
                  <span className="asset-status-tag">Checked Out</span>
                </div>

                <div className="asset-unit-card">
                  <CreditCard size={16} className="text-amber-600" />
                  <div className="asset-meta">
                    <strong>Fleet Commercial Fuel Card</strong>
                    <span>WEX / Chevron &bull; Card ending in 4108</span>
                  </div>
                  <span className="asset-status-tag">Assigned</span>
                </div>

                <div className="asset-unit-card">
                  <Building size={16} className="text-emerald-600" />
                  <div className="asset-meta">
                    <strong>Station Facility Locker</strong>
                    <span>Locker #24 &bull; DDF6 Station Hub</span>
                  </div>
                  <span className="asset-status-tag">Assigned</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverProfileScreen;
