import React, { FC, useState, useEffect, useCallback } from "react";
import {
  X,
  Clock,
  Wrench,
  ShieldAlert,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  User,
  RotateCw,
  ClipboardList,
  Flame,
  Truck,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { Vehicle, VehicleTimelineItem } from "../../../../types/vehicle";
import { vehicleApi } from "../../../../api/vehicleApi";
import LoadingSpinner from "../../../common/LoadingSpinner";

interface VehicleTimelineModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "All",
  "Body Damage",
  "Mechanical Issues",
  "Preventive Maintenance",
  "Inspections",
  "Tasks",
  "Violations",
  "Accidents",
  "Notes",
] as const;

type TimelineCategory = (typeof CATEGORIES)[number];

export const VehicleTimelineModal: FC<VehicleTimelineModalProps> = ({
  vehicle,
  isOpen,
  onClose,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TimelineCategory>("All");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleApi.getVehicleTimeline(vehicle.id, 100, 0);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [vehicle.id]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedCategory("All");
    }
  }, [isOpen, loadData]);

  // Filter items based on selected category
  const filteredItems = items.filter((item) => {
    if (selectedCategory === "All") return true;

    const t = (item.type || "").toLowerCase();
    switch (selectedCategory) {
      case "Body Damage":
        return t === "body_damage";
      case "Mechanical Issues":
        return t === "mechanical";
      case "Preventive Maintenance":
        return t === "preventive_maintenance";
      case "Inspections":
        return (
          t === "default_inspection" ||
          t === "pre_inspection" ||
          t === "post_inspection" ||
          t === "inspection"
        );
      case "Tasks":
        return t === "task_management" || t === "task";
      case "Violations":
        return t === "nexus_event" || t === "violation";
      case "Accidents":
        return t === "accident_report" || t === "accident";
      case "Notes":
        return t === "notes" || t === "note";
      default:
        return true;
    }
  });

  // Group items by date string
  const groupedItems = filteredItems.reduce((acc: Record<string, any[]>, item) => {
    const rawDate = item.created_at || item.data?.date || item.date || "";
    let groupKey = "Unknown Date";

    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
          groupKey = "Today";
        } else if (d.toDateString() === yesterday.toDateString()) {
          groupKey = "Yesterday";
        } else {
          groupKey = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      }
    }

    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});

  const getItemBadgeConfig = (type: string) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "body_damage":
        return {
          icon: <ShieldAlert size={16} />,
          label: "Body Damage",
          bg: "var(--ads-red-tint)",
          text: "var(--ads-red)",
          border: "var(--ads-red-tint)",
          dotColor: "var(--ads-red)",
        };
      case "mechanical":
        return {
          icon: <AlertTriangle size={16} />,
          label: "Mechanical Issue",
          bg: "var(--ads-amber-tint)",
          text: "var(--ads-amber)",
          border: "var(--ads-amber-tint)",
          dotColor: "var(--ads-amber)",
        };
      case "preventive_maintenance":
        return {
          icon: <Wrench size={16} />,
          label: "Preventive Log",
          bg: "var(--ads-blue-tint)",
          text: "var(--ads-blue)",
          border: "var(--ads-blue-tint-strong)",
          dotColor: "var(--ads-blue)",
        };
      case "default_inspection":
      case "pre_inspection":
      case "post_inspection":
      case "inspection":
        return {
          icon: <ClipboardList size={16} />,
          label: "Driver Inspection",
          bg: "var(--ads-green-tint)",
          text: "var(--ads-green)",
          border: "var(--ads-green-tint)",
          dotColor: "var(--ads-green)",
        };
      case "task_management":
      case "task":
        return {
          icon: <CheckCircle2 size={16} />,
          label: "Task Update",
          bg: "var(--ads-purple-tint)",
          text: "var(--ads-purple)",
          border: "var(--ads-purple-tint)",
          dotColor: "var(--ads-purple)",
        };
      case "accident_report":
      case "accident":
        return {
          icon: <Flame size={16} />,
          label: "Accident Report",
          bg: "var(--ads-red-tint)",
          text: "var(--ads-red)",
          border: "var(--ads-red-tint)",
          dotColor: "var(--ads-red)",
        };
      case "notes":
      case "note":
        return {
          icon: <FileText size={16} />,
          label: "Vehicle Note",
          bg: "var(--ads-canvas)",
          text: "var(--ads-ink-secondary)",
          border: "var(--ads-hairline)",
          dotColor: "var(--ads-ink-tertiary)",
        };
      default:
        return {
          icon: <Truck size={16} />,
          label: "Vehicle Activity",
          bg: "var(--ads-blue-tint)",
          text: "var(--ads-blue-active)",
          border: "var(--ads-blue-tint-strong)",
          dotColor: "var(--ads-blue)",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--ads-s5) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--ads-r-sm)",
                background: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                  Vehicle Timeline
                </h2>
                <span
                  style={{
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.6rem",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid var(--ads-blue-tint-strong)",
                  }}
                >
                  {filteredItems.length} Events
                </span>
              </div>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--ads-ink-tertiary)" }}>
                Vehicle: <strong>{vehicle.vin || "Vehicle #" + vehicle.id}</strong>
                {(vehicle as any).license_plate ? ` (${(vehicle as any).license_plate})` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s2)" }}>
            <button
              type="button"
              onClick={loadData}
              title="Refresh Timeline"
              aria-label="Refresh timeline"
              style={{
                width: 32,
                height: 32,
                background: "transparent",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-sm)",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)";
                e.currentTarget.style.color = "var(--ads-ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--ads-ink-tertiary)";
              }}
            >
              <RotateCw size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close vehicle timeline"
              style={{
                width: 32,
                height: 32,
                background: "transparent",
                border: "1px solid var(--ads-hairline)",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                borderRadius: "var(--ads-r-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ads-ink)";
                e.currentTarget.style.background = "rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ads-ink-tertiary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            padding: "var(--ads-s3) var(--ads-s6)",
            background: "rgba(0, 0, 0, 0.025)",
            borderBottom: "1px solid var(--ads-hairline)",
            display: "flex",
            alignItems: "center",
            gap: "var(--ads-s2)",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={isSelected}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--ads-r-pill)",
                  fontSize: "0.8125rem",
                  fontWeight: isSelected ? 600 : 550,
                  letterSpacing: "-0.005em",
                  border: "1px solid " + (isSelected ? "transparent" : "var(--ads-hairline)"),
                  backgroundColor: isSelected ? "var(--ads-blue)" : "var(--ads-material-thick)",
                  color: isSelected ? "#FFFFFF" : "var(--ads-ink-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                  boxShadow: isSelected ? "0 1px 4px rgba(0, 113, 227, 0.32)" : "var(--ads-bevel)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Timeline Body */}
        <div
          style={{
            padding: "var(--ads-s6)",
            flex: 1,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3.5rem",
                color: "var(--ads-ink-tertiary)",
              }}
            >
              <LoadingSpinner size="lg" />
              <span style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                Loading vehicle history logs...
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3.5rem 1rem",
                color: "var(--ads-ink-tertiary)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--ads-blue-tint)",
                  color: "var(--ads-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Layers size={28} />
              </div>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                No Timeline Logs Found
              </h4>
              <p style={{ margin: "0", fontSize: "0.85rem", color: "var(--ads-ink-tertiary)" }}>
                No recorded activity found for the &ldquo;{selectedCategory}&rdquo; filter.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {Object.entries(groupedItems).map(([groupTitle, groupEvents]) => (
                <div key={groupTitle}>
                  {/* Date Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.875rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "var(--ads-ink)",
                        backgroundColor: "rgba(0,0,0,0.04)",
                        padding: "0.2rem 0.65rem",
                        borderRadius: "var(--ads-r-xs)",
                      }}
                    >
                      {groupTitle}
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "var(--ads-hairline)" }} />
                  </div>

                  {/* Events in this group */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      paddingLeft: "0.5rem",
                      borderLeft: "2px solid var(--ads-hairline)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    {groupEvents.map((item, idx) => {
                      const cfg = getItemBadgeConfig(item.type);
                      const eventDate = item.created_at || item.data?.date || item.date;
                      let formattedTime = "";
                      if (eventDate) {
                        const d = new Date(eventDate);
                        if (!isNaN(d.getTime())) {
                          formattedTime = d.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        }
                      }

                      // Extract summary text
                      const summary =
                        item.message ||
                        item.title ||
                        item.data?.detail ||
                        item.data?.description ||
                        item.data?.notes ||
                        item.data?.service_type_name ||
                        item.data?.service_name ||
                        (typeof item.data === "string" ? item.data : "Activity logged");

                      const user =
                        item.user_name ||
                        item.created_by_name ||
                        item.data?.driver_name ||
                        item.data?.user ||
                        "";

                      return (
                        <div
                          key={item.id || idx}
                          style={{
                            background: "var(--ads-material-thick)",
                            border: "1px solid var(--ads-hairline)",
                            borderRadius: "var(--ads-r-md)",
                            padding: "var(--ads-s3) var(--ads-s4)",
                            boxShadow: "var(--ads-shadow-xs), var(--ads-bevel)",
                            marginLeft: "var(--ads-s3)",
                            position: "relative",
                            transition: "box-shadow var(--ads-dur) var(--ads-ease), transform var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "var(--ads-shadow-md), var(--ads-bevel)";
                            e.currentTarget.style.borderColor = "var(--ads-hairline-strong)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "var(--ads-shadow-xs), var(--ads-bevel)";
                            e.currentTarget.style.borderColor = "var(--ads-hairline)";
                          }}
                        >
                          {/* Dot indicator on timeline spine */}
                          <div
                            style={{
                              position: "absolute",
                              left: "-1.72rem",
                              top: "1.1rem",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: cfg.dotColor,
                              border: "2px solid #FFFFFF",
                              boxShadow: "0 0 0 2px var(--ads-hairline)",
                            }}
                          />

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.5rem",
                              marginBottom: "0.4rem",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                backgroundColor: cfg.bg,
                                color: cfg.text,
                                border: `1px solid ${cfg.border}`,
                                padding: "3px 9px",
                                borderRadius: "var(--ads-r-pill)",
                              }}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </span>

                            {formattedTime && (
                              <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-quaternary)" }}>
                                {formattedTime}
                              </span>
                            )}
                          </div>

                          <p
                            style={{
                              margin: "0 0 0.35rem",
                              fontSize: "0.88rem",
                              fontWeight: 500,
                              color: "var(--ads-ink)",
                              lineHeight: 1.4,
                            }}
                          >
                            {summary}
                          </p>

                          {/* Extra details if available */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                              flexWrap: "wrap",
                              fontSize: "0.78rem",
                              color: "var(--ads-ink-tertiary)",
                            }}
                          >
                            {user && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <User size={13} color="var(--ads-ink-quaternary)" />
                                <span>{user}</span>
                              </div>
                            )}

                            {item.data?.miles && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <span>
                                  Mileage: <strong>{Number(item.data.miles).toLocaleString()} mi</strong>
                                </span>
                              </div>
                            )}

                            {item.data?.vendor && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <span>
                                  Vendor: <strong>{item.data.vendor}</strong>
                                </span>
                              </div>
                            )}

                            {item.data?.location && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <span>
                                  Location: <strong>{item.data.location}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
            Real-time chronological events from Fleet Timeline MS
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid var(--ads-hairline)",
              background: "var(--ads-material-thick)",
              boxShadow: "var(--ads-bevel)",
              color: "var(--ads-ink)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
