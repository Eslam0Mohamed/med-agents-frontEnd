import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import {
  searchDrugs,
  checkPrescriptionSafety,
  createPrescription,
  updatePrescription,
} from "../../api/prescription";
import { getMedicationSuggestions } from "../../api/consultation";

const DOSAGE_UNITS = ["mcg", "mg", "g"];
const FREQUENCY_PERIODS = ["per day", "per week", "per month"];
const DURATION_UNITS = ["days", "weeks", "months"];

const emptyMedication = () => ({
  _key: Math.random().toString(36).slice(2),
  name: "",
  activeIngredient: "",
  dosageAmount: "",
  dosageUnit: "mg",
  frequencyCount: "",
  frequencyPeriod: "per day",
  isChronic: false,
  durationValue: "",
  durationUnit: "days",
});

// Convert a prescription's saved medication (decorated by the backend, e.g.
// dosageAmount/dosageUnit/frequencyCount/... already present) into form state.
const medicationToFormState = (med) => ({
  _key: Math.random().toString(36).slice(2),
  name: med.name || "",
  activeIngredient: med.activeIngredient || "",
  dosageAmount: med.dosageAmount ?? "",
  dosageUnit: med.dosageUnit || "mg",
  frequencyCount: med.frequencyCount ?? "",
  frequencyPeriod: med.frequencyPeriod || "per day",
  isChronic: !!med.isChronic,
  durationValue: med.durationValue ?? "",
  durationUnit: med.durationUnit || "days",
});

function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// One medication row, including its own drug-name autocomplete dropdown.
function MedicationRow({ medication, index, onChange, onRemove, canRemove }) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const handleNameChange = (value) => {
    // لو الدكتور بدأ يعدل الاسم يدويًا، المادة الفعالة المحفوظة قبل كدة مش مضمون تكون صحيحة لسة
    onChange(index, { ...medication, name: value, activeIngredient: "" });
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchDrugs(value.trim());
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (drug) => {
    // نلغي أي debounce جاري قبل ما نسجل الاختيار
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    const activeIngredient =
      drug.genericName &&
      drug.genericName !== "N/A" &&
      drug.genericName.toLowerCase() !== drug.displayName.toLowerCase()
        ? drug.genericName
        : "";
    onChange(index, {
      ...medication,
      name: drug.displayName,
      activeIngredient,
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const field = (key, value) =>
    onChange(index, { ...medication, [key]: value });

  return (
    <div className="border border-gray-200 rounded-lg p-4 relative bg-gray-50/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          {t("prescriptionModal.medicationLabel", { number: index + 1 })}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            ✕ {t("prescriptionModal.remove")}
          </button>
        )}
      </div>

      {/* Drug name with FDA autocomplete */}
      <div className="relative mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {t("prescriptionModal.medicationName")}
        </label>
        <input
          type="text"
          value={medication.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(
              () => setShowSuggestions(false),
              200,
            );
          }}
          placeholder={t("prescriptionModal.namePlaceholder")}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {medication.activeIngredient && (
          <p className="text-xs text-gray-400 mt-1">
            {t("prescriptionModal.activeIngredient")}{" "}
            <span className="text-gray-600">{medication.activeIngredient}</span>
          </p>
        )}
        {showSuggestions && (searching || suggestions.length > 0) && (
          <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
            {searching && (
              <li className="px-3 py-2 text-xs text-gray-400">
                {t("prescriptionModal.searchingFDA")}
              </li>
            )}
            {!searching &&
              suggestions.map((drug, i) => (
                <li
                  key={`${drug.displayName}-${i}`}
                  onMouseDown={() => handleSelectSuggestion(drug)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-900">
                    {drug.displayName}
                  </span>
                  {drug.genericName !== "N/A" &&
                    drug.genericName?.toLowerCase() !==
                      drug.displayName.toLowerCase() && (
                      <span className="text-gray-400 text-xs">
                        {" "}
                        ({drug.genericName})
                      </span>
                    )}
                  {drug.route !== "N/A" && (
                    <span className="text-gray-400 text-xs">
                      {" "}
                      · {drug.route}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Dosage amount + unit */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.dosageAmount")}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={medication.dosageAmount}
            onChange={(e) => field("dosageAmount", e.target.value)}
            placeholder={t("prescriptionModal.dosageAmountPlaceholder")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.unit")}
          </label>
          <select
            value={medication.dosageUnit}
            onChange={(e) => field("dosageUnit", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {DOSAGE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Frequency count + period */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.timesTaken")}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            value={medication.frequencyCount}
            onChange={(e) => field("frequencyCount", e.target.value)}
            placeholder={t("prescriptionModal.timesTakenPlaceholder")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.frequency")}
          </label>
          <select
            value={medication.frequencyPeriod}
            onChange={(e) => field("frequencyPeriod", e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {FREQUENCY_PERIODS.map((p) => (
              <option key={p} value={p}>
                {t(`prescriptionModal.frequencyPeriods.${p}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chronic checkbox */}
      <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={medication.isChronic}
          onChange={(e) => field("isChronic", e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          {t("prescriptionModal.chronicMedication")}{" "}
          <span className="text-gray-400">
            {t("prescriptionModal.chronicMedicationHint")}
          </span>
        </span>
      </label>

      {/* Duration value + unit (disabled when chronic) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.duration")}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            disabled={medication.isChronic}
            value={medication.isChronic ? "" : medication.durationValue}
            onChange={(e) => field("durationValue", e.target.value)}
            placeholder={
              medication.isChronic
                ? t("prescriptionModal.durationLifelong")
                : t("prescriptionModal.durationPlaceholder")
            }
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              medication.isChronic ? "bg-gray-100 text-gray-400" : "bg-white"
            }`}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t("prescriptionModal.durationUnit")}
          </label>
          <select
            disabled={medication.isChronic}
            value={medication.durationUnit}
            onChange={(e) => field("durationUnit", e.target.value)}
            className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              medication.isChronic ? "bg-gray-100 text-gray-400" : "bg-white"
            }`}
          >
            {DURATION_UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`prescriptionModal.durationUnits.${u}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Safety panel: same visual language as the Drug Safety dashboard, but now
// shows the single short sentence the Quick Drug Check agent returns for
// each medication (or a clean checkmark when there's no issue).
function SafetyPanel({ loading, checkedMedications }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse text-2xl">
          🧠
        </div>
        <p className="font-semibold text-gray-800 text-sm">
          {t("prescriptionModal.checkingSafety")}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          {t("prescriptionModal.checkingSafetyDesc")}
        </p>
      </div>
    );
  }

  if (!checkedMedications || checkedMedications.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
          🛡️
        </div>
        <p className="font-semibold text-gray-800 text-sm">
          {t("prescriptions.safetyScreening")}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          {t("prescriptionModal.safetyScreeningEmptyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {checkedMedications.map((med, i) =>
        med.quickCheckMessage ? (
          <div
            key={i}
            className="border border-amber-300 bg-amber-50 rounded-lg p-3"
          >
            <p className="text-xs font-bold text-amber-700 uppercase mb-1 flex items-center gap-1.5">
              <span>⚠</span> {med.name}
            </p>
            <p className="text-sm text-amber-800">{med.quickCheckMessage}</p>
          </div>
        ) : (
          <div
            key={i}
            className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center gap-2"
          >
            <span className="text-green-600">✓</span>
            <span className="text-sm font-medium text-green-800">
              {t("prescriptionModal.noIssuesDetected", { name: med.name })}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/**
 * PrescriptionModal
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - consultationId: string (required to create)
 * - patient: { _id, name, allergies, chronicConditions, dateOfBirth } (required)
 * - language: 'en' | 'ar'
 * - existingPrescription: prescription object when editing, null when creating
 * - onSaved: (prescription) => void  called after successful create/update
 *
 * ملاحظة: ده بقى جزء عادي من تدفق الصفحة (مش popup ثابت)، بالظبط زي التصميم
 * في داشبورد الأنجولار — فمفيش أي "fixed"/"backdrop"/زرار X هنا خالص. الصفحة
 * اللي بتستخدمه (ConsultationForm/StartFollowUp/Prescriptions) هي المسؤولة
 * عن مكانه في الصفحة وإظهاره/إخفاءه بشرط isOpen.
 */
export default function PrescriptionModal({
  isOpen,
  onClose,
  consultationId,
  patient,
  language = "en",
  existingPrescription = null,
  prefillMedications = null,
  diagnosis = "",
  symptoms = [],
  rawInput = "",
  isFollowup = false,
  previousPrescription = [],
  onSaved,
}) {
  const { t } = useTranslation();
  const isEditMode = !!existingPrescription;
  const [medications, setMedications] = useState([emptyMedication()]);
  const [checkedMedications, setCheckedMedications] = useState(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [medicationSuggestions, setMedicationSuggestions] = useState(null);
  const [loadingMedSuggestions, setLoadingMedSuggestions] = useState(false);
  const [medSuggestionsError, setMedSuggestionsError] = useState("");
  const safetyDebounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    if (existingPrescription?.medications?.length) {
      setMedications(
        existingPrescription.medications.map(medicationToFormState),
      );
    } else if (prefillMedications?.length) {
      // جاية من "اقترح أدوية" بتاع إيجنت التشخيص - الدكتور لسه يقدر
      // يعدّل/يمسح/يضيف قبل الحفظ، مش هتتحفظ زي ما هي أوتوماتيك
      setMedications(
        prefillMedications.map((m) => ({
          ...emptyMedication(),
          ...m,
          _key: Math.random().toString(36).slice(2),
        })),
      );
    } else {
      setMedications([emptyMedication()]);
    }
    setCheckedMedications(null);
    setMedicationSuggestions(null);
    setMedSuggestionsError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingPrescription, prefillMedications]);

  // إيجنت منفصل تمامًا عن إيجنت التشخيص - بياخد التشخيص + الأعراض + ملاحظات
  // الدكتور، ويقترح خطة أدوية مبدئية. النتيجة بتتضاف هنا كصفوف عادية في
  // الفورم - لسه بتعدي على فحص الأمان اللايف قبل الحفظ زي أي دواء تاني
  const handleSuggestMedications = async () => {
    if (!diagnosis || !diagnosis.trim()) {
      Swal.fire({
        title: t("common.error"),
        text: t("consultations.diagnosisRequiredForMeds"),
        icon: "warning",
        confirmButtonText: t("common.ok"),
      });
      return;
    }

    setLoadingMedSuggestions(true);
    setMedSuggestionsError("");
    setMedicationSuggestions(null);

    try {
      const res = await getMedicationSuggestions({
        patientId: patient?._id,
        diagnosis,
        symptoms,
        rawInput,
        language,
        isFollowup,
        previousPrescription,
      });
      setMedicationSuggestions(res.data || []);
    } catch (err) {
      setMedSuggestionsError(
        err.response?.data?.message || t("consultations.medSuggestionsFailed"),
      );
    } finally {
      setLoadingMedSuggestions(false);
    }
  };

  // بيضيف الأدوية المقترحة كصفوف في الفورم (مش بيحفظ حاجة أوتوماتيك) - لو
  // الفورم لسه فيه بس الصف الفاضي الافتراضي، بيستبدله؛ غير كده بيضيفهم فوق
  const handleUseSuggestedMedications = () => {
    if (!medicationSuggestions?.length) return;
    const newRows = medicationSuggestions.map((m) => ({
      ...emptyMedication(),
      name: m.name || "",
      activeIngredient: m.activeIngredient || "",
      dosageAmount: m.dosageAmount ?? "",
      dosageUnit: m.dosageUnit || "mg",
      frequencyCount: m.frequencyCount ?? "",
      frequencyPeriod: m.frequencyPeriod || "per day",
      isChronic: !!m.isChronic,
      durationValue: m.durationValue ?? "",
      durationUnit: m.durationUnit || "days",
    }));

    setMedications((prev) => {
      const isOnlyEmptyRow = prev.length === 1 && !prev[0].name?.trim();
      return isOnlyEmptyRow ? newRows : [...prev, ...newRows];
    });
    setMedicationSuggestions(null);
  };

  const runSafetyCheck = useCallback(
    async (meds) => {
      const validMeds = meds.filter((m) => m.name.trim());
      if (validMeds.length === 0 || !patient?._id) {
        // بنزود الرقم هنا كمان عشان لو رد قديم لسه ماوصلش يتجاهل، مش يكتب
        // فوق حالة "مفيش أدوية" دلوقتي
        requestIdRef.current += 1;
        setCheckedMedications(null);
        return;
      }

      // رقم فريد لكل نداء — بنستخدمه بعدين نتأكد إن الرد اللي وصل هو آخر
      // نداء اتبعت فعلاً، مش رد قديم وصل متأخر (race condition)
      const requestId = ++requestIdRef.current;

      try {
        setCheckingSafety(true);
        const res = await checkPrescriptionSafety({
          patientId: patient._id,
          medications: validMeds.map((m) => ({
            name: m.name,
            activeIngredient: m.activeIngredient || null,
            dosageAmount: m.dosageAmount ? Number(m.dosageAmount) : null,
            dosageUnit: m.dosageUnit || null,
            frequencyCount: m.frequencyCount ? Number(m.frequencyCount) : null,
            frequencyPeriod: m.frequencyPeriod || null,
            isChronic: !!m.isChronic,
            durationValue: m.durationValue ? Number(m.durationValue) : null,
            durationUnit: m.durationUnit || null,
          })),
          excludePrescriptionId: existingPrescription?._id,
        });

        // لو فيه نداء أحدث اتبعت بعد ده (يعني الدكتور كمّل يكتب)، الرد ده
        // بقى قديم — نتجاهله تمامًا عشان مايكتبش فوق النتيجة الصح الحالية
        if (requestId !== requestIdRef.current) return;

        setCheckedMedications(res.data?.medications || []);
      } catch {
        if (requestId === requestIdRef.current) setCheckedMedications(null);
      } finally {
        if (requestId === requestIdRef.current) setCheckingSafety(false);
      }
    },
    [patient, existingPrescription],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (safetyDebounceRef.current) clearTimeout(safetyDebounceRef.current);
    safetyDebounceRef.current = setTimeout(() => {
      runSafetyCheck(medications);
    }, 500);
    return () => clearTimeout(safetyDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications, isOpen]);

  if (!isOpen) return null;

  const handleMedicationChange = (index, updated) => {
    setMedications((prev) => prev.map((m, i) => (i === index ? updated : m)));
  };

  const handleAddMedication = () => {
    setMedications((prev) => [...prev, emptyMedication()]);
  };

  const handleRemoveMedication = (index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const validateMedications = () => {
    for (const med of medications) {
      if (!med.name.trim())
        return t("prescriptionModal.validation.nameRequired");
      if (!med.dosageAmount || Number(med.dosageAmount) <= 0)
        return t("prescriptionModal.validation.dosageInvalid", {
          name: med.name || t("prescriptionModal.defaultMedicationName"),
        });
      if (!med.frequencyCount || Number(med.frequencyCount) <= 0)
        return t("prescriptionModal.validation.frequencyInvalid", {
          name: med.name || t("prescriptionModal.defaultMedicationNameThe"),
        });
      if (
        !med.isChronic &&
        (!med.durationValue || Number(med.durationValue) <= 0)
      ) {
        return t("prescriptionModal.validation.durationInvalid", {
          name: med.name || t("prescriptionModal.defaultMedicationNameThe"),
        });
      }
    }
    return null;
  };

  const buildPayloadMedications = () =>
    medications.map((m) => ({
      name: m.name.trim(),
      activeIngredient: m.activeIngredient?.trim() || null,
      dosageAmount: Number(m.dosageAmount),
      dosageUnit: m.dosageUnit,
      frequencyCount: Number(m.frequencyCount),
      frequencyPeriod: m.frequencyPeriod,
      isChronic: m.isChronic,
      ...(m.isChronic
        ? {}
        : {
            durationValue: Number(m.durationValue),
            durationUnit: m.durationUnit,
          }),
    }));

  const handleSave = async () => {
    const validationError = validateMedications();
    if (validationError) {
      Swal.fire({
        title: t("prescriptionModal.incompleteTitle"),
        text: validationError,
        icon: "warning",
        confirmButtonText: t("common.ok"),
      });
      return;
    }

    setIsSaving(true);
    try {
      const payloadMedications = buildPayloadMedications();
      let res;
      if (isEditMode) {
        res = await updatePrescription(existingPrescription._id, {
          medications: payloadMedications,
          language,
        });
      } else {
        res = await createPrescription({
          consultationId,
          patientId: patient._id,
          medications: payloadMedications,
          language,
        });
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: isEditMode
          ? t("prescriptionModal.updatedSuccess")
          : t("prescriptionModal.savedSuccess"),
        timer: 1400,
        showConfirmButton: false,
      });
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      Swal.fire({
        title: t("common.error"),
        text: err.response?.data?.message || t("prescriptionModal.saveFailed"),
        icon: "error",
        confirmButtonText: t("common.ok"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const age = calculateAge(patient?.dateOfBirth);

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100">
      <div className="border-b px-5 sm:px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-blue-700">
            {isEditMode
              ? t("prescriptionModal.editTitle")
              : t("prescriptionModal.addTitle")}
          </h2>
          {patient && (
            <p className="text-xs text-gray-500 mt-1">
              {patient.name}
              {age !== null && (
                <> · {t("prescriptionModal.ageLabel", { age })}</>
              )}
              {patient.allergies?.length > 0 && (
                <>
                  {" "}
                  ·{" "}
                  {t("prescriptionModal.allergiesLabel", {
                    list: patient.allergies.join(", "),
                  })}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Medications column */}
        <div className="lg:col-span-2 space-y-4">
          {medications.map((med, index) => (
            <MedicationRow
              key={med._key}
              medication={med}
              index={index}
              onChange={handleMedicationChange}
              onRemove={handleRemoveMedication}
              canRemove={medications.length > 1}
            />
          ))}

          <button
            type="button"
            onClick={handleAddMedication}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            {t("prescriptionModal.addAnotherMedication")}
          </button>
        </div>

        {/* Safety column */}
        <div className="space-y-3">
          {diagnosis && diagnosis.trim() && (
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
              <div className="bg-purple-50 px-4 py-3 flex items-center justify-between border-b border-purple-100 gap-2">
                <span className="font-semibold text-purple-800 text-sm flex items-center gap-1.5">
                  💊 {t("consultations.suggestedMedications")}
                </span>
                <button
                  type="button"
                  onClick={handleSuggestMedications}
                  disabled={loadingMedSuggestions}
                  className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-700 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition disabled:opacity-50 shrink-0"
                >
                  {loadingMedSuggestions
                    ? t("consultations.generatingMeds")
                    : t("consultations.generateMeds")}
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-3">
                  {t("consultations.suggestedMedicationsNote")}
                </p>

                {medSuggestionsError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">
                    {medSuggestionsError}
                  </p>
                )}

                {medicationSuggestions &&
                  medicationSuggestions.length === 0 && (
                    <p className="text-xs text-gray-400">
                      {t("consultations.noMedSuggestions")}
                    </p>
                  )}

                {medicationSuggestions && medicationSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {medicationSuggestions.map((med, i) => (
                      <div
                        key={i}
                        className="bg-purple-50/60 border border-purple-100 rounded-lg p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">
                            {med.name}
                            {med.activeIngredient &&
                              med.activeIngredient.toLowerCase() !==
                                med.name.toLowerCase() && (
                                <span className="text-slate-400 font-normal">
                                  {" "}
                                  ({med.activeIngredient})
                                </span>
                              )}
                          </span>
                          {med.isChronic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 uppercase">
                              {t("patients.chronic")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {med.dosageAmount}
                          {med.dosageUnit} · {med.frequencyCount}x{" "}
                          {med.frequencyPeriod}
                          {!med.isChronic &&
                            med.durationValue &&
                            ` · ${med.durationValue} ${med.durationUnit}`}
                        </p>
                        {med.reason && (
                          <p className="text-xs text-slate-600 mt-1.5 italic">
                            {med.reason}
                          </p>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleUseSuggestedMedications}
                      className="w-full mt-1 inline-flex items-center justify-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition"
                    >
                      {t("consultations.useSuggestedMedications")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-b border-blue-100">
              <span className="font-semibold text-blue-800 text-sm flex items-center gap-1.5">
                🛡️ {t("prescriptions.safetyScreening")}
              </span>
            </div>
            <div className="p-4">
              <SafetyPanel
                loading={checkingSafety}
                checkedMedications={checkedMedications}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t px-5 sm:px-6 py-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-medium text-sm disabled:opacity-50"
        >
          {isSaving
            ? t("common.saving")
            : isEditMode
              ? t("prescriptionModal.update")
              : t("prescriptionModal.save")}
        </button>
      </div>
    </div>
  );
}
