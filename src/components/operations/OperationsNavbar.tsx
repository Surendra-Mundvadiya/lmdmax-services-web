import React, { FC, useState, useRef, useEffect } from "react";
import {
  Users,
  Truck,
  ShieldAlert,
  Package,
  Cloud,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useDriverStore, AVAILABLE_STATIONS } from "../../store/driverStore";

interface OperationsNavbarProps {
  activeModule?: "drivers" | "vehicles" | "admins" | "inventory" | "cloud";
  onModuleChange?: (module: string) => void;
}

export const OperationsNavbar: FC<OperationsNavbarProps> = ({
  activeModule = "drivers",
  onModuleChange,
}) => {
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);
  const setSelectedStationFilter = useDriverStore((state) => state.setSelectedStationFilter);
  const drivers = useDriverStore((state) => state.drivers);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setStationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStationCount = (stationCode: string) => {
    if (stationCode === "ALL") return drivers.length;
    return drivers.filter((d) => d.stations.some((s) => s.station_code === stationCode)).length;
  };

  const currentStationDisplay =
    selectedStationFilter === "ALL"
      ? `All Stations (${AVAILABLE_STATIONS.length})`
      : AVAILABLE_STATIONS.find((s) => s.code === selectedStationFilter)?.name || selectedStationFilter;

  const modules = [
    { id: "drivers", label: "Drivers", icon: Users, active: true, count: getStationCount(selectedStationFilter) },
    { id: "vehicles", label: "Vehicles", icon: Truck, active: false, badge: "Shared" },
    { id: "admins", label: "Admins", icon: ShieldAlert, active: false, badge: "Shared" },
    { id: "inventory", label: "Inventory", icon: Package, active: false, badge: "Shared" },
    { id: "cloud", label: "LMD Cloud", icon: Cloud, active: false, badge: "Shared" },
  ];

  return (
    <div className="operations-subnav-bar">
      <div className="operations-modules-tabs">
        {modules.map((m) => {
          const Icon = m.icon;
          const isSelected = activeModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`operations-tab-pill ${isSelected ? "active" : ""} ${
                !m.active ? "opacity-75" : ""
              }`}
              onClick={() => {
                if (m.active && onModuleChange) {
                  onModuleChange(m.id);
                }
              }}
              title={m.active ? m.label : `${m.label} (Coming Soon in Unified App)`}
            >
              <Icon size={15} />
              <span>{m.label}</span>
              {m.count !== undefined && (
                <span className="operations-count-badge">{m.count}</span>
              )}
              {m.badge && <span className="operations-pill-badge">{m.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* Multi-Station Selector Filter */}
      <div className="station-selector-wrapper" ref={dropdownRef}>
        <span className="station-selector-label">STATION:</span>
        <button
          type="button"
          className="station-selector-btn"
          onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
          aria-label="Filter by delivery station"
          aria-expanded={stationDropdownOpen}
        >
          <Building2 size={14} style={{ color: "var(--ads-blue)" }} />
          <span className="station-btn-text">{currentStationDisplay}</span>
          <ChevronDown size={14} className="station-arrow-icon" />
        </button>

        {stationDropdownOpen && (
          <div className="station-dropdown-menu">
            <div className="station-dropdown-header">
              <span>Filter by Delivery Station</span>
            </div>

            <button
              type="button"
              className={`station-dropdown-item ${selectedStationFilter === "ALL" ? "active" : ""}`}
              onClick={() => {
                setSelectedStationFilter("ALL");
                setStationDropdownOpen(false);
              }}
            >
              <div className="station-item-info">
                <span className="station-item-code">All Stations</span>
                <span className="station-item-count">
                  {drivers.length} Drivers
                </span>
              </div>
              {selectedStationFilter === "ALL" && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
            </button>

            <div className="station-dropdown-divider" />

            {AVAILABLE_STATIONS.map((station) => {
              const count = getStationCount(station.code);
              const isCurrent = selectedStationFilter === station.code;
              return (
                <button
                  key={station.code}
                  type="button"
                  className={`station-dropdown-item ${isCurrent ? "active" : ""}`}
                  onClick={() => {
                    setSelectedStationFilter(station.code);
                    setStationDropdownOpen(false);
                  }}
                >
                  <div className="station-item-info">
                    <span className="station-item-code">{station.code}</span>
                    <span className="station-item-desc">{station.name}</span>
                  </div>
                  <div className="station-item-right">
                    <span className="station-item-count">{count}</span>
                    {isCurrent && <Check size={14} style={{ color: "var(--ads-blue)" }} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsNavbar;
