# LMDmax Unified App - Core System Rules & Guidelines

These 10 rules are MANDATORY and MUST be strictly followed across the entire application without exception:

1. **Responsiveness & Parity Across BOTH App Layouts, All Devices & Browsers**:
   - The app must be fully responsive, visually cohesive, and functionally identical across **BOTH application layouts**:
     - **Top Header Navbar Layout (`top-nav`)**
     - **Left Navigation Bar Layout (`sidebar-nav`)**
   - Every screen, feature, and interaction must work seamlessly on all viewports (smartphones, tablets, laptops, ultra-wide desktops) and modern browsers.
   - Clean touch targets, responsive collapse/drawers, proper flex/grid wrapping, and zero horizontal/vertical scroll overflows or double scrollbars.

2. **Frontend-Only Scope (Zero Backend Modifications)**:
   - Do NOT make any changes to the backend microservices (`fleet-users-msrv-production`, `fleet-performance-msrv-production`, `fleet-scheduler-msrv-production`, etc.).
   - All tasks, proxying, formatting, state management, and adaptations must be achieved purely on the frontend.

3. **Strict Theme, Typography & Modern UI/UX Consistency**:
   - **Universal Font Family**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` used universally across all headers, cards, tables, inputs, buttons, and micro-copy in both layouts.
   - **Modern UI/UX & Sleek Transitions**: Use fluid state transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), subtle micro-animations, and clean hover elevations.
   - **Crisp Solid Cards (Zero Murky Glassapp Gradients)**: Cards must be solid `#FFFFFF !important` with clean `1px solid #E2E8F0` borders, `border-radius: 14px`, and subtle elevation (`0 2px 8px rgba(15, 23, 42, 0.04)`). No muddy radial gradients or illegible background blur bleed-through.
   - **Consistent Blue-and-White Theme**: `#4F8BFF`, `#2563EB`, `#1D4ED8`, `#EFF6FF`, `#F0F6FF`, `#FFFFFF`, `#1E293B`, `#64748B`.
   - **High Contrast Buttons**: All blue buttons and active blue pills (`#2563EB`) and their nested child text/icons MUST have pure white text (`#FFFFFF !important`).

4. **Single Header Architecture (No Double Headers)**:
   - Never render double headers on any page.
   - The unified `AppNavbar` serves as the single top navigation bar in top-nav mode. In sidebar mode, `SidebarTopHeader` serves as the single top bar. Page bodies must never introduce duplicate secondary title headers.

5. **Accurate API Endpoints Only**:
   - Only fetch and integrate API data from the specific endpoints and applications designated by the user.
   - Reference existing production apps (`fleet-web-production`, `performance-web-production`, `scheduler-web-production`) for exact route contracts.

6. **100% Real-Time & Dynamic Data (Zero Dummy / Fake Data)**:
   - All displays, tables, cards, dropdowns, and metrics must be dynamically populated from live backend APIs.
   - Never create or fall back to mock objects, fabricated demo profiles, hardcoded statistics, or dummy test records. Empty or loading states should be rendered when data is not yet loaded.

7. **Consult User for Backend Requirements**:
   - If any change or fix is required in the backend, ask and notify the user first with full technical details.
   - Never modify backend files autonomously.

8. **Uniform Layout Architecture Across All Pages**:
   - Standardize layouts into verified patterns:
     - **Full Dashboard / Grid Views**: Floating cards directly on canvas (`gap: 1.15rem`, single viewport scroll).
     - **Split-Catalog Views (Reports, Upload, Settings)**: Canvas breadcrumb + "View by" capsule pills on top (`upload-filter-toolbar`) + divided two-column layout (`upload-split-layout`: 320px left catalog card + right workspace card).
     - **Directory / Table Views (Vehicles, Drivers)**: Canvas filter pills + unified white table card container.

9. **Zero Unsolicited or Redundant Information**:
   - Remove unnecessary information, redundant labels, repeated titles, and clutter throughout the complete application.
   - Keep views focused, clean, executive, and minimal.

10. **Strict Layout Persistence**:
    - When a user chooses an app layout (e.g. Left Navigation Bar Layout), it must remain active and locked across 100% of screens, route transitions, and page reloads until explicitly changed.
