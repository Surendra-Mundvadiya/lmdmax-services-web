import React, { FC, useState } from "react";
import { ArrowLeft, X, Plus, Trash2, RotateCcw, AlertCircle, Check, SlidersHorizontal } from "lucide-react";
import { calloutRescueApi } from "../../../api/calloutRescueApi";

interface CalloutTypeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  deleted: string[];
  onTypesUpdated: (options: string[], deleted: string[]) => void;
  embedded?: boolean;
}

export const CalloutTypeManagerModal: FC<CalloutTypeManagerModalProps> = ({
  isOpen,
  onClose,
  options,
  deleted,
  onTypesUpdated,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  const [newTypeName, setNewTypeName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    if (options.some((opt) => opt.toLowerCase() === trimmed.toLowerCase())) {
      setError("This callout type already exists in active types.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const newOptions = [...options, trimmed];
      const newDeleted = deleted.filter((d) => d.toLowerCase() !== trimmed.toLowerCase());
      await calloutRescueApi.updateCalloutTypes({
        list: newOptions,
        deleted: newDeleted,
      });
      onTypesUpdated(newOptions, newDeleted);
      setNewTypeName("");
    } catch (err: any) {
      setError(err.message || "Failed to add callout type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteType = async (typeToDelete: string) => {
    if (options.length <= 1) {
      setError("Cannot delete all callout types. At least one type must remain.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const newOptions = options.filter((opt) => opt !== typeToDelete);
      const newDeleted = [...deleted, typeToDelete];
      await calloutRescueApi.updateCalloutTypes({
        list: newOptions,
        deleted: newDeleted,
      });
      onTypesUpdated(newOptions, newDeleted);
    } catch (err: any) {
      setError(err.message || "Failed to delete callout type");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreType = async (typeToRestore: string) => {
    try {
      setIsSaving(true);
      setError(null);
      const newOptions = [...options, typeToRestore];
      const newDeleted = deleted.filter((d) => d !== typeToRestore);
      await calloutRescueApi.updateCalloutTypes({
        list: newOptions,
        deleted: newDeleted,
      });
      onTypesUpdated(newOptions, newDeleted);
    } catch (err: any) {
      setError(err.message || "Failed to restore callout type");
    } finally {
      setIsSaving(false);
    }
  };

  const tabsHeader = (
    <div className="flex items-center px-6 pt-4 border-b border-slate-100 gap-4 text-xs font-semibold">
      <button
        type="button"
        onClick={() => setActiveTab("active")}
        className={`pb-2.5 border-b-2 transition ${
          activeTab === "active"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        Active Types ({options.length})
      </button>
      <button
        type="button"
        onClick={() => setActiveTab("deleted")}
        className={`pb-2.5 border-b-2 transition ${
          activeTab === "deleted"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        Archived Types ({deleted.length})
      </button>
    </div>
  );

  const managerContent = (
    <div className="p-6 space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === "active" ? (
        <>
          {/* Add form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter new callout type or template..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={isSaving || !newTypeName.trim()}
              style={{ color: "#FFFFFF" }}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition flex items-center gap-1 shrink-0"
            >
              <Plus size={14} />
              <span style={{ color: "#FFFFFF" }}>Add Type</span>
            </button>
          </form>

          {/* List */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {options.map((opt) => (
              <div key={opt} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <span className="font-medium text-slate-800">{opt}</span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleDeleteType(opt)}
                  title="Delete / Archive Type"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
          {deleted.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No archived callout types</div>
          ) : (
            deleted.map((opt) => (
              <div key={opt} className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <span className="text-slate-500 line-through">{opt}</span>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRestoreType(opt)}
                  title="Restore Type"
                  className="px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container" style={{ minHeight: "100%", padding: "1.5rem" }}>
        {/* Top Navigation Header */}
        <div className="screen-nav-header" style={{ marginBottom: "1.5rem" }}>
          <div className="screen-nav-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to Callouts"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: "#1E293B",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Callouts</span>
            </button>
            <div className="screen-heading">
              <h1 className="screen-title" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                Manage Callout Types & Templates
              </h1>
              <p className="screen-subtitle" style={{ fontSize: "0.8125rem", color: "#64748B", margin: "0.2rem 0 0 0" }}>
                Customize and configure categories and reason templates available for driver callouts
              </p>
            </div>
          </div>
          <div className="screen-nav-right">
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <span style={{ color: "#FFFFFF" }}>Done</span>
            </button>
          </div>
        </div>

        {/* Card Container */}
        <div style={{ maxWidth: 740, margin: "0 auto", width: "100%" }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            {tabsHeader}
            {managerContent}
            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.45rem 1.15rem",
                  borderRadius: "7px",
                  border: "none",
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                <span style={{ color: "#FFFFFF" }}>Done</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Manage Callout Types</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize categories available for driver callouts</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {tabsHeader}
        {managerContent}

        <div className="flex justify-end px-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
