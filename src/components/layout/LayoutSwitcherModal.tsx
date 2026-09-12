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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 10060,
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
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to right, #F8FAFC, #FFFFFF)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
              }}
            >
              <Layout size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0F172A" }}>
                Choose Application Layout
              </h2>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#64748B" }}>
                Select how you want to navigate and interact with LMDmax Unified App
              </p>
            </div>
          </div>

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
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Layout Cards Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* 1. Top Navigation Card (Existing) */}
            <div
              onClick={() => setSelectedMode("top-nav")}
              style={{
                border: selectedMode === "top-nav" ? "2px solid #2563EB" : "1px solid #E2E8F0",
                backgroundColor: selectedMode === "top-nav" ? "#EFF6FF" : "#FFFFFF",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                transition: "all 0.15s ease",
                boxShadow: selectedMode === "top-nav" ? "0 4px 12px rgba(37, 99, 235, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
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
                    backgroundColor: "#2563EB",
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
                  borderRadius: "6px",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #CBD5E1",
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
                    borderRadius: "4px",
                    backgroundColor: "#2563EB",
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
                    borderRadius: "4px",
                    border: "1px dashed #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: 600 }}>
                    Full Width Content
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 700, color: "#0F172A" }}>
                  Top Navigation
                </h4>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748B", lineHeight: 1.4 }}>
                  Header at the top with Global Utilities dropdown, maximum screen width for tables & dashboards.
                </p>
              </div>
            </div>

            {/* 2. Left Sidebar + Top Header Card */}
            <div
              onClick={() => setSelectedMode("sidebar-nav")}
              style={{
                border: selectedMode === "sidebar-nav" ? "2px solid #2563EB" : "1px solid #E2E8F0",
                backgroundColor: selectedMode === "sidebar-nav" ? "#EFF6FF" : "#FFFFFF",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                transition: "all 0.15s ease",
                boxShadow: selectedMode === "sidebar-nav" ? "0 4px 12px rgba(37, 99, 235, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
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
                    backgroundColor: "#2563EB",
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
                  borderRadius: "6px",
                  backgroundColor: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  padding: "5px",
                  display: "flex",
                  gap: "5px",
                }}
              >
                {/* Left Sidebar */}
                <div
                  style={{
                    width: "38px",
                    backgroundColor: "#1E293B",
                    borderRadius: "4px",
                    padding: "4px 3px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div style={{ width: "16px", height: "4px", backgroundColor: "#3B82F6", borderRadius: "2px", marginBottom: "2px" }} />
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
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 4px",
                    }}
                  >
                    <div style={{ width: "24px", height: "3px", backgroundColor: "#94A3B8", borderRadius: "1px" }} />
                    <div style={{ display: "flex", gap: "2px" }}>
                      <div style={{ width: "6px", height: "6px", backgroundColor: "#EFF6FF", borderRadius: "50%", border: "1px solid #BFDBFE" }} />
                      <div style={{ width: "6px", height: "6px", backgroundColor: "#2563EB", borderRadius: "50%" }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: "3px",
                      border: "1px dashed #CBD5E1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: 600 }}>
                      App Workspace
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", fontWeight: 700, color: "#0F172A" }}>
                  Left Sidebar + Top Header
                </h4>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748B", lineHeight: 1.4 }}>
                  Sidebar navigation with grouped Inspections, Reports, and Utilities + sleek top action bar.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              fontSize: "0.8rem",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <Sparkles size={16} color="#2563EB" />
            <span>
              Your layout choice is saved automatically and applies immediately across all pages.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "0.5rem",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: "0.5rem 1.35rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
            }}
          >
            Apply Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutSwitcherModal;
