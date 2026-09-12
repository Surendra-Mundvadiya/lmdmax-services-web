import React, { FC, useState, useEffect, useMemo } from "react";
import { X, Shield, Building, Check, AlertCircle, Loader2 } from "lucide-react";
import type { AdminUser } from "../../../types/admin";
import { useAdminStore } from "../../../store/adminStore";
import { useAuthStore } from "../../../store/authStore";
import { validateEmail } from "../../../utils/validators";

interface EditAdminModalProps {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminName: string) => void;
}

export const EditAdminModal: FC<EditAdminModalProps> = ({
  admin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const updateAdminApi = useAdminStore((state) => state.updateAdminApi);
  const stations = useAuthStore((state) => state.stations);
  const allStations = useAuthStore((state) => state.allStations);

  // Derive active real delivery stations from Queen account
  const realStations = useMemo(() => {
    const list = stations.length > 0 ? stations : allStations;
    return list
      .filter((s) => s.active === true)
      .map((s) => ({
        id: String(s.company_id),
        code: s.station_code,
      }))
      .filter((s, idx, arr) => arr.findIndex((x) => x.code === s.code) === idx);
  }, [stations, allStations]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (admin) {
      setName(admin.name || `${admin.first_name || ""} ${admin.last_name || ""}`.trim());
      setEmail(admin.email && admin.email !== "—" && admin.email !== "*****" ? admin.email : "");
      
      const cleanPhone = (admin.phone || "").replace(/\D/g, "");
      setPhone(cleanPhone.length === 10 ? cleanPhone : admin.phone && admin.phone !== "—" ? admin.phone : "");

      // Resolve admin's stations: map company_ids to station codes or keep codes
      const adminStationCodes = (admin.stations || [])
        .map((st) => {
          const matched = realStations.find((rs) => String(rs.id) === String(st) || rs.code === st);
          return matched ? matched.code : st;
        })
        .filter((code) => realStations.some((rs) => rs.code === code));

      setSelectedStations(
        adminStationCodes.length > 0
          ? adminStationCodes
          : realStations.length > 0
          ? [realStations[0].code]
          : ["QUE2"]
      );

      setErrors({});
      setServerError(null);
    }
  }, [admin, realStations]);

  if (!isOpen || !admin) return null;

  const handleStationToggle = (code: string) => {
    setSelectedStations((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 3) return prev; // Max 3 stations
      return [...prev, code];
    });
    if (errors.stations) {
      setErrors((prev) => ({ ...prev, stations: "" }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = "Full name is required";
    } else if (name.trim().length < 3) {
      errs.name = "Name must be at least 3 characters";
    }

    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!validateEmail(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      errs.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      errs.phone = "Please enter a valid 10-digit phone number";
    }

    if (selectedStations.length === 0) {
      errs.stations = "Please select at least one delivery station";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    // Map station codes back to company_ids
    const targetCompanyIds = selectedStations
      .map((code) => {
        const matched = realStations.find((s) => s.code === code);
        return matched ? String(matched.id) : null;
      })
      .filter(Boolean) as string[];

    try {
      const res = await updateAdminApi(admin.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ""),
        station_code: targetCompanyIds,
      });

      if (res.success) {
        onSuccess(name.trim());
        onClose();
      } else {
        setServerError(res.message || "Failed to update administrator");
      }
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-dialog max-w-lg">
        {/* Modal Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="custom-modal-title">Edit Administrator</h3>
              <p className="text-xs text-slate-500">
                Update account details and station assignments
              </p>
            </div>
          </div>
          <button
            type="button"
            className="custom-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="custom-modal-body flex flex-col gap-4 py-4">
          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* 1. Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full h-10 px-3 text-sm text-slate-900 bg-white border rounded-md outline-none transition-all ${
                errors.name ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              }`}
              placeholder="Enter full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
            />
            {errors.name && <span className="text-xs text-red-600 font-medium">{errors.name}</span>}
          </div>

          {/* 2. Email ID & Phone Number (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`w-full h-10 px-3 text-sm text-slate-900 bg-white border rounded-md outline-none transition-all ${
                  errors.email ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                }`}
                placeholder="Enter email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {errors.email && <span className="text-xs text-red-600 font-medium">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                className={`w-full h-10 px-3 text-sm text-slate-900 bg-white border rounded-md outline-none transition-all ${
                  errors.phone ? "border-red-500 bg-red-50" : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                }`}
                placeholder="10 digit phone number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                }}
              />
              {errors.phone && <span className="text-xs text-red-600 font-medium">{errors.phone}</span>}
            </div>
          </div>

          {/* 3. Station Code */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Station Code <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Max 3 stations</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {realStations.map((st) => {
                const isSelected = selectedStations.includes(st.code);
                return (
                  <button
                    key={st.code}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-600 text-blue-600 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                    }`}
                    onClick={() => handleStationToggle(st.code)}
                    title={`Assign station ${st.code}`}
                  >
                    <Building size={13} />
                    <span>{st.code}</span>
                    {isSelected && <Check size={13} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>
            {errors.stations && <span className="text-xs text-red-600 font-medium">{errors.stations}</span>}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer" style={{ display: "flex", gap: "0.85rem", justifyContent: "flex-end", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #E2E8F0" }}>
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
              className="btn-blue-primary"
              disabled={isSubmitting || selectedStations.length === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span className="text-white">Saving...</span>
                </>
              ) : (
                <span className="text-white">Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminModal;
