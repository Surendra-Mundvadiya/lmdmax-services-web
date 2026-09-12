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
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        transition: "opacity 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "100%",
          backgroundColor: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderLeft: "1px solid var(--ads-hairline)",
          boxShadow: "var(--ads-shadow-lg)",
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
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(0, 0, 0, 0.025)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0 }}>
                Select Drivers
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)", margin: "0.15rem 0 0 0" }}>
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
              borderRadius: "var(--ads-r-xs)",
              border: "1px solid var(--ads-hairline)",
              backgroundColor: "var(--ads-material-thick)",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
            }}
            title="Close Drawer"
            aria-label="Close Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--ads-hairline)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "rgba(0, 0, 0, 0.025)",
              border: "1px solid var(--ads-hairline)",
              borderRadius: "var(--ads-r-xs)",
              padding: "0.45rem 0.75rem",
            }}
          >
            <Search size={15} style={{ color: "var(--ads-ink-tertiary)" }} />
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
                color: "var(--ads-ink)",
                width: "100%",
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                title="Clear search"
                style={{ background: "none", border: "none", color: "var(--ads-ink-tertiary)", cursor: "pointer" }}
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
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--ads-ink-tertiary)", fontSize: "0.8125rem" }}>
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
                    borderRadius: "var(--ads-r-sm)",
                    border: isSelected ? "1.5px solid var(--ads-blue)" : "1px solid var(--ads-hairline)",
                    backgroundColor: isSelected ? "var(--ads-blue-tint)" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(0, 113, 227, 0.045)";
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
                        backgroundColor: isSelected ? "var(--ads-blue)" : "rgba(0, 0, 0, 0.045)",
                        color: isSelected ? "#FFFFFF" : "var(--ads-ink-secondary)",
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
                          color: isSelected ? "var(--ads-blue)" : "var(--ads-ink)",
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
                          color: "var(--ads-ink-tertiary)",
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
                      borderRadius: "var(--ads-r-xs)",
                      border: isSelected ? "2px solid var(--ads-blue)" : "2px solid var(--ads-hairline-strong)",
                      backgroundColor: isSelected ? "var(--ads-blue)" : "#FFFFFF",
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
            borderTop: "1px solid var(--ads-hairline)",
            backgroundColor: "rgba(0, 0, 0, 0.025)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-tertiary)" }}>
            {selectedSet.size} driver{selectedSet.size !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              backgroundColor: "var(--ads-blue)",
              color: "#FFFFFF",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-pill)",
              boxShadow: "0 1px 3px rgba(0, 113, 227, 0.24)",
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
