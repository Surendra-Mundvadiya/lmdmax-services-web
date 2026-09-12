import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Send,
  FileCheck,
  Search,
  Check,
  Paperclip,
  Upload,
  AlertTriangle,
  FileText,
  MessageSquare,
  Smartphone,
  Mail,
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useDriverStore } from "../../../store/driverStore";
import { useAuthStore } from "../../../store/authStore";
import { ESignatureApi, ESignatureChannel } from "../../../api/eSignatureApi";
import ESignatureDocumentPreview from "./ESignatureDocumentPreview";
import "./esignature.css";

export interface ESignatureSendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDocumentType?: "acknowledgement" | "write-up";
  initialDriverId?: string | number;
  embedded?: boolean;
}

const DEFAULT_VIOLATIONS = [
  "Speeding",
  "Stop Sign Violation",
  "Distracted Driving / Phone",
  "Seatbelt Non-Compliance",
  "Following Distance Violation",
  "Attendance / Late Arrival",
  "Callout Without Notice",
  "Vehicle Care & DVIC Neglect",
  "Customer Escalation / Concession",
  "Package Handling & Delivery Defects",
  "Station & Safety Policy Violation",
  "General Conduct",
];

const PRESET_TEMPLATES = [
  {
    name: "Safe Driving & Speeding Policy",
    type: "write-up" as const,
    violations: ["Speeding"],
    title: "Speeding Safety Violation",
    notes:
      "Dear ${name},\n\nDuring your shift on Amazon delivery route, a severe speeding infraction was recorded by the Netradyne safety camera system. Maintaining a safe speed limit is strictly required by company and Amazon station safety guidelines.\n\nPlease review and digitally sign this write-up acknowledging understanding of our fleet speed limits and commitment to safe driving.",
  },
  {
    name: "Stop Sign Compliance Acknowledgement",
    type: "acknowledgement" as const,
    violations: ["Stop Sign Violation"],
    title: "Stop Sign Safety Acknowledgement",
    notes:
      "Dear ${name},\n\nThis form serves as an official acknowledgement regarding full stops at all stop signs and red lights while operating fleet vans. Rolling stops compromise on-road safety and result in direct tier infractions.\n\nPlease review and e-sign this acknowledgment committing to coming to a complete stop at all posted intersections.",
  },
  {
    name: "Attendance & Shift Reliability",
    type: "acknowledgement" as const,
    violations: ["Attendance / Late Arrival"],
    title: "Shift Attendance & Punctuality Policy",
    notes:
      "Dear ${name},\n\nReliable and punctual attendance is essential for dispatch scheduling and package route assignments. Unexcused late arrivals impact the entire team's departure wave.\n\nPlease sign below confirming review of our attendance and callout notification policy.",
  },
  {
    name: "Customer Delivery & Package Care",
    type: "write-up" as const,
    violations: ["Customer Escalation / Concession"],
    title: "Customer Escalation & Care",
    notes:
      "Dear ${name},\n\nA customer feedback escalation or concession was registered for deliveries assigned to your route. Professional customer service, careful package handling, and adhering to customer delivery notes are paramount.\n\nPlease sign this record acknowledging corrective action.",
  },
];

const generateRandomString = (len = 3) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};

