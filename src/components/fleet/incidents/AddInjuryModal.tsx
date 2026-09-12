import React, { FC, useState, useEffect, useMemo } from "react";
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
  Car,
  User,
  AlertTriangle,
  FileText,
  Activity,
  HeartPulse,
  Truck,
  Building,
  CheckCircle2,
} from "lucide-react";
import { axiosInstance } from "../../../api/axiosClient";
import { fleetApi, VehicleRecord } from "../../../api/fleetApi";

interface DriverOption {
  id: number;
  name: string;
  transporter_id?: string;
}

interface AddInjuryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSuccessToast?: (msg: string) => void;
  embedded?: boolean;
}

export type TFormType =
  | "Motor vehicle with injuries"
  | "Motor vehicle without injuries"
  | "Injury not involving motor vehicle";

export type TYesNo = "Yes" | "No" | "";

const BODY_PART_OPTIONS = [
  "Head / Face",
  "Neck",
  "Back / Spine",
  "Shoulder",
  "Arm / Elbow",
  "Hand / Wrist / Finger",
  "Chest / Ribs",
  "Abdomen",
  "Hip / Pelvis",
  "Leg / Knee",
  "Foot / Ankle / Toe",
  "Multiple Body Parts",
  "Other",
];

const INCIDENT_RESULTED_OPTIONS = [
  "Fatality",
  "Fracture",
  "Degloving",
  "Amputation",
  "Loss of Consciousness",
  "Concussion",
  "Sprain / Strain",
  "Laceration / Cut",
  "Bruise / Contusion",
  "Heat Exhaustion / Stress",
  "Animal Bite / Scratch",
  "Other",
];

