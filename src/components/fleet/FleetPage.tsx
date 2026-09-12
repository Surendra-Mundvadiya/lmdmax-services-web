import React, { FC } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import GlassAppLayout from "../layout/GlassAppLayout";
import { ErrorBoundary } from "../common/ErrorBoundary";
import VehicleAssignmentView from "./assignments/VehicleAssignmentView";
import DriverInspectionSummaryView from "./assignments/DriverInspectionSummaryView";
import InspectionCautionView from "./caution/InspectionCautionView";
import VehicleInspectionView from "./inspections/VehicleInspectionView";
import VehicleInspectionReportsView from "./inspections/VehicleInspectionReportsView";
import AccidentInjuryView from "./incidents/AccidentInjuryView";

export const FleetPage: FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const incidentTab = searchParams.get("tab") || "accident";

  const getSubView = (): "assignments" | "summary" | "caution" | "vehicle-inspection" | "reports" | "incidents" => {
    if (location.pathname.includes("summary")) return "summary";
    if (location.pathname.includes("vehicle-inspection")) return "vehicle-inspection";
    if (location.pathname.includes("reports")) return "reports";
    if (location.pathname.includes("incidents")) return "incidents";
    if (location.pathname.includes("caution") || location.pathname.includes("question-form")) return "caution";
    if (location.pathname.includes("driver-inspection") || location.pathname.includes("assignments")) return "assignments";
    return "assignments";
  };

  const subView = getSubView();

  const getBreadcrumb = () => {
    if (subView === "incidents") {
      return {
        section: "Utilities",
        page: incidentTab === "injury" ? "Injury Reports" : "Accident Reports",
      };
    }
    if (subView === "vehicle-inspection") {
      return { section: "Inspections", page: "Vehicle Inspection" };
    }
    if (subView === "reports") {
      return { section: "Inspections", page: "Inspection Reports" };
    }
    if (subView === "caution") {
      return { section: "Inspections", page: "Inspection Caution Form" };
    }
    return { section: "Inspections", page: "Driver Inspection" };
  };

  return (
    <GlassAppLayout
      currentRoute="fleet"
      activeBreadcrumb={getBreadcrumb()}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        {/* Floating Workspace Container Card */}
        <div
          className="upload-workspace-container"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "1rem 1.25rem",
          }}
        >
          <ErrorBoundary fallbackTitle="Fleet Service View">
            {/* 1. Fleet > Driver Inspection */}
            {subView === "assignments" && <VehicleAssignmentView />}

            {/* 1b. Fleet > Driver Inspection Summary (Dedicated Next Page) */}
            {subView === "summary" && <DriverInspectionSummaryView />}

            {/* 2. Fleet > Inspection Question Form */}
            {subView === "caution" && <InspectionCautionView />}

            {/* 3. Fleet > Vehicle Inspection */}
            {subView === "vehicle-inspection" && <VehicleInspectionView />}

            {/* 4. Fleet > Inspection Reports */}
            {subView === "reports" && <VehicleInspectionReportsView />}

            {/* 5. Fleet > Accident & Injury Report */}
            {subView === "incidents" && <AccidentInjuryView />}
          </ErrorBoundary>
        </div>
      </div>
    </GlassAppLayout>
  );
};

export default FleetPage;
