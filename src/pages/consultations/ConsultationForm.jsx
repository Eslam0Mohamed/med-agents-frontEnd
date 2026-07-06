import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setPatientChronicConditions } from "../../slices/patientsSlice";
import { consultationSchema } from "../../schemas/consultation";
import { getAllPatients } from "../../api/patient";
import {
  createConsultation,
  getAIRecommendation,
  getConsultationById,
  updateConsultation,
} from "../../api/consultation";
import { getPrescriptionByConsultation } from "../../api/prescription";
import PrescriptionModal from "../../components/prescriptions/PrescriptionModal";

const ConsultationForm = () => {
  const { t } = useTranslation();
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = !!id;
  const [createdId, setCreatedId] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState("");
  const [existingPrescription, setExistingPrescription] = useState(null);
  // بنستخدم useState عادي هنا بدل الاعتماد على react-hook-form، بالظبط
  // زي صفحة الفولو أب (StartFollowUp.jsx) اللي شغالة صح — عشان القيمة متأخرش
  // في التسجيل مع RHF بسبب إن الحقل بيتركّب في الصفحة بعد رجوع نتيجة الـ AI
  const [isChronicManual, setIsChronicManual] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      language: "en",
    },
  });

  const isChronicChecked = isChronicManual;

  const loadConsultation = useCallback(
    async (patientsList) => {
      try {
        const res = await getConsultationById(id);
        const data = res.data;

        const patientIdValue =
          typeof data.patientId === "object"
            ? data.patientId?._id
            : data.patientId;

        const patientName =
          typeof data.patientId === "object"
            ? data.patientId?.name
            : patientsList.find((p) => p._id === data.patientId)?.name || "";

        setValue("patientId", patientIdValue);
        setSelectedPatientId(patientIdValue);
        setPatientSearch(patientName);
        setValue("rawInput", data.rawInput);
        setValue(
          "symptoms",
          Array.isArray(data.symptoms)
            ? data.symptoms.join(", ")
            : data.symptoms,
        );
        setValue("diagnosis", data.diagnosis || "");
        setValue("language", data.language || "en");
        setIsChronicManual(data.isChronic || false);
        setValue(
          "followUpDate",
          data.followUpDate
            ? new Date(data.followUpDate).toISOString().split("T")[0]
            : "",
        );
        setAiResult(data);

        // زي صفحة الفولو اب بالظبط: أول ما تفتح Edit، تشوف على طول اللي
        // كنت كاتبه والبريسكربشن الموجودة مع بعض، من غير ما تحتاج تدوس
        // حفظ الأول عشان تظهرلك
        setSavedConsultationId(id);
        try {
          const presRes = await getPrescriptionByConsultation(id);
          setExistingPrescription(presRes?.data || null);
        } catch {
          setExistingPrescription(null);
        }
        setShowPrescriptionModal(true);
      } catch (err) {
        console.error("Failed to load consultation", err);
      }
    },
    [id, setValue],
  );

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await getAllPatients();
        const list = res.data || res;
        setPatients(list);

        if (isEditMode) {
          loadConsultation(list);
        }

        if (patientId) {
          const patient = list.find((p) => String(p._id) === String(patientId));
          if (patient) {
            setSelectedPatientId(patient._id);
            setPatientSearch(patient.name);
            setValue("patientId", patient._id);
            setShowDropdown(false);
          }
        }
      } catch (err) {
        console.error("Failed to load patients", err);
      }
    };

    loadPatients();
  }, [isEditMode, patientId, loadConsultation, setValue]);

  useEffect(() => {
    if (!isEditMode && !patientId && patients.length > 0) {
      setShowDropdown(true);
    }
  }, [patients, isEditMode, patientId]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()),
  );

  const handlePatientSelect = (patient) => {
    setPatientSearch(patient.name);
    setSelectedPatientId(patient._id);
    setValue("patientId", patient._id, { dValidate: true, shouldDirty: true });
    setShowDropdown(false);
  };

  const handleGetAIRecommendation = async () => {
    const isValid = await trigger(["patientId", "rawInput", "symptoms"]);
    if (!isValid) return;

    const formValues = watch();
    setIsGenerating(true);
    setAiResult(null);

    const payload = {
      patientId: selectedPatientId,
      rawInput: formValues.rawInput,
      diagnosis: formValues.diagnosis || "",
      language: formValues.language || "en",
      isChronic: isChronicManual,
      symptoms: formValues.symptoms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      followUpDate: formValues.followUpDate || undefined,
    };

    try {
      const res = await getAIRecommendation(payload);
      setAiResult(res.data);
      setCreatedId(res.data._id);
      setIsSaved(true);
      if (res.data.diagnosis) {
        setValue("diagnosis", res.data.diagnosis);
      }
    } catch (err) {
      console.log(err.response?.data);
      Swal.fire(t("common.error"), t("consultations.failedAI"), "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (formData) => {
    setIsLoading(true);

    const payload = {
      patientId: selectedPatientId || formData.patientId,
      rawInput: formData.rawInput,
      diagnosis: formData.diagnosis,
      language: formData.language,
      isChronic: isChronicManual,
      symptoms: formData.symptoms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      // في وضع التعديل، لازم نبعت followUpDate دايمًا حتى لو فاضية — عشان
      // الباك يقدر يفرّق بين "الدكتور مسح التاريخ عن قصد" و"الحقل ده أصلاً
      // مش جزء من التعديل". في وضع الإنشاء مفيش لبس، فمفيش داعي نبعتها فاضية.
      followUpDate: isEditMode
        ? formData.followUpDate || ""
        : formData.followUpDate || undefined,
      // لو الدكتور دوس "Get AI Recommendation" تاني بعد ما عدّل (في وضع
      // الإدت)، aiResult بيبقى فيه أحدث قراءة من الإيجنت (structuredNote/
      // suggestedSpecialist/urgencyLevel) — لازم نبعتها مع التحديث عشان
      // تتحفظ فعليًا على الكونسلتيشن دي بالذات، مش بس تتعرض في الشاشة
      // وتضيع لو الدكتور دوس Update. لو مفيش aiResult (نادر) منبعتش الحقول
      // دي خالص عشان منمسحش قيم موجودة بالغلط.
      ...(aiResult
        ? {
            structuredNote: aiResult.structuredNote,
            suggestedSpecialist: aiResult.suggestedSpecialist,
            urgencyLevel: aiResult.urgencyLevel,
          }
        : {}),
    };

    try {
      let consultationId = id;

      if (isEditMode) {
        const res = await updateConsultation(id, payload);
        if (res.chronicConditions) {
          dispatch(
            setPatientChronicConditions({
              patientId: payload.patientId,
              chronicConditions: res.chronicConditions,
            }),
          );
        }
      } else {
        const res = await createConsultation(payload);
        consultationId = res.data._id;
        if (res.chronicConditions) {
          dispatch(
            setPatientChronicConditions({
              patientId: payload.patientId,
              chronicConditions: res.chronicConditions,
            }),
          );
        }
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        title: t("consultations.savedSuccess"),
        text: payload.isChronic
          ? t("consultations.savedChronicText")
          : t("consultations.savedText"),
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
        // toast: true بيلغي الخلفية الداكنة (backdrop) اللي بتغطي الصفحة كلها
        // في الـ Swal العادي — عشان كارت الروشتة اللي بيظهر تحت مباشرة يبان
        // جزء طبيعي من نفس الصفحة، مش حاسس إنه popup فوق خلفية معتمة
        background: undefined,
      });

      setSavedConsultationId(consultationId);

      try {
        const presRes = await getPrescriptionByConsultation(consultationId);
        setExistingPrescription(presRes.data);
      } catch {
        setExistingPrescription(null);
      }

      setShowPrescriptionModal(true);
    } catch {
      Swal.fire(t("common.error"), t("consultations.failedSave"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  const getUrgencyColor = (level) => {
    const colors = {
      low: "text-green-600 bg-green-50 border-green-200",
      medium: "text-orange-600 bg-orange-50 border-orange-200",
      critical: "text-red-600 bg-red-50 border-red-200",
    };
    return colors[level] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const currentPatient =
    patients.find(
      (p) => String(p._id) === String(selectedPatientId || watch("patientId")),
    ) ||
    (existingPrescription?.patientId &&
    typeof existingPrescription.patientId === "object"
      ? existingPrescription.patientId
      : null);

  const handleClosePrescriptionModal = () => {
    setShowPrescriptionModal(false);
    navigate("/consultations");
  };

  const handlePrescriptionSaved = () => {
    setShowPrescriptionModal(false);
    navigate("/prescriptions");
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-5">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-blue-700 mb-1">
              {isEditMode
                ? t("consultations.editConsultation")
                : t("consultations.newConsultation")}
            </h2>
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
              {t("consultations.formSubtitle")}
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient */}
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    {t("consultations.patient")}
                  </label>
                  <input
                    type="text"
                    value={patientSearch}
                    disabled={isEditMode || !!patientId}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setSelectedPatientId("");
                      setValue("patientId", "", { shouldValidate: true });
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (!isEditMode && !patientId) setShowDropdown(true);
                    }}
                    placeholder={t("consultations.patientPlaceholder")}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditMode || patientId ? "bg-gray-100" : ""
                    }`}
                  />
                  <input type="hidden" {...register("patientId")} />

                  {!isEditMode &&
                    !patientId &&
                    showDropdown &&
                    filteredPatients.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                        {filteredPatients.map((p) => (
                          <li
                            key={p._id}
                            onClick={() => handlePatientSelect(p)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                          >
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    )}

                  {errors.patientId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.patientId.message}
                    </p>
                  )}
                </div>

                {/* Doctor's Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    {t("consultations.doctorNotes")}
                  </label>
                  <textarea
                    {...register("rawInput")}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.rawInput && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.rawInput.message}
                    </p>
                  )}
                </div>

                {/* Symptoms */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    {t("consultations.symptoms")}
                  </label>
                  <input
                    type="text"
                    {...register("symptoms")}
                    placeholder={t("consultations.symptomsPlaceholder")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.symptoms && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.symptoms.message}
                    </p>
                  )}
                </div>

                {/* Language */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    {t("consultations.language")}
                  </label>
                  <select
                    {...register("language")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">{t("consultations.english")}</option>
                    <option value="ar">{t("consultations.arabic")}</option>
                  </select>
                </div>
              </div>

              {/* AI Recommendation Result */}
              {(aiResult || isEditMode) && (
                <div className="mt-6 p-6 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                    <span>📋 {t("consultations.clinicalSupport")}</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t("consultations.finalizeNote")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diagnosis */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-sm font-medium text-blue-700">
                          {t("consultations.diagnosis")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 select-none">
                          <input
                            type="checkbox"
                            checked={isChronicManual}
                            onChange={(e) =>
                              setIsChronicManual(e.target.checked)
                            }
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                          />
                          <span
                            className={`transition-colors duration-200 ${isChronicChecked ? "text-blue-600 font-extrabold" : ""}`}
                          >
                            {t("consultations.chronicDisease")}
                          </span>
                        </label>
                      </div>
                      <input
                        type="text"
                        {...register("diagnosis")}
                        placeholder={t("consultations.diagnosisPlaceholder")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.diagnosis && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.diagnosis.message}
                        </p>
                      )}
                    </div>

                    {/* Follow-up Date */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        {t("consultations.followUpDate")}
                      </label>
                      <input
                        type="date"
                        {...register("followUpDate")}
                        min={minDate}
                        max={maxDate}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.followUpDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.followUpDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t">
                <button
                  type="button"
                  onClick={handleGetAIRecommendation}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  🤖{" "}
                  {isGenerating
                    ? t("consultations.analyzing")
                    : t("consultations.getAI")}{" "}
                  →
                </button>

                {(aiResult || isEditMode) && (
                  <div className="flex gap-3 ms-auto">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-medium text-sm disabled:opacity-50"
                    >
                      {isLoading
                        ? t("common.saving")
                        : isEditMode
                          ? t("common.update")
                          : t("consultations.saveRecord")}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-100">
                <span className="font-semibold text-blue-800 text-sm flex items-center gap-1.5">
                  ⚡ {t("consultations.clinicalInsights")}
                </span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                  BETA
                </span>
              </div>

              <div className="p-5">
                {!aiResult && !isGenerating && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      🧠
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {t("consultations.agentReady")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      {t("consultations.agentReadyText")}
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse text-2xl">
                      🧠
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {t("consultations.analyzing")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {t("consultations.agentAnalyzing")}
                    </p>
                  </div>
                )}

                {aiResult && !isGenerating && (
                  <div className="space-y-3">
                    <div
                      className={`border rounded-lg p-3 ${getUrgencyColor(aiResult.urgencyLevel)}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                        {t("consultations.urgencyLevel")}
                      </p>
                      <p className="text-sm font-bold capitalize">
                        {aiResult.urgencyLevel}
                      </p>
                    </div>

                    {aiResult.suggestedSpecialist && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t("consultations.suggestedSpecialist")}
                        </p>
                        <p className="text-sm text-gray-800">
                          {aiResult.suggestedSpecialist}
                        </p>
                      </div>
                    )}

                    {aiResult.structuredNote && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t("consultations.structuredNote")}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {aiResult.structuredNote}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* الروشتة: ديف منفصل تمامًا وFull width تحت مربع الكونسلتيشن +
          الإيجنت، مش جوه أي عمود منهم */}
      {showPrescriptionModal && (
        <div>
          <PrescriptionModal
            isOpen={showPrescriptionModal}
            onClose={handleClosePrescriptionModal}
            consultationId={savedConsultationId}
            patient={currentPatient}
            language={watch("language") || "en"}
            existingPrescription={existingPrescription}
            onSaved={handlePrescriptionSaved}
          />
        </div>
      )}
    </div>
  );
};

export default ConsultationForm;
