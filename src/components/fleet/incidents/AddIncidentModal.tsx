import React, { FC, useState, useEffect, useMemo } from "react";
import {
  X,
  ShieldAlert,
  HeartPulse,
  PlusCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  AlertTriangle,
  Building2,
  Phone,
} from "lucide-react";
import { axiosInstance, getClientTimeZone } from "../../../api/axiosClient";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";

interface DriverOption {
  id: number;
  name: string;
}

interface AddIncidentModalProps {
  open: boolean;
  initialType?: "accident" | "injury";
  onClose: () => void;
  onSuccess: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const AddIncidentModal: FC<AddIncidentModalProps> = ({
  open,
  initialType = "accident",
  onClose,
  onSuccess,
  onSuccessToast,
}) => {
  const [formType, setFormType] = useState<"accident" | "injury">(initialType);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Common Fields
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentTime, setIncidentTime] = useState<string>("12:00");
  const [location, setLocation] = useState<string>("");
  const [details, setDetails] = useState<string>("");

  // Accident specific
  const [destination, setDestination] = useState<string>("");
  const [weather, setWeather] = useState<string>("Clear");
  const [roadCondition, setRoadCondition] = useState<string>("Dry");
  const [traffic, setTraffic] = useState<string>("Moderate");
  const [lightCondition, setLightCondition] = useState<string>("Daylight");
  const [hurt, setHurt] = useState<boolean>(false);
  const [calledDispatcher, setCalledDispatcher] = useState<boolean>(true);
  const [policeCalled, setPoliceCalled] = useState<boolean>(false);
  const [policeDept, setPoliceDept] = useState<string>("");
  const [officerName, setOfficerName] = useState<string>("");
  const [policeReportNo, setPoliceReportNo] = useState<string>("");
  const [citationIssued, setCitationIssued] = useState<boolean>(false);
  const [policePhone, setPolicePhone] = useState<string>("");
  const [damageNotes, setDamageNotes] = useState<string>("");
  const [lawsuitFiled, setLawsuitFiled] = useState<boolean>(false);
  const [lawyerName, setLawyerName] = useState<string>("");
  const [adjusterName, setAdjusterName] = useState<string>("");

  // Injury specific
  const [injuryType, setInjuryType] = useState<string>("injury_with_vehicle");
  const [treatmentAdministered, setTreatmentAdministered] = useState<string>("");
  const [hospitalVisited, setHospitalVisited] = useState<string>("");
  const [physicianName, setPhysicianName] = useState<string>("");
  const [restrictionsAdvised, setRestrictionsAdvised] = useState<string>("");
  const [supervisorNotified, setSupervisorNotified] = useState<boolean>(true);
  const [supervisorName, setSupervisorName] = useState<string>("");

