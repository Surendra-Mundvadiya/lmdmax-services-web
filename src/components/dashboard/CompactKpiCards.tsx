import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Truck,
  PhoneCall,
  AlertOctagon,
  ShieldCheck,
  Package,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  DriversStatusSummary,
  VehiclesStatusSummary,
  VehiclesDamageBreakdown,
  InspectionsAlertsSummary,
  AttendanceCalloutsSummary,
  DeliveryMetricsSummary,
} from "../../api/unifiedDashboardApi";

interface Props {
  drivers?: DriversStatusSummary;
  vehicles?: VehiclesStatusSummary;
  damage?: VehiclesDamageBreakdown;
  inspections?: InspectionsAlertsSummary;
  callouts?: AttendanceCalloutsSummary;
  deliveryMetrics?: DeliveryMetricsSummary;
  isLoading?: boolean;
}

export const CompactKpiCards: FC<Props> = ({
  drivers,
  vehicles,
  damage,
  inspections,
  callouts,
  deliveryMetrics,
  isLoading,
}) => {
  const navigate = useNavigate();

  // Drivers
  const totalDrivers = drivers?.totalDrivers || 0;
  const activeDrivers = drivers?.activeDrivers || 0;
  const inactiveDrivers = drivers?.inactiveDrivers || 0;

  // Vehicles
  const totalVehicles = vehicles?.totalVehicles || 0;
  const activeVehicles = vehicles?.activeVehicles || 0;
  const inactiveVehicles = vehicles?.inactiveVehicles || 0;
  const noDamage = damage?.noDamage || 0;
  const inShop = damage?.inShop || 0;
  const grounded = damage?.grounded || 0;
  const severelyDamaged = damage?.severelyDamaged || 0;

  // Callouts
  const totalCallouts = callouts?.totalCallouts || 0;
  const excused = callouts?.excused || 0;
  const unexcused = callouts?.unexcused || 0;

  // Inspections
  const totalAlerts = inspections?.totalAlerts || 0;
  const criticalFailures = inspections?.criticalFailures || 0;
  const pendingReviews = inspections?.pendingReviews || 0;

  // Delivery
  const totalDelivered = deliveryMetrics?.totalDelivered || 0;
  const target = deliveryMetrics?.target || 0;
  const completionRate = target > 0 ? Math.round((totalDelivered / target) * 100) : (deliveryMetrics?.completionRate || 0);

  return (
    <div className="uop-compact-kpi-grid">
      {/* 1. Drivers KPI Card (1x) - ALWAYS beside Vehicles */}
      <div
        className="uop-card uop-compact-kpi-card drivers-card clickable"
        onClick={() => navigate("/operations?tab=drivers")}
        title="View driver roster"
      >
        <div className="uop-compact-header">
          <span className="uop-compact-title">Drivers</span>
          <div className="uop-compact-icon blue">
            <Users size={15} />
          </div>
        </div>

        <div className="uop-compact-value">
          {isLoading ? <div className="uop-skeleton" style={{ width: 48, height: 26 }} /> : totalDrivers}
        </div>

        <div className="uop-compact-pills">
          <span
            className="uop-compact-pill green"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/operations?tab=drivers&status=active");
            }}
          >
            <CheckCircle2 size={10} />
            {activeDrivers} Active
          </span>
          <span
            className="uop-compact-pill"
            style={{
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate("/operations?tab=drivers&status=inactive");
            }}
          >
            {inactiveDrivers} Inactive
          </span>
        </div>

        <div className="uop-compact-footer">
          <span />
          <span className="uop-card-link-hint">
            <span>Roster</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* 2. Vehicles KPI Card (2x - DOUBLE SIZE) - ALWAYS beside Drivers */}
      <div
        className="uop-card uop-compact-kpi-card double-size clickable"
        onClick={() => navigate("/fleet/vehicle-inspection")}
        title="View fleet inventory and active condition breakdown"
      >
        <div className="uop-compact-header">
          <span className="uop-compact-title">Vehicles</span>
          <div className="uop-compact-icon emerald">
            <Truck size={15} />
          </div>
        </div>

        <div className="uop-double-vehicle-body">
          {/* Left: Total count & Inactive pill */}
          <div className="uop-double-vehicle-left">
            <div className="uop-compact-value" style={{ margin: 0 }}>
              {isLoading ? <div className="uop-skeleton" style={{ width: 48, height: 26 }} /> : totalVehicles}
            </div>
            <div style={{ marginTop: "0.35rem" }}>
              <span
                className="uop-compact-pill"
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  fontWeight: 700,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/vehicle-inspection?status=inactive");
                }}
                title="Inactive Vehicles"
              >
                {inactiveVehicles} Inactive
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="uop-double-vehicle-divider" />

          {/* Right: Active Vehicles Header with all sub-categories directly under it */}
          <div className="uop-double-vehicle-active-section">
            <div className="uop-vehicle-active-header">
              <span
                className="uop-compact-pill green"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/vehicle-inspection?status=active");
                }}
                title="Filter active vehicles"
              >
                <CheckCircle2 size={10} />
                {activeVehicles} Active Vehicles
              </span>
              <span style={{ fontSize: "0.625rem", color: "#64748B", fontWeight: 600 }}>
                Condition Breakdown
              </span>
            </div>

            {/* Sub-categories under Active Vehicles: No damage, In-Shop (gray), Grounded, Severe */}
            <div className="uop-compact-condition-row" style={{ marginTop: "0.3rem", marginBottom: 0 }}>
              <span
                className="uop-condition-chip green"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/reports?filter=no_damage");
                }}
                title="No Damage"
              >
                <strong>{noDamage}</strong> No damage
              </span>
              <span
                className="uop-condition-chip"
                style={{
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                  border: "1px solid #CBD5E1",
                  fontWeight: 600,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/reports?filter=in_shop");
                }}
                title="In-Shop"
              >
                <strong>{inShop}</strong> In-Shop
              </span>
              <span
                className="uop-condition-chip coral"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/reports?filter=grounded");
                }}
                title="Grounded"
              >
                <strong>{grounded}</strong> Grounded
              </span>
              <span
                className="uop-condition-chip crimson"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/fleet/reports?filter=severe");
                }}
                title="Severe Damage"
              >
                <strong>{severelyDamaged}</strong> Severe
              </span>
            </div>
          </div>
        </div>

        <div className="uop-compact-footer">
          <span style={{ fontSize: "0.6875rem", color: "#64748B" }}>
            {totalVehicles > 0 ? `${Math.round((activeVehicles / totalVehicles) * 100)}% Active` : "Fleet Ready"}
          </span>
          <span className="uop-card-link-hint">
            <span>Vehicles</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* 3. Inspection Alerts KPI Card (1x) */}
      <div
        className="uop-card uop-compact-kpi-card clickable"
        onClick={() => navigate("/fleet/driver-inspection")}
        title="View inspection alerts"
        style={{
          borderColor: criticalFailures > 0 ? "#FECACA" : "#E2E8F0",
          backgroundColor: criticalFailures > 0 ? "#FFF8F8" : "#FFFFFF",
        }}
      >
        <div className="uop-compact-header">
          <span
            className="uop-compact-title"
            style={{ color: criticalFailures > 0 ? "#DC2626" : "inherit" }}
          >
            Inspection Alerts
          </span>
          <div className={`uop-compact-icon ${criticalFailures > 0 ? "red" : "blue"}`}>
            {criticalFailures > 0 ? <AlertOctagon size={15} /> : <ShieldCheck size={15} />}
          </div>
        </div>

        <div
          className="uop-compact-value"
          style={{ color: criticalFailures > 0 ? "#DC2626" : "#0F172A" }}
        >
          {isLoading ? <div className="uop-skeleton" style={{ width: 40, height: 26 }} /> : totalAlerts}
        </div>

        <div className="uop-compact-pills">
          <span
            className="uop-compact-pill"
            style={{
              backgroundColor: criticalFailures > 0 ? "#FEF2F2" : "#ECFDF5",
              color: criticalFailures > 0 ? "#DC2626" : "#059669",
              border: criticalFailures > 0 ? "1px solid #FECACA" : "1px solid #A7F3D0",
              fontWeight: 700,
            }}
          >
            {criticalFailures} Critical
          </span>
          <span style={{ fontSize: "0.6875rem", color: "#64748B", fontWeight: 600 }}>
            {pendingReviews} Review
          </span>
        </div>

        <div className="uop-compact-footer">
          <span />
          <span
            className="uop-card-link-hint"
            style={{ color: criticalFailures > 0 ? "#DC2626" : "#2563EB" }}
          >
            <span>Inspections</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* 4. Callouts KPI Card (1x) */}
      <div
        className="uop-card uop-compact-kpi-card clickable"
        onClick={() => navigate("/operations?tab=callout")}
        title="View callout notices"
      >
        <div className="uop-compact-header">
          <span className="uop-compact-title">Callouts</span>
          <div className={`uop-compact-icon ${totalCallouts > 0 ? "amber" : "emerald"}`}>
            <PhoneCall size={15} />
          </div>
        </div>

        <div
          className="uop-compact-value"
          style={{ color: totalCallouts > 0 ? "#D97706" : "#0F172A" }}
        >
          {isLoading ? <div className="uop-skeleton" style={{ width: 40, height: 26 }} /> : totalCallouts}
        </div>

        <div className="uop-compact-pills">
          <span className="uop-compact-pill blue">
            {excused} Excused
          </span>
          <span
            className="uop-compact-pill"
            style={{
              backgroundColor: unexcused > 0 ? "#FEF2F2" : "#F8FAFC",
              color: unexcused > 0 ? "#DC2626" : "#64748B",
              border: unexcused > 0 ? "1px solid #FECACA" : "1px solid #E2E8F0",
              fontWeight: 700,
            }}
          >
            {unexcused > 0 && <AlertTriangle size={10} />}
            {unexcused} Unexcused
          </span>
        </div>

        <div className="uop-compact-footer">
          <span />
          <span className="uop-card-link-hint">
            <span>Callouts</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* 5. Delivery Volume KPI Card (1x) */}
      <div
        className="uop-card uop-compact-kpi-card clickable"
        onClick={() => navigate("/performance/reports?report=driver_rating_report")}
        title="View delivery volume"
      >
        <div className="uop-compact-header">
          <span className="uop-compact-title">Deliveries</span>
          <div className="uop-compact-icon blue">
            <Package size={15} />
          </div>
        </div>

        <div className="uop-compact-value">
          {isLoading ? (
            <div className="uop-skeleton" style={{ width: 48, height: 26 }} />
          ) : (
            <>
              {totalDelivered.toLocaleString()}
              <span style={{ fontSize: "0.8125rem", color: "#64748B", fontWeight: 500 }}>
                {" "}/{target.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="uop-compact-progress-wrap">
          <div
            className="uop-compact-progress-fill"
            style={{ width: `${Math.min(completionRate, 100)}%` }}
          />
        </div>

        <div className="uop-compact-footer">
          <span style={{ color: "#059669", fontWeight: 700, fontSize: "0.6875rem" }}>
            {completionRate}% Delivered
          </span>
          <span className="uop-card-link-hint">
            <span>Deliveries</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompactKpiCards;
