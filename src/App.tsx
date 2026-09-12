import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./environment";
import { useAuthStore } from "./store/authStore";

// Components
import AuthLayout from "./components/auth/AuthLayout";
import SignInForm from "./components/auth/SignInForm";
import OtpSignInForm from "./components/auth/OtpSignInForm";
import SignUpForm from "./components/auth/SignUpForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import AccountLinkModal from "./components/auth/AccountLinkModal";
import ControlTowerSSO from "./components/auth/ControlTowerSSO";
import ServiceHub from "./components/dashboard/ServiceHub";
import UnifiedOperationsDashboard from "./components/dashboard/UnifiedOperationsDashboard";
import ProfilePage from "./components/profile/ProfilePage";
import SettingsPage from "./components/settings/SettingsPage";
import HelpAndSupportPage from "./components/support/HelpAndSupportPage";
import NotificationsPage from "./components/notifications/NotificationsPage";
import DriversPage from "./components/operations/drivers/DriversPage";
import FleetPage from "./components/fleet/FleetPage";
import VehiclesPage from "./components/fleet/vehicles/VehiclesPage";
import PerformancePage from "./components/performance/PerformancePage";
import ESignatureView from "./components/performance/esignature/ESignatureView";
import SchedulerPage from "./components/scheduler/SchedulerPage";
import ChatsPage from "./components/chats/ChatsPage";
import TemplatesPage from "./components/templates/TemplatesPage";
import CurationsPage from "./components/curation/CurationsPage";
import ModulePlaceholderPage from "./components/common/ModulePlaceholderPage";
import AccessDeniedModal from "./components/common/AccessDeniedModal";
import ErrorBoundary from "./components/common/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AuthView = "SIGN_IN" | "OTP_SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD";

