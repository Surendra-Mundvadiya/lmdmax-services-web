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

3. **Apple-Inspired Design System (Single Source of Truth)**:
   - **All** color, material, radius, elevation, spacing and motion values come from `src/styles/apple-design-system.css`. Never hardcode a hex value, radius or shadow in a component — use the `--ads-*` tokens. If a token is missing, add it to the design system rather than inventing a local value.
   - **Universal Font Family**: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` across all headers, cards, tables, inputs, buttons and micro-copy in both layouts. Tracking tightens as type scales up (`-0.022em` at h1 → `-0.005em` at caption).
   - **Translucent Material Surfaces**: Cards, modals and chrome use the material scale (`--ads-material-thin/regular/thick`) with `backdrop-filter: var(--ads-blur-sm/md/lg)`, a `1px solid var(--ads-hairline)` border and the inner top highlight `var(--ads-bevel)`. Anything carrying body text uses `--ads-material-thick` or heavier so contrast is preserved.
   - **Accent & Neutrals**: Apple system blue `--ads-blue: #0071E3` is the single accent. Text uses `--ads-ink` (#1D1D1F) / `--ads-ink-secondary` / `--ads-ink-tertiary`. Canvas is `--ads-canvas` (#F5F5F7). Semantic colors (`--ads-green/amber/red/purple`) are for status only, never decoration.
   - **High Contrast Buttons**: Filled blue buttons and active pills and their nested child text/icons MUST render pure white (`#FFFFFF`). Never blue-on-blue.
   - **Motion**: Transitions use `var(--ads-ease)` (`cubic-bezier(0.16, 1, 0.3, 1)`) at `--ads-dur-fast`/`--ads-dur`. Hover lifts are `translateY(-1px|-2px)`; presses are `scale(0.97)`. All motion must respect `prefers-reduced-motion`.
   - **No inline styles for theming.** Inline `style={{}}` blocks defeat the cascade and are the main source of drift in this codebase. Use design-system classes; reserve inline styles for genuinely dynamic values (computed widths, positions).

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
