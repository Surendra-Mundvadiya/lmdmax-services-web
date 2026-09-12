import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Truck,
  Wrench,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  DriversStatusSummary,
  VehiclesStatusSummary,
  VehiclesDamageBreakdown,
  InspectionsAlertsSummary,
} from "../../../api/unifiedDashboardApi";

interface Props {
  drivers?: DriversStatusSummary;
  vehicles?: VehiclesStatusSummary;
  damage?: VehiclesDamageBreakdown;
  inspections?: InspectionsAlertsSummary;
  isLoading?: boolean;
}

export const Tier1FleetHealth: FC<Props> = ({
  drivers,
  vehicles,
  damage,
  inspections,
  isLoading,
}) => {
  const navigate = useNavigate();

  const totalDrivers = drivers?.totalDrivers || 0;
  const activeDrivers = drivers?.activeDrivers || 0;
  const inactiveDrivers = drivers?.inactiveDrivers || 0;

  const totalVehicles = vehicles?.totalVehicles || 0;
  const activeVehicles = vehicles?.activeVehicles || 0;
  const inactiveVehicles = vehicles?.inactiveVehicles || 0;

  const noDamage = damage?.noDamage || 0;
  const inShop = damage?.inShop || 0;
  const grounded = damage?.grounded || 0;
  const severelyDamaged = damage?.severelyDamaged || 0;

  const totalAlerts = inspections?.totalAlerts || 0;
  const criticalFailures = inspections?.criticalFailures || 0;
  const pendingReviews = inspections?.pendingReviews || 0;

  return (
    <div>
      <div className="uop-tier-header">
        <div className="uop-tier-title-wrap">
          <span className="uop-tier-tag">Tier 1</span>
          <h2 className="uop-tier-title">Real-Time Fleet & Inspection Health</h2>
        </div>
        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>
          Live Asset Telemetry
        </span>
      </div>

      <div className="uop-tier1-grid">
        {/* 1. Driver Headcount */}
        <div
          className="uop-card clickable"
          onClick={() => navigate("/operations?tab=drivers")}
          title="Click to view driver roster and status filters"
        >
          <div className="uop-card-header">
            <h3 className="uop-card-title">
              <span>Driver Headcount</span>
            </h3>
            <div className="uop-card-icon blue">
              <Users size={18} />
            </div>
          </div>

          <div className="uop-card-value">
            {isLoading ? <div className="uop-skeleton" style={{ width: 80, height: 32 }} /> : totalDrivers}
          </div>

          <div className="uop-sub-badges-row">
            <span
              className="uop-sub-badge active-green"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/operations?tab=drivers&status=active");
              }}
              title="Filter active drivers"
            >
              <CheckCircle2 size={11} />
              {activeDrivers} Active
            </span>
            <span
              className="uop-sub-badge inactive-grey"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/operations?tab=drivers&status=inactive");
              }}
              title="Filter inactive drivers"
            >
              {inactiveDrivers} Inactive
            </span>
          </div>

          <div className="uop-card-footer">
            <span>Roster Deployment</span>
            <span className="uop-card-link-hint">
              <span>Manage Drivers</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* 2. Fleet Inventory & Active Vehicle Condition (Unified Single Card) */}
        <div
          className="uop-card uop-fleet-combined-card clickable"
          onClick={() => navigate("/fleet/vehicle-inspection")}
          title="Click to view fleet vehicles inventory & condition"
        >
          <div className="uop-card-header">
            <h3 className="uop-card-title">
              <span>Fleet Inventory & Vehicle Condition</span>
            </h3>
            <div className="uop-card-icon emerald">
              <Truck size={18} />
            </div>
          </div>

          <div className="uop-combined-fleet-body">
            {/* Left: Inventory Counts */}
            <div className="uop-combined-inventory-section">
              <div className="uop-split-metric">
                <div className="uop-split-col">
                  <span className="uop-split-label">Total</span>
                  <span className="uop-split-number">
                    {isLoading ? <div className="uop-skeleton" style={{ width: 40, height: 24 }} /> : totalVehicles}
                  </span>
                </div>
                <div className="uop-split-col">
                  <span className="uop-split-label">Active</span>
                  <span className="uop-split-number active">
                    {isLoading ? <div className="uop-skeleton" style={{ width: 40, height: 24 }} /> : activeVehicles}
                  </span>
                </div>
                <div className="uop-split-col">
                  <span className="uop-split-label">Inactive</span>
                  <span className="uop-split-number inactive">
                    {isLoading ? <div className="uop-skeleton" style={{ width: 40, height: 24 }} /> : inactiveVehicles}
                  </span>
                </div>
              </div>
            </div>

            {/* Subtle Vertical Divider */}
            <div className="uop-combined-divider" />

            {/* Right: Active Vehicle Condition Breakdown */}
            <div className="uop-combined-condition-section">
              <div className="uop-condition-header-label">
                <Wrench size={12} style={{ color: "#D97706" }} />
                <span>Active Vehicle Condition</span>
              </div>
              <div className="uop-condition-grid">
                <div
                  className="uop-condition-segment green"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/fleet/reports?filter=no_damage");
                  }}
                  title="Filter No Damage"
                >
                  <span className="val">{noDamage}</span>
                  <span className="lbl">No Damage</span>
                </div>
                <div
                  className="uop-condition-segment amber"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/fleet/reports?filter=in_shop");
                  }}
                  title="Filter In-Shop"
                >
                  <span className="val">{inShop}</span>
                  <span className="lbl">In-Shop</span>
                </div>
                <div
                  className="uop-condition-segment coral"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/fleet/reports?filter=grounded");
                  }}
                  title="Filter Grounded"
                >
                  <span className="val">{grounded}</span>
                  <span className="lbl">Grounded</span>
                </div>
                <div
                  className="uop-condition-segment crimson"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/fleet/reports?filter=severe");
                  }}
                  title="Filter Severe"
                >
                  <span className="val">{severelyDamaged}</span>
                  <span className="lbl">Severe</span>
                </div>
              </div>
            </div>
          </div>

          <div className="uop-card-footer">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span>
                {totalVehicles > 0 ? `${Math.round((activeVehicles / totalVehicles) * 100)}% Operational` : "Fleet Ready"}
              </span>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span style={{ color: grounded + inShop + severelyDamaged > 0 ? "#DC2626" : "#64748B", fontWeight: 600 }}>
                {grounded + inShop + severelyDamaged} Need Attention
              </span>
            </div>
            <span className="uop-card-link-hint">
              <span>Inspect & Maintenance</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>

        {/* 4. Inspection Alerts (Critical Action Card) */}
        <div
          className="uop-card clickable"
          onClick={() => navigate("/fleet/driver-inspection")}
          title="Click to resolve pending inspection alerts"
          style={{
            borderColor: criticalFailures > 0 ? "#FECACA" : "#E2E8F0",
            backgroundColor: criticalFailures > 0 ? "#FFF5F5" : "#FFFFFF",
          }}
        >
          <div className="uop-card-header">
            <h3 className="uop-card-title">
              <span style={{ color: criticalFailures > 0 ? "#DC2626" : "inherit" }}>
                Inspection Alerts
              </span>
            </h3>
            <div className={`uop-card-icon ${criticalFailures > 0 ? "red" : "blue"}`}>
              {criticalFailures > 0 ? <AlertOctagon size={18} /> : <ShieldCheck size={18} />}
            </div>
          </div>

          <div className="uop-card-value" style={{ color: criticalFailures > 0 ? "#DC2626" : "#0F172A" }}>
            {isLoading ? <div className="uop-skeleton" style={{ width: 60, height: 32 }} /> : totalAlerts}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.725rem",
                fontWeight: 700,
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: criticalFailures > 0 ? "#FEE2E2" : "#ECFDF5",
                color: criticalFailures > 0 ? "#991B1B" : "#065F46",
                border: criticalFailures > 0 ? "1px solid #FECACA" : "1px solid #A7F3D0",
              }}
            >
              {criticalFailures} Critical Failures
            </span>
            <span style={{ fontSize: "0.725rem", color: "#64748B" }}>
              {pendingReviews} In Review
            </span>
          </div>

          <div className="uop-card-footer">
            <span>Daily DVIC Compliance</span>
            <span className="uop-card-link-hint" style={{ color: criticalFailures > 0 ? "#DC2626" : "#2563EB" }}>
              <span>Action Alerts</span>
              <ChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