const AuthScreen = () => {
  const [currentView, setCurrentView] = useState<AuthView>("SIGN_IN");
  const [accountLinkInfo, setAccountLinkInfo] = useState<{
    code: string;
    provider: "google" | "apple";
    jwtId?: number;
    Gtoken?: string;
    id?: number;
  } | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If already logged in, redirect directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  const handleSignUpSuccess = () => {
    setNotification({
      type: "success",
      message: "Registration successful! You can now sign in with your email and password.",
    });
    setCurrentView("SIGN_IN");
  };

  const handlePasswordResetSuccess = () => {
    setNotification({
      type: "success",
      message: "Password reset successful! Please sign in with your new password.",
    });
    setCurrentView("SIGN_IN");
  };

  return (
    <AuthLayout>
      {notification && (
        <div
          style={{
            backgroundColor: notification.type === "success" ? "#ECFDF5" : "#EFF6FF",
            border: `1px solid ${notification.type === "success" ? "#A7F3D0" : "#BFDBFE"}`,
            color: notification.type === "success" ? "#065F46" : "#1E40AF",
            padding: "0.875rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              color: "inherit",
              marginLeft: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {currentView === "SIGN_IN" && (
        <SignInForm
          onSwitchToOtp={() => setCurrentView("OTP_SIGN_IN")}
          onSwitchToSignUp={() => setCurrentView("SIGN_UP")}
          onSwitchToForgotPassword={() => setCurrentView("FORGOT_PASSWORD")}
          onRequireAccountLink={(info) => setAccountLinkInfo(info)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {currentView === "OTP_SIGN_IN" && (
        <OtpSignInForm
          onBackToEmail={() => setCurrentView("SIGN_IN")}
          onSuccess={handleLoginSuccess}
        />
      )}

      {currentView === "SIGN_UP" && (
        <SignUpForm
          onBackToSignIn={() => setCurrentView("SIGN_IN")}
          onSuccess={handleSignUpSuccess}
        />
      )}

      {currentView === "FORGOT_PASSWORD" && (
        <ForgotPasswordForm
          onBackToSignIn={() => setCurrentView("SIGN_IN")}
          onSuccess={handlePasswordResetSuccess}
        />
      )}

      {/* Account Linking Modal when OAuth returns needOTP */}
      <AccountLinkModal
        isOpen={Boolean(accountLinkInfo)}
        onClose={() => setAccountLinkInfo(null)}
        authInfo={accountLinkInfo}
        onSuccess={handleLoginSuccess}
      />
    </AuthLayout>
  );
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const stations = useAuthStore((state) => state.stations);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    if (isAuthenticated && stations.length === 0) {
      fetchProfile();
    }
  }, [isAuthenticated, stations.length, fetchProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <ErrorBoundary fallbackTitle="Application Module Error">{children}</ErrorBoundary>;
};

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AccessDeniedModal />
          <Routes>
            {/* Public Authentication routes */}
            <Route path="/" element={<AuthScreen />} />

            {/* Control Tower SSO Route */}
            <Route
              path="/control-tower-signin/:login_id/:company_id"
              element={<ControlTowerSSO />}
            />

            {/* Protected Unified Operations Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UnifiedOperationsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Services Hub (3-card launchpad view) */}
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <ServiceHub />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hub"
              element={
                <ProtectedRoute>
                  <ServiceHub />
                </ProtectedRoute>
              }
            />

            {/* Protected User & Company Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Settings Route (Exclusively RTS Checkout Admins) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admins"
              element={
                <ProtectedRoute>
                  <Navigate to="/settings?tab=admins" replace />
                </ProtectedRoute>
              }
            />

            {/* Protected Notifications Route */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Help & Support Routes */}
            <Route
              path="/helpandsupport"
              element={
                <ProtectedRoute>
                  <HelpAndSupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help-and-support"
              element={
                <ProtectedRoute>
                  <HelpAndSupportPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Top Header Navigation Services */}
            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <ChatsPage />
                </ProtectedRoute>
              }
            />
            {/* Templates Route */}
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <TemplatesPage />
                </ProtectedRoute>
              }
            />
            {/* Curations Route */}
            <Route
              path="/curations"
              element={
                <ProtectedRoute>
                  <CurationsPage />
                </ProtectedRoute>
              }
            />
            {/* Performance Routes */}
            <Route
              path="/performance"
              element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance/upload"
              element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance/reports"
              element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance/reports/:report_key"
              element={
                <ProtectedRoute>
                  <PerformancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance/e-signature"
              element={
                <ProtectedRoute>
                  <ESignatureView />
                </ProtectedRoute>
              }
            />

            {/* Fleet Routes */}
            <Route
              path="/fleet"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/assignments"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/assignments/summary/:vehicleId"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/driver-inspection"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/driver-inspection/summary/:vehicleId"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/inspections"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/caution"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/vehicle-inspection"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/reports"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/incidents"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />

            {/* Global Utilities > Vehicles Routes */}
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute>
                  <VehiclesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles/add"
              element={
                <ProtectedRoute>
                  <VehiclesPage mode="add" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles/edit/:id"
              element={
                <ProtectedRoute>
                  <VehiclesPage mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet/vehicles"
              element={
                <ProtectedRoute>
                  <Navigate to="/vehicles" replace />
                </ProtectedRoute>
              }
            />

            {/* Scheduler Routes */}
            <Route
              path="/scheduler"
              element={
                <ProtectedRoute>
                  <SchedulerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduler/shifts"
              element={
                <ProtectedRoute>
                  <SchedulerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduler/time-off"
              element={
                <ProtectedRoute>
                  <SchedulerPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Operations & Drivers Management (Common Features across Fleet, Performance & Scheduler) */}
            <Route
              path="/operations"
              element={
                <ProtectedRoute>
                  <DriversPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/drivers"
              element={
                <ProtectedRoute>
                  <DriversPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute>
                  <DriversPage />
                </ProtectedRoute>
              }
            />

            {/* Direct Callout & Rescue Routes */}
            <Route
              path="/callout"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=callout" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/callout"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=callout" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rescue"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=rescue" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/rescue"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=rescue" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=notes" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/notes"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=notes" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=tasks" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/tasks"
              element={
                <ProtectedRoute>
                  <Navigate to="/operations?tab=tasks" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload_roster"
              element={
                <ProtectedRoute>
                  <Navigate to="/performance/upload?report=weekly_roster_report" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/upload_roster"
              element={
                <ProtectedRoute>
                  <Navigate to="/performance/upload?report=weekly_roster_report" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bulk_upload"
              element={
                <ProtectedRoute>
                  <Navigate to="/performance/upload?report=drivers&category=bulk" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations/bulk_upload"
              element={
                <ProtectedRoute>
                  <Navigate to="/performance/upload?report=drivers&category=bulk" replace />
                </ProtectedRoute>
              }
            />

            {/* Additional Utilities Routes */}
            <Route
              path="/accident_injury"
              element={
                <ProtectedRoute>
                  <Navigate to="/fleet/incidents" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cloud"
              element={
                <ProtectedRoute>
                  <ModulePlaceholderPage moduleKey="cloud" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <ModulePlaceholderPage moduleKey="inventory" />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
