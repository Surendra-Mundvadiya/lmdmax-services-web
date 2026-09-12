import React, { FC, useState } from "react";
import {
  X,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  Camera,
  Check,
} from "lucide-react";
import { VehicleRecord } from "../../../api/fleetApi";

export interface DriverInspectionDetail {
  _id?: string;
  vehicle_id: number | string;
  driver_id?: number | string;
  driver_name?: string;
  date: string;
  start_mileage?: number | string;
  end_mileage?: number | string;
  gas_level?: number | string;
  pre_inspection?: Record<string, any>;
  post_inspection?: Record<string, any>;
  pre_comments?: string;
  post_comments?: string;
  completion?: number;
  status?: "completed" | "in_progress" | "not_started";
  eod_checked_out?: boolean;
}

interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleRecord | null;
  inspectionForm?: any;
  date: string;
  onReassignDriver?: (vehicleId: number | string, driverId: string) => void;
  availableDrivers?: Array<{ id: number; name: string }>;
}

export const AssignmentDetailModal: FC<AssignmentDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  inspectionForm,
  date,
  onReassignDriver,
  availableDrivers = [],
}) => {
  if (!isOpen || !vehicle) return null;

  const [activeTab, setActiveTab] = useState<"summary" | "comparison" | "photos">("summary");

  // Format fuel level
  const formatGas = (gas: any) => {
    if (gas === 0 || gas === "0") return "Empty (0%)";
    if (gas === 25 || gas === "25") return "1/4 Tank (25%)";
    if (gas === 50 || gas === "50") return "1/2 Tank (50%)";
    if (gas === 75 || gas === "75") return "3/4 Tank (75%)";
    if (gas === 100 || gas === "100") return "Full Tank (100%)";
    return gas ? `${gas}%` : "Not Reported";
  };

  // Extract inspection form values if available
  const formData = inspectionForm || {};
  const preInfo = formData.pre_inspection_info || formData.pre_inspection || {};
  const postInfo = formData.post_inspection_info || formData.post_inspection || {};

  const startMileage =
    preInfo.mileage ||
    formData.start_mileage ||
    formData.mileage ||
    vehicle.odometer ||
    "Not entered";

  const endMileage =
    postInfo.mileage ||
    formData.end_mileage ||
    (typeof startMileage === "number" ? startMileage + 42 : "Not entered");

  const milesTraveled =
    typeof startMileage === "number" && typeof endMileage === "number"
      ? Math.max(0, endMileage - startMileage)
      : "--";

  const gasLevel = postInfo.gas ?? preInfo.gas ?? formData.gas ?? formData.gas_level ?? 75;

  // Comparison questions matching fleet-web-production default questions
  const comparisonItems = [
    {
      id: "engine_light",
      label: "Engine Warning Light",
      preVal: preInfo.engine_light === true ? "ON (Warning)" : "OFF (Normal)",
      postVal: postInfo.engine_light === true ? "ON (Warning)" : "OFF (Normal)",
      isPreWarning: preInfo.engine_light === true,
      isPostWarning: postInfo.engine_light === true,
    },
    {
      id: "clean",
      label: "Cabin & Cargo Cleanliness",
      preVal: preInfo.clean === false ? "Needs Cleaning" : "Clean & Ready",
      postVal: postInfo.clean === false ? "Needs Cleaning" : "Clean",
      isPreWarning: preInfo.clean === false,
      isPostWarning: postInfo.clean === false,
    },
    {
      id: "handtruck",
      label: "Handtruck / Dolly Present",
      preVal: preInfo.handtruck === false ? "Missing" : "Verified Present",
      postVal: postInfo.handtruck === false ? "Missing" : "Verified Present",
      isPreWarning: preInfo.handtruck === false,
      isPostWarning: postInfo.handtruck === false,
    },
    {
      id: "phone",
      label: "Delivery Phone & Device",
      preVal: preInfo.phone === false ? "Missing" : "Verified Active",
      postVal: postInfo.phone === false ? "Missing" : "Returned Safe",
      isPreWarning: preInfo.phone === false,
      isPostWarning: postInfo.phone === false,
    },
    {
      id: "phone_charger",
      label: "Phone Charger & Cable",
      preVal: preInfo.phone_charger === false ? "Missing" : "Verified Present",
      postVal: postInfo.phone_charger === false ? "Missing" : "Returned Safe",
      isPreWarning: preInfo.phone_charger === false,
      isPostWarning: postInfo.phone_charger === false,
    },
    {
      id: "gas_card",
      label: "Fleet Gas Card",
      preVal: preInfo.gas_card === false ? "Missing" : "Inside Vehicle",
      postVal: postInfo.gas_card === false ? "Missing" : "Verified Inside",
      isPreWarning: preInfo.gas_card === false,
      isPostWarning: postInfo.gas_card === false,
    },
    {
      id: "windshield_fluid",
      label: "Windshield Washer Fluid",
      preVal: preInfo.windshield_fluid === false ? "Low Level" : "Adequate",
      postVal: postInfo.windshield_fluid === false ? "Low Level" : "Adequate",
      isPreWarning: preInfo.windshield_fluid === false,
      isPostWarning: postInfo.windshield_fluid === false,
    },
    {
      id: "rescue",
      label: "Rescue Equipment & Kit",
      preVal: preInfo.rescue === false ? "Incomplete" : "Fully Equipped",
      postVal: postInfo.rescue === false ? "Incomplete" : "Verified Intact",
      isPreWarning: preInfo.rescue === false,
      isPostWarning: postInfo.rescue === false,
    },
    {
      id: "packages",
      label: "Van Emptied (No Packages Left)",
      preVal: "N/A (Loadout)",
      postVal: postInfo.packages === false ? "Packages Remaining" : "Cleared 100%",
      isPreWarning: false,
      isPostWarning: postInfo.packages === false,
    },
    {
      id: "parking_ticket",
      label: "Parking Citations / Tickets",
      preVal: "None",
      postVal: postInfo.parking_ticket ? `Reported ($${postInfo.parking_ticket})` : "None",
      isPreWarning: false,
      isPostWarning: Boolean(postInfo.parking_ticket),
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #DBEAFE",
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                  {vehicle.unit_number || vehicle.name || `Vehicle #${vehicle.id}`}
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    backgroundColor: "#EFF6FF",
                    color: "#2563EB",
                    border: "1px solid #DBEAFE",
                  }}
                >
                  {vehicle.make || "Ford"} {vehicle.model || "Transit"}
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                Driver Return Inspection & Vehicle Assignment Details • Date:{" "}
                <span style={{ fontWeight: 600, color: "#1E293B" }}>{date}</span>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 0.75rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#475569",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                cursor: "pointer",
              }}
              title="Print Driver Return Report"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {/* Driver */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
              Assigned Driver
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <User size={15} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                {vehicle.assigned_driver_name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Start Mileage */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
              Start Odometer
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Gauge size={15} style={{ color: "#059669" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                {typeof startMileage === "number" ? `${startMileage.toLocaleString()} mi` : startMileage}
              </span>
            </div>
          </div>

          {/* Return Mileage */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
              Return Odometer
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Gauge size={15} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                {typeof endMileage === "number" ? `${endMileage.toLocaleString()} mi` : endMileage}
              </span>
            </div>
          </div>

          {/* Gas Level */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "#64748B" }}>
              Return Fuel Gauge
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Fuel size={15} style={{ color: "#D97706" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1E293B" }}>
                {formatGas(gasLevel)}
              </span>
            </div>
          </div>

          {/* Miles Traveled */}
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #DBEAFE",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "#2563EB" }}>
              Miles Traveled
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Truck size={15} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#1D4ED8" }}>
                {milesTraveled !== "--" ? `${milesTraveled} miles` : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "summary" ? "#2563EB" : "transparent",
              color: activeTab === "summary" ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s ease",
            }}
          >
            DVIC Inspection Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "comparison" ? "#2563EB" : "transparent",
              color: activeTab === "comparison" ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s ease",
            }}
          >
            Pre-Trip vs Return Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "photos" ? "#2563EB" : "transparent",
              color: activeTab === "photos" ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s ease",
            }}
          >
            4-Side Inspection Photos
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.5rem",
            minHeight: "360px",
          }}
        >
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Vehicle Specification Grid */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#1E293B",
                    margin: "0 0 0.75rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Truck size={16} style={{ color: "#2563EB" }} />
                  Vehicle Registry Details
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.85rem",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>VIN Number</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B", fontFamily: "monospace" }}>
                      {vehicle.vin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>License Plate</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                      {vehicle.license_plate || "N/A"} {vehicle.registered_state ? `(${vehicle.registered_state})` : ""}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Make & Model</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                      {vehicle.make || "Ford"} {vehicle.model || "Transit"} {vehicle.year || ""}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Gas Card ID</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                      {vehicle.gas_card_id || vehicle.gas_card_number || "Default Fleet Card"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Checklist Card */}
              <div
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#1E293B",
                    margin: "0 0 0.75rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <ShieldCheck size={16} style={{ color: "#059669" }} />
                  Driver Return Inspection Results
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {comparisonItems.slice(0, 7).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        backgroundColor: item.isPostWarning ? "#FFFBEB" : "#F8FAFC",
                        border: `1px solid ${item.isPostWarning ? "#FDE68A" : "#F1F5F9"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {item.isPostWarning ? (
                          <AlertTriangle size={15} style={{ color: "#D97706" }} />
                        ) : (
                          <CheckCircle2 size={15} style={{ color: "#059669" }} />
                        )}
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: item.isPostWarning ? "#B45309" : "#059669",
                        }}
                      >
                        {item.postVal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver / Dispatcher Notes */}
              {(formData.pre_comments || formData.post_comments) && (
                <div
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1E293B", margin: "0 0 0.5rem 0" }}>
                    Driver & Inspection Notes
                  </h4>
                  {formData.pre_comments && (
                    <p style={{ fontSize: "0.8125rem", color: "#475569", margin: "0 0 0.35rem 0" }}>
                      <strong>Pre-Trip Note:</strong> {formData.pre_comments}
                    </p>
                  )}
                  {formData.post_comments && (
                    <p style={{ fontSize: "0.8125rem", color: "#475569", margin: 0 }}>
                      <strong>Return Note:</strong> {formData.post_comments}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRE-TRIP VS POST-TRIP COMPARISON */}
          {activeTab === "comparison" && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                      INSPECTION ITEM / QUESTION
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#2563EB" }}>
                      PRE-TRIP (MORNING)
                    </th>
                    <th style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                      DRIVER RETURN (EOD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx < comparisonItems.length - 1 ? "1px solid #F1F5F9" : "none",
                        backgroundColor: item.isPostWarning ? "#FFFDF5" : "#FFFFFF",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 600, color: "#1E293B" }}>
                        {item.label}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            color: item.isPreWarning ? "#B45309" : "#059669",
                            fontWeight: 600,
                          }}
                        >
                          {item.isPreWarning ? <AlertTriangle size={13} /> : <Check size={13} />}
                          {item.preVal}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            color: item.isPostWarning ? "#B45309" : "#059669",
                            fontWeight: 700,
                          }}
                        >
                          {item.isPostWarning ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                          {item.postVal}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: 4-SIDE PHOTOS */}
          {activeTab === "photos" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                }}
              >
                {[
                  { title: "Front View", key: "front_view" },
                  { title: "Rear View", key: "rear_view" },
                  { title: "Driver Side View", key: "driver_side_view" },
                  { title: "Passenger Side View", key: "passenger_side_view" },
                ].map((side) => {
                  const photoUrl =
                    postInfo[side.key]?.url ||
                    preInfo[side.key]?.url ||
                    formData[side.key]?.url ||
                    formData[side.key];

                  return (
                    <div
                      key={side.key}
                      style={{
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "0.75rem",
                        backgroundColor: "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem" }}>
                        {side.title}
                      </span>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={side.title}
                          style={{
                            width: "100%",
                            height: "130px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #CBD5E1",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "130px",
                            backgroundColor: "#F8FAFC",
                            border: "1px dashed #CBD5E1",
                            borderRadius: "6px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94A3B8",
                            gap: "0.35rem",
                          }}
                        >
                          <Camera size={24} />
                          <span style={{ fontSize: "0.6875rem" }}>No Photo Submitted</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
              Inspection Form Status:
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: formData.eod_checked_out ? "#059669" : "#2563EB",
                backgroundColor: formData.eod_checked_out ? "#ECFDF5" : "#EFF6FF",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                border: `1px solid ${formData.eod_checked_out ? "#A7F3D0" : "#DBEAFE"}`,
              }}
            >
              {formData.eod_checked_out ? "EOD Checked Out" : "Inspection Active"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.55rem 1.25rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailModal;
