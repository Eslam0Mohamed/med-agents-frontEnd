import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { setPatientChronicConditions } from "../../slices/patientsSlice";
import { getFollowUpById, updateFollowUp } from "../../api/followup";
import {
  createConsultation,
  getAIRecommendation,
  updateConsultation,
} from "../../api/consultation";
import { getPrescriptionByConsultation } from "../../api/prescription";
import PrescriptionModal from "../../components/prescriptions/PrescriptionModal";
import apiInstance from "../../config/apiInstance";
import LanguageToggle from "../../components/LanguageToggle";
import DifferentialDiagnosisPanel from "../../components/consultations/DifferentialDiagnosisPanel";
import LabFilesUploader from "../../components/consultations/LabFilesUploader";
import InlineError from "../../components/InlineError";

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
  const dispatch = useDispatch();

  const passedFollowUp = location.state?.followUp || null;
  const isEditMode = location.state?.mode === "edit";
  // لو الدكتور جاي من صفحة البريسكربشن عشان يعدّل الروشتة بس، مش عايزينه
  // يعدّل في الفولو أب نفسها من هنا خالص — بس يشوف السياق ويعدّل الروشتة
  const prescriptionOnlyEdit = !!location.state?.prescriptionOnlyEdit;

  const [followUp, setFollowUp] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [aiResult, setAiResult] = useState(null);
  // ميتاداتا ملفات التحاليل/الأشعة المرفوعة (اختياري)
  const [labFiles, setLabFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // بعد ما نحفظ الكونسلتيشن، ديف الروشتة بيظهر في نفس الصفحة (مش بوب أب ولا
  // صفحة تانية) عشان الدكتور يقدر يعدّل/يضيف الروشتة في نفس مكان إكمال الفولو أب
  const [showPrescriptionSection, setShowPrescriptionSection] = useState(false);
  const [existingPrescription, setExistingPrescription] = useState(null);
  // بدل ما نعرض ملاحظات الدكتور والأعراض بتاعة الكونسلتيشن/الفولو أب اللي
  // فاتت، عايزين نعرض الروشتة اللي اتكتبت فيها (سواء كونسلتيشن عادية أو
  // فولو أب سابقة) عشان الدكتور يشوف الأدوية الحالية للمريض بسرعة
  const [previousPrescription, setPreviousPrescription] = useState(null);
  const [savedConsultationId, setSavedConsultationId] = useState("");

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

  const getPreviousPrescriptionMeds = () => {
    return (previousPrescription?.medications || []).filter(Boolean);
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
      urgencyLevel:
        result.urgencyLevel || result.urgency || result.priority || "",
      suggestedSpecialist:
        result.suggestedSpecialist || result.specialist || "",
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
      colors[level?.toLowerCase()] || "text-gray-600 bg-gray-50 border-gray-200"
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

  const getBestCompletedConsultation = (currentFollowUp) => {
    // الباك اند (getFollowUpById) بيرجّع completionConsultationId وconsultationId
    // كاملين (populated) من الأول - مفيش داعي لأي تخمين أو نداء إضافي في
    // الفرونت، ده بس كان بيزود احتمال إننا نجيب كونسلتيشن غلط أو نفشل بصمت
    if (
      typeof currentFollowUp?.completionConsultationId === "object" &&
      currentFollowUp?.completionConsultationId !== null
    ) {
      return currentFollowUp.completionConsultationId;
    }

    if (
      typeof currentFollowUp?.consultationId === "object" &&
      currentFollowUp?.consultationId !== null
    ) {
      return currentFollowUp.consultationId;
    }

    return null;
  };

  const fillEditForm = async (currentFollowUp) => {
    const consultationToEdit = getBestCompletedConsultation(currentFollowUp);

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
        currentFollowUp?.language || "en",
      ),
    );

    setAiResult(normalized);
    setLabFiles(
      Array.isArray(consultationToEdit.labFiles)
        ? consultationToEdit.labFiles
        : [],
    );

    if (prescriptionOnlyEdit) {
      setSavedConsultationId(consultationToEdit._id);
      try {
        const presRes = await getPrescriptionByConsultation(
          consultationToEdit._id,
        );
        setExistingPrescription(presRes?.data || null);
      } catch {
        setExistingPrescription(null);
      }
      setShowPrescriptionSection(true);
    }
  };

  const loadFollowUp = async () => {
    try {
      setLoading(true);
      setLoadError("");

      // زي صفحة الكونسلتيشن بالظبط: دايمًا نجيب البيانات فريش من الباك اند
      // بدل الاعتماد على location.state (ممكن تبقى قديمة من وقت تحميل
      // الليستة)؛ الباك اند أصلاً بيرجّع consultationId وcompletionConsultationId
      // كاملين (populated)، فمش محتاجين أي "تخمين" إضافي في الفرونت
      const res = await getFollowUpById(followupId);
      const data = res?.data;

      setFollowUp(data);

      // حماية إضافية: حتى لو حد وصل للصفحة دي بشكل مباشر (مش من زرار
      // "Start Follow Up" اللي بقى مخفي أصلاً للفولو أبس المتأخرة)، منمنعش
      // بدء فولو أب اتلغت (الباك اند بيحوّلها cancelled تلقائيًا لو فات
      // ميعادها ولسه pending) - أو حتى لو لسبب ما لسه راجعة pending بس
      // ميعادها فعلًا فات (fallback احتياطي لو الباك اند القديم شغال)
      const isCancelledStatus =
        data?.status === "cancelled" || data?.status === "canceled";
      const isPendingStatus = !data?.status || data.status === "pending";
      const isPastDueFollowUp =
        !isEditMode &&
        (isCancelledStatus ||
          (isPendingStatus &&
            data?.scheduledDate &&
            new Date(data.scheduledDate).setHours(0, 0, 0, 0) <
              new Date().setHours(0, 0, 0, 0)));

      if (isPastDueFollowUp) {
        Swal.fire(
          t("common.error"),
          t("followups.pastDueCannotStart"),
          "error",
        );
        navigate("/followups");
        return;
      }

      // نجيب روشتة الكونسلتيشن/الفولو أب اللي فاتت (اللي جدولت الفولو أب
      // الحالية دي) عشان نعرضها بدل الملاحظات والأعراض القديمة
      const prevConsultationId =
        typeof data?.consultationId === "object"
          ? data.consultationId?._id
          : data?.consultationId;
      if (prevConsultationId) {
        try {
          const prevPresRes =
            await getPrescriptionByConsultation(prevConsultationId);
          setPreviousPrescription(prevPresRes?.data || null);
        } catch {
          setPreviousPrescription(null);
        }
      } else {
        setPreviousPrescription(null);
      }

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
      setLoadError(t("followups.messages.errorLoadDetails"));
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
      setFormError(t("followups.messages.missingClinicalData"));
      return false;
    }

    if (!getPatientId()) {
      setFormError(t("followups.messages.missingPatientData"));
      return false;
    }

    return true;
  };

  const handleGetAIRecommendation = async () => {
    setFormError("");
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

        previousInstructions:
          getPreviousConsultation()?.structuredNote ||
          getPreviousConsultation()?.rawInput ||
          "",
        previousDiagnosis: getPreviousDiagnosis(),
        previousSymptoms: getPreviousSymptoms(),
        previousNotes: getPreviousNotes(),
        previousPrescription: getPreviousPrescriptionMeds()
          .map((m) => {
            const dose =
              m.dosageAmount && m.dosageUnit
                ? `${m.dosageAmount}${m.dosageUnit}`
                : "";
            const freq =
              m.frequencyCount && m.frequencyPeriod
                ? `${m.frequencyCount}x ${m.frequencyPeriod}`
                : "";
            return [m.name, dose, freq].filter(Boolean).join(" ");
          })
          .join(", "),

        // ميتاداتا الملفات بس - الباك بيقرا الملف الفعلي من الديسك
        labFiles: labFiles.map(({ url, mimeType, originalName }) => ({
          url,
          mimeType,
          originalName,
        })),
      };

      const response = await getAIRecommendation(payload);
      const normalized = normalizeAIResult(response);

      if (!normalized) {
        setFormError(t("followups.messages.noAIResultText"));
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

      setFormError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          t("followups.messages.aiFailed"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmFollowUp = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!isEditMode && !aiResult) {
      setFormError(t("followups.messages.aiRequiredText"));
      return;
    }

    if (
      !form.rawInput.trim() ||
      !form.symptoms.trim() ||
      !form.diagnosis.trim()
    ) {
      setFormError(t("followups.messages.missingFinalData"));
      return;
    }

    const patientId = getPatientId();

    if (!patientId) {
      setFormError(t("followups.messages.missingPatientData"));
      return;
    }

    if (form.followUpDate) {
      // مقارنة بالتواريخ بس (من غير وقت) عشان "النهاردة" و"بكرة" يتقارنوا صح
      const chosen = new Date(form.followUpDate);
      const chosenDateOnly = new Date(
        chosen.getFullYear(),
        chosen.getMonth(),
        chosen.getDate(),
      );
      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      if (chosenDateOnly <= todayDateOnly) {
        setFormError(t("followups.messages.followUpDateBeforeCompletion"));
        return;
      }

      const maxAllowedDate = new Date(todayDateOnly);
      maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 6);
      if (chosenDateOnly > maxAllowedDate) {
        setFormError(t("followups.messages.followUpDateTooFar"));
        return;
      }
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

        // بتتحفظ على الكونسلتيشن نفسها عشان تفضل موجودة في الـ Patient
        // History، حتى لو الدكتور مادّاش على "Get AI Recommendation" تاني
        // بعد ما ضاف الملفات
        labFiles: labFiles.map(({ url, mimeType, originalName, size }) => ({
          url,
          mimeType,
          originalName,
          size,
        })),

        // من غيرهم، الباك بيرجع للـ default بتاعه (structuredNote = rawInput
        // و urgencyLevel = "unknown") — بالظبط زي اللي بيحصل في صفحة
        // الكونسلتيشن، لازم نبعت أحدث قراءة من الإيجنت (aiResult) عشان تتحفظ
        // فعليًا على الكونسلتيشن دي، وتظهر صح في Clinical Insights وفي
        // Patient History بعد كده
        ...(aiResult
          ? {
              structuredNote: aiResult.structuredNote,
              suggestedSpecialist: aiResult.suggestedSpecialist,
              urgencyLevel: aiResult.urgencyLevel,
              // القطع المنظمة لإيجنت التشخيص التفريقي - بتتحفظ منفصلة عشان
              // الـ Patient History يقدر يعرضهم في أقسام منظمة
              clinicalReading: aiResult.clinicalReading,
              possibleDiagnoses: aiResult.possibleDiagnoses,
            }
          : {}),
      };

      let savedConsultationId = "";
      let newFollowUp = null;

      if (aiResult?._id) {
        // في وضع التعديل، لازم نبعت followUpDate دايمًا حتى لو فاضية — عشان
        // الباك يقدر يفرّق بين "الدكتور مسح التاريخ عن قصد" و"الحقل ده أصلاً
        // مش جزء من التعديل"
        const updateRes = await updateConsultation(aiResult._id, {
          ...consultationPayload,
          followUpDate: form.followUpDate || "",
        });
        savedConsultationId = aiResult._id;
        newFollowUp = updateRes?.newFollowUp || null;
        if (updateRes.chronicConditions) {
          dispatch(
            setPatientChronicConditions({
              patientId,
              chronicConditions: updateRes.chronicConditions,
            }),
          );
        }
      } else {
        const consultationRes = await createConsultation(consultationPayload);
        savedConsultationId = consultationRes?.data?._id || "";
        newFollowUp = consultationRes?.newFollowUp || null;
        if (consultationRes.chronicConditions) {
          dispatch(
            setPatientChronicConditions({
              patientId,
              chronicConditions: consultationRes.chronicConditions,
            }),
          );
        }
        // بعد أول حفظ، لو الدكتور دوس على الزرار تاني (الفورم لسه ظاهر ومعاه
        // ديف الروشتة)، لازم يتعمل تعديل على نفس الكونسلتيشن دي مش إنشاء
        // نسخة مكررة تانية — فبنسجل الـ id في aiResult عشان الشرط اللي فوق
        // (aiResult?._id) يتحقق صح في أي إرسال تاني
        if (savedConsultationId) {
          setAiResult((prev) => ({
            ...(prev || {}),
            _id: savedConsultationId,
          }));
        }
      }

      // الباك اند دلوقتي بيقفل الفولو أب المصدر دي (status: confirmed +
      // completedAt = تاريخ اليوم) وينشئ/يحدّث الفولو أب الجديدة بالتاريخ
      // المكتوب، كل ده كجزء من نداء createConsultation/updateConsultation
      // نفسه فوق - مبقاش محتاجين نداء منفصل هنا، وأي نداء زيادة كان بيكتب
      // فوق scheduledDate الأصلي بتاريخ الفولو أب الجديد بالغلط

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

      if (form.followUpDate && !newFollowUp?._id) {
        // منعرضش أي Alert للدكتور هنا (بناءً على طلبه)، بس بنسجلها في الـ
        // console عشان لو فيه مشكلة فعلية تفضل قابلة للتتبع من غير ما
        // نقاطع سير عمل الدكتور بحوار زيادة
        console.error(
          "Expected backend to create/update a follow-up for date",
          form.followUpDate,
          "but got no newFollowUp in the response.",
        );
      }

      setSavedConsultationId(savedConsultationId);
      try {
        const presRes =
          await getPrescriptionByConsultation(savedConsultationId);
        setExistingPrescription(presRes?.data || null);
      } catch {
        setExistingPrescription(null);
      }
      setShowPrescriptionSection(true);
    } catch (error) {
      console.error("FULL ERROR:", error);
      console.error("BACKEND RESPONSE:", error?.response?.data);

      setFormError(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          t("followups.messages.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrescriptionSaved = () => {
    navigate(prescriptionOnlyEdit ? "/prescriptions" : "/followups");
  };

  const handlePrescriptionClosed = () => {
    navigate(prescriptionOnlyEdit ? "/prescriptions" : "/followups");
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
          {loadError || t("followups.start.notFound")}
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
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-4 sm:p-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-xl font-bold text-blue-700">
                {isEditMode
                  ? t("followups.start.editTitle")
                  : t("followups.start.title")}
              </h2>
              <div className="flex items-center gap-3">
                {getPatientId() && (
                  <a
                    href={`/patients/history/${getPatientId()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer transition"
                  >
                    {t("consultations.seeHistory")}
                  </a>
                )}
                <LanguageToggle
                  variant="light"
                  value={form.language}
                  onChange={(lang) =>
                    setForm((prev) => ({ ...prev, language: lang }))
                  }
                />
              </div>
            </div>

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
                    {t("followups.start.previousPrescription")}
                  </p>

                  {getPreviousPrescriptionMeds().length === 0 ? (
                    <p className="text-sm text-gray-800">
                      {t("followups.start.noPrescriptionRecorded")}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {getPreviousPrescriptionMeds().map((med, i) => (
                        <li key={i} className="text-sm text-gray-800">
                          <span className="font-semibold">{med.name}</span>
                          {med.dosageAmount && (
                            <>
                              {" "}
                              — {med.dosageAmount}
                              {med.dosageUnit}
                            </>
                          )}
                          {med.frequencyCount && med.frequencyPeriod && (
                            <>
                              {" "}
                              · {med.frequencyCount}x {med.frequencyPeriod}
                            </>
                          )}
                          {med.isChronic && (
                            <span className="ms-1 text-xs text-blue-600 font-semibold">
                              ({t("prescriptions.chronic")})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("followups.start.previousInstructions")}
                  </p>

                  {getPreviousConsultation()?.clinicalReading ||
                  getPreviousConsultation()?.possibleDiagnoses?.length > 0 ||
                  getPreviousConsultation()?.structuredNote ? (
                    <DifferentialDiagnosisPanel
                      clinicalReading={
                        getPreviousConsultation()?.clinicalReading
                      }
                      diagnoses={getPreviousConsultation()?.possibleDiagnoses}
                      structuredNoteFallback={
                        getPreviousConsultation()?.structuredNote
                      }
                    />
                  ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {getPreviousConsultation()?.rawInput ||
                        t("followups.start.noInstructionsRecorded")}
                    </p>
                  )}
                </div>

                <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("followups.start.previousDiagnosis")}
                  </p>

                  <p className="text-sm text-gray-800">
                    {getPreviousDiagnosis()}
                  </p>
                </div>
              </div>
            </div>

            <InlineError message={formError} />

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
                    disabled={prescriptionOnlyEdit}
                    placeholder={t("followups.start.notesPlaceholder")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                    disabled={prescriptionOnlyEdit}
                    placeholder={t("followups.start.symptomsPlaceholder")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* التحاليل المعملية / تقارير الأشعة - اختياري */}
                <LabFilesUploader
                  files={labFiles}
                  onChange={setLabFiles}
                  disabled={prescriptionOnlyEdit}
                />

                {/* اللغة بقت بتتحدد من زرار EN/AR اللي فوق الصفحة */}
              </div>

              {!showPrescriptionSection && !prescriptionOnlyEdit && (
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
              )}

              {aiResult &&
                !showPrescriptionSection &&
                !prescriptionOnlyEdit && (
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
                            {t("consultations.diagnosis")}{" "}
                            <span className="text-red-500">*</span>
                          </label>

                          <label className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-bold text-slate-600 transition-all duration-200 hover:bg-blue-50 hover:border-blue-200 select-none w-max max-w-full">
                            <input
                              type="checkbox"
                              name="isChronic"
                              checked={form.isChronic}
                              onChange={handleChange}
                              disabled={prescriptionOnlyEdit}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                            />

                            <span
                              className={`transition-colors duration-200 truncate ${
                                form.isChronic
                                  ? "text-blue-600 font-extrabold"
                                  : ""
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
                          disabled={prescriptionOnlyEdit}
                          placeholder={t("consultations.diagnosisPlaceholder")}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                          min={minDate}
                          max={maxDate}
                          onChange={handleChange}
                          disabled={prescriptionOnlyEdit}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-semibold text-sm disabled:opacity-50 block w-full sm:w-auto"
                      >
                        {submitting
                          ? t("common.saving")
                          : isEditMode || savedConsultationId
                            ? t("followups.start.saveChanges")
                            : t("followups.start.confirmButton")}
                      </button>
                    </div>
                  </div>
                )}
            </form>
          </div>

          <div className="space-y-5 lg:border-l lg:border-slate-100 lg:pl-5">
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
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
                        aiResult.urgencyLevel,
                      )}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                        {t("consultations.urgencyLevel")}
                      </p>

                      <p className="text-sm font-bold capitalize">
                        {aiResult.urgencyLevel ||
                          t("followups.start.notProvided")}
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

                    <DifferentialDiagnosisPanel
                      clinicalReading={aiResult.clinicalReading}
                      diagnoses={aiResult.possibleDiagnoses}
                      structuredNoteFallback={aiResult.structuredNote}
                      labFiles={labFiles}
                    />

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
          </div>
        </div>
      </div>

      {showPrescriptionSection && (
        <div className="mt-6">
          <PrescriptionModal
            isOpen={showPrescriptionSection}
            onClose={handlePrescriptionClosed}
            consultationId={savedConsultationId}
            patient={followUp?.patientId}
            language={form.language || "en"}
            existingPrescription={existingPrescription}
            diagnosis={form.diagnosis}
            symptoms={buildSymptomsArray()}
            rawInput={form.rawInput}
            isFollowup
            previousPrescription={getPreviousPrescriptionMeds()}
            onSaved={handlePrescriptionSaved}
          />
        </div>
      )}
    </div>
  );
};

export default StartFollowUp;