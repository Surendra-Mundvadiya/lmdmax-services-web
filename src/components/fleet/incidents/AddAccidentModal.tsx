import React, { FC, useState, useEffect } from "react";
import {
  ArrowLeft,
  X,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  AlertTriangle,
  FileText,
  Building,
  Phone,
  Mail,
  Scale,
} from "lucide-react";
import { axiosInstance, getClientTimeZone } from "../../../api/axiosClient";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";

interface DriverOption {
  id: number;
  name: string;
}

interface AddAccidentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSuccessToast?: (msg: string) => void;
  embedded?: boolean;
}

const STEPS = [
  { id: 1, label: "Incident & Driver" },
  { id: 2, label: "Conditions & Details" },
  { id: 3, label: "Police & Lawsuit" },
  { id: 4, label: "Third-Party & Vehicle" },
];

export const AddAccidentModal: FC<AddAccidentModalProps> = ({
  open,
  onClose,
  onSuccess,
  onSuccessToast,
  embedded = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Incident & Driver ──
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentTime, setIncidentTime] = useState<string>("12:00");
  const [driverLicenseNo, setDriverLicenseNo] = useState<string>("");
  const [equipmentNo, setEquipmentNo] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [zipcode, setZipcode] = useState<string>("");
  const [destination, setDestination] = useState<string>("Delivery");
  const [calledDispatcher, setCalledDispatcher] = useState<boolean>(true);
  const [hurt, setHurt] = useState<boolean>(false);

  // ── Step 2: Conditions & Details ──
  const [incidentDetails, setIncidentDetails] = useState<string>("");
  const [eastLane, setEastLane] = useState<string>("1");
  const [westLane, setWestLane] = useState<string>("1");
  const [northLane, setNorthLane] = useState<string>("1");
  const [southLane, setSouthLane] = useState<string>("1");
  const [roadConstruction, setRoadConstruction] = useState<string>("No Construction");
  const [roadAttitude, setRoadAttitude] = useState<string>("Straight & Level");
  const [traffic, setTraffic] = useState<string>("Moderate");
  const [lightCondition, setLightCondition] = useState<string>("Daylight");
  const [weather, setWeather] = useState<string>("Clear");
  const [roadCondition, setRoadCondition] = useState<string>("Dry");

  // ── Step 3: Police & Lawsuit ──
  const [policeCalled, setPoliceCalled] = useState<boolean>(false);
  const [policeDept, setPoliceDept] = useState<string>("");
  const [policeOfficer, setPoliceOfficer] = useState<string>("");
  const [policeReportNo, setPoliceReportNo] = useState<string>("");
  const [policeCitation, setPoliceCitation] = useState<boolean>(false);
  const [policePhone, setPolicePhone] = useState<string>("");
  const [policeDetails, setPoliceDetails] = useState<string>("");

  const [lawsuitFiled, setLawsuitFiled] = useState<boolean>(false);
  const [lawyerName, setLawyerName] = useState<string>("");
  const [adjusterName, setAdjusterName] = useState<string>("");
  const [lawsuitDate, setLawsuitDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [lawsuitNotes, setLawsuitNotes] = useState<string>("");

  // ── Step 4: Third-Party & Vehicle Damage ──
  const [thirdDriverName, setThirdDriverName] = useState<string>("");
  const [thirdDriverPhone, setThirdDriverPhone] = useState<string>("");
  const [thirdDriverEmail, setThirdDriverEmail] = useState<string>("");
  const [thirdDriverLicense, setThirdDriverLicense] = useState<string>("");
  const [thirdDriverState, setThirdDriverState] = useState<string>("");
  const [thirdDriverAddress, setThirdDriverAddress] = useState<string>("");

  const [witnessName, setWitnessName] = useState<string>("");
  const [witnessPhone, setWitnessPhone] = useState<string>("");
  const [witnessEmail, setWitnessEmail] = useState<string>("");

  const [thirdVehicleInsurance, setThirdVehicleInsurance] = useState<string>("");
  const [thirdVehiclePolicy, setThirdVehiclePolicy] = useState<string>("");
  const [thirdVehicleYear, setThirdVehicleYear] = useState<string>("");
  const [thirdVehicleMakeModel, setThirdVehicleMakeModel] = useState<string>("");
  const [thirdVehiclePlate, setThirdVehiclePlate] = useState<string>("");
  const [thirdVehicleState, setThirdVehicleState] = useState<string>("");

  const [damageComments, setDamageComments] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      return;
    }
    setLoadingInitial(true);

    const fetchDrivers = axiosInstance
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

    const fetchVehicles = fleetApi.getVehicles();

    Promise.all([fetchDrivers, fetchVehicles])
      .then(([drvList, vehList]) => {
        setDrivers(drvList || []);
        setVehicles(vehList || []);
      })
      .finally(() => setLoadingInitial(false));
  }, [open]);

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      if (!selectedDriverId) {
        alert("Please select a driver.");
        return false;
      }
      if (!selectedVehicleId) {
        alert("Please select a fleet vehicle.");
        return false;
      }
      if (!location.trim()) {
        alert("Please enter the accident location.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!incidentDetails.trim()) {
        alert("Please provide the details of the incident.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    const tz = getClientTimeZone();
    const selectedDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));
    const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId));

    try {
      const payload = {
        timezone: tz,
        vehicle: Number(selectedVehicleId),
        driver: Number(selectedDriverId),
        date: `${incidentDate}T${incidentTime}:00`,
        status: "open",
        damage_general_question: {
          called_dispatcher: calledDispatcher,
          hurt,
          called_police: policeCalled,
          location: location.trim(),
          details: incidentDetails.trim(),
          zipcode: zipcode.trim() ? Number(zipcode.trim()) || zipcode.trim() : "",
          equipment_number: equipmentNo.trim(),
          driver_license_no: driverLicenseNo.trim(),
          destination,
          details_of_incident: incidentDetails.trim(),
          ...(policeCalled
            ? {
                policeDepartment: policeDept.trim(),
                policeOfficer: policeOfficer.trim(),
                policeReportNo: policeReportNo.trim(),
                policeCitation,
                policePhone: policePhone.trim(),
                policeDetails: policeDetails.trim(),
              }
            : {}),
        },
        damage_comments: damageComments.trim(),
        third_party_info_driver: {
          name: thirdDriverName.trim(),
          phone: thirdDriverPhone.trim(),
          email: thirdDriverEmail.trim(),
          otherDriverlicense: thirdDriverLicense.trim(),
          state: thirdDriverState.trim(),
          address: thirdDriverAddress.trim(),
        },
        third_party_info_witness: {
          name: witnessName.trim(),
          phone: witnessPhone.trim(),
          email: witnessEmail.trim(),
        },
        third_party_info_vehicle: {
          insurance: thirdVehicleInsurance.trim(),
          policyNo: thirdVehiclePolicy.trim(),
          year: thirdVehicleYear.trim(),
          makeModel: thirdVehicleMakeModel.trim(),
          licensePlate: thirdVehiclePlate.trim(),
          state: thirdVehicleState.trim(),
        },
        third_party_lawsuit: {
          lawsuitFiled,
          ...(lawsuitFiled
            ? {
                lawyer: lawyerName.trim(),
                adjuster: adjusterName.trim(),
                lawsuitDate,
                notes: lawsuitNotes.trim(),
              }
            : {}),
        },
        conditions: {
          no_of_lanes: {
            east: { answer: eastLane },
            west: { answer: westLane },
            north: { answer: northLane },
            south: { answer: southLane },
          },
          road_construction: { answer: roadConstruction },
          road_attitude: { answer: roadAttitude },
          traffic_conditions: { answer: traffic },
          light_conditions: { answer: lightCondition },
          weather_conditions: { answer: weather },
          road_conditions: { answer: roadCondition },
        },
        additional_data: {
          vehicle_id: Number(selectedVehicleId),
          driver_id: Number(selectedDriverId),
          driver_name: selectedDriver?.name || "",
          vehicle_name: selectedVehicle?.unit_number || selectedVehicle?.name || "",
        },
      };

      await axiosInstance.post("/incident_report_form/v1/incident_report", payload);
      if (onSuccessToast) onSuccessToast("Accident report created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create accident report.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const content = (
    <div
      style={
        embedded
          ? {
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-lg)",
              WebkitBackdropFilter: "var(--ads-blur-lg)",
              borderRadius: "var(--ads-r-xl)",
              border: "1px solid var(--ads-hairline)",
              overflow: "hidden",
              boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
            }
          : {
              background: "var(--ads-material-thick)",
              backdropFilter: "var(--ads-blur-lg)",
              WebkitBackdropFilter: "var(--ads-blur-lg)",
              borderRadius: "var(--ads-r-xl)",
              width: "100%",
              maxWidth: "820px",
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
              border: "1px solid var(--ads-hairline)",
            }
      }
      onClick={embedded ? undefined : (e) => e.stopPropagation()}
    >
      {/* Modal Header (shown only when opened as floating popup, hidden in embedded mode) */}
      {!embedded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--ads-s5) var(--ads-s6)",
            borderBottom: "1px solid var(--ads-hairline)",
            background: "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ads-s3)" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--ads-r-sm)",
                backgroundColor: "var(--ads-red-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={20} color="var(--ads-red)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.014em", color: "var(--ads-ink)" }}>
                Add Accident Report
              </h3>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                File a complete vehicle collision & property damage report
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add accident report dialog"
            style={{
              background: "transparent",
              border: "1px solid var(--ads-hairline)",
              cursor: "pointer",
              color: "var(--ads-ink-tertiary)",
              padding: "6px",
              borderRadius: "var(--ads-r-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

        {/* Step Wizard Header */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--ads-hairline)",
            background: "transparent",
            padding: "0.6rem var(--ads-s6)",
            gap: "var(--ads-s2)",
            overflowX: "auto",
          }}
        >
          {STEPS.map((s) => {
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id < currentStep || validateCurrentStep()) {
                    setCurrentStep(s.id);
                  }
                }}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--ads-r-pill)",
                  fontSize: "0.78rem",
                  fontWeight: isCurrent ? 600 : 550,
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  border: isCurrent ? "1px solid var(--ads-blue)" : "1px solid transparent",
                  backgroundColor: isCurrent ? "var(--ads-blue-tint)" : "transparent",
                  color: isCurrent
                    ? "var(--ads-blue)"
                    : isDone
                    ? "var(--ads-green)"
                    : "var(--ads-ink-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  whiteSpace: "nowrap",
                  transition: "all var(--ads-dur-fast) var(--ads-ease)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    backgroundColor: isCurrent
                      ? "var(--ads-blue)"
                      : isDone
                      ? "var(--ads-green)"
                      : "rgba(0,0,0,0.04)",
                    color: isCurrent || isDone ? "#FFFFFF" : "var(--ads-ink-tertiary)",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  {isDone ? <Check size={11} /> : s.id}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="scrollable"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--ads-s6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ads-s5)",
          }}
        >
          {loadingInitial ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "260px",
                gap: "0.6rem",
              }}
            >
              <Loader2 size={24} style={{ animation: "spin 0.8s linear infinite", color: "var(--ads-blue)" }} />
              <span style={{ fontSize: "0.875rem", color: "var(--ads-ink-tertiary)" }}>
                Loading fleet drivers & vehicles…
              </span>
            </div>
          ) : (
            <>
              {/* ════════════════════════════════════════════════════════════════
                  STEP 1: Incident & Driver
                 ════════════════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>Driver Name *</label>
                      <select
                        required
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select Driver…</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Vehicle Name / Unit *</label>
                      <select
                        required
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select Vehicle…</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.unit_number || v.name || `Van #${v.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>Accident Date *</label>
                      <input
                        type="date"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        style={inputStyle}
                      >
                      </input>
                    </div>
                    <div>
                      <label style={labelStyle}>Accident Time *</label>
                      <input
                        type="time"
                        required
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Driver's License No.</label>
                      <input
                        type="text"
                        placeholder="Driver License No."
                        value={driverLicenseNo}
                        onChange={(e) => setDriverLicenseNo(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>Accident Location (Street / Intersection) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter full accident location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Zipcode</label>
                      <input
                        type="text"
                        placeholder="e.g. 80202"
                        value={zipcode}
                        onChange={(e) => setZipcode(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Equipment No.</label>
                      <input
                        type="text"
                        placeholder="Equipment #"
                        value={equipmentNo}
                        onChange={(e) => setEquipmentNo(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>Destination</label>
                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.3rem" }}>
                        {["Delivery", "AMZL_Station", "Vehicle_Service"].map((opt) => (
                          <label
                            key={opt}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontSize: "0.8125rem",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name="destination"
                              value={opt}
                              checked={destination === opt}
                              onChange={(e) => setDestination(e.target.value)}
                            />
                            <span>{opt.replace("_", " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "0.8rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={calledDispatcher}
                          onChange={(e) => setCalledDispatcher(e.target.checked)}
                        />
                        <span style={{ fontWeight: 600 }}>Driver called dispatcher?</span>
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={hurt}
                          onChange={(e) => setHurt(e.target.checked)}
                        />
                        <span style={{ fontWeight: 600, color: hurt ? "var(--ads-red)" : "var(--ads-ink)" }}>
                          Is anyone injured?
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════════
                  STEP 2: Conditions & Details
                 ════════════════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <div>
                    <label style={labelStyle}>Details of the Incident *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="What happened, how it happened, factors leading up to the incident. Be as specific as possible…"
                      value={incidentDetails}
                      onChange={(e) => setIncidentDetails(e.target.value)}
                      style={{
                        ...inputStyle,
                        height: "auto",
                        padding: "0.75rem",
                        lineHeight: 1.5,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Number of Lanes (Each Direction)</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <span style={subLabelStyle}>East</span>
                        <input type="number" min="0" value={eastLane} onChange={(e) => setEastLane(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <span style={subLabelStyle}>West</span>
                        <input type="number" min="0" value={westLane} onChange={(e) => setWestLane(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <span style={subLabelStyle}>North</span>
                        <input type="number" min="0" value={northLane} onChange={(e) => setNorthLane(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <span style={subLabelStyle}>South</span>
                        <input type="number" min="0" value={southLane} onChange={(e) => setSouthLane(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={labelStyle}>Road Construction</label>
                      <select value={roadConstruction} onChange={(e) => setRoadConstruction(e.target.value)} style={selectStyle}>
                        <option value="No Construction">No Construction</option>
                        <option value="Under Construction">Under Construction</option>
                        <option value="Road Maintenance">Road Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Road Attitude</label>
                      <select value={roadAttitude} onChange={(e) => setRoadAttitude(e.target.value)} style={selectStyle}>
                        <option value="Straight & Level">Straight & Level</option>
                        <option value="Straight & Grade">Straight & Grade</option>
                        <option value="Straight & Hillcrest">Straight & Hillcrest</option>
                        <option value="Curve & Level">Curve & Level</option>
                        <option value="Curve & Grade">Curve & Grade</option>
                        <option value="Curve & Hillcrest">Curve & Hillcrest</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={labelStyle}>Weather</label>
                      <select value={weather} onChange={(e) => setWeather(e.target.value)} style={selectStyle}>
                        <option value="Clear">Clear</option>
                        <option value="Fog">Fog</option>
                        <option value="Sleet">Sleet</option>
                        <option value="Snow">Snow</option>
                        <option value="Rain">Rain</option>
                        <option value="Severe Wind">Severe Wind</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Road Condition</label>
                      <select value={roadCondition} onChange={(e) => setRoadCondition(e.target.value)} style={selectStyle}>
                        <option value="Dry">Dry</option>
                        <option value="Wet">Wet</option>
                        <option value="Muddy">Muddy</option>
                        <option value="Snow">Snow</option>
                        <option value="Ice">Ice</option>
                        <option value="Holes/Ruts">Holes / Ruts</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Traffic</label>
                      <select value={traffic} onChange={(e) => setTraffic(e.target.value)} style={selectStyle}>
                        <option value="Light">Light</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Lighting</label>
                      <select value={lightCondition} onChange={(e) => setLightCondition(e.target.value)} style={selectStyle}>
                        <option value="Daylight">Daylight</option>
                        <option value="Dawn">Dawn</option>
                        <option value="Dusk">Dusk</option>
                        <option value="Dark - Street Lighted">Dark (Street Lighted)</option>
                        <option value="Dark - Not Lighted">Dark (Not Lighted)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════════
                  STEP 3: Police & Lawsuit
                 ════════════════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Police Section */}
                  <div style={sectionBoxStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                        Police Department Involvement
                      </span>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={policeCalled}
                          onChange={(e) => setPoliceCalled(e.target.checked)}
                        />
                        <span style={{ fontWeight: 600 }}>Was police called?</span>
                      </label>
                    </div>

                    {policeCalled && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={labelStyle}>Police Department</label>
                          <input type="text" placeholder="Department name" value={policeDept} onChange={(e) => setPoliceDept(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Officer Name</label>
                          <input type="text" placeholder="Officer name" value={policeOfficer} onChange={(e) => setPoliceOfficer(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Police Report Number</label>
                          <input type="text" placeholder="Report #" value={policeReportNo} onChange={(e) => setPoliceReportNo(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Department Phone</label>
                          <input type="text" placeholder="Phone number" value={policePhone} onChange={(e) => setPolicePhone(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", marginTop: "0.5rem", cursor: "pointer" }}>
                            <input type="checkbox" checked={policeCitation} onChange={(e) => setPoliceCitation(e.target.checked)} />
                            <span>Citation issued to our driver?</span>
                          </label>
                        </div>
                        <div>
                          <label style={labelStyle}>Additional Police Details</label>
                          <input type="text" placeholder="Badges, notes, station info" value={policeDetails} onChange={(e) => setPoliceDetails(e.target.value)} style={inputStyle} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lawsuit Section */}
                  <div style={sectionBoxStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)" }}>
                        Third-Party Lawsuit Status
                      </span>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8125rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={lawsuitFiled}
                          onChange={(e) => setLawsuitFiled(e.target.checked)}
                        />
                        <span style={{ fontWeight: 600 }}>Has a lawsuit been filed?</span>
                      </label>
                    </div>

                    {lawsuitFiled && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={labelStyle}>Lawyer Name</label>
                          <input type="text" placeholder="Attorney or legal counsel" value={lawyerName} onChange={(e) => setLawyerName(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Adjuster Name</label>
                          <input type="text" placeholder="Insurance adjuster" value={adjusterName} onChange={(e) => setAdjusterName(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Lawsuit Date</label>
                          <input type="date" value={lawsuitDate} onChange={(e) => setLawsuitDate(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Legal Notes</label>
                          <input type="text" placeholder="Case number, claim notes…" value={lawsuitNotes} onChange={(e) => setLawsuitNotes(e.target.value)} style={inputStyle} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════════════════════════════════════════════════════════
                  STEP 4: Third-Party & Vehicle Damage
                 ════════════════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  {/* Third party driver */}
                  <div style={sectionBoxStyle}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)", display: "block", marginBottom: "0.75rem" }}>
                      Other Driver's Information (Third-Party)
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={labelStyle}>Driver Name</label>
                        <input type="text" placeholder="Other driver name" value={thirdDriverName} onChange={(e) => setThirdDriverName(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <input type="text" placeholder="Other driver phone" value={thirdDriverPhone} onChange={(e) => setThirdDriverPhone(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" placeholder="Other driver email" value={thirdDriverEmail} onChange={(e) => setThirdDriverEmail(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Driver License No.</label>
                        <input type="text" placeholder="License #" value={thirdDriverLicense} onChange={(e) => setThirdDriverLicense(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>State</label>
                        <input type="text" placeholder="State code" value={thirdDriverState} onChange={(e) => setThirdDriverState(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Address</label>
                        <input type="text" placeholder="Address" value={thirdDriverAddress} onChange={(e) => setThirdDriverAddress(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Third party vehicle */}
                  <div style={sectionBoxStyle}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)", display: "block", marginBottom: "0.75rem" }}>
                      Other Vehicle & Insurance
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={labelStyle}>Insurance Company</label>
                        <input type="text" placeholder="e.g. Geico, State Farm" value={thirdVehicleInsurance} onChange={(e) => setThirdVehicleInsurance(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Policy Number</label>
                        <input type="text" placeholder="Policy #" value={thirdVehiclePolicy} onChange={(e) => setThirdVehiclePolicy(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Year</label>
                        <input type="text" placeholder="e.g. 2022" value={thirdVehicleYear} onChange={(e) => setThirdVehicleYear(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Make & Model</label>
                        <input type="text" placeholder="e.g. Toyota RAV4" value={thirdVehicleMakeModel} onChange={(e) => setThirdVehicleMakeModel(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>License Plate</label>
                        <input type="text" placeholder="Plate number" value={thirdVehiclePlate} onChange={(e) => setThirdVehiclePlate(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>License State</label>
                        <input type="text" placeholder="State" value={thirdVehicleState} onChange={(e) => setThirdVehicleState(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Witness info */}
                  <div style={sectionBoxStyle}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ads-ink)", display: "block", marginBottom: "0.75rem" }}>
                      Witness Information
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={labelStyle}>Witness Name</label>
                        <input type="text" placeholder="Witness name" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Witness Phone</label>
                        <input type="text" placeholder="Phone" value={witnessPhone} onChange={(e) => setWitnessPhone(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Witness Email</label>
                        <input type="email" placeholder="Email" value={witnessEmail} onChange={(e) => setWitnessEmail(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Damage Comments */}
                  <div>
                    <label style={labelStyle}>Damage Comments / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Describe damage to our fleet van, point of impact, scratches, broken mirrors…"
                      value={damageComments}
                      onChange={(e) => setDamageComments(e.target.value)}
                      style={{
                        ...inputStyle,
                        height: "auto",
                        padding: "0.75rem",
                        lineHeight: 1.5,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal Footer Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "var(--ads-s4)",
              borderTop: "1px solid var(--ads-hairline)",
              marginTop: "auto",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "var(--ads-r-pill)",
                border: "1px solid var(--ads-hairline)",
                background: "var(--ads-material-thick)",
                color: "var(--ads-ink)",
                boxShadow: "var(--ads-bevel)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                transition: "all var(--ads-dur-fast) var(--ads-ease)",
              }}
            >
              Cancel
            </button>

            <div style={{ display: "flex", gap: "var(--ads-s3)" }}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid var(--ads-hairline)",
                    background: "var(--ads-material-thick)",
                    color: "var(--ads-ink)",
                    boxShadow: "var(--ads-bevel)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid transparent",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  <span style={{ color: "#FFFFFF" }}>Next Step</span>
                  <ChevronRight size={16} style={{ color: "#FFFFFF" }} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "var(--ads-r-pill)",
                    border: "1px solid transparent",
                    backgroundColor: "var(--ads-blue)",
                    color: "#FFFFFF",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    transition: "all var(--ads-dur-fast) var(--ads-ease)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite", color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>Submitting Report…</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} style={{ color: "#FFFFFF" }} />
                      <span style={{ color: "#FFFFFF" }}>Submit Accident Report</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );

    if (embedded) {
      return (
        <div className="add-driver-screen-container" style={{ maxWidth: "1000px" }}>
          {/* Screen Nav Header */}
          <div className="screen-nav-header">
            <div className="screen-nav-left">
              <button
                type="button"
                className="back-btn"
                onClick={onClose}
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                <span>Back to Incident List</span>
              </button>
              <div className="screen-title-divider" />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--ads-r-sm)",
                    backgroundColor: "var(--ads-red-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={18} color="var(--ads-red)" />
                </div>
                <h2 className="screen-heading">Add Accident Report</h2>
              </div>
            </div>
            <div className="screen-nav-right">
              <button
                type="button"
                className="btn-outline-secondary btn-sm"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>

          {content}
        </div>
      );
    }

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.32)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--ads-s4)",
        }}
        onClick={onClose}
      >
        {content}
      </div>
    );
  };

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--ads-ink-secondary)",
  marginBottom: "0.3rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const subLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  color: "var(--ads-ink-tertiary)",
  marginBottom: "0.2rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 0.75rem",
  borderRadius: "var(--ads-r-sm)",
  border: "1px solid var(--ads-hairline-strong)",
  fontSize: "0.8125rem",
  color: "var(--ads-ink)",
  boxSizing: "border-box",
  backgroundColor: "var(--ads-material-thick)",
  outline: "none",
  transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

const sectionBoxStyle: React.CSSProperties = {
  backgroundColor: "var(--ads-canvas)",
  borderRadius: "var(--ads-r-md)",
  border: "1px solid var(--ads-hairline)",
  padding: "var(--ads-s4)",
};

export default AddAccidentModal;
