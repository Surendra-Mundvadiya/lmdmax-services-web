import React, { FC, useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Hash,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Camera,
} from "lucide-react";
import { curationApi } from "../../api/curationApi";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import { useCurationStore } from "../../store/curationStore";

export interface AddDriverFromCurationProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    name: string;
    transporter_id?: string;
    netradyne_id?: string;
    curation_id?: string;
    curation_type?: "unified" | "netradyne" | "ementor";
  };
  onSuccess?: (newDriverName: string) => void;
}

export const AddDriverFromCurationModal: FC<AddDriverFromCurationProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const stations = useAuthStore((state) => state.stations);
  const activeStationObj = stations.find((s) => s.current) || stations[0];
  const defaultStationCode =
    activeStationObj?.station_code ||
    useAuthStore.getState().user?.station_code ||
    "QUE2";

  const createDriverAsync = useDriverStore((state) => state.createDriverAsync);
  const fetchDrivers = useDriverStore((state) => state.fetchDrivers);
  const fetchCurationCount = useCurationStore((state) => state.fetchCurationCount);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [netradyneId, setNetradyneId] = useState("");
  const [selectedStation, setSelectedStation] = useState(defaultStationCode);
  const [allowSignin, setAllowSignin] = useState(true);
  const [allowInspections, setAllowInspections] = useState(true);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Populate when modal opens
  useEffect(() => {
    if (isOpen && initialData) {
      const rawName = (initialData.name || "").trim();
      const parts = rawName.split(/\s+/);
      const fName = parts[0] || "";
      const lName = parts.slice(1).join(" ") || "";

      setFirstName(fName);
      setLastName(lName);
      setTransporterId(initialData.transporter_id || "");
      setNetradyneId(initialData.netradyne_id || "");
      setSelectedStation(defaultStationCode);
      setEmail("");
      setPhone("");
      setAllowSignin(true);
      setAllowInspections(true);
      setErrorMsg(null);
    }
  }, [isOpen, initialData, defaultStationCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (!trimmedFirst) {
      setErrorMsg("First name is required.");
      return;
    }
    if (!trimmedLast) {
      setErrorMsg("Last name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("A valid email address is required.");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create driver in fleet users microservice & driverStore
      const createdDriver = await createDriverAsync({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        email: email.trim(),
        phone: phone.trim(),
        transporter_id: transporterId.trim() || `TID-${Date.now()}`,
        netradyne_id: netradyneId.trim() || null,
        status: "active",
        allow_signin: allowSignin,
        allow_inspections: allowInspections,
        stations: [{ station_code: selectedStation }],
        address: "",
        hire_date: new Date().toISOString().split("T")[0],
        date_of_birth: "",
        work_anniversary: new Date().toISOString().split("T")[0],
      });

      // 2. Associate name in performance service
      if (createdDriver && (transporterId.trim() || netradyneId.trim())) {
        try {
          await curationApi.addAssociatedNames(
            fullName,
            createdDriver.id,
            initialData?.netradyne_id ? { [initialData.netradyne_id]: fullName } : undefined
          );
        } catch (assocErr) {
          console.warn("curationApi.addAssociatedNames note:", assocErr);
        }
      }

      // 3. Delete / resolve curation record if curation_id provided
      if (initialData?.curation_id) {
        try {
          await curationApi.deleteCuration(
            initialData.curation_id,
            initialData.curation_type === "unified" ? "transporter_id" : "netradyne_id"
          );
        } catch (delErr) {
          console.warn("curationApi.deleteCuration note:", delErr);
        }
      }

      // 4. Force synchronization of active driver roster so driver is visible on Drivers screen immediately
      await fetchDrivers();

      // 5. Refresh curation count
      await fetchCurationCount(true);

      onSuccess?.(fullName);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to add driver from curation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-dialog"
        style={{ maxWidth: "560px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="custom-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Add Driver from Curation</h3>
              <p className="text-xs text-slate-500">
                Register pending curation record into active fleet driver roster
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Transporter ID & Netradyne ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transporter ID
                </label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. T-10294"
                    value={transporterId}
                    onChange={(e) => setTransporterId(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Netradyne ID
                </label>
                <div className="relative">
                  <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. NET-8823"
                    value={netradyneId}
                    onChange={(e) => setNetradyneId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Station Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Station
              </label>
              <div className="relative">
                <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                >
                  {stations.map((st) => (
                    <option key={st.station_code} value={st.station_code}>
                      {st.station_code} - {st.company_name || "Station"}
                    </option>
                  ))}
                  {stations.length === 0 && (
                    <option value={defaultStationCode}>{defaultStationCode}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Permissions & Toggles */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allowSignin}
                  onChange={(e) => setAllowSignin(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Allow Driver App Sign-in</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allowInspections}
                  onChange={(e) => setAllowInspections(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Allow Vehicle Inspections</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="custom-modal-footer">
            <button
              type="button"
              className="btn-outline-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-blue-primary flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-white" />
                  <span>Adding Driver...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} className="text-white" />
                  <span>Save & Add Driver</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDriverFromCurationModal;
