import React, { FC, useState } from "react";
import {
  ArrowLeft,
  Truck,
  User,
  Calendar,
  Gauge,
  Fuel,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Link,
  Maximize2,
  X,
} from "lucide-react";
import { InspectionRecord } from "../../../api/fleetApi";

interface EmbeddedInspectionReportViewProps {
  inspection: InspectionRecord;
  onBack: () => void;
  onReassignVehicle?: (inspection: InspectionRecord) => void;
}

export const EmbeddedInspectionReportView: FC<EmbeddedInspectionReportViewProps> = ({
  inspection,
  onBack,
  onReassignVehicle,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "exterior" | "powertrain" | "interior" | "safety"
  >("all");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const checklist = inspection.checklist || [];
  const filteredChecklist =
    activeCategory === "all"
      ? checklist
      : checklist.filter((item) => item.category === activeCategory);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-600" />
            PASS / OPERATIONAL
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={14} className="text-amber-600" />
            CAUTION REQUIRED
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={14} className="text-rose-600" />
            GROUNDED / DEFECTIVE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  const getItemStatusBadge = (status: "pass" | "caution" | "fail") => {
    switch (status) {
      case "pass":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} className="text-emerald-600" />
            Passed
          </span>
        );
      case "caution":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={11} className="text-amber-600" />
            Caution
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
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-200">
      {/* Top Header Card with Back Button */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Inspections</span>
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Inspection Report
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {inspection.shift_type || "Daily Inspection"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-500">#{inspection.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Truck size={22} className="text-blue-600" />
                  {inspection.vehicle_unit || "Vehicle Unit"}
                </h2>
                {getStatusBadge(inspection.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReassignVehicle && (
              <button
                type="button"
                onClick={() => onReassignVehicle(inspection)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                <Link size={14} />
                <span>Reassign Vehicle</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>
            VIN: <strong className="font-mono text-slate-700">{inspection.vin || "—"}</strong>
          </span>
          <span>•</span>
          <span>
            License Plate: <strong className="text-slate-700">{inspection.license_plate || "—"}</strong>
          </span>
          <span>•</span>
          <span>
            Make/Model: <strong className="text-slate-700">{(inspection as any).make || "Fleet"} {(inspection as any).model || "Transit"}</strong>
          </span>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <User size={14} className="text-blue-600" />
              <span>Assigned Driver</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {inspection.driver_name || "Unassigned"}
            </div>
            <div className="text-[11px] text-slate-400">
              {inspection.driver_id ? `ID #${inspection.driver_id}` : "Fleet Driver"}
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Calendar size={14} className="text-blue-600" />
              <span>Inspection Date</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {inspection.date || "Today"}
            </div>
            <div className="text-[11px] text-slate-400">
              {inspection.shift_type || "RTS Check"}
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Gauge size={14} className="text-blue-600" />
              <span>Odometer</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {inspection.odometer ? `${inspection.odometer.toLocaleString()} mi` : "—"}
            </div>
            <div className="text-[11px] text-slate-400">
              Verified by driver
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <Fuel size={14} className="text-blue-600" />
              <span>Fuel / Battery</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {inspection.fuel_level || "Full (100%)"}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              Operating level
            </div>
          </div>
        </div>

        {/* Defects Alert Banner if applicable */}
        {(inspection.status === "failed" ||
          inspection.status === "caution" ||
          (inspection.defects_found && inspection.defects_found > 0)) && (
          <div
            className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
              inspection.status === "failed"
                ? "bg-rose-50/80 border-rose-200 text-rose-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
          >
            <div className="mt-0.5">
              {inspection.status === "failed" ? (
                <XCircle size={20} className="text-rose-600" />
              ) : (
                <AlertTriangle size={20} className="text-amber-600" />
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
                  "Driver or safety inspector flagged physical items during vehicle return check. Requires maintenance review."}
              </p>
            </div>
          </div>
        )}

        {/* Itemized Checklist Tabs & Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              Itemized DVIC Checklist Questions
            </h4>
            <span className="text-xs font-semibold text-slate-500">
              {checklist.filter((i) => i.status === "pass").length} / {checklist.length} Passed
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-4 overflow-x-auto">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Checklist Items List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredChecklist.length === 0 ? (
              <div className="col-span-2 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No checklist items found for this category.
              </div>
            ) : (
              filteredChecklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border-2 transition-all ${
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
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera size={18} className="text-blue-600" />
              Inspection Photos & Captures ({inspection.images?.length || 0})
            </h4>
            <span className="text-xs text-slate-400">Timestamped Inspection Captures</span>
          </div>

          {!inspection.images || inspection.images.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-400">
              <Camera size={28} className="mx-auto mb-2 opacity-40 text-slate-400" />
              No defect or exterior photos uploaded with this inspection.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                    <Maximize2 size={18} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Footer Metadata */}
        <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Submission Source: <strong className="text-slate-800">{inspection.submission_source || "Mobile Driver App"}</strong>
          </div>
          <div>
            Verified On: <strong className="text-slate-800">{inspection.verified_on ? new Date(inspection.verified_on).toLocaleString() : "Submitted"}</strong>
          </div>
          <div>
            Inspector: <strong className="text-slate-800">{inspection.verified_by || inspection.driver_name || "Self-Reported"}</strong>
          </div>
        </div>
      </div>

      {/* Lightbox for inspecting captured photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={selectedPhoto}
              alt="Inspection photo enlarged"
              className="max-h-[85vh] max-w-full object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedInspectionReportView;