export const ESignatureSendFormModal: React.FC<ESignatureSendFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDocumentType = "acknowledgement",
  initialDriverId,
  embedded = false,
}) => {
  const { drivers, fetchDrivers } = useDriverStore();
  const { user } = useAuthStore();

  // Wizard Steps: 0 = Form Details, 1 = Preview & Channels
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form State
  const [documentType, setDocumentType] = useState<"acknowledgement" | "write-up">(
    initialDocumentType
  );
  const [title, setTitle] = useState<string>("");
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [selectedViolations, setSelectedViolations] = useState<Set<string>>(new Set());
  const [customViolations, setCustomViolations] = useState<string[]>([]);
  const [newViolationInput, setNewViolationInput] = useState<string>("");
  const [showAddViolation, setShowAddViolation] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Delivery Channels
  const [channels, setChannels] = useState<{
    inapp: boolean;
    sms: boolean;
    email: boolean;
  }>({
    inapp: true,
    sms: true,
    email: false,
  });

  // UI / Search State
  const [driverSearch, setDriverSearch] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize drivers if needed
  useEffect(() => {
    if (isOpen && drivers.length === 0) {
      fetchDrivers();
    }
  }, [isOpen, drivers.length, fetchDrivers]);

  // Set initial driver if provided
  useEffect(() => {
    if (isOpen) {
      if (initialDriverId) {
        setSelectedDriverIds(new Set([String(initialDriverId)]));
        setIsBulkMode(false);
      }
      setDocumentType(initialDocumentType);
      setTitle(initialDocumentType === "acknowledgement" ? "Acknowledgement Form" : "Write-Up Report");
      setCurrentStep(0);
      setErrorMessage(null);
    }
  }, [isOpen, initialDriverId, initialDocumentType]);

  // Filtered active drivers
  const availableDrivers = useMemo(() => {
    const active = drivers.filter((d) => d.status === "active" || !d.status);
    if (!driverSearch.trim()) return active;
    const q = driverSearch.toLowerCase();
    return active.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.transporter_id && d.transporter_id.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q))
    );
  }, [drivers, driverSearch]);

  // Selected driver objects
  const selectedDriversList = useMemo(() => {
    return drivers.filter((d) => selectedDriverIds.has(String(d.id)));
  }, [drivers, selectedDriverIds]);

  const allViolationsList = useMemo(() => {
    return Array.from(new Set([...DEFAULT_VIOLATIONS, ...customViolations]));
  }, [customViolations]);

  const handleToggleDriver = (driverId: string) => {
    const updated = new Set(selectedDriverIds);
    if (!isBulkMode) {
      updated.clear();
      updated.add(driverId);
    } else {
      if (updated.has(driverId)) {
        updated.delete(driverId);
      } else {
        updated.add(driverId);
      }
    }
    setSelectedDriverIds(updated);
  };

  const handleSelectAllDrivers = () => {
    const allIds = new Set(availableDrivers.map((d) => String(d.id)));
    setSelectedDriverIds(allIds);
  };

  const handleClearDrivers = () => {
    setSelectedDriverIds(new Set());
  };

  const handleToggleViolation = (vio: string) => {
    const updated = new Set(selectedViolations);
    if (updated.has(vio)) {
      updated.delete(vio);
    } else {
      updated.add(vio);
    }
    setSelectedViolations(updated);
  };

  const handleAddCustomViolation = () => {
    const trimmed = newViolationInput.trim();
    if (!trimmed) return;
    if (!customViolations.includes(trimmed) && !DEFAULT_VIOLATIONS.includes(trimmed)) {
      setCustomViolations((prev) => [...prev, trimmed]);
    }
    setSelectedViolations((prev) => new Set([...prev, trimmed]));
    setNewViolationInput("");
    setShowAddViolation(false);
  };

  const handleApplyTemplate = (tmpl: (typeof PRESET_TEMPLATES)[0]) => {
    setDocumentType(tmpl.type);
    setTitle(tmpl.title);
    setSelectedViolations(new Set(tmpl.violations));
    setNotes(tmpl.notes);
    setTemplateDropdownOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Preview generated message
  const representativeDriverName =
    selectedDriversList.length > 0 ? selectedDriversList[0].name : "${name}";
  const previewNotificationMessage = useMemo(() => {
    const companyName = user?.company?.company_name || "DSP Fleet Management";
    const docTitle =
      title.trim() || (documentType === "acknowledgement" ? "Acknowledgement" : "Write-Up report");
    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    if (customMessage.trim()) {
      return customMessage
        .replace(/\$\{name\}/gi, representativeDriverName)
        .replace(/\$\{title\}/gi, docTitle)
        .replace(/\$\{company_name\}/gi, companyName);
    }

    return `Hi ${representativeDriverName}\n\nPlease e-sign the ${docTitle}.\nDate: ${todayStr}\n\nClick the link below 👇🏻 !!!\nLink :- \${link}\n\nRegards,\n${companyName}`;
  }, [customMessage, representativeDriverName, title, documentType, user?.company?.company_name]);

  // Validation before proceed to step 1
  const validateForm = (): string | null => {
    if (selectedDriverIds.size === 0) {
      return "Please select at least one recipient driver.";
    }
    if (selectedViolations.size === 0) {
      return "Please select at least one infraction or incident category.";
    }
    return null;
  };

  const handleGoToPreview = () => {
    const err = validateForm();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage(null);
    setCurrentStep(1);
  };

  // Submit form to live API
  const handleSubmit = async (saveAsDraft = false) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const activeChannelsList: ESignatureChannel[] = [];
      if (!saveAsDraft) {
        if (channels.inapp) activeChannelsList.push("inapp");
        if (channels.sms) activeChannelsList.push("sms");
        if (channels.email) activeChannelsList.push("email");

        if (activeChannelsList.length === 0) {
          throw new Error("Please select at least one delivery channel (SMS or In-App).");
        }
      }

      const todayIso = new Date().toISOString().split("T")[0];
      const docTitle =
        title.trim() || (documentType === "acknowledgement" ? "Acknowledgement" : "Write-Up report");
      const companyName = user?.company?.company_name || "DSP Fleet Management";

      const items = selectedDriversList.map((driver) => {
        const randKey = `${generateRandomString(3)}${driver.id}${generateRandomString(3)}`;
        const resolvedNotes = notes.replace(/\$\{name\}/gi, driver.name);
        const resolvedMsg = !saveAsDraft
          ? customMessage.trim()
            ? customMessage
                .replace(/\$\{name\}/gi, driver.name)
                .replace(/\$\{title\}/gi, docTitle)
                .replace(/\$\{company_name\}/gi, companyName)
            : `Hi ${driver.name}\n\nPlease e-sign the ${docTitle}.\nDate: ${new Date().toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              )}\n\nClick the link below 👇🏻 !!!\nLink :- \${link}\n\nRegards,\n${companyName}`
          : "";

        return {
          status: saveAsDraft ? "draft" : "sent",
          key: randKey,
          driver_id: String(driver.id),
          driver_name: driver.name,
          report_date: todayIso,
          report_type: documentType === "acknowledgement" ? "ack" : "write-up",
          title: docTitle,
          violation: Array.from(selectedViolations),
          notes: resolvedNotes,
          email: driver.email || "",
          message: resolvedMsg,
          sent_from: "message",
        };
      });

      const formData = new FormData();
      formData.append("e_sign_data", JSON.stringify(items));
      if (!saveAsDraft) {
        formData.append("channels", JSON.stringify(activeChannelsList));
      }
      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await ESignatureApi.createReport(formData);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[ESignature Submit Error]", err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || "Failed to create E-Signature. Please check details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formBody = (
    <div style={embedded ? { display: "flex", flexDirection: "column", gap: "1.25rem" } : undefined} className={!embedded ? "esign-modal-body" : undefined}>
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.65rem 0.95rem",
            backgroundColor: "var(--ads-red-tint)",
            border: "1px solid transparent",
            borderRadius: "var(--ads-r-sm)",
            color: "var(--ads-red)",
            fontSize: "0.775rem",
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={16} style={{ color: "var(--ads-red)", flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {currentStep === 0 ? (
        /* =========================================================================
            STEP 1: DOCUMENT TYPE, DRIVER SELECTION, VIOLATIONS, NOTES & ATTACHMENTS
           ========================================================================= */
        <>
          {/* 1. Document Type Switcher */}
          <div className="esign-form-group">
            <label className="esign-form-label">Select Document Type</label>
            <div className="esign-type-selector-grid">
              <div
                onClick={() => {
                  setDocumentType("acknowledgement");
                  if (!title || title === "Write-Up Report") setTitle("Acknowledgement Form");
                }}
                className={`esign-type-card ${documentType === "acknowledgement" ? "selected" : ""}`}
              >
                <div className="esign-type-radio-circle">
                  {documentType === "acknowledgement" && <Check size={11} strokeWidth={3} />}
                </div>
                <div>
                  <div className="esign-type-card-title">Acknowledgement</div>
                  <div className="esign-type-card-desc">
                    General policy reviews, safety compliance sign-offs, and driver notices
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  setDocumentType("write-up");
                  if (!title || title === "Acknowledgement Form") setTitle("Write-Up Report");
                }}
                className={`esign-type-card ${documentType === "write-up" ? "selected" : ""}`}
              >
                <div className="esign-type-radio-circle">
                  {documentType === "write-up" && <Check size={11} strokeWidth={3} />}
                </div>
                <div>
                  <div className="esign-type-card-title">Write-Up</div>
                  <div className="esign-type-card-desc">
                    Safety infractions, attendance violations, on-road incidents, and performance actions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Driver Selection & Bulk Mode Toggle */}
          <div className="esign-form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="esign-form-label">
                Recipient Drivers ({selectedDriverIds.size} Selected)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  style={{
                    padding: "0.25rem 0.7rem",
                    borderRadius: "var(--ads-r-pill)",
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    backgroundColor: isBulkMode ? "var(--ads-blue)" : "rgba(0, 0, 0, 0.06)",
                    color: isBulkMode ? "#FFFFFF" : "var(--ads-ink-secondary)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: isBulkMode ? "0 1px 4px rgba(0, 113, 227, 0.3)" : "none",
                    transition:
                      "background-color var(--ads-dur-fast) var(--ads-ease), color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  {isBulkMode ? "Bulk Mode: ON" : "Single Driver Mode"}
                </button>
                {isBulkMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleSelectAllDrivers}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ads-blue)",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Select All ({availableDrivers.length})
                    </button>
                    <span style={{ color: "var(--ads-ink-quaternary)" }}>•</span>
                    <button
                      type="button"
                      onClick={handleClearDrivers}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ads-ink-tertiary)",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Driver Search Input */}
            <div className="esign-search-box" style={{ width: "100%" }}>
              <Search size={13} className="esign-search-icon" />
              <input
                type="text"
                placeholder="Search active drivers by name, transporter ID, or phone…"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="esign-search-input"
              />
              {driverSearch && (
                <button
                  type="button"
                  onClick={() => setDriverSearch("")}
                  className="esign-search-clear"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Drivers Selection List */}
            <div className="esign-driver-pill-list">
              {availableDrivers.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "1.5rem 0", color: "var(--ads-ink-quaternary)", fontSize: "0.75rem" }}>
                  No active drivers found matching search.
                </div>
              ) : (
                availableDrivers.map((driver) => {
                  const isSelected = selectedDriverIds.has(String(driver.id));
                  return (
                    <div
                      key={driver.id}
                      onClick={() => handleToggleDriver(String(driver.id))}
                      className={`esign-driver-pill ${isSelected ? "selected" : ""}`}
                    >
                      <div className="esign-driver-pill-check">
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {driver.name}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Document Title */}
          <div className="esign-form-group">
            <label className="esign-form-label">Document Title</label>
            <input
              type="text"
              maxLength={50}
              placeholder="e.g. Speeding Policy Acknowledgement or Attendance Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="esign-input-text"
            />
          </div>

          {/* 4. Infraction & Incident Categories Multi-Select */}
          <div className="esign-form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="esign-form-label">
                Infraction & Violation Types *
              </label>
              <button
                type="button"
                onClick={() => setShowAddViolation(!showAddViolation)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ads-blue)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Plus size={12} />
                <span>Add Custom Option</span>
              </button>
            </div>

            {showAddViolation && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.5rem",
                  backgroundColor: "var(--ads-blue-tint)",
                  borderRadius: "var(--ads-r-sm)",
                  border: "1px solid transparent",
                }}
              >
                <input
                  type="text"
                  placeholder="Enter new violation category…"
                  value={newViolationInput}
                  onChange={(e) => setNewViolationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomViolation();
                    }
                  }}
                  className="esign-input-text"
                  style={{ height: "30px", fontSize: "0.775rem" }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomViolation}
                  className="esign-btn-primary"
                  style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
                >
                  Add
                </button>
              </div>
            )}

            <div className="esign-violation-grid">
              {allViolationsList.map((vio) => {
                const isSelected = selectedViolations.has(vio);
                return (
                  <button
                    key={vio}
                    type="button"
                    onClick={() => handleToggleViolation(vio)}
                    className={`esign-violation-btn ${isSelected ? "selected" : ""}`}
                  >
                    <span>{vio}</span>
                    {isSelected && <Check size={11} strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Notes / Description Editor with Token Support */}
          <div className="esign-form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="esign-form-label">Notes & Incident Statement</label>
              <span style={{ fontSize: "0.7rem", color: "var(--ads-ink-tertiary)" }}>
                Use <strong style={{ color: "var(--ads-blue)" }}>{"${name}"}</strong> for driver's name
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Enter detailed notes, policies, incident location/time, and instructions for the driver…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="esign-textarea"
            />
          </div>

          {/* 6. Supporting Attachments / Evidence */}
          <div className="esign-form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="esign-form-label">
                Attachments & Evidence ({attachedFiles.length})
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ads-blue)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Upload size={12} />
                <span>Upload Files</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {attachedFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--ads-hairline-strong)",
                  borderRadius: "var(--ads-r-md)",
                  padding: "1.25rem 1rem",
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: "rgba(0, 0, 0, 0.025)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  fontSize: "0.775rem",
                  color: "var(--ads-ink-tertiary)",
                }}
              >
                <Paperclip size={18} style={{ color: "var(--ads-ink-quaternary)" }} />
                <span>Drop inspection photos, PDF incident reports, or click to upload</span>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.45rem" }}>
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.4rem 0.65rem",
                      borderRadius: "var(--ads-r-xs)",
                      backgroundColor: "rgba(0, 0, 0, 0.05)",
                      border: "1px solid var(--ads-hairline)",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                      <FileText size={13} style={{ color: "var(--ads-blue)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ads-ink)" }}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      aria-label={`Remove attachment ${file.name}`}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--ads-ink-tertiary)",
                        cursor: "pointer",
                        padding: "2px",
                        borderRadius: "var(--ads-r-xs)",
                        display: "flex",
                        transition: "color var(--ads-dur-fast) var(--ads-ease), transform var(--ads-dur-fast) var(--ads-ease)",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* =========================================================================
            STEP 2: LIVE DOCUMENT PREVIEW & NOTIFICATION CHANNELS
           ========================================================================= */
        <>
          {/* Delivery Channels Selector */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--ads-blue-tint)",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-md)",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "#0058B0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.35rem",
              }}
            >
              Select delivery channels
            </div>
            <p style={{ margin: "0 0 0.85rem", fontSize: "0.775rem", color: "var(--ads-ink-secondary)" }}>
              Choose how this digital form is delivered to{" "}
              <strong style={{ color: "var(--ads-ink)" }}>
                {selectedDriverIds.size} recipient driver{selectedDriverIds.size > 1 ? "s" : ""}
              </strong>
              :
            </p>

            <div className="esign-channels-grid">
              <div
                onClick={() =>
                  setChannels((prev) => ({ ...prev, inapp: !prev.inapp }))
                }
                className={`esign-channel-card ${channels.inapp ? "selected" : ""}`}
              >
                <Smartphone size={18} style={{ color: "var(--ads-blue)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--ads-ink)" }}>
                    In-App Chat
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ads-ink-tertiary)" }}>
                    Driver App Mobile Alert
                  </div>
                </div>
              </div>

              <div
                onClick={() =>
                  setChannels((prev) => ({ ...prev, sms: !prev.sms }))
                }
                className={`esign-channel-card ${channels.sms ? "selected" : ""}`}
              >
                <MessageSquare size={18} style={{ color: "var(--ads-green)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--ads-ink)" }}>
                    SMS Text
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ads-ink-tertiary)" }}>
                    Direct Phone Text Message
                  </div>
                </div>
              </div>

              <div
                onClick={() =>
                  setChannels((prev) => ({ ...prev, email: !prev.email }))
                }
                className={`esign-channel-card ${channels.email ? "selected" : ""}`}
              >
                <Mail size={18} style={{ color: "var(--ads-purple)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--ads-ink)" }}>
                    Email
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ads-ink-tertiary)" }}>
                    Driver Email Dispatch
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SMS / In-App Message Preview */}
          <div className="esign-form-group">
            <label className="esign-form-label">Notification Message Preview</label>
            <div
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(0, 0, 0, 0.025)",
                border: "1px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-sm)",
                fontSize: "0.775rem",
                fontFamily: "monospace",
                color: "var(--ads-ink-secondary)",
                whiteSpace: "pre-wrap",
                lineHeight: 1.45,
              }}
            >
              {previewNotificationMessage}
            </div>
          </div>

          {/* Document Rendered Preview */}
          <div className="esign-form-group">
            <label className="esign-form-label">Live Document Render Preview</label>
            <div className="esign-doc-preview-wrap">
              <ESignatureDocumentPreview
                documentType={documentType}
                employeeName={representativeDriverName}
                reportDate={new Date().toISOString()}
                title={title}
                companyName={user?.company?.company_name || "DSP Fleet Operations"}
                companyLogoUrl={user?.company?.company_logo_url}
                status="sent"
                incidentTypes={Array.from(selectedViolations)}
                notes={notes.replace(/\$\{name\}/gi, representativeDriverName)}
                attachments={attachedFiles}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container">
        {/* Top Header matching AddDriverScreen / AddAdminScreen */}
        <div className="add-driver-header">
          <div className="add-driver-header-left">
            <button
              type="button"
              className="back-btn"
              onClick={onClose}
              title="Back to E-Signatures"
            >
              <ArrowLeft size={16} />
              <span>Back to E-Signatures</span>
            </button>
            <div className="screen-title-divider" />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 className="screen-heading">Send E-Signature Form</h1>
              <span className={`esign-type-tag ${documentType === "acknowledgement" ? "ack" : "writeup"}`} style={{ margin: 0 }}>
                {documentType === "acknowledgement" ? "Acknowledgement" : "Write-Up"}
              </span>
            </div>
          </div>

          <div className="add-driver-header-right">
            {/* Template Selector Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                className="btn-outline-cancel"
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.75rem" }}
                title="Insert preset document template"
              >
                <Sparkles size={13} style={{ color: "var(--ads-blue)" }} />
                <span>Templates</span>
              </button>

              {templateDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "0.35rem",
                    width: "280px",
                    backgroundColor: "var(--ads-material-thick)",
                    backdropFilter: "var(--ads-blur-lg)",
                    WebkitBackdropFilter: "var(--ads-blur-lg)",
                    borderRadius: "var(--ads-r-md)",
                    boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                    border: "1px solid var(--ads-hairline)",
                    padding: "0.4rem 0",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: "0.3rem 0.8rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--ads-ink-quaternary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Preset templates
                  </div>
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.8rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem",
                        borderBottom: "1px solid var(--ads-hairline)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.775rem", color: "var(--ads-ink)" }}>
                        {tmpl.name}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", textTransform: "capitalize" }}>
                        {tmpl.type} • {tmpl.violations.join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-outline-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            {currentStep === 0 ? (
              <button
                type="button"
                onClick={handleGoToPreview}
                className="btn-blue-primary"
              >
                <span>Continue to Preview</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="btn-outline-cancel"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="btn-blue-primary"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span>Dispatching…</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send E-Signature</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="add-driver-card" style={{ padding: "1.5rem" }}>
          {/* Stepper Tabs */}
          <div className="esign-modal-stepper" style={{ marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className={`esign-step-tab ${currentStep === 0 ? "active" : ""}`}
            >
              <span className="esign-step-circle">1</span>
              <span>Document & Recipient Details</span>
            </button>

            <button
              type="button"
              onClick={handleGoToPreview}
              className={`esign-step-tab ${currentStep === 1 ? "active" : ""}`}
            >
              <span className="esign-step-circle">2</span>
              <span>Review Preview & Delivery Channels</span>
            </button>
          </div>

          {/* Body */}
          {formBody}

          {/* Stepper Back navigation when on preview step */}
          {currentStep === 1 && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--ads-hairline)" }}>
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                disabled={isSubmitting}
                className="btn-outline-cancel"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <ChevronLeft size={14} />
                <span>Back to Document Details</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="esign-modal-backdrop" onClick={onClose}>
      <div className="esign-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="esign-modal-header">
          <div className="esign-modal-title-wrap">
            <div className="esign-header-icon-wrap" style={{ width: 34, height: 34 }}>
              <FileCheck size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 className="esign-modal-title">Send E-Signature Form</h2>
                <span className={`esign-type-tag ${documentType === "acknowledgement" ? "ack" : "writeup"}`}>
                  {documentType === "acknowledgement" ? "Acknowledgement" : "Write-Up"}
                </span>
              </div>
              <p className="esign-modal-subtitle">
                Digital document dispatch with live verification and driver sign-off tracking
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            {/* Template Selector Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                className="esign-btn-secondary"
                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem" }}
                title="Insert preset document template"
              >
                <Sparkles size={13} style={{ color: "var(--ads-blue)" }} />
                <span>Templates</span>
              </button>

              {templateDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: "0.35rem",
                    width: "280px",
                    backgroundColor: "var(--ads-material-thick)",
                    backdropFilter: "var(--ads-blur-lg)",
                    WebkitBackdropFilter: "var(--ads-blur-lg)",
                    borderRadius: "var(--ads-r-md)",
                    boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
                    border: "1px solid var(--ads-hairline)",
                    padding: "0.4rem 0",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: "0.3rem 0.8rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--ads-ink-quaternary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Preset templates
                  </div>
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem 0.8rem",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem",
                        borderBottom: "1px solid var(--ads-hairline)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--ads-blue-tint)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span style={{ fontWeight: 600, fontSize: "0.775rem", color: "var(--ads-ink)" }}>
                        {tmpl.name}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--ads-ink-tertiary)", textTransform: "capitalize" }}>
                        {tmpl.type} • {tmpl.violations.join(", ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="esign-icon-btn"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="esign-modal-stepper">
          <button
            type="button"
            onClick={() => setCurrentStep(0)}
            className={`esign-step-tab ${currentStep === 0 ? "active" : ""}`}
          >
            <span className="esign-step-circle">1</span>
            <span>Document & Recipient Details</span>
          </button>

          <button
            type="button"
            onClick={handleGoToPreview}
            className={`esign-step-tab ${currentStep === 1 ? "active" : ""}`}
          >
            <span className="esign-step-circle">2</span>
            <span>Review Preview & Delivery Channels</span>
          </button>
        </div>

        {/* Modal Body */}
        {formBody}

        {/* Modal Footer Controls */}
        <div className="esign-modal-footer">
          <div>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                disabled={isSubmitting}
                className="esign-btn-secondary"
              >
                <ChevronLeft size={14} />
                <span>Back to Edit</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="esign-btn-secondary"
            >
              Cancel
            </button>

            {currentStep === 0 ? (
              <button
                type="button"
                onClick={handleGoToPreview}
                className="esign-btn-primary"
              >
                <span>Continue to Preview</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="esign-btn-secondary"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="esign-btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Dispatching…</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send E-Signature Form</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignatureSendFormModal;