  useEffect(() => {
    setFormType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (!open) return;
    setLoadingInitial(true);

    // Fetch drivers
    const fetchDriversPromise = axiosInstance
      .get("drivers/v1/drivers/all_stations?limit=700&is_deleted=false")
      .then((res) => {
        const raw = res.data?.data?.data || res.data?.data || res.data || [];
        const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
        return list.map((d: any) => ({
          id: Number(d.id),
          name: String(
            d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`
          ),
        }));
      })
      .catch(() =>
        axiosInstance.get("drivers/v1/drivers?limit=700").then((res) => {
          const raw = res.data?.data?.data || res.data?.data || res.data || [];
          const list: any[] = Array.isArray(raw) ? raw : raw?.drivers || [];
          return list.map((d: any) => ({
            id: Number(d.id),
            name: String(
              d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`
            ),
          }));
        })
      );

    // Fetch vehicles
    const fetchVehiclesPromise = fleetApi.getVehicles();

    Promise.all([fetchDriversPromise, fetchVehiclesPromise])
      .then(([drvList, vehList]) => {
        setDrivers(drvList || []);
        setVehicles(vehList || []);
      })
      .finally(() => setLoadingInitial(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) {
      alert("Please select a driver.");
      return;
    }

    setSubmitting(true);
    const tz = getClientTimeZone();
    const selectedDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));
    const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));

    try {
      if (formType === "accident") {
        const accidentPayload = {
          date: `${incidentDate}T${incidentTime}:00`,
          time: incidentTime,
          driver: Number(selectedDriverId),
          driver_name: selectedDriver?.name || "",
          vehicle: selectedVehicleId ? Number(selectedVehicleId) : null,
          vehicle_unit: selectedVehicle?.unit_number || selectedVehicle?.name || "",
          vin: selectedVehicle?.vin || "",
          license_plate: selectedVehicle?.license_plate || "",
          accident_location: location,
          destination,
          incident_details: details,
          weather,
          road_condition: roadCondition,
          traffic,
          light_condition: lightCondition,
          hurt,
          called_dispatcher: calledDispatcher,
          police: policeCalled
            ? {
                is_police_called: true,
                police_department: policeDept,
                officer_name: officerName,
                report_number: policeReportNo,
                citation_issued: citationIssued,
                phone_number: policePhone,
              }
            : { is_police_called: false },
          has_third_party_lawsuit: lawsuitFiled,
          lawsuit: lawsuitFiled
            ? {
                lawyer_name: lawyerName,
                adjuster_name: adjusterName,
                lawsuit_date: incidentDate,
              }
            : undefined,
          damage_comments: damageNotes,
          status: "open",
          timezone: tz,
        };

        await axiosInstance.post("/incident_report_form/v1/incident_report", accidentPayload);
        if (onSuccessToast) onSuccessToast("Accident report filed successfully!");
      } else {
        const injuryPayload = {
          injury_type: injuryType,
          status: "open",
          driver: Number(selectedDriverId),
          driver_name: selectedDriver?.name || "",
          vehicle: selectedVehicleId ? Number(selectedVehicleId) : null,
          personal_information: {
            driver_name: selectedDriver?.name || "",
          },
          incident_event_information: {
            incident_date: incidentDate,
            incident_time: incidentTime,
            incident_location: location,
            incident_details: details,
            weather_condition: weather,
            treatment_administered: treatmentAdministered,
            hospital_visited: hospitalVisited,
            physician_name: physicianName,
            restrictions_advised: restrictionsAdvised,
          },
          vehicle_information: selectedVehicle
            ? {
                vehicle_name: selectedVehicle.unit_number || selectedVehicle.name || "",
                vin_no: selectedVehicle.vin || "",
                vehicle_license_plate: selectedVehicle.license_plate || "",
              }
            : undefined,
          supervisor_notified: supervisorNotified,
          supervisor_name: supervisorName,
          timezone: tz,
        };

        await axiosInstance.post("/injury_report/v1/injury_report", injuryPayload);
        if (onSuccessToast) onSuccessToast("Injury report filed successfully!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to submit report. Please try again.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E2E8F0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: formType === "accident" ? "#FEF2F2" : "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {formType === "accident" ? (
                <ShieldAlert size={18} color="#DC2626" />
              ) : (
                <HeartPulse size={18} color="#2563EB" />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0F172A" }}>
                Add New {formType === "accident" ? "Accident" : "Injury"} Report
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                Submit official incident documentation to the fleet management system
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              padding: "6px",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            padding: "0.5rem 1.5rem",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setFormType("accident")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: formType === "accident" ? 700 : 500,
              cursor: "pointer",
              border: "none",
              backgroundColor: formType === "accident" ? "#2563EB" : "transparent",
              color: formType === "accident" ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s ease",
            }}
          >
            Accident Report
          </button>
          <button
            type="button"
            onClick={() => setFormType("injury")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: formType === "injury" ? 700 : 500,
              cursor: "pointer",
              border: "none",
              backgroundColor: formType === "injury" ? "#2563EB" : "transparent",
              color: formType === "injury" ? "#FFFFFF" : "#64748B",
              transition: "all 0.15s ease",
            }}
          >
            Injury Report
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="scrollable"
          style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {loadingInitial ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "0.6rem" }}>
              <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", color: "#2563EB" }} />
              <span style={{ fontSize: "0.875rem", color: "#64748B" }}>Loading drivers & vehicles…</span>
            </div>
          ) : (
            <>
              {/* Primary Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Driver */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Driver *
                  </label>
                  <select
                    required
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  >
                    <option value="">Select Driver…</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Vehicle {formType === "accident" ? "*" : "(Optional)"}
                  </label>
                  <select
                    required={formType === "accident"}
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      backgroundColor: "#FFFFFF",
                      outline: "none",
                    }}
                  >
                    <option value="">Select Fleet Vehicle…</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.unit_number || v.name || `Vehicle ${v.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Location & Destination */}
              <div style={{ display: "grid", gridTemplateColumns: formType === "accident" ? "1fr 1fr" : "1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Accident / Incident Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Intersection, City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                {formType === "accident" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                      Destination
                    </label>
                    <input
                      type="text"
                      placeholder="Delivery Station, Warehouse, Depot"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      style={{
                        width: "100%",
                        height: "38px",
                        padding: "0 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.875rem",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Injury Type (Injury only) */}
              {formType === "injury" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                    Injury Classification *
                  </label>
                  <select
                    value={injuryType}
                    onChange={(e) => setInjuryType(e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 0.75rem",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      fontSize: "0.875rem",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <option value="injury_with_vehicle">Vehicle + Injury</option>
                    <option value="vehicle_without_injury">Vehicle — No Injury</option>
                    <option value="injury_without_vehicle">Injury Not Involving Vehicle</option>
                  </select>
                </div>
              )}

              {/* Incident Narrative */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                  Incident Description & Narrative *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe sequentially what occurred during the incident…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Accident Specific: Conditions & Questions */}
              {formType === "accident" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748B", marginBottom: "0.25rem", textTransform: "uppercase" }}>Weather</label>
                      <select value={weather} onChange={(e) => setWeather(e.target.value)} style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}>
                        <option value="Clear">Clear</option>
                        <option value="Rain">Rain</option>
                        <option value="Snow">Snow</option>
                        <option value="Fog">Fog</option>
                        <option value="Hail">Hail</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748B", marginBottom: "0.25rem", textTransform: "uppercase" }}>Road</label>
                      <select value={roadCondition} onChange={(e) => setRoadCondition(e.target.value)} style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}>
                        <option value="Dry">Dry</option>
                        <option value="Wet">Wet</option>
                        <option value="Icy">Icy</option>
                        <option value="Muddy">Muddy</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748B", marginBottom: "0.25rem", textTransform: "uppercase" }}>Traffic</label>
                      <select value={traffic} onChange={(e) => setTraffic(e.target.value)} style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}>
                        <option value="Light">Light</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "#64748B", marginBottom: "0.25rem", textTransform: "uppercase" }}>Light</label>
                      <select value={lightCondition} onChange={(e) => setLightCondition(e.target.value)} style={{ width: "100%", height: "34px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.8125rem" }}>
                        <option value="Daylight">Daylight</option>
                        <option value="Dawn/Dusk">Dawn / Dusk</option>
                        <option value="Dark - Lighted">Dark (Lighted)</option>
                        <option value="Dark - Unlighted">Dark (Unlighted)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "#1E293B", cursor: "pointer" }}>
                      <input type="checkbox" checked={hurt} onChange={(e) => setHurt(e.target.checked)} />
                      <span>Anyone injured?</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "#1E293B", cursor: "pointer" }}>
                      <input type="checkbox" checked={calledDispatcher} onChange={(e) => setCalledDispatcher(e.target.checked)} />
                      <span>Dispatcher contacted?</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", color: "#1E293B", cursor: "pointer" }}>
                      <input type="checkbox" checked={policeCalled} onChange={(e) => setPoliceCalled(e.target.checked)} />
                      <span>Police dispatched / called?</span>
                    </label>
                  </div>

                  {policeCalled && (
                    <div style={{ backgroundColor: "#F8FAFC", padding: "0.85rem", borderRadius: "8px", border: "1px solid #E2E8F0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <input type="text" placeholder="Police Department" value={policeDept} onChange={(e) => setPoliceDept(e.target.value)} style={{ height: "34px", padding: "0 0.6rem", borderRadius: "6px", border: "1px solid #CBD5E1" }} />
                      <input type="text" placeholder="Police Report #" value={policeReportNo} onChange={(e) => setPoliceReportNo(e.target.value)} style={{ height: "34px", padding: "0 0.6rem", borderRadius: "6px", border: "1px solid #CBD5E1" }} />
                      <input type="text" placeholder="Officer Name" value={officerName} onChange={(e) => setOfficerName(e.target.value)} style={{ height: "34px", padding: "0 0.6rem", borderRadius: "6px", border: "1px solid #CBD5E1" }} />
                      <input type="text" placeholder="Phone" value={policePhone} onChange={(e) => setPolicePhone(e.target.value)} style={{ height: "34px", padding: "0 0.6rem", borderRadius: "6px", border: "1px solid #CBD5E1" }} />
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                      Vehicle Damage Comments
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Front bumper crushed, side panel scratch…"
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      style={{
                        width: "100%",
                        height: "36px",
                        padding: "0 0.75rem",
                        borderRadius: "8px",
                        border: "1px solid #CBD5E1",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </>
              )}

              {/* Injury Specific: Medical & Treatment */}
              {formType === "injury" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Treatment Given
                      </label>
                      <input
                        type="text"
                        placeholder="First Aid, Ice Pack, Hospital Transport…"
                        value={treatmentAdministered}
                        onChange={(e) => setTreatmentAdministered(e.target.value)}
                        style={{ width: "100%", height: "36px", padding: "0 0.75rem", borderRadius: "8px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Hospital / Clinic Visited
                      </label>
                      <input
                        type="text"
                        placeholder="Facility or Urgent Care name…"
                        value={hospitalVisited}
                        onChange={(e) => setHospitalVisited(e.target.value)}
                        style={{ width: "100%", height: "36px", padding: "0 0.75rem", borderRadius: "8px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Physician / Provider Name
                      </label>
                      <input
                        type="text"
                        placeholder="Attending doctor or provider…"
                        value={physicianName}
                        onChange={(e) => setPhysicianName(e.target.value)}
                        style={{ width: "100%", height: "36px", padding: "0 0.75rem", borderRadius: "8px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem", textTransform: "uppercase" }}>
                        Work Restrictions Advised
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Light duty, No lifting over 20 lbs…"
                        value={restrictionsAdvised}
                        onChange={(e) => setRestrictionsAdvised(e.target.value)}
                        style={{ width: "100%", height: "36px", padding: "0 0.75rem", borderRadius: "8px", border: "1px solid #CBD5E1", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Footer actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
              paddingTop: "1rem",
              borderTop: "1px solid #E2E8F0",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                color: "#475569",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingInitial}
              style={{
                padding: "0.55rem 1.35rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                  <span>Submitting Report…</span>
                </>
              ) : (
                <>
                  <PlusCircle size={15} />
                  <span>Submit {formType === "accident" ? "Accident" : "Injury"} Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncidentModal;
