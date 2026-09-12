import React, { FC } from "react";
import {
  Layout,
  Check,
  PanelLeft,
  Sparkles,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from "lucide-react";
import { useLayoutStore, AppLayoutMode } from "../../../store/layoutStore";

export const AppLayoutSettingsPanel: FC = () => {
  const layoutMode = useLayoutStore((state) => state.layoutMode);
  const setLayoutMode = useLayoutStore((state) => state.setLayoutMode);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Info */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          padding: "1.25rem 1.5rem",
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563EB",
            }}
          >
            <Layout size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 750, color: "#0F172A" }}>
              Application Layout Preferences
            </h3>
            <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#64748B" }}>
              Choose between top header navigation or left sidebar navigation based on your workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Layout Choice Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* 1. Top Navigation */}
        <div
          onClick={() => setLayoutMode("top-nav")}
          style={{
            backgroundColor: layoutMode === "top-nav" ? "#EFF6FF" : "#FFFFFF",
            border: layoutMode === "top-nav" ? "2px solid #2563EB" : "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "1.5rem",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            transition: "all 0.15s ease",
            boxShadow: layoutMode === "top-nav" ? "0 6px 16px rgba(37, 99, 235, 0.12)" : "0 2px 6px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Active Badge */}
          {layoutMode === "top-nav" && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              <Check size={12} strokeWidth={3} />
              Active Layout
            </div>
          )}

          {/* Wireframe Diagram */}
          <div
            style={{
              height: "120px",
              borderRadius: "8px",
              backgroundColor: "#F1F5F9",
              border: "1px solid #CBD5E1",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div
              style={{
                height: "24px",
                borderRadius: "5px",
                backgroundColor: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
              }}
            >
              <div style={{ width: "40px", height: "6px", backgroundColor: "#FFFFFF", borderRadius: "3px" }} />
              <div style={{ display: "flex", gap: "5px" }}>
                <div style={{ width: "20px", height: "5px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                <div style={{ width: "20px", height: "5px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                <div style={{ width: "20px", height: "5px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
              </div>
              <div style={{ width: "12px", height: "12px", backgroundColor: "#FFFFFF", borderRadius: "50%" }} />
            </div>

            <div
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: "5px",
                border: "1px dashed #CBD5E1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                Full-Width Screen Workspace
              </span>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 750, color: "#0F172A" }}>
              Top Navigation (Default)
            </h4>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#64748B", lineHeight: 1.45 }}>
              Standard unified header layout with full navigation items, Global Utilities mega-menu, and 100% full-width viewport space for comprehensive data tables.
            </p>

            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", color: "#475569", lineHeight: 1.6 }}>
              <li>Single unified top navigation bar</li>
              <li>Maximum horizontal screen space for tables &amp; forms</li>
              <li>Global Utilities dropdown with all operational modules</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLayoutMode("top-nav");
            }}
            style={{
              marginTop: "auto",
              padding: "0.55rem 1rem",
              borderRadius: "0.5rem",
              border: layoutMode === "top-nav" ? "1px solid #2563EB" : "1px solid #CBD5E1",
              backgroundColor: layoutMode === "top-nav" ? "#2563EB" : "#FFFFFF",
              color: layoutMode === "top-nav" ? "#FFFFFF" : "#334155",
              fontSize: "0.85rem",
              fontWeight: 650,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {layoutMode === "top-nav" ? "Selected Layout" : "Switch to Top Navigation"}
          </button>
        </div>

        {/* 2. Left Sidebar + Top Header */}
        <div
          onClick={() => setLayoutMode("sidebar-nav")}
          style={{
            backgroundColor: layoutMode === "sidebar-nav" ? "#EFF6FF" : "#FFFFFF",
            border: layoutMode === "sidebar-nav" ? "2px solid #2563EB" : "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "1.5rem",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            transition: "all 0.15s ease",
            boxShadow: layoutMode === "sidebar-nav" ? "0 6px 16px rgba(37, 99, 235, 0.12)" : "0 2px 6px rgba(15, 23, 42, 0.04)",
          }}
        >
          {/* Active Badge */}
          {layoutMode === "sidebar-nav" && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.2rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              <Check size={12} strokeWidth={3} />
              Active Layout
            </div>
          )}

          {/* Wireframe Diagram */}
          <div
            style={{
              height: "120px",
              borderRadius: "8px",
              backgroundColor: "#F1F5F9",
              border: "1px solid #CBD5E1",
              padding: "6px",
              display: "flex",
              gap: "6px",
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                width: "48px",
                backgroundColor: "#1E293B",
                borderRadius: "5px",
                padding: "5px 4px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ width: "22px", height: "5px", backgroundColor: "#3B82F6", borderRadius: "2px", marginBottom: "3px" }} />
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "2px" }} />
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "2px" }} />
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "2px" }} />
              <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "2px" }} />
            </div>

            {/* Top Bar + Workspace */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              <div
                style={{
                  height: "20px",
                  borderRadius: "4px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 6px",
                }}
              >
                <div style={{ width: "32px", height: "4px", backgroundColor: "#94A3B8", borderRadius: "2px" }} />
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "9px", height: "9px", backgroundColor: "#EFF6FF", borderRadius: "50%", border: "1px solid #BFDBFE" }} />
                  <div style={{ width: "9px", height: "9px", backgroundColor: "#2563EB", borderRadius: "50%" }} />
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "4px",
                  border: "1px dashed #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                  App Workspace
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem", fontWeight: 750, color: "#0F172A" }}>
              Left Sidebar + Top Header
            </h4>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#64748B", lineHeight: 1.45 }}>
              Collapsible left sidebar for direct 1-click navigation across Drivers, Vehicles, Inspections, Reports, and Utilities alongside a streamlined top action bar.
            </p>

            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", color: "#475569", lineHeight: 1.6 }}>
              <li>Collapsible desktop sidebar &amp; mobile slide-out drawer</li>
              <li>Grouped collapsible submenus for Inspections, Reports &amp; Utilities</li>
              <li>Top header with Notifications, Station Switcher, Help &amp; Profile</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLayoutMode("sidebar-nav");
            }}
            style={{
              marginTop: "auto",
              padding: "0.55rem 1rem",
              borderRadius: "0.5rem",
              border: layoutMode === "sidebar-nav" ? "1px solid #2563EB" : "1px solid #CBD5E1",
              backgroundColor: layoutMode === "sidebar-nav" ? "#2563EB" : "#FFFFFF",
              color: layoutMode === "sidebar-nav" ? "#FFFFFF" : "#334155",
              fontSize: "0.85rem",
              fontWeight: 650,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {layoutMode === "sidebar-nav" ? "Selected Layout" : "Switch to Left Sidebar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppLayoutSettingsPanel;
