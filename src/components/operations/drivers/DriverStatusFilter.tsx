import React, { FC, useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Filter,
  UserCheck,
  UserX,
  Smartphone,
  SmartphoneNfc,
  Users,
} from "lucide-react";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import type { DriverStatusFilter, DriverSigninFilter } from "../../../types/driver";

export const DriverStatusFilterComponent: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const drivers = useDriverStore((state) => state.drivers);
  const statusFilter = useDriverStore((state) => state.statusFilter);
  const setStatusFilter = useDriverStore((state) => state.setStatusFilter);
  const signinFilter = useDriverStore((state) => state.signinFilter);
  const setSigninFilter = useDriverStore((state) => state.setSigninFilter);

  const authStations = useAuthStore((state) => state.stations);
  const user = useAuthStore((state) => state.user);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    user?.station_code ||
    user?.company?.station_code ||
    "QUE2";

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute counts strictly scoped to the selected station from the header
  const stationDrivers = activeStationCode
    ? drivers.filter((d) =>
        d.stations.some(
          (s) =>
            s.station_code &&
            s.station_code.trim().toUpperCase() === activeStationCode.trim().toUpperCase()
        )
      )
    : drivers;

  const totalCount = stationDrivers.length;
  const activeCount = stationDrivers.filter((d) => d.status === "active").length;
  const inactiveCount = stationDrivers.filter((d) => d.status === "inactive").length;
  const signinEnabledCount = stationDrivers.filter((d) => d.status === "active" && d.allow_signin).length;
  const signinDisabledCount = stationDrivers.filter((d) => d.status === "active" && !d.allow_signin).length;

  // Active label
  const getFilterLabel = () => {
    if (statusFilter === "all") {
      return `All Drivers (${totalCount})`;
    }
    if (statusFilter === "inactive") {
      return `Inactive Drivers (${inactiveCount})`;
    }
    // statusFilter === "active"
    if (signinFilter === "signin_enabled") {
      return `Active • Sign-in Enabled (${signinEnabledCount})`;
    }
    if (signinFilter === "signin_disabled") {
      return `Active • Sign-in Disabled (${signinDisabledCount})`;
    }
    return `Active Drivers (${activeCount})`;
  };

  const handleSelect = (status: DriverStatusFilter, signin: DriverSigninFilter = "all") => {
    setStatusFilter(status);
    setSigninFilter(signin);
    setIsOpen(false);
  };

  const isOptionSelected = (status: DriverStatusFilter, signin: DriverSigninFilter = "all") => {
    if (status === "all") return statusFilter === "all";
    if (status === "inactive") return statusFilter === "inactive";
    return statusFilter === "active" && signinFilter === signin;
  };

  return (
    <div className="status-dropdown-wrapper" ref={dropdownRef}>
      {/* Fleet-Style Dropdown Filter Option */}
      <button
        type="button"
        className="driver-status-filter-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Filter by status and sign-in permissions"
      >
        <Filter size={13} style={{ color: "var(--ads-blue)" }} />
        <span className="filter-btn-text">{getFilterLabel()}</span>
        <ChevronDown size={14} className="filter-btn-chevron" />
      </button>

      {isOpen && (
        <div className="driver-status-menu">
          <div className="status-menu-header">
            <span>Filter Driver Status</span>
          </div>

          {/* All Drivers */}
          <button
            type="button"
            className={`status-menu-option ${isOptionSelected("all") ? "selected" : ""}`}
            onClick={() => handleSelect("all", "all")}
          >
            <div className="option-title-group">
              <Users size={14} style={{ color: "var(--ads-blue)" }} />
              <span className="option-title">All Drivers</span>
            </div>
            <div className="option-right">
              <span className="option-count">{totalCount}</span>
              {isOptionSelected("all") && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </div>
          </button>

          <div className="status-menu-divider" />

          {/* Active - All */}
          <button
            type="button"
            className={`status-menu-option ${isOptionSelected("active", "all") ? "selected" : ""}`}
            onClick={() => handleSelect("active", "all")}
          >
            <div className="option-title-group">
              <UserCheck size={14} style={{ color: "var(--ads-green)" }} />
              <span className="option-title">All Active Drivers</span>
            </div>
            <div className="option-right">
              <span className="option-count count-emerald">{activeCount}</span>
              {isOptionSelected("active", "all") && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </div>
          </button>

          {/* Active - Sign in Enabled */}
          <button
            type="button"
            className={`status-menu-option sub-option ${isOptionSelected("active", "signin_enabled") ? "selected" : ""}`}
            onClick={() => handleSelect("active", "signin_enabled")}
          >
            <div className="option-title-group">
              <Smartphone size={13} style={{ color: "var(--ads-blue)" }} />
              <span className="option-title">Sign-in Enabled (LMD Drive)</span>
            </div>
            <div className="option-right">
              <span className="option-count count-blue">{signinEnabledCount}</span>
              {isOptionSelected("active", "signin_enabled") && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </div>
          </button>

          {/* Active - Sign in Disabled */}
          <button
            type="button"
            className={`status-menu-option sub-option ${isOptionSelected("active", "signin_disabled") ? "selected" : ""}`}
            onClick={() => handleSelect("active", "signin_disabled")}
          >
            <div className="option-title-group">
              <SmartphoneNfc size={13} style={{ color: "var(--ads-ink-quaternary)" }} />
              <span className="option-title">Sign-in Disabled</span>
            </div>
            <div className="option-right">
              <span className="option-count">{signinDisabledCount}</span>
              {isOptionSelected("active", "signin_disabled") && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </div>
          </button>

          <div className="status-menu-divider" />

          {/* Inactive */}
          <button
            type="button"
            className={`status-menu-option ${isOptionSelected("inactive") ? "selected" : ""}`}
            onClick={() => handleSelect("inactive", "all")}
          >
            <div className="option-title-group">
              <UserX size={14} style={{ color: "var(--ads-red)" }} />
              <span className="option-title">Inactive Drivers</span>
            </div>
            <div className="option-right">
              <span className="option-count count-red">{inactiveCount}</span>
              {isOptionSelected("inactive") && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverStatusFilterComponent;
