import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import GlassAppLayout from "../layout/GlassAppLayout";
import { NavRouteType } from "../layout/AppNavbar";
import {
  MessageSquare,
  BarChart3,
  Truck,
  CalendarDays,
  ArrowLeft,
  Building,
  Users,
  ShieldCheck,
  ChevronRight,
  Cloud,
  Package,
} from "lucide-react";
import { useDriverStore } from "../../store/driverStore";

interface ModuleConfig {
  id: NavRouteType;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgColor: string;
  stats: { label: string; value: string; change?: string }[];
  highlights: string[];
}

const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  chats: {
    id: "chats",
    title: "LMDmax Communications & Chats",
    badge: "Twilio Connected",
    subtitle: "Two-Way Driver Messaging & Broadcast Dispatch",
    description:
      "Send real-time dispatch alerts, route changes, emergency notifications, and receive driver check-ins directly via dedicated station numbers.",
    icon: MessageSquare,
    color: "#2563EB",
    bgColor: "#EFF6FF",
    stats: [
      { label: "Active Threads", value: "24", change: "+4 today" },
      { label: "Delivery Alerts Sent", value: "158", change: "100% delivered" },
      { label: "Driver Response Rate", value: "98.2%", change: "Avg 2.4 min" },
    ],
    highlights: [
      "Station-scoped Twilio broadcast messaging",
      "Automated route dispatch & shift reminders",
      "Two-way SMS with Amazon DSP delivery drivers",
      "Audit logs with read receipts & timestamps",
    ],
  },
  performance: {
    id: "performance",
    title: "LMDmax Performance Intelligence",
    badge: "Scorecard v2.0",
    subtitle: "Driver Analytics, Tier Leaderboards & Safety Scores",
    description:
      "Track Fantastic Plus metrics, CDF (Customer Delivery Feedback), DPMO, Netradyne camera safety events, and driver tier rankings across all stations.",
    icon: BarChart3,
    color: "#1D4ED8",
    bgColor: "#EFF6FF",
    stats: [
      { label: "Station Tier", value: "Fantastic Plus", change: "Top 5% DSP" },
      { label: "Safe Driving Score", value: "942 / 1000", change: "+18 pts" },
      { label: "Active Scorecards", value: "48 Drivers", change: "Weekly audit" },
    ],
    highlights: [
      "Weekly Amazon Logistics scorecard ingestion",
      "Netradyne camera event logging & coaching notes",
      "Tier rankings (Fantastic, Great, Fair, Poor)",
      "Digital driver write-ups with mobile acknowledgment",
    ],
  },
  fleet: {
    id: "fleet",
    title: "LMDmax Fleet Management",
    badge: "Fleet v7.3",
    subtitle: "Daily DVIC Inspections, Van Maintenance & Telematics",
    description:
      "Full vehicle compliance tracking, mandatory pre/post-trip DVIC inspections, AI damage scan history, maintenance repair logs, and registration renewals.",
    icon: Truck,
    color: "#059669",
    bgColor: "#ECFDF5",
    stats: [
      { label: "Vans in Service", value: "38 / 42", change: "4 under maintenance" },
      { label: "DVIC Completed Today", value: "36", change: "100% compliance" },
      { label: "Open Work Orders", value: "3", change: "Oil & tires" },
    ],
    highlights: [
      "Daily pre-trip and post-trip DVIC inspection logs",
      "Damage detection scans with photo verification",
      "Preventative maintenance schedules & odometer tracking",
      "Registration, insurance & DOT compliance records",
    ],
  },
  scheduler: {
    id: "scheduler",
    title: "LMDmax Intelligent Scheduler",
    badge: "ReScript Engine",
    subtitle: "Automated Shift Rostering, Time-Off & Availability",
    description:
      "Generate weekly schedules tailored to forecasted package volumes, handle driver availability, manage shift swaps, and track overtime.",
    icon: CalendarDays,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    stats: [
      { label: "Scheduled Shifts", value: "184", change: "This week" },
      { label: "Roster Coverage", value: "100%", change: "0 open shifts" },
      { label: "Pending Time-Off", value: "2 requests", change: "Needs review" },
    ],
    highlights: [
      "Smart algorithmic shift generation based on historical volume",
      "Driver availability submission via mobile app",
      "Shift swapping & manager approval workflow",
      "Overtime threshold alerts & standby dispatch queue",
    ],
  },
  cloud: {
    id: "dashboard" as NavRouteType,
    title: "LMDmax Cloud Storage",
    badge: "Encrypted Cloud",
    subtitle: "Delivery Station Document Archives & Cloud Assets",
    description:
      "Centralized cloud repository for station agreements, vehicle lease contracts, compliance certs, and operational documentation.",
    icon: Cloud,
    color: "#0284C7",
    bgColor: "#F0F9FF",
    stats: [
      { label: "Stored Files", value: "342", change: "+12 this month" },
      { label: "Storage Used", value: "2.4 GB", change: "Encrypted" },
      { label: "Sync Status", value: "100%", change: "Real-time" },
    ],
    highlights: [
      "Secure cloud document management with station isolation",
      "Automatic synchronization with driver and fleet records",
      "Full audit trail with version history and access permissions",
      "Instant PDF export and digital archive viewing",
    ],
  },
  inventory: {
    id: "dashboard" as NavRouteType,
    title: "LMDmax Operations Inventory",
    badge: "Station Assets",
    subtitle: "Equipment Tracking, Device Checkout & Supplies",
    description:
      "Track handheld Rabbit scanners, gas cards, safety vests, van keys, and station hardware with automated driver assignment logs.",
    icon: Package,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    stats: [
      { label: "Active Devices", value: "54 / 60", change: "6 in charging dock" },
      { label: "Gas Cards", value: "42", change: "Assigned" },
      { label: "Station Stock", value: "98%", change: "Vests & Supplies" },
    ],
    highlights: [
      "Hardware scanner & Rabbit device serial tracking",
      "Daily driver checkout and return logs",
      "Fleet fuel card allocation and expense limits",
      "Automated missing or damaged equipment alerts",
    ],
  },
};

