import React, { FC } from "react";
import AppNavbar, { NavRouteType } from "./AppNavbar";
import AppSidebar from "./AppSidebar";
import SidebarTopHeader from "./SidebarTopHeader";
import { useLayoutStore } from "../../store/layoutStore";
import "./glass-layout.css";

export interface GlassAppLayoutProps {
  children?: React.ReactNode;
  currentRoute?: NavRouteType | string;
  activeBreadcrumb?: {
    section?: string;
    page?: string;
    subPage?: string;
    detail?: string;
  };
}

export const GlassAppLayout: FC<GlassAppLayoutProps> = ({
  children,
  currentRoute,
  activeBreadcrumb,
}) => {
  const layoutMode = useLayoutStore((state) => state.layoutMode);

  if (layoutMode === "sidebar-nav") {
    return (
      <div className="glass-sidebar-layout-shell">
        {/* 1. 3-Card Floating Left Navigation Column */}
        <AppSidebar />

        {/* 2. Main Column: Floating Top Header Card + Floating Content Card */}
        <div className="glass-sidebar-main-column">
          <SidebarTopHeader activeBreadcrumb={activeBreadcrumb} />
          <main className="sidebar-content-floating-card">
            <div
              key={currentRoute ? String(currentRoute) : "page-view"}
              className="apple-page-transition"
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default: Top Navigation Bar Layout
  return (
    <div className="glass-app-layout-shell">
      {/* Strictly Single Top Navigation Bar */}
      <AppNavbar currentRoute={currentRoute as NavRouteType} />

      {/* Full-Width Main Viewport for Page Content */}
      <main className="glass-app-main-viewport">
        <div
          key={currentRoute ? String(currentRoute) : "page-view"}
          className="apple-page-transition"
          style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default GlassAppLayout;
