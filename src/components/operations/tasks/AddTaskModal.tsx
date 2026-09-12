import React, { FC, useState, useMemo } from "react";
import { ArrowLeft, X, Search, Check, AlertCircle, Tag, Plus } from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useAuthStore } from "../../../store/authStore";
import { useAdminStore } from "../../../store/adminStore";
import { getAvatarColor, getInitials } from "../../../utils/avatarUtils";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { tag_message: string; tagged: string; type?: string }) => Promise<void>;
  embedded?: boolean;
}

export const AddTaskModal: FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  embedded = false,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const authStations = useAuthStore((state) => state.stations);
  const activeStationObj = authStations.find((s) => s.current) || authStations[0];
  const activeStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    useAuthStore.getState().user?.company?.station_code ||
    "QUE4";

  const admins = useAdminStore((state) => state.admins);

  const [message, setMessage] = useState("");
  const [taggedAccountId, setTaggedAccountId] = useState("");
  const [searchAssignee, setSearchAssignee] = useState("");
  const [taskType, setTaskType] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available admins to tag
  const availableAdmins = useMemo(() => {
    const list: { id: string; name: string; email?: string; role?: string }[] = [];

    if (currentUser) {
      list.push({
        id: String(currentUser.account_id || currentUser.id || currentUser.email || "me"),
        name: `${currentUser.name || "You"} (Current User)`,
        email: currentUser.email,
        role: "You",
      });
    }

    admins.forEach((a) => {
      const idStr = String(a.account_id || a.id);
      if (currentUser && String(currentUser.account_id || currentUser.id) === idStr) return;
      list.push({
        id: idStr,
        name: a.name || a.first_name || a.email || "Admin",
        email: a.email,
        role: a.role || "Admin",
      });
    });

    return list;
  }, [currentUser, admins]);

  const filteredAdmins = useMemo(() => {
    if (!searchAssignee.trim()) return availableAdmins;
    const q = searchAssignee.toLowerCase().trim();
    return availableAdmins.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.email && a.email.toLowerCase().includes(q))
    );
  }, [availableAdmins, searchAssignee]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please describe the task");
      return;
    }

    const assigneeVal = taggedAccountId.trim() || String(currentUser?.account_id || currentUser?.id || "General");

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        tag_message: message.trim(),
        tagged: assigneeVal,
        type: taskType,
      });
      setMessage("");
      setTaggedAccountId("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAdminObj = availableAdmins.find((a) => a.id === taggedAccountId);

  if (!isOpen) return null;

  const formFields = (
    <div className="tasks-modal-body" style={embedded ? { padding: 0 } : undefined}>
      {error && (
        <div
          style={{
            padding: "0.6rem 0.85rem",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            color: "#991B1B",
            fontSize: "0.775rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Task Type Selector */}
      <div className="tasks-form-group">
        <label className="tasks-form-label">Duty / Task Type</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "general", label: "General Duty" },
            { id: "chat", label: "Communication / Chat" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTaskType(t.id)}
              className={`tasks-type-btn ${taskType === t.id ? "active" : ""}`}
              style={{ flex: 1, padding: "0.45rem" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Message Input */}
      <div className="tasks-form-group">
        <label className="tasks-form-label">
          Task Description / Instruction <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write task details, instructions or action items needed..."
          rows={4}
          className="tasks-textarea"
          required
        />
      </div>

      {/* Tagged Admin Dropdown / Selector */}
      <div className="tasks-form-group">
        <label className="tasks-form-label">
          Tag Dispatcher / Admin (Assignee)
        </label>

        {/* Search Assignee */}
        <div className="tasks-search-assignee">
          <Search size={14} className="tasks-search-icon" />
          <input
            type="text"
            placeholder="Search station admins..."
            value={searchAssignee}
            onChange={(e) => setSearchAssignee(e.target.value)}
            className="tasks-search-input"
          />
        </div>

        {/* Admin List */}
        <div className="tasks-admin-list">
          {filteredAdmins.map((adm) => {
            const isSelected = taggedAccountId === adm.id;
            return (
              <div
                key={adm.id}
                onClick={() => setTaggedAccountId(isSelected ? "" : adm.id)}
                className={`tasks-admin-item ${isSelected ? "selected" : ""}`}
              >
                <div className="tasks-admin-item-left">
                  <span
                    className="task-avatar"
                    style={{
                      backgroundColor: getAvatarColor(adm.name),
                      width: 22,
                      height: 22,
                      fontSize: "0.65rem",
                    }}
                  >
                    {getInitials(adm.name)}
                  </span>
                  <div>
                    <div style={{ fontSize: "0.775rem", fontWeight: 600, color: "#1E293B" }}>
                      {adm.name}
                    </div>
                    {adm.email && (
                      <div style={{ fontSize: "0.6875rem", color: "#64748B" }}>{adm.email}</div>
                    )}
                  </div>
                </div>

                {isSelected && <Check size={14} style={{ color: "#2563EB" }} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* 1. Header: Back + Title on Left, Cancel & Submit Button on Right */}
        <div className="add-driver-header">
          <div className="add-driver-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to Tasks"
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              <span>Back to Tasks</span>
            </button>
            <div className="screen-title-divider" />
            <h2 className="screen-heading">Add Task</h2>
          </div>

          <div className="add-driver-header-right">
            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-task-form"
              className="btn-blue-primary"
              disabled={isSubmitting || !message.trim()}
              style={{ color: "#FFFFFF" }}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span style={{ color: "#FFFFFF" }}>Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={15} style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF" }}>Create Task</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Main Form Card */}
        <div className="add-driver-card">
          <form
            id="add-task-form"
            onSubmit={handleSubmit}
            className="add-driver-form"
            noValidate
          >
            {formFields}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tasks-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="tasks-modal-card">
        {/* Header */}
        <div className="tasks-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Tag size={15} />
            </div>
            <div>
              <h2 className="tasks-modal-title">Create New Task</h2>
              <div style={{ fontSize: "0.725rem", color: "#64748B" }}>
                Station {activeStationCode} • Tag & track operational action items
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="tasks-modal-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          {formFields}
          <div className="tasks-modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="btn-add-task"
              style={{ padding: "0.45rem 1.1rem" }}
            >
              <span style={{ color: "#FFFFFF" }}>
                {isSubmitting ? "Creating..." : "Create Task"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
