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
    <section className="profile-section-card">
      <div className="section-card-header flex-between">
        <div className="section-header-title-wrap">
          <div className="section-header-icon-box">
            <Layers size={15} />
          </div>
          <h2 className="section-card-heading">Station Access</h2>
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
            >
              <div className="station-cell-left">
                <div className="station-code-pill">
                  <Building2 size={14} />
                  <span>{station.station_code || `Station ${index + 1}`}</span>
                </div>

                <div className="station-location-details">
                  <span className="station-address-line">
                    <MapPin size={12} className="text-blue-600" />{" "}
                    {station.address || "—"}
                  </span>
                  {station.zipcode && (
                    <span className="station-zip-line">ZIP: {station.zipcode}</span>
                  )}
                </div>
              </div>

              <div className="station-cell-right">
                {isPending ? (
                  <span className="pill-badge pill-gold">
                    <Clock size={11} />
                    <span>Pending</span>
                  </span>
                ) : isEditing && isOwner ? (
                  <div className="station-toggle-wrapper">
                    <span
                      className={`pill-badge ${
                        isActive ? "pill-blue" : "pill-slate"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <label className="custom-blue-switch">
                      <input
                        type="checkbox"
                        checked={isActive}
                        disabled={
                          isUpdatingStatus ===
                          (station.company_id || station.station_code)
                        }
                        onChange={() => handleToggleStatus(station, isActive)}
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>
                ) : (
                  <span
                    className={`pill-badge ${
                      isActive ? "pill-blue" : "pill-slate"
                    }`}
                  >
                    {isActive ? <CheckCircle size={11} /> : null}
                    <span>{isActive ? "Active" : "Inactive"}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {companyAccess.length === 0 && (
          <div className="empty-station-notice">
            <AlertCircle size={16} className="text-blue-600" />
            <span>
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