export const AddInjuryModal: FC<AddInjuryModalProps> = ({
  open,
  onClose,
  onSuccess,
  onSuccessToast,
  embedded = false,
}) => {
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: Station & Personnel ──
  const [incidentType, setIncidentType] = useState<TFormType>(
    "Motor vehicle with injuries"
  );
  const [deliveryStationId, setDeliveryStationId] = useState("");
  const [dspName, setDspName] = useState("");
  const [dspLogin, setDspLogin] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverLogin, setDriverLogin] = useState("");
  const [transporterIdentification, setTransporterIdentification] = useState("");
  const [driverTimeInRole, setDriverTimeInRole] = useState("");
  const [isDriverTrainingUpToDate, setIsDriverTrainingUpToDate] =
    useState<TYesNo>("Yes");
  const [dateOfInitialTraining, setDateOfInitialTraining] = useState("");
  const [trainingDescription, setTrainingDescription] = useState("");
  const [dateOfIncident, setDateOfIncident] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timeOfIncident, setTimeOfIncident] = useState("12:00 PM");

  // ── Step 2: Injury / Illness Details ──
  const [affectedBodyPart, setAffectedBodyPart] = useState("Back / Spine");
  const [incidentResulted, setIncidentResulted] = useState<string[]>([]);
  const [specificJobWhenInjured, setSpecificJobWhenInjured] = useState("");
  const [detailsOfIncident, setDetailsOfIncident] = useState("");
  const [isAnyoneObserve, setIsAnyoneObserve] = useState<TYesNo>("No");
  const [witnessWhom, setWitnessWhom] = useState("");
  const [initialPainLevel, setInitialPainLevel] = useState("5");
  const [painLevelPostFirstAid, setPainLevelPostFirstAid] = useState("3");
  const [isDriverSeekMedicalCare, setIsDriverSeekMedicalCare] =
    useState<TYesNo>("No");
  const [isDriverGoViaAmbulance, setIsDriverGoViaAmbulance] =
    useState<TYesNo>("No");
  const [isInjuryLifeThreatening, setIsInjuryLifeThreatening] =
    useState<TYesNo>("No");
  const [isPartPreviouslyInjured, setIsPartPreviouslyInjured] =
    useState<TYesNo>("No");
  const [isInjuryReportedToAmazon, setIsInjuryReportedToAmazon] =
    useState<TYesNo>("Yes");

  // Sub-sections for Step 2
  // Package handling
  const [wasInjuryRelatedToHoldingPkg, setWasInjuryRelatedToHoldingPkg] =
    useState<TYesNo>("No");
  const [pkgTBANumber, setPkgTBANumber] = useState("");
  const [pkgActionDetails, setPkgActionDetails] = useState("");
  const [pkgAccidentLocation, setPkgAccidentLocation] = useState("");
  const [isStairsInvolved, setIsStairsInvolved] = useState<TYesNo>("No");

  // Animal related
  const [wasInjuryAnimalRelated, setWasInjuryAnimalRelated] =
    useState<TYesNo>("No");
  const [petTrainingDate, setPetTrainingDate] = useState("");
  const [petGuideReadDate, setPetGuideReadDate] = useState("");
  const [isDASeeThePet, setIsDASeeThePet] = useState<TYesNo>("No");
  const [isHavePawPrint, setIsHavePawPrint] = useState<TYesNo>("No");
  const [isPetSecured, setIsPetSecured] = useState<TYesNo>("No");

  // Slip & Fall
  const [isRelatedToSlipFallEvent, setIsRelatedToSlipFallEvent] =
    useState<TYesNo>("No");
  const [isPurchasedSafetyShoes, setIsPurchasedSafetyShoes] =
    useState<TYesNo>("Yes");
  const [whyWhereSafetyShoes, setWhyWhereSafetyShoes] = useState("");
  const [whichShoes, setWhichShoes] = useState("");
  const [isNewSafetyShoesDoInjury, setIsNewSafetyShoesDoInjury] =
    useState<TYesNo>("No");
  const [isThreePtsOfContactUsed, setIsThreePtsOfContactUsed] =
    useState<TYesNo>("Yes");

  // In / Out of vehicle
  const [isInjuryWhileEntry, setIsInjuryWhileEntry] = useState<TYesNo>("No");
  const [howThreePtsOfContactMaintain, setHowThreePtsOfContactMaintain] =
    useState("");
  const [isPkgInHand, setIsPkgInHand] = useState<TYesNo>("No");
  const [isDADistractedWhileEntry, setIsDADistractedWhileEntry] =
    useState<TYesNo>("No");
  const [entryDistractDescribe, setEntryDistractDescribe] = useState("");

  // Heat stress
  const [isHeatStress, setIsHeatStress] = useState<TYesNo>("No");
  const [heatIndex, setHeatIndex] = useState("");
  const [lastMealTime, setLastMealTime] = useState("");
  const [hourWorked, setHourWorked] = useState("");
  const [totalHoursWorked, setTotalHoursWorked] = useState("");
  const [totalHoursWorkedPrev, setTotalHoursWorkedPrev] = useState("");
  const [isPossessBadgeCard, setIsPossessBadgeCard] = useState<TYesNo>("Yes");

  // ── Step 3: Vehicle Information & Performance ──
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState("Delivery Van");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleManufacturer, setVehicleManufacturer] = useState("");
  const [licensePlateState, setLicensePlateState] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [isBranded, setIsBranded] = useState<TYesNo>("Yes");
  const [isNetradyneInstalled, setIsNetradyneInstalled] = useState<TYesNo>("Yes");
  const [isDATrainingUptoDate, setIsDATrainingUptoDate] = useState<TYesNo>("Yes");
  const [vehicleProvideDetails, setVehicleProvideDetails] = useState("");

  // Trailing metrics
  const [driverFICOScore, setDriverFICOScore] = useState("800");
  const [driverFICOSTrailing, setDriverFICOSTrailing] = useState("800");
  const [seatbeltScore, setSeatbeltScore] = useState("0");
  const [seatbeltTrailing, setSeatbeltTrailing] = useState("0");
  const [speedingRate, setSpeedingRate] = useState("0");
  const [speedingTrailing, setSpeedingTrailing] = useState("0");
  const [violationNumber, setViolationNumber] = useState("0");
  const [violationTrailing, setViolationTrailing] = useState("0");
  const [distanceRate, setDistanceRate] = useState("0");
  const [distanceTrailing, setDistanceTrailing] = useState("0");
  const [netradyneRate, setNetradyneRate] = useState("0");
  const [netradyneTrailing, setNetradyneTrailing] = useState("0");

  // Testing details
  const [isTestedDrug, setIsTestedDrug] = useState<TYesNo>("No");
  const [dateOfTest, setDateOfTest] = useState("");
  const [isIncidentIn3Years, setIsIncidentIn3Years] = useState<TYesNo>("No");
  const [accidentDatePrior, setAccidentDatePrior] = useState("");
  const [provideDetailsWhyPrior, setProvideDetailsWhyPrior] = useState("");

  // ── Step 4: Incident Event & Road Conditions ──
  const [shiftCode, setShiftCode] = useState("CYCLE_1");
  const [shiftStartTime, setShiftStartTime] = useState("09:00 AM");
  const [dateOfReportToDSP, setDateOfReportToDSP] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateOfReportToAmazon, setDateOfReportToAmazon] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timeOfIncidentInHours, setTimeOfIncidentInHours] = useState("4");
  const [isIncidentSelfReported, setIsIncidentSelfReported] =
    useState<TYesNo>("Yes");
  const [isIncidentOverTime, setIsIncidentOverTime] = useState<TYesNo>("No");
  const [isChecklistComplete, setIsChecklistComplete] = useState<TYesNo>("Yes");
  const [issueIdentifiedDetails, setIssueIdentifiedDetails] = useState("");
  const [isCriteriaMeet, setIsCriteriaMeet] = useState<TYesNo>("No");
  const [isPoliceReported, setIsPoliceReported] = useState<TYesNo>("No");
  const [policeReportText, setPoliceReportText] = useState("");

  // Rollaway
  const [isVehicleRollAway, setIsVehicleRollAway] = useState<TYesNo>("No");
  const [isPutIntoPark, setIsPutIntoPark] = useState<TYesNo>("Yes");
  const [isVanOff, setIsVanOff] = useState<TYesNo>("Yes");
  const [isBreakEngaged, setIsBreakEngaged] = useState<TYesNo>("Yes");
  const [isNetradyneAvailable, setIsNetradyneAvailable] = useState<TYesNo>("Yes");
  const [isSentForMaintenance, setIsSentForMaintenance] = useState<TYesNo>("No");

  // Road & environmental questions
  const [isFire, setIsFire] = useState<TYesNo>("No");
  const [isIgnitionOff, setIsIgnitionOff] = useState<TYesNo>("Yes");
  const [isHazmatSpill, setIsHazmatSpill] = useState<TYesNo>("No");
  const [isHazardEquipWork, setIsHazardEquipWork] = useState<TYesNo>("Yes");
  const [ifNoPleaseDescribe, setIfNoPleaseDescribe] = useState("");
  const [isDALogged, setIsDALogged] = useState<TYesNo>("Yes");
  const [environmentalFactors, setEnvironmentalFactors] = useState("None");
  const [isEyesOnPath, setIsEyesOnPath] = useState<TYesNo>("Yes");
  const [isDADistracted, setIsDADistracted] = useState<TYesNo>("No");
  const [describeDADistraction, setDescribeDADistraction] = useState("");
  const [isPropertyDamage, setIsPropertyDamage] = useState<TYesNo>("No");
  const [propertyDamageDetails, setPropertyDamageDetails] = useState("");
  const [isVehicleTowed, setIsVehicleTowed] = useState<TYesNo>("No");
  const [vehicleTowedDetails, setVehicleTowedDetails] = useState("");
  const [isPoliceCalled, setIsPoliceCalled] = useState<TYesNo>("No");
  const [policeCalledDetails, setPoliceCalledDetails] = useState("");
  const [isDriverFault, setIsDriverFault] = useState<TYesNo>("No");
  const [driverFaultDetails, setDriverFaultDetails] = useState("");
  const [isLeaderShipContacted, setIsLeaderShipContacted] =
    useState<TYesNo>("Yes");
  const [isVehicleMeetRoadStandard, setIsVehicleMeetRoadStandard] =
    useState<TYesNo>("Yes");
  const [isVehicleRequireRepair, setIsVehicleRequireRepair] =
    useState<TYesNo>("No");
  const [vehicleRepairDetails, setVehicleRepairDetails] = useState("");
  const [lastPreventiveMaintenanceDetails, setLastPreventiveMaintenanceDetails] =
    useState("");
  const [isHaveRightOfWay, setIsHaveRightOfWay] = useState<TYesNo>("Yes");
  const [isIntersectionCleared, setIsIntersectionCleared] =
    useState<TYesNo>("Yes");
  const [isParkedOnCorrectSide, setIsParkedOnCorrectSide] =
    useState<TYesNo>("Yes");
  const [directionOfTravel, setDirectionOfTravel] = useState("North");
  const [actionPerformedDetails, setActionPerformedDetails] = useState("");
  const [isStopSign, setIsStopSign] = useState<TYesNo>("No");

  // ── Step 5: Root Cause & Action ──
  const [causesContributed, setCausesContributed] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [whatCPASTaken, setWhatCPASTaken] = useState("");

  // Determine dynamic steps based on form type
  const availableSteps = useMemo(() => {
    if (incidentType === "Motor vehicle without injuries") {
      return [
        { id: 1, label: "Station & Personnel" },
        { id: 3, label: "Vehicle & Trailing Data" },
        { id: 4, label: "Incident & Road Conditions" },
        { id: 5, label: "Root Cause & Actions" },
      ];
    }
    if (incidentType === "Injury not involving motor vehicle") {
      return [
        { id: 1, label: "Station & Personnel" },
        { id: 2, label: "Injury & Illness Details" },
        { id: 5, label: "Root Cause & Actions" },
      ];
    }
    return [
      { id: 1, label: "Station & Personnel" },
      { id: 2, label: "Injury & Illness Details" },
      { id: 3, label: "Vehicle & Trailing Data" },
      { id: 4, label: "Incident & Road Conditions" },
      { id: 5, label: "Root Cause & Actions" },
    ];
  }, [incidentType]);

  const [stepIndex, setStepIndex] = useState(0);
  const currentStepObj = availableSteps[stepIndex] || availableSteps[0];
  const currentStepId = currentStepObj?.id || 1;

  // Initial load: drivers & vehicles
  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setLoadingInitial(true);

    const loadData = async () => {
      try {
        const [drvRes, vehList] = await Promise.all([
          axiosInstance
            .get("/driver/v1/get_all_driver")
            .then((r) => r.data?.data || [])
            .catch(() => []),
          fleetApi.getVehicles().catch(() => []),
        ]);

        const mappedDrivers: DriverOption[] = (drvRes || []).map((d: any) => ({
          id: d.id,
          name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || `Driver #${d.id}`,
          transporter_id: d.transporter_id || d.license_number || "",
        }));

        setDrivers(mappedDrivers);
        setVehicles(vehList || []);

        if (mappedDrivers.length > 0) {
          setSelectedDriverId(String(mappedDrivers[0].id));
          if (mappedDrivers[0].transporter_id) {
            setTransporterIdentification(mappedDrivers[0].transporter_id);
          }
        }
        if (vehList && vehList.length > 0) {
          setSelectedVehicleId(String(vehList[0].id));
          setLicensePlate(vehList[0].license_plate || "");
          setVehicleManufacturer(vehList[0].make || "");
          setVehicleModel(vehList[0].model || "");
          setLicensePlateState(vehList[0].state || "");
        }
      } catch {
        // Handled
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [open]);

  // Sync driver info on driver change
  const handleDriverChange = (driverIdStr: string) => {
    setSelectedDriverId(driverIdStr);
    const drv = drivers.find((d) => String(d.id) === driverIdStr);
    if (drv?.transporter_id) {
      setTransporterIdentification(drv.transporter_id);
    }
  };

  // Sync vehicle info on vehicle change
  const handleVehicleChange = (vehicleIdStr: string) => {
    setSelectedVehicleId(vehicleIdStr);
    const veh = vehicles.find((v) => String(v.id) === vehicleIdStr);
    if (veh) {
      setLicensePlate(veh.license_plate || "");
      setVehicleManufacturer(veh.make || "");
      setVehicleModel(veh.model || "");
      setLicensePlateState(veh.state || "");
      setVehicleType(veh.type || "Delivery Van");
    }
  };

  // Handle next step
  const handleNext = () => {
    if (stepIndex === 0) {
      if (!selectedDriverId) {
        alert("Please select a driver before proceeding.");
        return;
      }
    }
    if (stepIndex < availableSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // Form Submission
  const handleSubmit = async () => {
    const selectedDriver = drivers.find((d) => String(d.id) === selectedDriverId);
    const selectedVehicle = vehicles.find((v) => String(v.id) === selectedVehicleId);

    const apiInjuryType =
      incidentType === "Injury not involving motor vehicle"
        ? "injury_without_vehicle"
        : incidentType === "Motor vehicle with injuries"
        ? "injury_with_vehicle"
        : "vehicle_without_injury";

    const payload = {
      date: dateOfIncident,
      driver: Number(selectedDriverId),
      injury_type: apiInjuryType,

      personal_information: {
        delivery_station_id: deliveryStationId.trim(),
        DSP_name: dspName.trim(),
        DSP_login: dspLogin.trim(),
        driver_name: selectedDriver?.name || "",
        driver_login: driverLogin.trim(),
        transporter_identification: transporterIdentification.trim(),
        driver_time_in_role: driverTimeInRole.trim(),
        date_of_initial_training: dateOfInitialTraining,
        driver_training_up_to_date: isDriverTrainingUpToDate,
        description: trainingDescription.trim(),
      },

      vehicle_information: {
        vehicle: selectedVehicleId ? Number(selectedVehicleId) : null,
        vehicle_name: selectedVehicle?.unit_number || selectedVehicle?.name || "",
        vin_no: selectedVehicle?.vin || "",
        vehicle_type: vehicleType,
        vehicle_license_plate: licensePlate,
        vehicle_manufacturer: vehicleManufacturer,
        vehicle_license_plate_state: licensePlateState,
        vehicle_model: vehicleModel,
        vehicle_branded: isBranded,
        is_netradyne_installed_in_vehicle: isNetradyneInstalled,
        is_the_da_training_up_to_date: isDATrainingUptoDate,
        if_da_training_not_up_to_date_why: vehicleProvideDetails,
        four_weeks_trailing_data_for_incident: {
          driver_fico_score: { value: driverFICOScore, total: driverFICOSTrailing },
          driver_seatbelt_off_rate: { value: seatbeltScore, total: seatbeltTrailing },
          driver_speeding_event_rate: { value: speedingRate, total: speedingTrailing },
          driver_stop_violations: { value: violationNumber, total: violationTrailing },
          driver_following_distance_rate: { value: distanceRate, total: distanceTrailing },
          da_netradyne_rate: { value: netradyneRate, total: netradyneTrailing },
        },
        incident_and_testing_details: {
          is_tested: isTestedDrug,
          date_of_test: dateOfTest,
          is_previous_driver_incidents: isIncidentIn3Years,
          accident_date: accidentDatePrior,
          accident_details: provideDetailsWhyPrior,
        },
      },

      injury_illness_information: {
        affected_body_part: affectedBodyPart,
        incident_resulted: JSON.stringify(incidentResulted),
        job_during_injury: specificJobWhenInjured.trim(),
        incident_detail: detailsOfIncident.trim(),
        incident_witnessed: isAnyoneObserve,
        witness_name: witnessWhom.trim(),
        initial_pain_scale: initialPainLevel,
        post_first_aid_pain_scale: painLevelPostFirstAid,
        seek_medical_care: isDriverSeekMedicalCare,
        transported_via_ambulance: isDriverGoViaAmbulance,
        life_threatening_injury: isInjuryLifeThreatening,
        prev_injured_body_part_been_injured: isPartPreviouslyInjured,
        injury_reported_to_amazon: isInjuryReportedToAmazon,

        injury_related_to_package: wasInjuryRelatedToHoldingPkg,
        injury_related_to_package_details: {
          tba_number: pkgTBANumber.trim(),
          accident_location: pkgAccidentLocation.trim(),
          stairs_involved: isStairsInvolved,
          action_performed_details: pkgActionDetails.trim(),
        },

        injury_related_to_pet: wasInjuryAnimalRelated,
        injury_related_pet_details: {
          pet_training_date: petTrainingDate,
          date_pet_guide: petGuideReadDate,
          da_seen_the_pet: isDASeeThePet,
          rabbit_device_print: isHavePawPrint,
          pet_secured: isPetSecured,
        },

        injury_related_to_fall_event: isRelatedToSlipFallEvent,
        injury_related_to_fall_event_details: {
          enrolled_safety_shoes: isPurchasedSafetyShoes,
          is_yes_then_why: whyWhereSafetyShoes.trim(),
          shoe_details: whichShoes.trim(),
          injury_by_shoes: isNewSafetyShoesDoInjury,
          contact_used: isThreePtsOfContactUsed,
        },

        injury_in_out_of_vehicle: isInjuryWhileEntry,
        in_out_vehicle_injury_details: {
          maintain_contact: howThreePtsOfContactMaintain.trim(),
          package_in_hand: isPkgInHand,
          is_distracted: isDADistractedWhileEntry,
          why_distracted: entryDistractDescribe.trim(),
        },

        injury_related_to_heat: isHeatStress,
        injury_related_heat_details: {
          heat_index_during_incident: heatIndex.trim(),
          da_last_meal_drink: lastMealTime.trim(),
          worked_before_incident: hourWorked.trim(),
          total_hours_worked_this_week: totalHoursWorked.trim(),
          total_hours_worked_previous_day: totalHoursWorkedPrev.trim(),
          possess_badge_card: isPossessBadgeCard,
        },
      },

      incident_event_information: {
        incident_date: dateOfIncident,
        incident_time: timeOfIncident,
        shift_code: shiftCode,
        shift_start_time: shiftStartTime,
        report_to_dsp: dateOfReportToDSP,
        report_to_amazon: dateOfReportToAmazon,
        da_time_in_task: timeOfIncidentInHours,
        self_reported_incident: isIncidentSelfReported,
        overtime_incident: isIncidentOverTime,
        dvic_checklist_done: isChecklistComplete,
        dvic_checklist_details: issueIdentifiedDetails.trim(),
        incident_police_report: isPoliceReported,
        detailed_police_report: policeReportText.trim(),
        is_dot_regulated: isCriteriaMeet,
        vehicle_rollaway: isVehicleRollAway,
        vehicle_rollaway_questions: {
          put_into_park: isPutIntoPark,
          emergency_brake_engaged: isBreakEngaged,
          was_van_off: isVanOff,
          telematics_or_netradyne_available: isNetradyneAvailable,
          van_grounded_sent_for_maintenance: isSentForMaintenance,
        },
        road_conditions_questions: {
          fire_or_explosion: isFire,
          ingition_turned_off: isIgnitionOff,
          hazmat_spill: isHazmatSpill,
          hazard_light_signal: isHazardEquipWork,
          hazard_light_signal_details: ifNoPleaseDescribe.trim(),
          logged_into_mentor_entire_route: isDALogged,
          list_environmental_factors_contributing: environmentalFactors.trim(),
          da_have_eyes_on_path: isEyesOnPath,
          was_da_distracted: isDADistracted,
          da_distracted_details: describeDADistraction.trim(),
          was_there_property_damage: isPropertyDamage,
          property_damage_details: propertyDamageDetails.trim(),
          vehicle_towed: isVehicleTowed,
          vehicle_towed_details: vehicleTowedDetails.trim(),
          emergency_medical_service: isPoliceCalled,
          emergency_medical_service_details: policeCalledDetails.trim(),
          driver_found_to_be_at_fault: isDriverFault,
          driver_found_to_be_at_fault_details: driverFaultDetails.trim(),
          contacted_leadership: isLeaderShipContacted,
          vehicle_meet_amazon_roadworthy: isVehicleMeetRoadStandard,
          vehicle_required_maintenance: isVehicleRequireRepair,
          vehicle_required_maintenance_details: vehicleRepairDetails.trim(),
          when_last_preventive_maintenance_details:
            lastPreventiveMaintenanceDetails.trim(),
          occurred_at_intersection: isHaveRightOfWay,
          clear_theIntersection_before_entering: isIntersectionCleared,
          da_parked_on_the_correct_side: isParkedOnCorrectSide,
          what_was_direction_of_travel: directionOfTravel,
          any_parties_turning_details: actionPerformedDetails.trim(),
          stop_sign_light_intersection: isStopSign,
        },
      },

      investigation_root_cause_action: {
        immediate_contribution_to_the_incident: causesContributed.trim(),
        root_cause_of_the_incident: rootCause.trim(),
        measures_taken_to_address_the_incident: whatCPASTaken.trim(),
      },
    };

    setSubmitting(true);
    try {
      await axiosInstance.post("/injury_report/v1/injury_report", payload);
      if (onSuccessToast) onSuccessToast("Injury report created successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create injury report.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const wizardContent = (
    <>
      {/* Step Wizard Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "var(--ads-s3) var(--ads-s6)",
            background: "transparent",
            borderBottom: "1px solid var(--ads-hairline)",
            overflowX: "auto",
            gap: "var(--ads-s2)",
          }}
        >
          {availableSteps.map((s, idx) => {
            const isActive = idx === stepIndex;
            const isCompleted = idx < stepIndex;
            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: isCompleted ? "var(--ads-blue)" : "var(--ads-hairline)",
                      minWidth: 16,
                      transition: "background-color var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onClick={() => setStepIndex(idx)}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: isActive
                        ? "var(--ads-blue)"
                        : isCompleted
                        ? "var(--ads-green)"
                        : "rgba(0,0,0,0.04)",
                      color: isActive || isCompleted ? "#FFFFFF" : "var(--ads-ink-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      transition: "all var(--ads-dur-fast) var(--ads-ease)",
                    }}
                  >
                    {isCompleted ? <Check size={13} color="#FFFFFF" /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: isActive ? 600 : 550,
                      letterSpacing: "-0.01em",
                      color: isActive
                        ? "var(--ads-blue)"
                        : isCompleted
                        ? "var(--ads-green)"
                        : "var(--ads-ink-tertiary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "var(--ads-s6)",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "var(--ads-s5)",
          }}
        >
          {loadingInitial ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "3rem",
                gap: "0.75rem",
                color: "var(--ads-ink-tertiary)",
              }}
            >
              <Loader2 size={32} className="animate-spin" color="var(--ads-blue)" />
              <span>Loading drivers & fleet vehicles...</span>
            </div>
          ) : (
            <>
              {/* ═══════════ STEP 1: Station & Personnel ═══════════ */}
              {currentStepId === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Incident Classification */}
                  <div
                    style={{
                      padding: "var(--ads-s4)",
                      borderRadius: "var(--ads-r-md)",
                      border: "1px solid var(--ads-blue-tint-strong)",
                      backgroundColor: "var(--ads-blue-tint)",
                    }}
                  >
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "var(--ads-blue)",
                        marginBottom: "var(--ads-s2)",
                      }}
                    >
                      Incident Type / Classification *
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "0.5rem",
                      }}
                    >
                      {(
                        [
                          "Motor vehicle with injuries",
                          "Motor vehicle without injuries",
                          "Injury not involving motor vehicle",
                        ] as TFormType[]
                      ).map((typeOpt) => {
                        const checked = incidentType === typeOpt;
                        return (
                          <button
                            key={typeOpt}
                            type="button"
                            onClick={() => setIncidentType(typeOpt)}
                            style={{
                              padding: "0.65rem 0.85rem",
                              borderRadius: "var(--ads-r-sm)",
                              border: checked
                                ? "1px solid var(--ads-blue)"
                                : "1px solid var(--ads-hairline)",
                              backgroundColor: checked
                                ? "var(--ads-material-thick)"
                                : "var(--ads-canvas)",
                              color: checked ? "var(--ads-blue)" : "var(--ads-ink-secondary)",
                              fontSize: "0.8125rem",
                              fontWeight: checked ? 600 : 550,
                              letterSpacing: "-0.01em",
                              textAlign: "left",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all var(--ads-dur-fast) var(--ads-ease)",
                            }}
                          >
                            <span>{typeOpt}</span>
                            {checked && <CheckCircle2 size={16} color="var(--ads-blue)" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Driver Selection */}
                    <div>
                      <label style={labelStyle}>DRIVER NAME *</label>
                      <select
                        style={inputStyle}
                        value={selectedDriverId}
                        onChange={(e) => handleDriverChange(e.target.value)}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Driver Login */}
                    <div>
                      <label style={labelStyle}>DRIVER LOGIN</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Enter driver login"
                        value={driverLogin}
                        onChange={(e) => setDriverLogin(e.target.value)}
                      />
                    </div>

                    {/* Transporter ID */}
                    <div>
                      <label style={labelStyle}>TRANSPORTER IDENTIFICATION</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Enter transporter id"
                        value={transporterIdentification}
                        onChange={(e) => setTransporterIdentification(e.target.value)}
                      />
                    </div>

                    {/* Driver Time in Role */}
                    <div>
                      <label style={labelStyle}>DRIVER TIME IN ROLE (MONTHS)</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. 12"
                        value={driverTimeInRole}
                        onChange={(e) => setDriverTimeInRole(e.target.value)}
                      />
                    </div>

                    {/* Delivery Station ID */}
                    <div>
                      <label style={labelStyle}>DELIVERY STATION ID</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. QUE2"
                        value={deliveryStationId}
                        onChange={(e) => setDeliveryStationId(e.target.value)}
                      />
                    </div>

                    {/* DSP Name */}
                    <div>
                      <label style={labelStyle}>DSP NAME</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Enter DSP name"
                        value={dspName}
                        onChange={(e) => setDspName(e.target.value)}
                      />
                    </div>

                    {/* DSP Login */}
                    <div>
                      <label style={labelStyle}>DSP LOGIN</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Enter DSP login"
                        value={dspLogin}
                        onChange={(e) => setDspLogin(e.target.value)}
                      />
                    </div>

                    {/* Date of Incident */}
                    <div>
                      <label style={labelStyle}>DATE OF INCIDENT / EVENT *</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={dateOfIncident}
                        onChange={(e) => setDateOfIncident(e.target.value)}
                      />
                    </div>

                    {/* Time of Incident */}
                    <div>
                      <label style={labelStyle}>TIME OF INCIDENT / EVENT</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. 02:30 PM"
                        value={timeOfIncident}
                        onChange={(e) => setTimeOfIncident(e.target.value)}
                      />
                    </div>

                    {/* Date of Initial Training */}
                    <div>
                      <label style={labelStyle}>DATE OF INITIAL TRAINING</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={dateOfInitialTraining}
                        onChange={(e) => setDateOfInitialTraining(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Driver Training Up to Date */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--ads-r-sm)",
                      backgroundColor: "var(--ads-canvas)",
                      border: "1px solid var(--ads-hairline)",
                    }}
                  >
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      Is driver safety training up to date?
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {(["Yes", "No"] as TYesNo[]).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setIsDriverTrainingUpToDate(val)}
                          style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "var(--ads-r-pill)",
                            border:
                              isDriverTrainingUpToDate === val
                                ? "1px solid var(--ads-blue)"
                                : "1px solid var(--ads-hairline-strong)",
                            backgroundColor:
                              isDriverTrainingUpToDate === val ? "var(--ads-blue)" : "var(--ads-material-thick)",
                            color:
                              isDriverTrainingUpToDate === val ? "#FFFFFF" : "var(--ads-ink-secondary)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>TRAINING DETAILS / COMMENTS</label>
                    <textarea
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="Provide details if training is not up to date or special notes..."
                      value={trainingDescription}
                      onChange={(e) => setTrainingDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 2: Injury & Illness Details ═══════════ */}
              {currentStepId === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Affected Body Part */}
                    <div>
                      <label style={labelStyle}>BODY PART AFFECTED *</label>
                      <select
                        style={inputStyle}
                        value={affectedBodyPart}
                        onChange={(e) => setAffectedBodyPart(e.target.value)}
                      >
                        {BODY_PART_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Specific Job Function */}
                    <div>
                      <label style={labelStyle}>SPECIFIC JOB WHEN INJURED</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="e.g. Delivering package at porch stairs"
                        value={specificJobWhenInjured}
                        onChange={(e) => setSpecificJobWhenInjured(e.target.value)}
                      />
                    </div>

                    {/* Initial Pain Level (1-10) */}
                    <div>
                      <label style={labelStyle}>INITIAL PAIN LEVEL (1 - 10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        style={inputStyle}
                        value={initialPainLevel}
                        onChange={(e) => setInitialPainLevel(e.target.value)}
                      />
                    </div>

                    {/* Pain Level Post First-Aid (1-10) */}
                    <div>
                      <label style={labelStyle}>PAIN LEVEL POST FIRST-AID (1 - 10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        style={inputStyle}
                        value={painLevelPostFirstAid}
                        onChange={(e) => setPainLevelPostFirstAid(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Incident Resulted In (Multi-select) */}
                  <div>
                    <label style={labelStyle}>INCIDENT RESULTED IN</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {INCIDENT_RESULTED_OPTIONS.map((resOpt) => {
                        const sel = incidentResulted.includes(resOpt);
                        return (
                          <button
                            key={resOpt}
                            type="button"
                            onClick={() => {
                              if (sel) {
                                setIncidentResulted(incidentResulted.filter((r) => r !== resOpt));
                              } else {
                                setIncidentResulted([...incidentResulted, resOpt]);
                              }
                            }}
                            style={{
                              padding: "0.3rem 0.65rem",
                              borderRadius: "var(--ads-r-pill)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              border: sel
                                ? "1px solid var(--ads-blue)"
                                : "1px solid var(--ads-hairline)",
                              backgroundColor: sel
                                ? "var(--ads-blue-tint)"
                                : "var(--ads-material-thick)",
                              color: sel ? "var(--ads-blue)" : "var(--ads-ink-secondary)",
                              transition: "all var(--ads-dur-fast) var(--ads-ease)",
                            }}
                          >
                            {resOpt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Details of Incident */}
                  <div>
                    <label style={labelStyle}>DETAILS OF INCIDENT</label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="What happened, how it happened, and factors leading up to injury..."
                      value={detailsOfIncident}
                      onChange={(e) => setDetailsOfIncident(e.target.value)}
                    />
                  </div>

                  {/* Witness Info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderRadius: "var(--ads-r-sm)",
                      backgroundColor: "var(--ads-canvas)",
                      border: "1px solid var(--ads-hairline)",
                    }}
                  >
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                      Did anyone observe or witness the incident?
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {(["Yes", "No"] as TYesNo[]).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setIsAnyoneObserve(v)}
                          style={{
                            padding: "0.35rem 0.85rem",
                            borderRadius: "var(--ads-r-pill)",
                            border:
                              isAnyoneObserve === v
                                ? "1px solid var(--ads-blue)"
                                : "1px solid var(--ads-hairline-strong)",
                            backgroundColor:
                              isAnyoneObserve === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                            color: isAnyoneObserve === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isAnyoneObserve === "Yes" && (
                    <div>
                      <label style={labelStyle}>WITNESS NAME / CONTACT</label>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Enter witness name and contact info"
                        value={witnessWhom}
                        onChange={(e) => setWitnessWhom(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Quick Medical Care Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {[
                      {
                        label: "Seek Medical Care?",
                        val: isDriverSeekMedicalCare,
                        set: setIsDriverSeekMedicalCare,
                      },
                      {
                        label: "Ambulance Transported?",
                        val: isDriverGoViaAmbulance,
                        set: setIsDriverGoViaAmbulance,
                      },
                      {
                        label: "Life-Threatening?",
                        val: isInjuryLifeThreatening,
                        set: setIsInjuryLifeThreatening,
                      },
                      {
                        label: "Previously Injured Part?",
                        val: isPartPreviouslyInjured,
                        set: setIsPartPreviouslyInjured,
                      },
                      {
                        label: "Reported to Amazon?",
                        val: isInjuryReportedToAmazon,
                        set: setIsInjuryReportedToAmazon,
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.6rem 0.85rem",
                          borderRadius: "var(--ads-r-sm)",
                          border: "1px solid var(--ads-hairline)",
                          backgroundColor: "var(--ads-canvas)",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                          {row.label}
                        </span>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              onClick={() => row.set(ans)}
                              style={{
                                padding: "0.25rem 0.55rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  row.val === ans
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  row.val === ans ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color: row.val === ans ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Accordion / Nested Detail Panels */}
                  {/* 1. Package Handling */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline)",
                      backgroundColor: "var(--ads-canvas)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                        Was injury related to holding or delivering a package?
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {(["Yes", "No"] as TYesNo[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setWasInjuryRelatedToHoldingPkg(v)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "var(--ads-r-pill)",
                              border:
                                wasInjuryRelatedToHoldingPkg === v
                                  ? "1px solid var(--ads-blue)"
                                  : "1px solid var(--ads-hairline-strong)",
                              backgroundColor:
                                wasInjuryRelatedToHoldingPkg === v
                                  ? "var(--ads-blue)"
                                  : "var(--ads-material-thick)",
                              color:
                                wasInjuryRelatedToHoldingPkg === v
                                  ? "#FFFFFF"
                                  : "var(--ads-ink-secondary)",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    {wasInjuryRelatedToHoldingPkg === "Yes" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "0.75rem",
                          marginTop: "0.75rem",
                        }}
                      >
                        <div>
                          <label style={labelStyle}>PACKAGE TBA NUMBER</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="TBA..."
                            value={pkgTBANumber}
                            onChange={(e) => setPkgTBANumber(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>ACCIDENT LOCATION</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="Address / Customer porch"
                            value={pkgAccidentLocation}
                            onChange={(e) => setPkgAccidentLocation(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>ACTION PERFORMED</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="Carrying box, bending down"
                            value={pkgActionDetails}
                            onChange={(e) => setPkgActionDetails(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Slip & Fall */}
                  <div
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--ads-r-sm)",
                      border: "1px solid var(--ads-hairline)",
                      backgroundColor: "var(--ads-canvas)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                        Was injury related to a slip, trip, or fall?
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {(["Yes", "No"] as TYesNo[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setIsRelatedToSlipFallEvent(v)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "var(--ads-r-pill)",
                              border:
                                isRelatedToSlipFallEvent === v
                                  ? "1px solid var(--ads-blue)"
                                  : "1px solid var(--ads-hairline-strong)",
                              backgroundColor:
                                isRelatedToSlipFallEvent === v
                                  ? "var(--ads-blue)"
                                  : "var(--ads-material-thick)",
                              color:
                                isRelatedToSlipFallEvent === v
                                  ? "#FFFFFF"
                                  : "var(--ads-ink-secondary)",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    {isRelatedToSlipFallEvent === "Yes" && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: "0.75rem",
                          marginTop: "0.75rem",
                        }}
                      >
                        <div>
                          <label style={labelStyle}>PURCHASED SAFETY SHOES?</label>
                          <select
                            style={inputStyle}
                            value={isPurchasedSafetyShoes}
                            onChange={(e) =>
                              setIsPurchasedSafetyShoes(e.target.value as TYesNo)
                            }
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>WHICH SHOES WERE WORN?</label>
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="Brand / Model"
                            value={whichShoes}
                            onChange={(e) => setWhichShoes(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>3 POINTS OF CONTACT USED?</label>
                          <select
                            style={inputStyle}
                            value={isThreePtsOfContactUsed}
                            onChange={(e) =>
                              setIsThreePtsOfContactUsed(e.target.value as TYesNo)
                            }
                          >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 3: Vehicle Information & Performance ═══════════ */}
              {currentStepId === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {/* Vehicle Selection */}
                    <div>
                      <label style={labelStyle}>SELECT FLEET VEHICLE *</label>
                      <select
                        style={inputStyle}
                        value={selectedVehicleId}
                        onChange={(e) => handleVehicleChange(e.target.value)}
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.unit_number || v.name || `Vehicle #${v.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <label style={labelStyle}>VEHICLE TYPE</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                      />
                    </div>

                    {/* License Plate */}
                    <div>
                      <label style={labelStyle}>LICENSE PLATE NO.</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                      />
                    </div>

                    {/* Manufacturer */}
                    <div>
                      <label style={labelStyle}>MANUFACTURER</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={vehicleManufacturer}
                        onChange={(e) => setVehicleManufacturer(e.target.value)}
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label style={labelStyle}>PLATE STATE</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={licensePlateState}
                        onChange={(e) => setLicensePlateState(e.target.value)}
                      />
                    </div>

                    {/* Model */}
                    <div>
                      <label style={labelStyle}>MODEL</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Branded & Netradyne */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--ads-r-sm)",
                        backgroundColor: "var(--ads-canvas)",
                        border: "1px solid var(--ads-hairline)",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        Vehicle Branded?
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        {(["Yes", "No"] as TYesNo[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setIsBranded(v)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "var(--ads-r-pill)",
                              border:
                                isBranded === v
                                  ? "1px solid var(--ads-blue)"
                                  : "1px solid var(--ads-hairline-strong)",
                              backgroundColor:
                                isBranded === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                              color: isBranded === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--ads-r-sm)",
                        backgroundColor: "var(--ads-canvas)",
                        border: "1px solid var(--ads-hairline)",
                      }}
                    >
                      <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--ads-ink)" }}>
                        Netradyne Installed?
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        {(["Yes", "No"] as TYesNo[]).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setIsNetradyneInstalled(v)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "var(--ads-r-pill)",
                              border:
                                isNetradyneInstalled === v
                                  ? "1px solid var(--ads-blue)"
                                  : "1px solid var(--ads-hairline-strong)",
                              backgroundColor:
                                isNetradyneInstalled === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                              color:
                                isNetradyneInstalled === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4-Week Trailing Performance Data */}
                  <div
                    style={{
                      padding: "var(--ads-s4)",
                      borderRadius: "var(--ads-r-md)",
                      border: "1px solid var(--ads-hairline)",
                      backgroundColor: "var(--ads-canvas)",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 var(--ads-s3) 0",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "var(--ads-ink)",
                        textTransform: "uppercase",
                      }}
                    >
                      4-Week Trailing Performance Metrics
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      <div>
                        <label style={labelStyle}>DRIVER FICO SCORE</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={driverFICOScore}
                          onChange={(e) => setDriverFICOScore(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>SEATBELT OFF RATE</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={seatbeltScore}
                          onChange={(e) => setSeatbeltScore(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>SPEEDING EVENT RATE</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={speedingRate}
                          onChange={(e) => setSpeedingRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>STOP SIGN VIOLATIONS</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={violationNumber}
                          onChange={(e) => setViolationNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>FOLLOWING DISTANCE RATE</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={distanceRate}
                          onChange={(e) => setDistanceRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>DA NETRADYNE SCORE</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={netradyneRate}
                          onChange={(e) => setNetradyneRate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testing & History */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem",
                        borderRadius: "var(--ads-r-sm)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor: "var(--ads-material-thick)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                          Drug & Alcohol Tested?
                        </span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setIsTestedDrug(v)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  isTestedDrug === v
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  isTestedDrug === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color: isTestedDrug === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {isTestedDrug === "Yes" && (
                        <input
                          type="date"
                          style={inputStyle}
                          value={dateOfTest}
                          onChange={(e) => setDateOfTest(e.target.value)}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        padding: "0.85rem",
                        borderRadius: "var(--ads-r-sm)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor: "var(--ads-material-thick)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                          Prior Incidents in 3 Years?
                        </span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setIsIncidentIn3Years(v)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  isIncidentIn3Years === v
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  isIncidentIn3Years === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color:
                                  isIncidentIn3Years === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {isIncidentIn3Years === "Yes" && (
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="Provide details / date of prior incident"
                          value={provideDetailsWhyPrior}
                          onChange={(e) => setProvideDetailsWhyPrior(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 4: Incident Event & Road Conditions ═══════════ */}
              {currentStepId === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.85rem",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>SHIFT CODE</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={shiftCode}
                        onChange={(e) => setShiftCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>SHIFT START TIME</label>
                      <input
                        type="text"
                        style={inputStyle}
                        value={shiftStartTime}
                        onChange={(e) => setShiftStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>DATE REPORTED TO DSP</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={dateOfReportToDSP}
                        onChange={(e) => setDateOfReportToDSP(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>DATE REPORTED TO AMAZON</label>
                      <input
                        type="date"
                        style={inputStyle}
                        value={dateOfReportToAmazon}
                        onChange={(e) => setDateOfReportToAmazon(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* DVIC & Police */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem",
                        borderRadius: "var(--ads-r-sm)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor: "var(--ads-canvas)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                          Daily Vehicle Inspection Checklist Done?
                        </span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setIsChecklistComplete(v)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  isChecklistComplete === v
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  isChecklistComplete === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color:
                                  isChecklistComplete === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        style={inputStyle}
                        placeholder="Issues identified during DVIC..."
                        value={issueIdentifiedDetails}
                        onChange={(e) => setIssueIdentifiedDetails(e.target.value)}
                      />
                    </div>

                    <div
                      style={{
                        padding: "0.85rem",
                        borderRadius: "var(--ads-r-sm)",
                        border: "1px solid var(--ads-hairline)",
                        backgroundColor: "var(--ads-canvas)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ads-ink)" }}>
                          Resulted in Police Report?
                        </span>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setIsPoliceReported(v)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  isPoliceReported === v
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  isPoliceReported === v ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color: isPoliceReported === v ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      {isPoliceReported === "Yes" && (
                        <input
                          type="text"
                          style={inputStyle}
                          placeholder="Police dept, officer, and report number..."
                          value={policeReportText}
                          onChange={(e) => setPoliceReportText(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Road Condition Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "0.65rem",
                    }}
                  >
                    {[
                      {
                        label: "Vehicle Rollaway?",
                        val: isVehicleRollAway,
                        set: setIsVehicleRollAway,
                      },
                      { label: "Fire or Explosion?", val: isFire, set: setIsFire },
                      {
                        label: "Hazmat Spill?",
                        val: isHazmatSpill,
                        set: setIsHazmatSpill,
                      },
                      {
                        label: "DA Distracted?",
                        val: isDADistracted,
                        set: setIsDADistracted,
                      },
                      {
                        label: "Property Damage?",
                        val: isPropertyDamage,
                        set: setIsPropertyDamage,
                      },
                      {
                        label: "Vehicle Towed?",
                        val: isVehicleTowed,
                        set: setIsVehicleTowed,
                      },
                      {
                        label: "Driver at Fault?",
                        val: isDriverFault,
                        set: setIsDriverFault,
                      },
                      {
                        label: "Leadership Contacted?",
                        val: isLeaderShipContacted,
                        set: setIsLeaderShipContacted,
                      },
                      {
                        label: "Roadworthy Standard?",
                        val: isVehicleMeetRoadStandard,
                        set: setIsVehicleMeetRoadStandard,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "var(--ads-r-xs)",
                          border: "1px solid var(--ads-hairline)",
                          backgroundColor: "var(--ads-material-thick)",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ads-ink-secondary)" }}>
                          {item.label}
                        </span>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {(["Yes", "No"] as TYesNo[]).map((ans) => (
                            <button
                              key={ans}
                              type="button"
                              onClick={() => item.set(ans)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                borderRadius: "var(--ads-r-pill)",
                                border:
                                  item.val === ans
                                    ? "1px solid var(--ads-blue)"
                                    : "1px solid var(--ads-hairline-strong)",
                                backgroundColor:
                                  item.val === ans ? "var(--ads-blue)" : "var(--ads-material-thick)",
                                color: item.val === ans ? "#FFFFFF" : "var(--ads-ink-secondary)",
                                fontSize: "0.6875rem",
                                fontWeight: 700,
                              }}
                            >
                              {ans}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════ STEP 5: Root Cause & Action ═══════════ */}
              {currentStepId === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>
                      IMMEDIATE CAUSES CONTRIBUTING TO INCIDENT *
                    </label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="List direct, immediate conditions or unsafe actions that caused the incident..."
                      value={causesContributed}
                      onChange={(e) => setCausesContributed(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>ROOT CAUSE OF INCIDENT *</label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="Identify systemic root cause (training, equipment, environmental, fatigue)..."
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      CORRECTIVE / PREVENTIVE ACTIONS TAKEN (CPAS) *
                    </label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                      placeholder="Specific action items implemented to prevent recurrences in the future..."
                      value={whatCPASTaken}
                      onChange={(e) => setWhatCPASTaken(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "var(--ads-s4) var(--ads-s6)",
            borderTop: "1px solid var(--ads-hairline)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--ads-s3)",
          }}
        >
          <button
            type="button"
            onClick={stepIndex === 0 ? onClose : handlePrev}
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
            {stepIndex > 0 && <ChevronLeft size={16} />}
            <span>{stepIndex === 0 ? "Cancel" : "Previous Step"}</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleNext}
            style={{
              padding: "9px 18px",
              borderRadius: "var(--ads-r-pill)",
              border: "1px solid transparent",
              backgroundColor: "var(--ads-blue)",
              opacity: submitting ? 0.55 : 1,
              color: "#FFFFFF",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>Submitting Report...</span>
              </>
            ) : stepIndex === availableSteps.length - 1 ? (
              <>
                <Check size={16} color="#FFFFFF" />
                <span style={{ color: "#FFFFFF" }}>Submit Injury Report</span>
              </>
            ) : (
              <>
                <span style={{ color: "#FFFFFF" }}>Next Step</span>
                <ChevronRight size={16} color="#FFFFFF" />
              </>
            )}
          </button>
        </div>
    </>
  );

  if (embedded) {
    return (
      <div className="add-driver-screen-container" style={{ maxWidth: "1050px" }}>
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
                  backgroundColor: "var(--ads-blue-tint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HeartPulse size={18} color="var(--ads-blue)" />
              </div>
              <h2 className="screen-heading">Add Injury / Illness Report</h2>
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

        {/* Wizard Card Container */}
        <div
          style={{
            background: "var(--ads-material-thick)",
            backdropFilter: "var(--ads-blur-lg)",
            WebkitBackdropFilter: "var(--ads-blur-lg)",
            borderRadius: "var(--ads-r-xl)",
            border: "1px solid var(--ads-hairline)",
            overflow: "hidden",
            boxShadow: "var(--ads-shadow-sm), var(--ads-bevel)",
          }}
        >
          {wizardContent}
        </div>
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
      <div
        style={{
          background: "var(--ads-material-thick)",
          backdropFilter: "var(--ads-blur-lg)",
          WebkitBackdropFilter: "var(--ads-blur-lg)",
          borderRadius: "var(--ads-r-xl)",
          width: "100%",
          maxWidth: "860px",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--ads-shadow-lg), var(--ads-bevel)",
          border: "1px solid var(--ads-hairline)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                backgroundColor: "var(--ads-blue-tint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HeartPulse size={22} color="var(--ads-blue)" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  letterSpacing: "-0.019em",
                  color: "var(--ads-ink)",
                }}
              >
                Add Injury / Illness Report
              </h2>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ads-ink-tertiary)" }}>
                Complete OSHA, DA incident, and fleet safety documentation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add injury report dialog"
            style={{
              padding: "0.5rem",
              borderRadius: "var(--ads-r-sm)",
              border: "1px solid var(--ads-hairline)",
              background: "transparent",
              color: "var(--ads-ink-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all var(--ads-dur-fast) var(--ads-ease)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {wizardContent}
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--ads-ink-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "0.35rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "var(--ads-r-sm)",
  border: "1px solid var(--ads-hairline-strong)",
  backgroundColor: "var(--ads-material-thick)",
  fontSize: "0.8125rem",
  color: "var(--ads-ink)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color var(--ads-dur-fast) var(--ads-ease), box-shadow var(--ads-dur-fast) var(--ads-ease), background-color var(--ads-dur-fast) var(--ads-ease)",
};

export default AddInjuryModal;
