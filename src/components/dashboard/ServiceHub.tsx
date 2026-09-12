import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import GlassAppLayout from "../layout/GlassAppLayout";
import {
  Truck,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export const ServiceHub: FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const services = [
    {
      id: "fleet",
      title: "LMDmax Fleet",
      badge: "Fleet v7.3",
      subtitle: "Vehicle Inspections & Asset Maintenance",
      description:
        "Manage vehicle condition reports, conduct mandatory daily pre/post inspections, record AI damage scans, and ensure complete DVIC compliance.",
      icon: Truck,
      color: "#2563EB",
      badgeBg: "#EFF6FF",
      features: [
        "Pre & Post-trip Driver Vehicle Inspections (DVIC)",
        "AI Damage Detection & Audit Trail",
        "Vehicle Telematics & Maintenance Logs",
        "OCR Registration & Insurance Scanning",
      ],
      actionLabel: "Launch Fleet",
    },
    {
      id: "performance",
      title: "LMDmax Performance",
      badge: "Performance v2.0",
      subtitle: "Driver Analytics & Safety Intelligence",
      description:
        "Track delivery quality scores, driver tier leaderboards, Netradyne safety events, customer escalation records, and two-way notifications.",
      icon: BarChart3,
      color: "#1D4ED8",
      badgeBg: "#EFF6FF",
      features: [
        "Scorecards & Weekly Tier Rankings",
        "Netradyne Safety & Video Events",
        "Driver Write-ups & Acknowledgments",
        "In-App Two-Way Communications",
      ],
      actionLabel: "Launch Performance",
    },
    {
      id: "scheduler",
      title: "LMDmax Scheduler",
      badge: "Scheduler ReScript",
      subtitle: "Intelligent Shift & Roster Automation",
      description:
        "Automate weekly shift generation, manage driver availability, approve time-off requests, and maintain optimal DSP route coverage.",
      icon: CalendarDays,
      color: "#1E40AF",
      badgeBg: "#EFF6FF",
      features: [
        "Automated Shift Scheduling Engine",
        "Driver Availability & Shift Swapping",
        "Time-Off Request & Approval Flow",
        "Live Broadcasts & Route Alerts",
      ],
      actionLabel: "Launch Scheduler",
    },
  ];

  return (
    <GlassAppLayout currentRoute="dashboard" activeBreadcrumb={{ section: "Network Overview", page: "Services Hub" }}>
      <div className="dashboard-page-container" style={{ width: "100%", height: "100%", overflowY: "auto" }}>
        <main className="dashboard-main-content">
          {/* Unified 3-column Service Cards */}
          <div className="dashboard-cards-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="hub-service-card">
                  <div className="card-top-row">
                    <div
                      className="card-icon-pill"
                      style={{ color: service.color, backgroundColor: service.badgeBg }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className="card-version-badge">{service.badge}</span>
                  </div>

                  <h3 className="service-card-title">{service.title}</h3>
                  <h5 className="service-card-subtitle">{service.subtitle}</h5>
                  <p className="service-card-desc">{service.description}</p>

                  <div className="feature-bullets">
                    {service.features.map((feat, idx) => (
                      <div key={idx} className="feature-bullet-item">
                        <CheckCircle2 size={13} className="text-blue-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-bottom-action">
                    <button
                      type="button"
                      className="service-launch-btn"
                      style={{ backgroundColor: service.color, color: "#FFFFFF" }}
                      onClick={() => {
                        navigate(`/${service.id}`);
                      }}
                    >
                      <span style={{ color: "#FFFFFF" }}>{service.actionLabel}</span>
                      <ChevronRight size={15} color="#FFFFFF" style={{ color: "#FFFFFF" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </GlassAppLayout>
  );
};

export default ServiceHub;

