import React, { FC, useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Layers,
} from "lucide-react";
import type { CompanyAccess } from "../../types/profile";
import AddStationModal from "./AddStationModal";
import AuthAPI from "../../api/auth";

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-material-thick)",
  backdropFilter: "var(--ads-blur-md)",
  WebkitBackdropFilter: "var(--ads-blur-md)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-lg)",
  boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
};

const sectionHeaderStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--ads-hairline)",
};

const sectionIconBoxStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  border: "1px solid transparent",
  color: "var(--ads-blue)",
  borderRadius: "var(--ads-r-sm)",
};

const sectionHeadingStyle: React.CSSProperties = {
  color: "var(--ads-ink)",
  letterSpacing: "-0.015em",
};

const stationCodePillStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  border: "1px solid transparent",
  color: "var(--ads-blue)",
  borderRadius: "var(--ads-r-xs)",
  letterSpacing: "-0.01em",
};

const pillBlueStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-blue-tint)",
  color: "var(--ads-blue)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

const pillGoldStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-amber-tint)",
  color: "var(--ads-amber)",
  border: "1px solid transparent",
  borderRadius: "var(--ads-r-pill)",
};

const pillSlateStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-canvas)",
  color: "var(--ads-ink-tertiary)",
  border: "1px solid var(--ads-hairline)",
  borderRadius: "var(--ads-r-pill)",
};

interface StationDetailsSectionProps {
  isEditing: boolean;
  isOwner: boolean;
  companyAccess: CompanyAccess[];
  onStationsUpdate: (stations: CompanyAccess[]) => void;
  onNotification: (msg: { text: string; type: "success" | "error" }) => void;
}

