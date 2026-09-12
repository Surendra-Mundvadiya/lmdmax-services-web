import React, { FC } from "react";
import { Smartphone, ShieldCheck } from "lucide-react";
import type { Driver } from "../../../types/driver";
import { useDriverStore } from "../../../store/driverStore";

interface DriverExpandedRowProps {
  driver: Driver;
  onViewProfile?: (driver: Driver) => void;
  onNotification?: (msg: { text: string; type: "success" | "error" }) => void;
}

export const DriverExpandedRow: FC<DriverExpandedRowProps> = ({
  driver,
  onNotification,
}) => {
  const toggleDriverSignin = useDriverStore((state) => state.toggleDriverSignin);
  const toggleDriverInspections = useDriverStore((state) => state.toggleDriverInspections);

  return (
    <div className="driver-expand-card driver-expand-simplified">
      <div className="driver-expand-permissions-row">
        {/* 1. Driver Sign In Toggle */}
        <div className="expand-permission-card">
          <div className="permission-card-icon-wrap text-blue-600 bg-blue-50">
            <Smartphone size={18} />
          </div>
          <div className="permission-card-content">
            <span className="permission-card-title">Driver Sign In</span>
            <span className="permission-card-desc">Allow driver mobile app sign-in access</span>
          </div>
          <label className="custom-blue-switch" title="Toggle driver mobile app sign-in">
            <input
              type="checkbox"
              checked={driver.allow_signin}
              disabled={driver.status === "inactive"}
              onChange={() => {
                toggleDriverSignin(driver.id);
                onNotification?.({
                  text: "Driver sign-in permission updated successfully!",
                  type: "success",
                });
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>

        {/* 2. Driver Inspection Allow Option */}
        <div className="expand-permission-card">
          <div className="permission-card-icon-wrap text-emerald-600 bg-emerald-50">
            <ShieldCheck size={18} />
          </div>
          <div className="permission-card-content">
            <span className="permission-card-title">Driver Inspection</span>
            <span className="permission-card-desc">Allow daily vehicle inspection checks</span>
          </div>
          <label className="custom-blue-switch" title="Toggle driver vehicle inspection permission">
            <input
              type="checkbox"
              checked={driver.allow_inspections}
              disabled={!driver.allow_signin || driver.status === "inactive"}
              onChange={() => {
                toggleDriverInspections(driver.id);
                onNotification?.({
                  text: "Driver inspection permission updated successfully!",
                  type: "success",
                });
              }}
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DriverExpandedRow;
