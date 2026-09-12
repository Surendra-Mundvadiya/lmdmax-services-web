import React, { FC, useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  Camera,
  ShieldCheck,
  Maximize2,
} from "lucide-react";
import { InspectionRecord, ChecklistItem } from "../../../api/fleetApi";

interface InspectionReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: InspectionRecord | null;
  onReassignVehicle?: (inspection: InspectionRecord) => void;
}

export const InspectionReportDrawer: FC<InspectionReportDrawerProps> = ({
  isOpen,
  onClose,
  inspection,
  onReassignVehicle,
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | "exterior" | "powertrain" | "interior" | "safety">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedPhoto, onClose]);

  if (!isOpen || !inspection) return null;

  const checklist = inspection.checklist || [];
  const filteredChecklist = activeCategory === "all"
    ? checklist
    : checklist.filter((item) => item.category === activeCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            PASS
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={13} className="text-amber-600" />
            CAUTION
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} className="text-rose-600" />
            FAIL / GROUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            PENDING
          </span>
        );
    }
  };

  const getItemStatusBadge = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} className="text-emerald-600" />
            Satisfactory
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={11} className="text-amber-600" />
            Attention Needed
          </span>
        );
      case "fail":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={11} className="text-rose-600" />
            Defect / Grounded
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l-2 border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="p-5 border-b-2 border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Inspection Report
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {inspection.shift_type || "Daily Inspection"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono text-slate-500">#{inspection.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={20} className="text-blue-600" />
                  {inspection.vehicle_unit || "Vehicle"}
                </h3>
                {getStatusBadge(inspection.status)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>VIN: <strong className="font-mono text-slate-700">{inspection.vin || "—"}</strong></span>
                <span>•</span>
                <span>Plate: <strong className="text-slate-700">{inspection.license_plate || "—"}</strong></span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close drawer (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Quick Summary Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                  <User size={13} className="text-blue-600" />
                  <span>Driver</span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {inspection.driver_name || "Unassigned"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {inspection.driver_id ? `ID: #${inspection.driver_id}` : "Assigned"}
                </div>
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                  <Calendar size={13} className="text-blue-600" />
                  <span>Inspection Date</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {inspection.date || "Today"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {inspection.shift_type || "RTS Check"}
                </div>
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                  <Gauge size={13} className="text-blue-600" />
                  <span>Odometer</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {inspection.odometer ? `${inspection.odometer.toLocaleString()} mi` : "—"}
                </div>
                <div className="text-[10px] text-slate-400">
                  Verified by driver
                </div>
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                  <Fuel size={13} className="text-blue-600" />
                  <span>Fuel / Battery</span>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {inspection.fuel_level || "Full (100%)"}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">
                  Operating level
                </div>
              </div>
            </div>

            {/* Defect / Notes Warning Banner if flagged */}
            {(inspection.status === "failed" || inspection.status === "caution" || (inspection.defects_found && inspection.defects_found > 0)) && (
              <div
                className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  inspection.status === "failed"
                    ? "bg-rose-50/80 border-rose-200 text-rose-900"
                    : "bg-amber-50/80 border-amber-200 text-amber-900"
                }`}
              >
                <div className="mt-0.5">
                  {inspection.status === "failed" ? (
                    <XCircle size={18} className="text-rose-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                    {inspection.status === "failed"
                      ? "Grounded / Critical Defects Reported"
                      : "Caution Items Noted"}
                  </h4>
                  <p className="text-xs leading-relaxed">
                    {inspection.notes ||
                      "Driver or safety inspector flagged physical items during vehicle return check. Requires maintenance dispatch review."}
                  </p>
                </div>
              </div>
            )}

            {/* Itemized Checklist Tabs & Questions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Itemized DVIC Checklist Questions
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {checklist.filter((i) => i.status === "pass").length} / {checklist.length} Passed
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-3 overflow-x-auto">
                {[
                  { id: "all", label: "All Items" },
                  { id: "exterior", label: "Exterior & Body" },
                  { id: "powertrain", label: "Powertrain & Brakes" },
                  { id: "interior", label: "Interior & Controls" },
                  { id: "safety", label: "Safety Gear" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeCategory === cat.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-2">
                {filteredChecklist.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    No items found for this category.
                  </div>
                ) : (
                  filteredChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        item.status === "fail"
                          ? "bg-rose-50/50 border-rose-200"
                          : item.status === "caution"
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                            {getItemStatusBadge(item.status)}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {item.description}
                            </p>
                          )}
                          {item.notes && (
                            <div className="mt-2 text-[11px] font-semibold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200/60">
                              Inspector Note: {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Media & Photos Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera size={16} className="text-blue-600" />
                  Media & Photo Uploads ({inspection.images?.length || 0})
                </h4>
                <span className="text-xs text-slate-400">Timestamped Inspection Captures</span>
              </div>

              {(!inspection.images || inspection.images.length === 0) ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-400">
                  <Camera size={24} className="mx-auto mb-1.5 opacity-40" />
                  No defect or exterior photos uploaded with this inspection.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inspection.images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative aspect-video rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 cursor-pointer shadow-xs"
                      onClick={() => setSelectedPhoto(img)}
                    >
                      <img
                        src={img}
                        alt={`Inspection capture ${i + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verification / Submission Details Footer Card */}
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Submission Source</span>
                <span className="font-semibold text-slate-800">
                  {inspection.submission_source || "Mobile Driver App"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Verified By</span>
                <span className="font-semibold text-slate-800">
                  {inspection.verified_by || "Station Safety Lead"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Verified On</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {inspection.verified_on || inspection.created_at || "Today"}
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t-2 border-slate-200 bg-white flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close Report
            </button>

            {onReassignVehicle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReassignVehicle(inspection);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                style={{ color: "#FFFFFF" }}
              >
                <Truck size={14} style={{ color: "#FFFFFF" }} />
                <span>Reassign Vehicle</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Photo Modal Zoom */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
            >
              <X size={20} />
            </button>
            <img
              src={selectedPhoto}
              alt="Expanded preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionReportDrawer;