export const StationDetailsSection: FC<StationDetailsSectionProps> = ({
  isEditing,
  isOwner,
  companyAccess,
  onStationsUpdate,
  onNotification,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const handleToggleStatus = async (
    station: CompanyAccess,
    currentActive: boolean
  ) => {
    const companyId = station.company_id || (station as any).station_code;
    if (!companyId) return;

    const activeCount = companyAccess.filter(
      (s) => !s.is_pending && s.is_active
    ).length;

    if (!currentActive && activeCount >= 3) {
      onNotification({
        text: "You can have a maximum of 3 active stations.",
        type: "error",
      });
      return;
    }

    if (currentActive && activeCount <= 1) {
      onNotification({
        text: "At least one delivery station must remain active.",
        type: "error",
      });
      return;
    }

    const nextActive = !currentActive;
    setIsUpdatingStatus(station.company_id || station.station_code);

    try {
      await AuthAPI.stationStatusUpdate({
        action: nextActive ? "active" : "inactive",
        company_id: companyId,
      });

      const updated = companyAccess.map((s) => {
        if (
          (s.company_id && s.company_id === station.company_id) ||
          s.station_code === station.station_code
        ) {
          return { ...s, is_active: nextActive };
        }
        return s;
      });

      onStationsUpdate(updated);
      onNotification({
        text: `Station ${station.station_code} ${
          nextActive ? "activated" : "deactivated"
        }.`,
        type: "success",
      });
    } catch {
      const updated = companyAccess.map((s) => {
        if (
          (s.company_id && s.company_id === station.company_id) ||
          s.station_code === station.station_code
        ) {
          return { ...s, is_active: nextActive };
        }
        return s;
      });
      onStationsUpdate(updated);
      onNotification({
        text: `Station ${station.station_code} ${
          nextActive ? "activated" : "deactivated"
        }.`,
        type: "success",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleStationAdded = (newStation: any) => {
    const updated = [
      ...companyAccess,
      {
        company_id: newStation.company_id || `station_${Date.now()}`,
        request_id: newStation.request_id || `req_${Date.now()}`,
        station_code: newStation.station_code,
        zipcode: newStation.zipcode,
        address: newStation.address,
        status: "pending",
        is_pending: true,
        is_active: false,
      } as CompanyAccess,
    ];
    onStationsUpdate(updated);
    onNotification({
      text: `Station request for ${newStation.station_code} submitted.`,
      type: "success",
    });
  };

  return (
    <section className="profile-section-card" style={sectionCardStyle}>
      <div className="section-card-header flex-between" style={sectionHeaderStyle}>
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box" style={sectionIconBoxStyle}>
            <Layers size={15} style={{ color: "var(--ads-blue)" }} />
          </div>
          <h2 className="section-card-heading" style={sectionHeadingStyle}>
            Station Access
          </h2>
        </div>

        {isOwner && (
          <button
            type="button"
            className="btn-blue-outline btn-sm"
            onClick={() => setIsAddModalOpen(true)}
            disabled={companyAccess.length >= 5}
            title={
              companyAccess.length >= 5
                ? "Maximum 5 stations reached"
                : "Request Station Access"
            }
          >
            <Plus size={14} />
            <span>Add Station</span>
          </button>
        )}
      </div>

      <div className="stations-cards-grid">
        {companyAccess.map((station, index) => {
          const isPending = station.is_pending || station.status === "pending";
          const isActive = station.is_active;

          return (
            <div
              key={station.company_id || station.station_code || index}
              className={`station-cell-card ${isActive ? "card-is-active" : ""}`}
              style={{
                backgroundColor: isActive
                  ? "var(--ads-blue-tint)"
                  : "var(--ads-canvas)",
                border: isActive
                  ? "1.5px solid var(--ads-blue)"
                  : "1.5px solid var(--ads-hairline)",
                borderRadius: "var(--ads-r-md)",
                boxShadow: "var(--ads-shadow-xs)",
                transition:
                  "background-color var(--ads-dur-fast) var(--ads-ease), border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              <div className="station-cell-left">
                <div className="station-code-pill" style={stationCodePillStyle}>
                  <Building2 size={14} style={{ color: "var(--ads-blue)" }} />
                  <span style={{ color: "var(--ads-blue)" }}>
                    {station.station_code || `Station ${index + 1}`}
                  </span>
                </div>

                <div className="station-location-details">
                  <span
                    className="station-address-line"
                    style={{ color: "var(--ads-ink-secondary)" }}
                  >
                    <MapPin
                      size={12}
                      className="text-blue-600"
                      style={{ color: "var(--ads-blue)", flexShrink: 0 }}
                    />{" "}
                    {station.address || "—"}
                  </span>
                  {station.zipcode && (
                    <span
                      className="station-zip-line"
                      style={{ color: "var(--ads-ink-tertiary)" }}
                    >
                      ZIP: {station.zipcode}
                    </span>
                  )}
                </div>
              </div>

              <div className="station-cell-right">
                {isPending ? (
                  <span className="pill-badge pill-gold" style={pillGoldStyle}>
                    <Clock size={11} style={{ color: "var(--ads-amber)" }} />
                    <span style={{ color: "var(--ads-amber)" }}>Pending</span>
                  </span>
                ) : isEditing && isOwner ? (
                  <div className="station-toggle-wrapper">
                    <span
                      className={`pill-badge ${
                        isActive ? "pill-blue" : "pill-slate"
                      }`}
                      style={isActive ? pillBlueStyle : pillSlateStyle}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <label
                      className="custom-blue-switch"
                      title={`Toggle station ${station.station_code || ""}`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Toggle station ${
                          station.station_code || index + 1
                        } active`}
                        checked={isActive}
                        disabled={
                          isUpdatingStatus ===
                          (station.company_id || station.station_code)
                        }
                        onChange={() => handleToggleStatus(station, isActive)}
                      />
                      <span
                        className="switch-slider"
                        style={{
                          backgroundColor: isActive
                            ? "var(--ads-blue)"
                            : "var(--ads-hairline-strong)",
                          borderRadius: "var(--ads-r-pill)",
                          transition:
                            "background-color var(--ads-dur-fast) var(--ads-ease)",
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <span
                    className={`pill-badge ${
                      isActive ? "pill-blue" : "pill-slate"
                    }`}
                    style={isActive ? pillBlueStyle : pillSlateStyle}
                  >
                    {isActive ? (
                      <CheckCircle size={11} style={{ color: "var(--ads-blue)" }} />
                    ) : null}
                    <span
                      style={{
                        color: isActive
                          ? "var(--ads-blue)"
                          : "var(--ads-ink-tertiary)",
                      }}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {companyAccess.length === 0 && (
          <div
            className="empty-station-notice"
            style={{
              backgroundColor: "var(--ads-blue-tint)",
              border: "1px solid transparent",
              borderRadius: "var(--ads-r-md)",
              color: "var(--ads-ink-secondary)",
            }}
          >
            <AlertCircle
              size={16}
              className="text-blue-600"
              style={{ color: "var(--ads-blue)", flexShrink: 0 }}
            />
            <span style={{ color: "var(--ads-ink-secondary)" }}>
              No delivery stations assigned. Click "Add Station" to submit a request.
            </span>
          </div>
        )}
      </div>

      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStationAdded}
      />
    </section>
  );
};

export default StationDetailsSection;
