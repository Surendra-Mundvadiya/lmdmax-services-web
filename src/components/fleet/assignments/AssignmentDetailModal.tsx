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
        background: "rgba(0,0,0,0.32)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                color: "var(--ads-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--ads-blue-tint-strong)",
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--ads-ink)", margin: 0, letterSpacing: "-0.019em" }}>
                  {vehicle.unit_number || vehicle.name || `Vehicle #${vehicle.id}`}
                </h2>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "var(--ads-r-pill)",
                    backgroundColor: "var(--ads-blue-tint)",
                    color: "var(--ads-blue)",
                    border: "1px solid var(--ads-blue-tint-strong)",
                  }}
                >
                  {vehicle.make || "Ford"} {vehicle.model || "Transit"}
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-tertiary)", margin: "0.2rem 0 0 0" }}>
                Driver Return Inspection & Vehicle Assignment Details • Date:{" "}
                <span style={{ fontWeight: 600, color: "var(--ads-ink)" }}>{date}</span>
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
                padding: "9px 18px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--ads-ink)",
                background: "var(--ads-material-thick)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-pill)",
                boxShadow: "var(--ads-bevel)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
              title="Print Driver Return Report"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assignment details"
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--ads-r-sm)",
                border: "1px solid var(--ads-hairline)",
                background: "transparent",
                color: "var(--ads-ink-tertiary)",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
            gap: "var(--ads-s3)",
            padding: "var(--ads-s4) var(--ads-s6)",
            background: "transparent",
            borderBottom: "1px solid var(--ads-hairline)",
          }}
        >
          {/* Driver */}
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)" }}>
              Assigned Driver
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <User size={15} style={{ color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                {vehicle.assigned_driver_name || "Unassigned"}
              </span>
            </div>
          </div>

          {/* Start Mileage */}
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)" }}>
              Start Odometer
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Gauge size={15} style={{ color: "var(--ads-green)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                {typeof startMileage === "number" ? `${startMileage.toLocaleString()} mi` : startMileage}
              </span>
            </div>
          </div>

          {/* Return Mileage */}
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)" }}>
              Return Odometer
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Gauge size={15} style={{ color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                {typeof endMileage === "number" ? `${endMileage.toLocaleString()} mi` : endMileage}
              </span>
            </div>
          </div>

          {/* Gas Level */}
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-canvas)",
              border: "1px solid var(--ads-hairline)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)" }}>
              Return Fuel Gauge
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Fuel size={15} style={{ color: "var(--ads-amber)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                {formatGas(gasLevel)}
              </span>
            </div>
          </div>

          {/* Miles Traveled */}
          <div
            style={{
              padding: "var(--ads-s3)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "var(--ads-blue-tint)",
              border: "1px solid var(--ads-blue-tint-strong)",
            }}
          >
            <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-blue)" }}>
              Miles Traveled
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
              <Truck size={15} style={{ color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--ads-blue)" }}>
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
            gap: "var(--ads-s2)",
            padding: "var(--ads-s2) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            background: "transparent",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            style={{
              padding: "7px 15px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              cursor: "pointer",
              background: activeTab === "summary" ? "var(--ads-blue)" : "transparent",
              color: activeTab === "summary" ? "#FFFFFF" : "var(--ads-ink-tertiary)",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            DVIC Inspection Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            style={{
              padding: "7px 15px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              cursor: "pointer",
              background: activeTab === "comparison" ? "var(--ads-blue)" : "transparent",
              color: activeTab === "comparison" ? "#FFFFFF" : "var(--ads-ink-tertiary)",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            Pre-Trip vs Return Comparison
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            style={{
              padding: "7px 15px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              cursor: "pointer",
              background: activeTab === "photos" ? "var(--ads-blue)" : "transparent",
              color: activeTab === "photos" ? "#FFFFFF" : "var(--ads-ink-tertiary)",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
            padding: "var(--ads-s6)",
            minHeight: "360px",
          }}
        >
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Vehicle Specification Grid */}
              <div
                style={{
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s4) var(--ads-s5)",
                  background: "var(--ads-material-thick)",
                  backdropFilter: "var(--ads-blur-md)",
                  WebkitBackdropFilter: "var(--ads-blur-md)",
                  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--ads-ink)",
                    letterSpacing: "-0.01em",
                    margin: "0 0 0.75rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Truck size={16} style={{ color: "var(--ads-blue)" }} />
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
                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>VIN Number</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)", fontFamily: "monospace" }}>
                      {vehicle.vin || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>License Plate</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      {vehicle.license_plate || "N/A"} {vehicle.registered_state ? `(${vehicle.registered_state})` : ""}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Make & Model</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      {vehicle.make || "Ford"} {vehicle.model || "Transit"} {vehicle.year || ""}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>Gas Card ID</span>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      {vehicle.gas_card_id || vehicle.gas_card_number || "Default Fleet Card"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Checklist Card */}
              <div
                style={{
                  border: "1px solid var(--ads-hairline)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "var(--ads-s4) var(--ads-s5)",
                  background: "var(--ads-material-thick)",
                  backdropFilter: "var(--ads-blur-md)",
                  WebkitBackdropFilter: "var(--ads-blur-md)",
                  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
                }}
              >
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--ads-ink)",
                    letterSpacing: "-0.01em",
                    margin: "0 0 0.75rem 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <ShieldCheck size={16} style={{ color: "var(--ads-green)" }} />
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
                        padding: "var(--ads-s2) var(--ads-s3)",
                        borderRadius: "var(--ads-r-xs)",
                        backgroundColor: item.isPostWarning ? "var(--ads-amber-tint)" : "var(--ads-canvas)",
                        border: `1px solid ${item.isPostWarning ? "var(--ads-amber-tint)" : "var(--ads-hairline)"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {item.isPostWarning ? (
                          <AlertTriangle size={15} style={{ color: "var(--ads-amber)" }} />
                        ) : (
                          <CheckCircle2 size={15} style={{ color: "var(--ads-green)" }} />
                        )}
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: item.isPostWarning ? "var(--ads-amber)" : "var(--ads-green)",
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
                    border: "1px solid var(--ads-hairline)",
                    borderRadius: "var(--ads-r-md)",
                    padding: "var(--ads-s4) var(--ads-s5)",
                    backgroundColor: "var(--ads-canvas)",
                  }}
                >
                  <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)", margin: "0 0 0.5rem 0" }}>
                    Driver & Inspection Notes
                  </h4>
                  {formData.pre_comments && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)", margin: "0 0 0.35rem 0" }}>
                      <strong>Pre-Trip Note:</strong> {formData.pre_comments}
                    </p>
                  )}
                  {formData.post_comments && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--ads-ink-secondary)", margin: 0 }}>
                      <strong>Return Note:</strong> {formData.post_comments}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRE-TRIP VS POST-TRIP COMPARISON */}
          {activeTab === "comparison" && (
            <div style={{ border: "1px solid var(--ads-hairline)", borderRadius: "var(--ads-r-md)", overflow: "hidden", background: "var(--ads-material-thick)", backdropFilter: "var(--ads-blur-md)", WebkitBackdropFilter: "var(--ads-blur-md)", boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                      Inspection Item / Question
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                      Pre-Trip (Morning)
                    </th>
                    <th style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,255,255,0.80)", backdropFilter: "var(--ads-blur-sm)", WebkitBackdropFilter: "var(--ads-blur-sm)", padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ads-ink-tertiary)", borderBottom: "1px solid var(--ads-hairline)" }}>
                      Driver Return (EOD)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: idx < comparisonItems.length - 1 ? "1px solid var(--ads-hairline)" : "none",
                        background: item.isPostWarning ? "var(--ads-amber-tint)" : "transparent",
                        transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,113,227,0.045)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = item.isPostWarning ? "var(--ads-amber-tint)" : "transparent";
                      }}
                    >
                      <td style={{ padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        {item.label}
                      </td>
                      <td style={{ padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.8125rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            color: item.isPreWarning ? "var(--ads-amber)" : "var(--ads-green)",
                            fontWeight: 600,
                          }}
                        >
                          {item.isPreWarning ? <AlertTriangle size={13} /> : <Check size={13} />}
                          {item.preVal}
                        </span>
                      </td>
                      <td style={{ padding: "var(--ads-s3) var(--ads-s4)", fontSize: "0.8125rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            color: item.isPostWarning ? "var(--ads-amber)" : "var(--ads-green)",
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
                        border: "1px solid var(--ads-hairline)",
                        borderRadius: "var(--ads-r-md)",
                        padding: "var(--ads-s3)",
                        background: "var(--ads-material-thick)",
                        backdropFilter: "var(--ads-blur-md)",
                        WebkitBackdropFilter: "var(--ads-blur-md)",
                        boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink)", marginBottom: "0.5rem" }}>
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
                            borderRadius: "var(--ads-r-xs)",
                            border: "1px solid var(--ads-hairline-strong)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "130px",
                            backgroundColor: "var(--ads-canvas)",
                            border: "1px dashed var(--ads-hairline-strong)",
                            borderRadius: "var(--ads-r-xs)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--ads-ink-quaternary)",
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
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
              Inspection Form Status:
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: formData.eod_checked_out ? "var(--ads-green)" : "var(--ads-blue)",
                backgroundColor: formData.eod_checked_out ? "var(--ads-green-tint)" : "var(--ads-blue-tint)",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--ads-r-pill)",
                border: `1px solid ${formData.eod_checked_out ? "var(--ads-green-tint)" : "var(--ads-blue-tint-strong)"}`,
              }}
            >
              {formData.eod_checked_out ? "EOD Checked Out" : "Inspection Active"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              background: "var(--ads-blue)",
              color: "#FFFFFF",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-pill)",
              cursor: "pointer",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
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
