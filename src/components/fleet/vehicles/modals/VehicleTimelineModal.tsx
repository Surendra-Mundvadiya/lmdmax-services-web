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
          bg: "#FEF2F2",
          text: "#DC2626",
          border: "#FECACA",
          dotColor: "#EF4444",
        };
      case "mechanical":
        return {
          icon: <AlertTriangle size={16} />,
          label: "Mechanical Issue",
          bg: "#FFFBEB",
          text: "#D97706",
          border: "#FDE68A",
          dotColor: "#F59E0B",
        };
      case "preventive_maintenance":
        return {
          icon: <Wrench size={16} />,
          label: "Preventive Log",
          bg: "#EFF6FF",
          text: "#2563EB",
          border: "#BFDBFE",
          dotColor: "#3B82F6",
        };
      case "default_inspection":
      case "pre_inspection":
      case "post_inspection":
      case "inspection":
        return {
          icon: <ClipboardList size={16} />,
          label: "Driver Inspection",
          bg: "#F0FDF4",
          text: "#16A34A",
          border: "#BBF7D0",
          dotColor: "#10B981",
        };
      case "task_management":
      case "task":
        return {
          icon: <CheckCircle2 size={16} />,
          label: "Task Update",
          bg: "#F5F3FF",
          text: "#7C3AED",
          border: "#DDD6FE",
          dotColor: "#8B5CF6",
        };
      case "accident_report":
      case "accident":
        return {
          icon: <Flame size={16} />,
          label: "Accident Report",
          bg: "#FFF1F2",
          text: "#E11D48",
          border: "#FECDD3",
          dotColor: "#F43F5E",
        };
      case "notes":
      case "note":
        return {
          icon: <FileText size={16} />,
          label: "Vehicle Note",
          bg: "#F8FAFC",
          text: "#475569",
          border: "#E2E8F0",
          dotColor: "#64748B",
        };
      default:
        return {
          icon: <Truck size={16} />,
          label: "Vehicle Activity",
          bg: "#EFF6FF",
          text: "#1D4ED8",
          border: "#BFDBFE",
          dotColor: "#2563EB",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E2E8F0",
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
            padding: "1.25rem 1.75rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #F8FAFC, #FFFFFF)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1E293B" }}>
                  Vehicle Timeline
                </h2>
                <span
                  style={{
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.6rem",
                    borderRadius: "9999px",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  {filteredItems.length} Events
                </span>
              </div>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#64748B" }}>
                Vehicle: <strong>{vehicle.vin || "Vehicle #" + vehicle.id}</strong>
                {(vehicle as any).license_plate ? ` (${(vehicle as any).license_plate})` : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={loadData}
              title="Refresh Timeline"
              style={{
                background: "#F1F5F9",
                border: "none",
                borderRadius: "0.375rem",
                padding: "0.45rem",
                color: "#475569",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E2E8F0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
            >
              <RotateCw size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "0.375rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1E293B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            padding: "0.75rem 1.75rem",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
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
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "9999px",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? 700 : 500,
                  border: isSelected ? "1px solid #2563EB" : "1px solid #E2E8F0",
                  backgroundColor: isSelected ? "#2563EB" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#64748B",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 4px rgba(37, 99, 235, 0.2)" : "none",
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
            padding: "1.5rem 1.75rem",
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
                color: "#64748B",
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
                color: "#64748B",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#EFF6FF",
                  color: "#3B82F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Layers size={28} />
              </div>
              <h4 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem", fontWeight: 700, color: "#1E293B" }}>
                No Timeline Logs Found
              </h4>
              <p style={{ margin: "0", fontSize: "0.85rem", color: "#64748B" }}>
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
                        color: "#1E293B",
                        backgroundColor: "#F1F5F9",
                        padding: "0.2rem 0.65rem",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {groupTitle}
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                  </div>

                  {/* Events in this group */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      paddingLeft: "0.5rem",
                      borderLeft: "2px solid #E2E8F0",
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
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: "0.75rem",
                            padding: "0.875rem 1.15rem",
                            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                            marginLeft: "0.75rem",
                            position: "relative",
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
                              boxShadow: "0 0 0 2px #E2E8F0",
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
                                padding: "0.15rem 0.55rem",
                                borderRadius: "0.375rem",
                              }}
                            >
                              {cfg.icon}
                              {cfg.label}
                            </span>

                            {formattedTime && (
                              <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                                {formattedTime}
                              </span>
                            )}
                          </div>

                          <p
                            style={{
                              margin: "0 0 0.35rem",
                              fontSize: "0.88rem",
                              fontWeight: 500,
                              color: "#1E293B",
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
                              color: "#64748B",
                            }}
                          >
                            {user && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <User size={13} color="#94A3B8" />
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
            padding: "0.875rem 1.75rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
            Real-time chronological events from Fleet Timeline MS
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
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
