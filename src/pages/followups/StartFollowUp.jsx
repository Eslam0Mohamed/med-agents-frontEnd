import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { getFollowUpById, updateFollowUp } from "../../api/followup";
import {
  createConsultation,
  getAIRecommendation,
  updateConsultation,
} from "../../api/consultation";
import apiInstance from "../../config/apiInstance";

const initialForm = {
  rawInput: "",
  symptoms: "",
  diagnosis: "",
  language: "en",
  followUpDate: "",
  isChronic: false,
};

const StartFollowUp = () => {
  const { t } = useTranslation();
  const { followupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const passedFollowUp = location.state?.followUp || null;
  const isEditMode = location.state?.mode === "edit";

  const [followUp, setFollowUp] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const toInputDate = (date) => {
    if (!date) return "";

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";

    return d.toISOString().split("T")[0];
  };

  const getPatientName = () => {
    return followUp?.patientId?.name || t("followups.unknownPatient");
  };

  const getPatientId = () => {
    return getId(followUp?.patientId);
  };

  const getPreviousConsultation = () => {
    if (
      typeof followUp?.consultationId === "object" &&
      followUp?.consultationId !== null
    ) {
      return followUp.consultationId;
    }

    return null;
  };

  const getPreviousSymptoms = () => {
    const consultation = getPreviousConsultation();

    if (!consultation?.symptoms) return t("followups.start.noSymptomsRecorded");

    if (Array.isArray(consultation.symptoms)) {
      return consultation.symptoms.join(", ");
    }

    return consultation.symptoms;
  };

  const getPreviousNotes = () => {
    const consultation = getPreviousConsultation();
    return consultation?.rawInput || t("followups.start.noNotesRecorded");
  };

  const getPreviousDiagnosis = () => {
    const consultation = getPreviousConsultation();
    return consultation?.diagnosis || t("followups.start.noDiagnosisRecorded");
  };

  const normalizeAIResult = (response) => {
    const result = response?.data || response;

    if (!result) return null;

    return {
      ...result,
      diagnosis:
        result.diagnosis ||
        result.suggestedDiagnosis ||
        result.finalDiagnosis ||
        "",
      structuredNote:
        result.structuredNote ||
        result.recommendation ||
        result.content ||
        result.message ||
        "",
      urgencyLevel: result.urgencyLevel || result.urgency || result.priority || "",
      suggestedSpecialist: result.suggestedSpecialist || result.specialist || "",
      followUpDate: result.followUpDate || result.nextFollowUpDate || "",
    };
  };

  const getUrgencyColor = (level) => {
    const colors = {
      low: "text-green-600 bg-green-50 border-green-200",
      medium: "text-orange-600 bg-orange-50 border-orange-200",
      critical: "text-red-600 bg-red-50 border-red-200",
    };

    return (
      colors[level?.toLowerCase()] ||
      "text-gray-600 bg-gray-50 border-gray-200"
    );
  };

  const buildFormFromConsultation = (consultation, fallbackLanguage = "en") => {
    const symptomsValue = Array.isArray(consultation?.symptoms)
      ? consultation.symptoms.join(", ")
      : consultation?.symptoms || "";

    return {
      rawInput: consultation?.rawInput || "",
      symptoms: symptomsValue,
      diagnosis: consultation?.diagnosis || "",
      language: consultation?.language || fallbackLanguage || "en",
      followUpDate: toInputDate(consultation?.followUpDate),
      isChronic: consultation?.isChronic || false,
    };
  };

  const getBestCompletedConsultation = async (currentFollowUp) => {
    if (currentFollowUp?.completedConsultation) {
      return currentFollowUp.completedConsultation;
    }

    // completionConsultationId هو المرجع الموثوق لزيارة الإكمال — الباك
    // بيحطه على الفولو أب نفسها وقت ما تتكمّل، وبيرجّعه معبّي (populated)
    // من getFollowUpById. الاعتماد عليه أوثق بكتير من إننا ندوّر في لستة
    // "/consultations/doctor" لأن الإندبوينت ده أصلاً بيستبعد زيارات
    // الإكمال (اللي معاها followupId) من نتايجه، فمكانش بيلاقيها خالص
    // في الحالات المتسلسلة (فولو اب من فولو اب)
    if (
      typeof currentFollowUp?.completionConsultationId === "object" &&
      currentFollowUp?.completionConsultationId !== null
    ) {
      return currentFollowUp.completionConsultationId;
    }

    try {
      const consultationsRes = await apiInstance.get("/consultations/doctor");
      const doctorConsultations = consultationsRes?.data?.data || [];

      const currentFollowupId = String(followupId);
      const originalConsultationId = String(getId(currentFollowUp?.consultationId));
      const patientId = String(getId(currentFollowUp?.patientId));

      const linkedByFollowupId = doctorConsultations.find((consultation) => {
        return (
          String(getId(consultation.followupId)) === currentFollowupId ||
          String(getId(consultation.sourceFollowupId)) === currentFollowupId
        );
      });

      if (linkedByFollowupId) {
        return linkedByFollowupId;
      }

      const samePatientConsultations = doctorConsultations
        .filter((consultation) => {
          const samePatient = String(getId(consultation.patientId)) === patientId;
          const notOriginal =
            String(getId(consultation._id)) !== originalConsultationId;

          return samePatient && notOriginal;
        })
        .sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

      return samePatientConsultations[0] || null;
    } catch (error) {
      console.error("Could not load completed follow-up consultation:", error);
      return null;
    }
  };

  const fillEditForm = async (currentFollowUp) => {
    const completedConsultation =
      await getBestCompletedConsultation(currentFollowUp);

    const originalConsultation =
      typeof currentFollowUp?.consultationId === "object" &&
      currentFollowUp?.consultationId !== null
        ? currentFollowUp.consultationId
        : null;

    const consultationToEdit = completedConsultation || originalConsultation;

    if (!consultationToEdit) {
      setForm((prev) => ({
        ...prev,
        language: currentFollowUp?.language || "en",
      }));
      return;
    }

    const normalized = normalizeAIResult({
      ...consultationToEdit,
      _id: consultationToEdit._id,
    });

    setForm(
      buildFormFromConsultation(
        consultationToEdit,
        currentFollowUp?.language || "en"
      )
    );

    setAiResult(normalized);
  };

  const loadFollowUp = async () => {
    try {
      setLoading(true);

      let data = passedFollowUp;

      if (!data) {
        const res = await getFollowUpById(followupId);
        data = res?.data;
      }

      setFollowUp(data);

      if (isEditMode) {
        await fillEditForm(data);
      } else {
        setForm((prev) => ({
          ...prev,
          language: data?.language || "en",
        }));
      }
    } catch (error) {
      console.error(error);
      Swal.fire(t("common.error"), t("followups.messages.errorLoadDetails"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followupId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    const shouldResetAI =
      name === "rawInput" || name === "symptoms" || name === "language";

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(shouldResetAI && !isEditMode
        ? {
            diagnosis: "",
            followUpDate: "",
          }
        : {}),
    }));

    if (shouldResetAI && !isEditMode) {
      setAiResult(null);
    }
  };

  const buildSymptomsArray = () => {
    return form.symptoms
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const validateClinicalInputs = () => {
    if (!form.rawInput.trim() || !form.symptoms.trim()) {
      Swal.fire(
        t("followups.messages.missingDataTitle"),
        t("followups.messages.missingClinicalData"),
        "warning"
      );
      return false;
    }

    if (!getPatientId()) {
      Swal.fire(t("common.error"), t("followups.messages.missingPatientData"), "error");
      return false;
    }

    return true;
  };

  const handleGetAIRecommendation = async () => {
    if (!validateClinicalInputs()) return;

    try {
      setIsGenerating(true);

      const payload = {
        patientId: getPatientId(),
        rawInput: form.rawInput.trim(),
        diagnosis: "",
        language: form.language || "en",
        isChronic: form.isChronic,
        symptoms: buildSymptomsArray(),
        followUpDate: undefined,

        followupId,
        visitType: "followup",
        sourceFollowupId: followupId,
        parentConsultationId: getId(followUp?.consultationId),

        previousInstructions: followUp?.instructions || "",
        previousDiagnosis: getPreviousDiagnosis(),
        previousSymptoms: getPreviousSymptoms(),
        previousNotes: getPreviousNotes(),
      };

      const response = await getAIRecommendation(payload);
      const normalized = normalizeAIResult(response);

      if (!normalized) {
        Swal.fire(
          t("followups.messages.noAIResultTitle"),
          t("followups.messages.noAIResultText"),
          "warning"
        );
        return;
      }

      const finalResult = {
        ...normalized,
        _id: normalized._id || aiResult?._id || "",
      };

      setAiResult(finalResult);

      setForm((prev) => ({
        ...prev,
        diagnosis: finalResult.diagnosis || prev.diagnosis,
        followUpDate: finalResult.followUpDate
          ? toInputDate(finalResult.followUpDate)
          : prev.followUpDate,
      }));
    } catch (error) {
      console.error("AI ERROR:", error?.response?.data || error);

      Swal.fire(
        t("common.error"),
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          t("followups.messages.aiFailed"),
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmFollowUp = async (event) => {
    event.preventDefault();

    if (!isEditMode && !aiResult) {
      Swal.fire(
        t("followups.messages.aiRequiredTitle"),
        t("followups.messages.aiRequiredText"),
        "warning"
      );
      return;
    }

    if (!form.rawInput.trim() || !form.symptoms.trim() || !form.diagnosis.trim()) {
      Swal.fire(
        t("followups.messages.missingDataTitle"),
        t("followups.messages.missingFinalData"),
        "warning"
      );
      return;
    }

    const patientId = getPatientId();

    if (!patientId) {
      Swal.fire(t("common.error"), t("followups.messages.missingPatientData"), "error");
      return;
    }

    try {
      setSubmitting(true);

      const consultationPayload = {
        patientId,
        rawInput: form.rawInput.trim(),
        diagnosis: form.diagnosis.trim(),
        language: form.language,
        isChronic: form.isChronic,
        symptoms: buildSymptomsArray(),
        followUpDate: form.followUpDate || undefined,

        followupId,
        visitType: "followup",
        sourceFollowupId: followupId,
        parentConsultationId: getId(followUp?.consultationId),
      };

      let savedConsultationId = "";

      if (aiResult?._id) {
        // في وضع التعديل، لازم نبعت followUpDate دايمًا حتى لو فاضية — عشان
        // الباك يقدر يفرّق بين "الدكتور مسح التاريخ عن قصد" و"الحقل ده أصلاً
        // مش جزء من التعديل"
        await updateConsultation(aiResult._id, {
          ...consultationPayload,
          followUpDate: form.followUpDate || '',
        });
        savedConsultationId = aiResult._id;
      } else {
        const consultationRes = await createConsultation(consultationPayload);
        savedConsultationId = consultationRes?.data?._id || "";
      }

      await updateFollowUp(followupId, {
        status: "confirmed",
        instructions: `Follow-up after ${form.diagnosis.trim()}`,
        scheduledDate: form.followUpDate || followUp?.scheduledDate,
        language: form.language,
      });

      Swal.fire({
        title: isEditMode
          ? t("followups.messages.updatedTitle")
          : t("followups.messages.confirmedTitle"),
        text: form.isChronic
          ? t("followups.messages.savedChronicText")
          : t("followups.messages.savedText"),
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });

      navigate("/followups");
    } catch (error) {
      console.error("FULL ERROR:", error);
      console.error("BACKEND RESPONSE:", error?.response?.data);

      Swal.fire(
        t("common.error"),
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          t("followups.messages.saveFailed"),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <p className="text-slate-400 font-medium text-xs mt-4 tracking-wider uppercase">
          {t("followups.start.loadingSession")}
        </p>
      </div>
    );
  }

  if (!followUp) {
    return (
      <div className="text-center py-20 bg-[#f8fafc] h-screen flex flex-col justify-center items-center p-4">
        <p className="text-slate-500 font-medium text-sm capitalize">
          {t("followups.start.notFound")}
        </p>

        <Link
          to="/followups"
          className="text-blue-500 font-bold mt-2 underline text-xs capitalize"
        >
          {t("followups.start.backToFollowUps")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto w-full box-border">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 sm:p-8">
          <h2 className="text-xl font-bold text-blue-700 mb-1">
            {isEditMode ? t("followups.start.editTitle") : t("followups.start.title")}
          </h2>

          <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
            {isEditMode
              ? t("followups.start.editSubtitle")
              : t("followups.start.subtitle")}
          </p>

          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                <span>📌 {t("followups.start.previousContextTitle")}</span>
              </h3>

              <p className="text-xs text-gray-500">
                {t("followups.start.previousContextSubtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("consultations.patient")}
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {getPatientName()}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("followups.start.scheduledFollowUp")}
                </p>

                <p className="text-sm text-gray-800">
                  {formatDate(followUp.scheduledDate)}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("followups.start.previousInstructions")}
                </p>

                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {followUp.instructions || t("followups.start.noInstructionsRecorded")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("followups.start.previousDiagnosis")}
                  </p>

                  <p className="text-sm text-gray-800">
                    {getPreviousDiagnosis()}
                  </p>
                </div>

                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("followups.start.previousSymptoms")}
                  </p>

                  <p className="text-sm text-gray-800">
                    {getPreviousSymptoms()}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("followups.start.previousNotes")}
                </p>

                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {getPreviousNotes()}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleConfirmFollowUp} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  {t("consultations.patient")}
                </label>

                <input
                  type="text"
                  value={getPatientName()}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  {t("consultations.doctorNotes")}
                </label>

                <textarea
                  name="rawInput"
                  rows={4}
                  value={form.rawInput}
                  onChange={handleChange}
                  placeholder={t("followups.start.notesPlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  {t("consultations.symptoms")}
                </label>

                <input
                  type="text"
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  placeholder={t("followups.start.symptomsPlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  {t("consultations.language")}
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">{t("consultations.english")}</option>
                  <option value="ar">{t("consultations.arabic")}</option>
                </select>
              </div>
            </div>

            {aiResult && (
              <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                    <span>📋 {t("consultations.clinicalSupport")}</span>
                  </h3>

                  <p className="text-xs text-gray-500">
                    {t("consultations.finalizeNote")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-sm font-medium text-blue-700">
                        {t("consultations.diagnosis")} <span className="text-red-500">*</span>
                      </label>

                      <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 select-none w-max max-w-full">
                        <input
                          type="checkbox"
                          name="isChronic"
                          checked={form.isChronic}
                          onChange={handleChange}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                        />

                        <span
                          className={`transition-colors duration-200 truncate ${
                            form.isChronic ? "text-blue-600 font-extrabold" : ""
                          }`}
                        >
                          {t("consultations.chronicDisease")}
                        </span>
                      </label>
                    </div>

                    <input
                      type="text"
                      name="diagnosis"
                      value={form.diagnosis}
                      onChange={handleChange}
                      placeholder={t("consultations.diagnosisPlaceholder")}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-700 sm:h-[28px] sm:flex sm:items-center">
                      {t("consultations.followUpDate")}
                    </label>

                    <input
                      type="date"
                      name="followUpDate"
                      value={form.followUpDate}
                      min={isEditMode ? undefined : minDate}
                      max={maxDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {form.isChronic && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                      {t("followups.start.chronicUpdateTitle")}
                    </p>

                    <p className="text-sm text-blue-900 leading-relaxed">
                      {t("followups.start.chronicUpdateText")}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end pt-3 border-t border-blue-100/60">
                  <Link
                    to="/followups"
                    className="text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium block w-full sm:w-auto order-2 sm:order-1"
                  >
                    {t("common.cancel")}
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-semibold text-sm disabled:opacity-50 block w-full sm:w-auto order-1 sm:order-2"
                  >
                    {submitting
                      ? t("common.saving")
                      : isEditMode
                        ? t("followups.start.saveChanges")
                        : t("followups.start.confirmButton")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 pt-5 border-t">
              <button
                type="button"
                onClick={handleGetAIRecommendation}
                disabled={isGenerating}
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                🤖{" "}
                {isGenerating
                  ? t("consultations.analyzing")
                  : aiResult
                    ? t("followups.start.regenerateAI")
                    : t("consultations.getAI")}{" "}
                →
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow overflow-hidden">
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
                    {t("followups.start.agentReadyText")}
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
                    {t("followups.start.agentAnalyzingText")}
                  </p>
                </div>
              )}

              {aiResult && !isGenerating && (
                <div className="space-y-3">
                  <div
                    className={`border rounded-lg p-3 ${getUrgencyColor(
                      aiResult.urgencyLevel
                    )}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                      {t("consultations.urgencyLevel")}
                    </p>

                    <p className="text-sm font-bold capitalize">
                      {aiResult.urgencyLevel || t("followups.start.notProvided")}
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

                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {aiResult.structuredNote}
                      </p>
                    </div>
                  )}

                  {!aiResult.structuredNote &&
                    !aiResult.suggestedSpecialist &&
                    !aiResult.urgencyLevel && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                          {t("followups.start.agentOutputTitle")}
                        </p>

                        <p className="text-sm text-yellow-900 leading-relaxed">
                          {t("followups.start.agentOutputText")}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
              <span className="font-semibold text-blue-800 text-sm">
                {t("followups.start.statusCardTitle")}
              </span>
            </div>

            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>{t("followups.start.statusLine1")}</p>

              <p>
                {isEditMode
                  ? t("followups.start.statusLine2Edit")
                  : t("followups.start.statusLine2Start")}
              </p>

              <p>{t("followups.start.statusLine3")}</p>

              {form.isChronic && (
                <p className="text-blue-700 font-semibold">
                  {t("followups.start.chronicFlagEnabled")}
                </p>
              )}

              {form.followUpDate && (
                <p>
                  {t("followups.start.followUpDateSet", {
                    date: formatDate(form.followUpDate),
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartFollowUp;