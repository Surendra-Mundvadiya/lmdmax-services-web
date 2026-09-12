import React, { FC, useState, useEffect } from "react";
import {
  X,
  Check,
  Layout,
  PanelLeft,
  Sliders,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLayoutStore, AppLayoutMode } from "../../store/layoutStore";

interface LayoutSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LayoutSwitcherModal: FC<LayoutSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentMode = useLayoutStore((state) => state.layoutMode);
  const setLayoutMode = useLayoutStore((state) => state.setLayoutMode);
  const [selectedMode, setSelectedMode] = useState<AppLayoutMode>(currentMode);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(currentMode);
    }
  }, [isOpen, currentMode]);

  if (!isOpen) return null;

  const handleApply = () => {
    setLayoutMode(selectedMode);
    onClose();
  };

  return (
    <div
      className="ads-scrim"
      style={{
        zIndex: 10060,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ads-s4)",
      }}
      onClick={onClose}
    >
      <div
        className="ads-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Choose application layout"
        style={{
          width: "100%",
          maxWidth: "680px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-blue-tint)",
                border: "1px solid var(--ads-blue-tint-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ads-blue)",
              }}
            >
              <Layout size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 650, letterSpacing: "-0.019em", color: "var(--ads-ink)" }}>
                Choose Application Layout
              </h2>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8125rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)" }}>
                Select how you want to navigate and interact with LMDmax Unified App
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close"
            aria-label="Close layout picker"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "var(--ads-r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition:
                "color var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ads-ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ads-ink-tertiary)")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Layout Cards Body */}
        <div style={{ padding: "var(--ads-s6)", display: "flex", flexDirection: "column", gap: "var(--ads-s5)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--ads-s4)" }}>
            {/* 1. Top Navigation Card (Existing) */}
            <div
              onClick={() => setSelectedMode("top-nav")}
              style={{
                border: selectedMode === "top-nav" ? "1px solid var(--ads-blue)" : "1px solid var(--ads-hairline)",
                background: selectedMode === "top-nav" ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                borderRadius: "var(--ads-r-md)",
                padding: "var(--ads-s5)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s3)",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                boxShadow: selectedMode === "top-nav" ? "var(--ads-shadow-md), var(--ads-bevel)" : "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              {selectedMode === "top-nav" && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
              )}

              {/* Graphic Wireframe */}
              <div
                style={{
                  height: "90px",
                  borderRadius: "var(--ads-r-xs)",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  border: "1px solid var(--ads-hairline)",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {/* Top header bar */}
                <div
                  style={{
                    height: "18px",
                    borderRadius: "var(--ads-r-xs)",
                    backgroundColor: "var(--ads-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 6px",
                  }}
                >
                  <div style={{ width: "30px", height: "5px", backgroundColor: "#FFFFFF", borderRadius: "2px" }} />
                  <div style={{ display: "flex", gap: "3px" }}>
                    <div style={{ width: "12px", height: "4px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                    <div style={{ width: "12px", height: "4px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                    <div style={{ width: "12px", height: "4px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "2px" }} />
                  </div>
                  <div style={{ width: "8px", height: "8px", backgroundColor: "#FFFFFF", borderRadius: "50%" }} />
                </div>
                {/* Full width content */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "var(--ads-r-xs)",
                    border: "1px dashed var(--ads-hairline-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "var(--ads-ink-quaternary)", fontWeight: 600 }}>
                    Full Width Content
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Top Navigation
                </h4>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ads-ink-secondary)", lineHeight: 1.5 }}>
                  Header at the top with Global Utilities dropdown, maximum screen width for tables & dashboards.
                </p>
              </div>
            </div>

            {/* 2. Left Sidebar + Top Header Card */}
            <div
              onClick={() => setSelectedMode("sidebar-nav")}
              style={{
                border: selectedMode === "sidebar-nav" ? "1px solid var(--ads-blue)" : "1px solid var(--ads-hairline)",
                background: selectedMode === "sidebar-nav" ? "var(--ads-blue-tint)" : "var(--ads-material-thick)",
                borderRadius: "var(--ads-r-md)",
                padding: "var(--ads-s5)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ads-s3)",
                transition: "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                boxShadow: selectedMode === "sidebar-nav" ? "var(--ads-shadow-md), var(--ads-bevel)" : "var(--ads-shadow-xs), var(--ads-bevel)",
              }}
            >
              {selectedMode === "sidebar-nav" && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
              )}

              {/* Graphic Wireframe */}
              <div
                style={{
                  height: "90px",
                  borderRadius: "var(--ads-r-xs)",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  border: "1px solid var(--ads-hairline)",
                  padding: "5px",
                  display: "flex",
                  gap: "5px",
                }}
              >
                {/* Left Sidebar */}
                <div
                  style={{
                    width: "38px",
                    backgroundColor: "var(--ads-ink)",
                    borderRadius: "var(--ads-r-xs)",
                    padding: "4px 3px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div style={{ width: "16px", height: "4px", backgroundColor: "var(--ads-blue)", borderRadius: "2px", marginBottom: "2px" }} />
                  <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(255,255,255,0.7)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "3px", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: "1px" }} />
                </div>

                {/* Right side: Top Bar + Content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  {/* Top Bar */}
                  <div
                    style={{
                      height: "14px",
                      borderRadius: "3px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid var(--ads-hairline)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 4px",
                    }}
                  >
                    <div style={{ width: "24px", height: "3px", backgroundColor: "var(--ads-ink-quaternary)", borderRadius: "1px" }} />
                    <div style={{ display: "flex", gap: "2px" }}>
                      <div style={{ width: "6px", height: "6px", backgroundColor: "var(--ads-blue-tint)", borderRadius: "50%", border: "1px solid var(--ads-blue-tint-strong)" }} />
                      <div style={{ width: "6px", height: "6px", backgroundColor: "var(--ads-blue)", borderRadius: "50%" }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: "3px",
                      border: "1px dashed var(--ads-hairline-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", color: "var(--ads-ink-quaternary)", fontWeight: 600 }}>
                      App Workspace
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                  Left Sidebar + Top Header
                </h4>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--ads-ink-secondary)", lineHeight: 1.5 }}>
                  Sidebar navigation with grouped Inspections, Reports, and Utilities + sleek top action bar.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "var(--ads-s3) var(--ads-s4)",
              borderRadius: "var(--ads-r-sm)",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--ads-hairline)",
              fontSize: "0.8rem",
              color: "var(--ads-ink-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <Sparkles size={16} color="#0071E3" />
            <span>
              Your layout choice is saved automatically and applies immediately across all pages.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "var(--ads-s3)",
          }}
        >
          <button type="button" onClick={onClose} className="ads-btn ads-btn--secondary">
            Cancel
          </button>
          <button type="button" onClick={handleApply} className="ads-btn ads-btn--primary">
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutSwitcherModal;