interface ModulePlaceholderPageProps {
  moduleKey: "chats" | "performance" | "fleet" | "scheduler" | "cloud" | "inventory";
}

export const ModulePlaceholderPage: FC<ModulePlaceholderPageProps> = ({ moduleKey }) => {
  const navigate = useNavigate();
  const selectedStationFilter = useDriverStore((state) => state.selectedStationFilter);
  const activeStation = selectedStationFilter || "DDF4";

  const config = MODULE_CONFIGS[moduleKey] || MODULE_CONFIGS.chats;
  const Icon = config.icon;

  return (
    <GlassAppLayout currentRoute={config.id} activeBreadcrumb={{ section: "Operations", page: config.title }}>
      <div className="operations-page-shell" style={{ width: "100%", height: "100%", overflowY: "auto" }}>
        <main className="operations-main-content scrollable" style={{ padding: "1.25rem 1.5rem" }}>
        {/* Top Hero Banner */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: config.bgColor,
                  color: config.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                <Icon size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    {config.title}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      backgroundColor: config.bgColor,
                      color: config.color,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      border: `1px solid ${config.color}33`,
                    }}
                  >
                    {config.badge}
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.2rem 0 0" }}>
                  {config.subtitle}
                </p>
              </div>
            </div>

            {/* Station indicator & Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.75rem",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "6px",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#1D4ED8",
                }}
              >
                <Building size={14} />
                <span>Station: {activeStation}</span>
              </div>

              <button
                type="button"
                className="btn-blue-outline btn-sm"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="btn-blue-primary btn-sm"
                onClick={() => navigate("/operations")}
              >
                <Users size={14} />
                <span>Operations & Drivers</span>
              </button>
            </div>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#334155", lineHeight: 1.5, margin: 0 }}>
            {config.description}
          </p>

          {/* Quick Metrics Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            {config.stats.map((st, i) => (
              <div
                key={i}
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                }}
              >
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                  {st.label}
                </span>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A" }}>
                  {st.value}
                </span>
                {st.change && (
                  <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#059669" }}>
                    {st.change}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Highlights & Features Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "1.25rem",
            }}
          >
            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A", margin: "0 0 0.75rem" }}>
              Key System Capabilities
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {config.highlights.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", color: "#334155" }}>
                  <ShieldCheck size={15} style={{ color: config.color, marginTop: "0.15rem", flexShrink: 0 }} />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0F172A", margin: "0 0 0.5rem" }}>
                Multi-Station Shared Operations
              </h4>
              <p style={{ fontSize: "0.8125rem", color: "#64748B", margin: 0, lineHeight: 1.45 }}>
                Drivers, vehicles, and delivery station inventory are synchronized across all modules. Manage roster entries once in Operations and access them everywhere.
              </p>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className="btn-blue-outline btn-sm w-full"
                onClick={() => navigate("/operations")}
                style={{ justifyContent: "space-between" }}
              >
                <span>Open Operations Master Roster</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </GlassAppLayout>
  );
};

export default ModulePlaceholderPage;
