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

  const cardStyle = (isActive: boolean): React.CSSProperties => ({
    background: isActive ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
    WebkitBackdropFilter: "var(--ads-blur-md)",
    backdropFilter: "var(--ads-blur-md)",
    border: isActive ? "1px solid var(--ads-blue)" : "1px solid var(--ads-hairline)",
    borderRadius: "var(--ads-r-lg)",
    padding: "var(--ads-s6)",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "var(--ads-s4)",
    transition:
      "background-color var(--ads-dur) var(--ads-ease), border-color var(--ads-dur) var(--ads-ease), box-shadow var(--ads-dur) var(--ads-ease), transform var(--ads-dur) var(--ads-ease)",
    boxShadow: isActive
      ? "var(--ads-shadow-md), var(--ads-bevel)"
      : "var(--ads-shadow-sm), var(--ads-bevel)",
  });

  const activeBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--ads-s4)",
    right: "var(--ads-s4)",
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--ads-s1)",
    padding: "3px 10px",
    borderRadius: "var(--ads-r-pill)",
    backgroundColor: "var(--ads-blue)",
    color: "#FFFFFF",
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "-0.005em",
  };

  const wireframeShellStyle: React.CSSProperties = {
    height: "120px",
    borderRadius: "var(--ads-r-sm)",
    backgroundColor: "rgba(0, 0, 0, 0.045)",
    border: "1px solid var(--ads-hairline)",
    display: "flex",
    gap: "6px",
  };

  const wireframeCanvasStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: "var(--ads-white)",
    borderRadius: "5px",
    border: "1px dashed var(--ads-hairline-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const wireframeCaptionStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: "var(--ads-ink-tertiary)",
    fontWeight: 550,
  };

  const headingStyle: React.CSSProperties = {
    margin: "0 0 var(--ads-s1)",
    fontSize: "1.0625rem",
    fontWeight: 600,
    letterSpacing: "-0.014em",
    color: "var(--ads-ink)",
  };

  const bodyStyle: React.CSSProperties = {
    margin: "0 0 var(--ads-s3)",
    fontSize: "0.8125rem",
    color: "var(--ads-ink-tertiary)",
    lineHeight: 1.5,
  };

  const listStyle: React.CSSProperties = {
    margin: 0,
    paddingLeft: "1.2rem",
    fontSize: "0.8125rem",
    color: "var(--ads-ink-secondary)",
    lineHeight: 1.6,
  };

  const choiceButtonStyle = (isActive: boolean): React.CSSProperties => ({
    marginTop: "auto",
    padding: "9px 18px",
    borderRadius: "var(--ads-r-pill)",
    border: isActive ? "1px solid transparent" : "1px solid var(--ads-hairline)",
    backgroundColor: isActive ? "var(--ads-blue)" : "var(--ads-material-thick)",
    color: isActive ? "#FFFFFF" : "var(--ads-ink)",
    fontFamily: "inherit",
    fontSize: "0.8125rem",
    fontWeight: 600,
    letterSpacing: "-0.01em",
    cursor: "pointer",
    transition:
      "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease)",
  });

  const isTopNav = layoutMode === "top-nav";
  const isSidebar = layoutMode === "sidebar-nav";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ads-s5)" }}>
      <div className="settings-panel-intro">
        <p className="settings-panel-intro-text">
          Choose between top header navigation or left sidebar navigation based on your workflow.
        </p>
      </div>

      {/* Interactive Layout Choice Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--ads-s5)",
        }}
      >
        {/* 1. Top Navigation */}
        <div onClick={() => setLayoutMode("top-nav")} style={cardStyle(isTopNav)}>
          {/* Active Badge */}
          {isTopNav && (
            <div style={activeBadgeStyle}>
              <Check size={12} strokeWidth={3} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Active Layout</span>
            </div>
          )}

          {/* Wireframe Diagram */}
          <div style={{ ...wireframeShellStyle, flexDirection: "column", padding: "8px" }}>
            <div
              style={{
                height: "24px",
                borderRadius: "5px",
                backgroundColor: "var(--ads-blue)",
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

            <div style={wireframeCanvasStyle}>
              <span style={wireframeCaptionStyle}>Full-Width Screen Workspace</span>
            </div>
          </div>

          <div>
            <h4 style={headingStyle}>Top Navigation (Default)</h4>
            <p style={bodyStyle}>
              Standard unified header layout with full navigation items, Global Utilities mega-menu, and 100% full-width viewport space for comprehensive data tables.
            </p>

            <ul style={listStyle}>
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
            style={choiceButtonStyle(isTopNav)}
          >
            {isTopNav ? "Selected Layout" : "Switch to Top Navigation"}
          </button>
        </div>

        {/* 2. Left Sidebar + Top Header */}
        <div onClick={() => setLayoutMode("sidebar-nav")} style={cardStyle(isSidebar)}>
          {/* Active Badge */}
          {isSidebar && (
            <div style={activeBadgeStyle}>
              <Check size={12} strokeWidth={3} style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF" }}>Active Layout</span>
            </div>
          )}

          {/* Wireframe Diagram */}
          <div style={{ ...wireframeShellStyle, padding: "6px" }}>
            {/* Sidebar */}
            <div
              style={{
                width: "48px",
                backgroundColor: "var(--ads-ink)",
                borderRadius: "5px",
                padding: "5px 4px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ width: "22px", height: "5px", backgroundColor: "var(--ads-blue)", borderRadius: "2px", marginBottom: "3px" }} />
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
                  backgroundColor: "var(--ads-white)",
                  border: "1px solid var(--ads-hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 6px",
                }}
              >
                <div style={{ width: "32px", height: "4px", backgroundColor: "var(--ads-ink-quaternary)", borderRadius: "2px" }} />
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "9px", height: "9px", backgroundColor: "var(--ads-blue-tint)", borderRadius: "50%", border: "1px solid var(--ads-hairline)" }} />
                  <div style={{ width: "9px", height: "9px", backgroundColor: "var(--ads-blue)", borderRadius: "50%" }} />
                </div>
              </div>

              <div style={wireframeCanvasStyle}>
                <span style={wireframeCaptionStyle}>App Workspace</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={headingStyle}>Left Sidebar + Top Header</h4>
            <p style={bodyStyle}>
              Collapsible left sidebar for direct 1-click navigation across Drivers, Vehicles, Inspections, Reports, and Utilities alongside a streamlined top action bar.
            </p>

            <ul style={listStyle}>
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
            style={choiceButtonStyle(isSidebar)}
          >
            {isSidebar ? "Selected Layout" : "Switch to Left Sidebar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppLayoutSettingsPanel;
