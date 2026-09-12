import React, { FC, useState, useMemo } from "react";
import { Search, X, Check, User, Users } from "lucide-react";
import { useDriverStore } from "../../../store/driverStore";
import type { Driver } from "../../../types/driver";

interface DriverSelectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDriverIds: (string | number)[];
  onToggleDriver: (driver: Driver) => void;
}

export const DriverSelectDrawer: FC<DriverSelectDrawerProps> = ({
  isOpen,
  onClose,
  selectedDriverIds,
  onToggleDriver,
}) => {
  const drivers = useDriverStore((state) => state.drivers);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedSet = useMemo(
    () => new Set(selectedDriverIds.map(String)),
    [selectedDriverIds]
  );

  const filteredDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeDrivers = drivers.filter((d) => d.status !== "inactive");
    if (!q) return activeDrivers;
    return activeDrivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.phone && d.phone.toLowerCase().includes(q)) ||
        (d.transporter_id && d.transporter_id.toLowerCase().includes(q))
    );
  }, [drivers, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(2px)",
        transition: "opacity 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1.1rem 1.25rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                Select Drivers
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#64748B", margin: "0.15rem 0 0 0" }}>
                {selectedSet.size > 0
                  ? `${selectedSet.size} driver${selectedSet.size > 1 ? "s" : ""} selected for callout`
                  : "Click drivers to add as callout rows"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              cursor: "pointer",
            }}
            title="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid #F1F5F9" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              padding: "0.45rem 0.75rem",
            }}
          >
            <Search size={15} style={{ color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.8125rem",
                color: "#1E293B",
                width: "100%",
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Driver List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.6rem 0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
          }}
        >
          {filteredDrivers.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748B", fontSize: "0.8125rem" }}>
              No active drivers found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const isSelected = selectedSet.has(String(driver.id));
              return (
                <div
                  key={driver.id}
                  onClick={() => onToggleDriver(driver)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "8px",
                    border: isSelected ? "1.5px solid #2563EB" : "1px solid #E2E8F0",
                    backgroundColor: isSelected ? "#EFF6FF" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "#FFFFFF";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        backgroundColor: isSelected ? "#2563EB" : "#F1F5F9",
                        color: isSelected ? "#FFFFFF" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        flexShrink: 0,
                      }}
                    >
                      {driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || <User size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: isSelected ? "#1D4ED8" : "#1E293B",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {driver.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.6875rem",
                          color: "#64748B",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {driver.phone || "Active Driver"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "6px",
                      border: isSelected ? "2px solid #2563EB" : "2px solid #CBD5E1",
                      backgroundColor: isSelected ? "#2563EB" : "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={14} style={{ color: "#FFFFFF", strokeWidth: 3 }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748B" }}>
            {selectedSet.size} driver{selectedSet.size !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1.1rem",
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverSelectDrawer;
