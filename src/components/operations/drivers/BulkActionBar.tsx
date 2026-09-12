import React, { FC } from "react";
import { CheckSquare, UserCheck, UserX, Key, KeyRound, X } from "lucide-react";
import { useDriverStore } from "../../../store/driverStore";

interface BulkActionBarProps {
  selectedDriverIds: number[];
  totalCount: number;
  onClearSelection: () => void;
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const BulkActionBar: FC<BulkActionBarProps> = ({
  selectedDriverIds,
  totalCount,
  onClearSelection,
  onNotification,
}) => {
  const bulkUpdateStatus = useDriverStore((state) => state.bulkUpdateStatus);
  const bulkUpdateSignin = useDriverStore((state) => state.bulkUpdateSignin);

  if (selectedDriverIds.length === 0) return null;

  const count = selectedDriverIds.length;

  const handleStatusChange = (status: "active" | "inactive") => {
    bulkUpdateStatus(selectedDriverIds, status);
    onNotification({
      text: "Selected drivers updated successfully!",
      type: "success",
    });
    onClearSelection();
  };

  const handleSigninChange = (enable: boolean) => {
    bulkUpdateSignin(selectedDriverIds, enable);
    onNotification({
      text: "Driver sign-in permissions updated successfully!",
      type: "success",
    });
    onClearSelection();
  };

  return (
    <div className="bulk-action-bar-container">
      <div className="bulk-bar-left">
        <CheckSquare size={16} style={{ color: "var(--ads-blue)" }} />
        <span className="bulk-selected-count">
          <strong>{count}</strong> of {totalCount} drivers selected
        </span>
      </div>

      <div className="bulk-actions-group">
        <button
          type="button"
          className="btn-bulk-action btn-bulk-success"
          onClick={() => handleStatusChange("active")}
          title="Mark selected as Active"
        >
          <UserCheck size={14} />
          <span>Set Active</span>
        </button>

        <button
          type="button"
          className="btn-bulk-action btn-bulk-warning"
          onClick={() => handleStatusChange("inactive")}
          title="Mark selected as Inactive"
        >
          <UserX size={14} />
          <span>Set Inactive</span>
        </button>

        <button
          type="button"
          className="btn-bulk-action btn-bulk-blue"
          onClick={() => handleSigninChange(true)}
          title="Enable LMD Drive Sign In"
        >
          <Key size={14} />
          <span>Enable Sign-in</span>
        </button>

        <button
          type="button"
          className="btn-bulk-action btn-bulk-slate"
          onClick={() => handleSigninChange(false)}
          title="Revoke LMD Drive Sign In"
        >
          <KeyRound size={14} />
          <span>Revoke Sign-in</span>
        </button>

        <button
          type="button"
          className="btn-bulk-clear"
          onClick={onClearSelection}
          title="Clear selection"
        >
          <X size={14} />
          <span>Deselect All</span>
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
