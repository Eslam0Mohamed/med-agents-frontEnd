import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
    if (!date) return "No date";

    return new Date(date).toLocaleDateString("en-US", {
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
    return followUp?.patientId?.name || "Unknown Patient";
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

    if (!consultation?.symptoms) return "No symptoms recorded";

    if (Array.isArray(consultation.symptoms)) {
      return consultation.symptoms.join(", ");
    }

    return consultation.symptoms;
  };

  const getPreviousNotes = () => {
    const consultation = getPreviousConsultation();
    return consultation?.rawInput || "No previous notes recorded";
  };

  const getPreviousDiagnosis = () => {
    const consultation = getPreviousConsultation();
    return consultation?.diagnosis || "No diagnosis recorded";
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
      Swal.fire("Error", "Failed to load follow-up details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUp();
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
        "Missing data",
        "Doctor notes and symptoms are required before AI recommendation.",
        "warning"
      );
      return false;
    }

    if (!getPatientId()) {
      Swal.fire("Error", "Patient data is missing from this follow-up.", "error");
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
          "No AI result",
          "The backend did not return an AI recommendation.",
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
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to get AI recommendation",
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
        "AI recommendation required",
        "Please get the AI recommendation before confirming the follow-up.",
        "warning"
      );
      return;
    }

    if (!form.rawInput.trim() || !form.symptoms.trim() || !form.diagnosis.trim()) {
      Swal.fire(
        "Missing data",
        "Doctor notes, symptoms, and final diagnosis are required.",
        "warning"
      );
      return;
    }

    const patientId = getPatientId();

    if (!patientId) {
      Swal.fire("Error", "Patient data is missing from this follow-up.", "error");
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
        await updateConsultation(aiResult._id, consultationPayload);
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
        title: isEditMode ? "Follow-up updated" : "Follow-up confirmed",
        text: form.isChronic
          ? "The follow-up was saved and marked as chronic."
          : "The follow-up session was saved successfully.",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });

      navigate("/followups");
    } catch (error) {
      console.error("FULL ERROR:", error);
      console.error("BACKEND RESPONSE:", error?.response?.data);

      Swal.fire(
        "Error",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to save follow-up session",
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
          Loading follow-up session ...
        </p>
      </div>
    );
  }

  if (!followUp) {
    return (
      <div className="text-center py-20 bg-[#f8fafc] h-screen flex flex-col justify-center items-center p-4">
        <p className="text-slate-500 font-medium text-sm capitalize">
          Follow-up not found
        </p>

        <Link
          to="/followups"
          className="text-blue-500 font-bold mt-2 underline text-xs capitalize"
        >
          Back to follow-ups
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto w-full box-border">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 sm:p-8">
          <h2 className="text-xl font-bold text-blue-700 mb-1">
            {isEditMode ? "Edit Follow-up" : "Start Follow-up"}
          </h2>

          <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
            {isEditMode
              ? "Update the saved follow-up visit details."
              : "Complete a follow-up visit using the same clinical decision support flow."}
          </p>

          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
            <div className="space-y-1 mb-4">
              <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                <span>📌 Previous Consultation Context</span>
              </h3>

              <p className="text-xs text-gray-500">
                Review the previous consultation before starting this follow-up.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Patient
                </p>

                <p className="text-sm font-semibold text-gray-800">
                  {getPatientName()}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Scheduled Follow-up
                </p>

                <p className="text-sm text-gray-800">
                  {formatDate(followUp.scheduledDate)}
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Previous Instructions
                </p>

                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {followUp.instructions || "No instructions recorded"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Previous Diagnosis
                  </p>

                  <p className="text-sm text-gray-800">
                    {getPreviousDiagnosis()}
                  </p>
                </div>

                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Previous Symptoms
                  </p>

                  <p className="text-sm text-gray-800">
                    {getPreviousSymptoms()}
                  </p>
                </div>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Previous Notes
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
                  Patient
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
                  Doctor&apos;s Notes
                </label>

                <textarea
                  name="rawInput"
                  rows={4}
                  value={form.rawInput}
                  onChange={handleChange}
                  placeholder="Write follow-up visit notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Symptoms (comma separated)
                </label>

                <input
                  type="text"
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  placeholder="chest pain, fever, shortness of breath"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Language
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>

            {aiResult && (
              <div className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                    <span>📋 Clinical Decision Support & Follow-up</span>
                  </h3>

                  <p className="text-xs text-gray-500">
                    The AI recommendation has been generated. Please finalize the diagnosis and set a follow-up date if required.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-sm font-medium text-blue-700">
                        Diagnosis <span className="text-red-500">*</span>
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
                          Chronic Disease
                        </span>
                      </label>
                    </div>

                    <input
                      type="text"
                      name="diagnosis"
                      value={form.diagnosis}
                      onChange={handleChange}
                      placeholder="Enter final diagnosis..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-blue-700 sm:h-[28px] sm:flex sm:items-center">
                      Follow-up Date
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
                      Chronic History Update
                    </p>

                    <p className="text-sm text-blue-900 leading-relaxed">
                      This follow-up consultation will be saved with chronic disease status and can appear in the patient history as a chronic condition.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end pt-3 border-t border-blue-100/60">
                  <Link
                    to="/followups"
                    className="text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-medium block w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-semibold text-sm disabled:opacity-50 block w-full sm:w-auto order-1 sm:order-2"
                  >
                    {submitting
                      ? "Saving..."
                      : isEditMode
                        ? "Save Changes"
                        : "Confirm Follow-up"}
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
                  ? "Analyzing..."
                  : aiResult
                    ? "Regenerate AI Recommendation"
                    : "Get AI Recommendation"}{" "}
                →
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-100">
              <span className="font-semibold text-blue-800 text-sm flex items-center gap-1.5">
                ⚡ Clinical Insights
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
                    Agent Ready
                  </p>

                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Fill out the follow-up form to receive automated clinical recommendations.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse text-2xl">
                    🧠
                  </div>

                  <p className="font-semibold text-gray-800 text-sm">
                    Analyzing...
                  </p>

                  <p className="text-xs text-gray-400 mt-1.5">
                    The AI agent is reviewing the follow-up clinical data.
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
                      Urgency Level
                    </p>

                    <p className="text-sm font-bold capitalize">
                      {aiResult.urgencyLevel || "Not provided"}
                    </p>
                  </div>

                  {aiResult.suggestedSpecialist && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Suggested Specialist
                      </p>

                      <p className="text-sm text-gray-800">
                        {aiResult.suggestedSpecialist}
                      </p>
                    </div>
                  )}

                  {aiResult.structuredNote && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Structured Note
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
                          Agent Output
                        </p>

                        <p className="text-sm text-yellow-900 leading-relaxed">
                          The backend returned an AI response, but no structured clinical insight fields were provided.
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
                Follow-up Status
              </span>
            </div>

            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>This visit uses the same clinical flow as a consultation.</p>

              <p>
                {isEditMode
                  ? "You are editing an already completed follow-up session."
                  : "AI recommendation is required before confirming the follow-up."}
              </p>

              <p>After confirmation, the original follow-up moves to Confirmed.</p>

              {form.isChronic && (
                <p className="text-blue-700 font-semibold">
                  Chronic disease flag is enabled for this follow-up.
                </p>
              )}

              {form.followUpDate && (
                <p>
                  A follow-up date is set for {formatDate(form.followUpDate)}.
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