import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { patientSchema } from "../../schemas/patientSchema";
import {
  createPatient,
  updatePatient,
  fetchPatientById,
} from "../../api/patient";
import { clearSelectedPatient } from "../../slices/patientsSlice";
import { searchDrugs } from "../../api/prescription";

export default function PatientForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedPatient, isSubmitting } = useSelector(
    (state) => state.patients,
  );

  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [medicationInput, setMedicationInput] = useState("");
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [showMedicationSuggestions, setShowMedicationSuggestions] =
    useState(false);
  const [searchingMedications, setSearchingMedications] = useState(false);
  const medicationDebounceRef = useRef(null);
  const medicationBlurTimeoutRef = useRef(null);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      allergies: [],
      chronicConditions: [],
      chronicMedications: [],
    },
  });

  const allergies = watch("allergies");
  const chronicConditions = watch("chronicConditions");
  const chronicMedications = watch("chronicMedications");

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchPatientById(id));
    }
    return () => dispatch(clearSelectedPatient());
  }, [id, isEditMode, dispatch]);

  useEffect(() => {
    if (isEditMode && selectedPatient) {
      reset({
        ...selectedPatient,
        dateOfBirth: selectedPatient.dateOfBirth?.split("T")[0] || "",
      });
    }
  }, [selectedPatient, isEditMode, reset]);

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val) {
      setValue("allergies", [...allergies, val]);
      setAllergyInput("");
    }
  };

  const removeAllergy = (index) => {
    setValue(
      "allergies",
      allergies.filter((_, i) => i !== index),
    );
  };

  const addCondition = () => {
    const val = conditionInput.trim();
    if (val) {
      setValue("chronicConditions", [...chronicConditions, val]);
      setConditionInput("");
    }
  };

  const removeCondition = (index) => {
    setValue(
      "chronicConditions",
      chronicConditions.filter((_, i) => i !== index),
    );
  };

  const handleMedicationInputChange = (value) => {
    setMedicationInput(value);
    setShowMedicationSuggestions(true);

    if (medicationDebounceRef.current)
      clearTimeout(medicationDebounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setMedicationSuggestions([]);
      return;
    }
    medicationDebounceRef.current = setTimeout(async () => {
      try {
        setSearchingMedications(true);
        const res = await searchDrugs(value.trim());
        setMedicationSuggestions(res.data || []);
      } catch {
        setMedicationSuggestions([]);
      } finally {
        setSearchingMedications(false);
      }
    }, 350);
  };

  const addMedication = (name) => {
    const val = (name ?? medicationInput).trim();
    if (
      val &&
      !chronicMedications.some((m) => m.toLowerCase() === val.toLowerCase())
    ) {
      setValue("chronicMedications", [...chronicMedications, val]);
    }
    setMedicationInput("");
    setMedicationSuggestions([]);
    setShowMedicationSuggestions(false);
  };

  const handleSelectMedicationSuggestion = (drug) => {
    if (medicationDebounceRef.current)
      clearTimeout(medicationDebounceRef.current);
    if (medicationBlurTimeoutRef.current)
      clearTimeout(medicationBlurTimeoutRef.current);
    addMedication(drug.displayName);
  };

  const removeMedication = (index) => {
    setValue(
      "chronicMedications",
      chronicMedications.filter((_, i) => i !== index),
    );
  };

  const onSubmit = async (data) => {
    setServerError("");
    try {
      if (isEditMode) {
        await dispatch(updatePatient({ id, patientData: data })).unwrap();
        navigate("/patients");
      } else {
        // بعد ما نضيف مريض جديد، بنسأل الدكتور يبدأله كونسلتيشن على طول
        // بدل ما نرجّعه لقايمة المرضى وهو مش عارف الخطوة الجاية إيه
        const newPatient = await dispatch(createPatient(data)).unwrap();
        await Swal.fire({
          icon: "success",
          title: t("patients.patientAddedTitle"),
          text: t("patients.patientAddedText"),
          confirmButtonText: t("common.ok"),
        });
        navigate(`/consultations/add/${newPatient._id}`);
      }
    } catch (err) {
      // مبنعرضش نص الإيرور الخام من الباك اند زي ما هو (بيبقى إنجليزي دايمًا
      // ومش متطابق مع لغة الواجهة) - بنعرض رسالة مترجمة. لو الباك اند رجّع
      // كود معروف (زي تكرار رقم التليفون) بنعرض رسالة مخصوصة أوضح، وإلا
      // بنعرض رسالة عامة مترجمة بدل النص الخام
      const rawMessage = typeof err === "string" ? err : err?.message;
      setServerError(
        rawMessage === "PHONE_ALREADY_EXISTS"
          ? t("patients.validation.phoneAlreadyExists")
          : t("patients.validation.serverError"),
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900">
          {t("patients.patientInformation")}
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {t("patients.manageInfo")}
        </p>

        {serverError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("patients.fullName")}
              </label>
              <input
                {...register("name")}
                placeholder="e.g. محمد علي "
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {t(errors.name.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("patients.phone")}
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.phone ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {t(errors.phone.message)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("patients.dateOfBirth")}
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                {...register("dateOfBirth")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.dateOfBirth ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">
                  {t(errors.dateOfBirth.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("patients.gender")}
              </label>
              <select
                {...register("gender")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.gender ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">{t("patients.gender")}</option>
                <option value="male">{t("patients.male")}</option>
                <option value="female">{t("patients.female")}</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">
                  {t(errors.gender.message)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("patients.bloodType")}{" "}
                <span className="text-gray-400 font-normal">
                  ({t("common.optional")})
                </span>
              </label>
              <select
                {...register("bloodType")}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.bloodType ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">{t("patients.bloodType")}</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                  (bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ),
                )}
              </select>
              {errors.bloodType && (
                <p className="text-red-500 text-xs mt-1">
                  {t(errors.bloodType.message)}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("patients.allergies")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("common.optional")})
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5">
              {allergies.map((a, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => removeAllergy(i)}
                    className="font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addAllergy())
                }
                placeholder={t("patients.addAllergy")}
                className="flex-1 min-w-30 outline-none text-sm"
              />
              <button
                type="button"
                onClick={addAllergy}
                className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-700 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md transition"
              >
                {t("common.add")}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("patients.chronicConditions")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("common.optional")})
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5">
              {chronicConditions.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addCondition())
                }
                placeholder={t("patients.addCondition")}
                className="flex-1 min-w-30 outline-none text-sm"
              />
              <button
                type="button"
                onClick={addCondition}
                className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-700 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md transition"
              >
                {t("common.add")}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("patients.chronicMedications")}{" "}
              <span className="text-gray-400 font-normal">
                ({t("common.optional")})
              </span>
            </label>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5">
                {chronicMedications.map((m, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMedication(i)}
                      className="font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={medicationInput}
                  onChange={(e) => handleMedicationInputChange(e.target.value)}
                  onFocus={() => setShowMedicationSuggestions(true)}
                  onBlur={() => {
                    medicationBlurTimeoutRef.current = setTimeout(
                      () => setShowMedicationSuggestions(false),
                      200,
                    );
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addMedication())
                  }
                  placeholder={t("patients.addMedication")}
                  className="flex-1 min-w-30 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => addMedication()}
                  className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-700 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-md transition"
                >
                  {t("common.add")}
                </button>
              </div>
              {showMedicationSuggestions &&
                (searchingMedications || medicationSuggestions.length > 0) && (
                  <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {searchingMedications && (
                      <li className="px-3 py-2 text-xs text-gray-400">
                        {t("prescriptionModal.searchingFDA")}
                      </li>
                    )}
                    {!searchingMedications &&
                      medicationSuggestions.map((drug, i) => (
                        <li
                          key={`${drug.displayName}-${i}`}
                          onMouseDown={() =>
                            handleSelectMedicationSuggestion(drug)
                          }
                          className="px-3 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                        >
                          <span className="font-medium text-gray-900">
                            {drug.displayName}
                          </span>
                          {drug.genericName && drug.genericName !== "N/A" && (
                            <span className="text-gray-400 text-xs">
                              {" "}
                              — {drug.genericName}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:bg-gray-400 transition"
            >
              {isSubmitting ? t("common.saving") : t("patients.saveRecord")}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 flex gap-3">
        <span className="text-blue-500">ℹ️</span>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {t("patients.privacyTitle")}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {t("patients.privacyText")}
          </p>
        </div>
      </div>
    </div>
  );
}