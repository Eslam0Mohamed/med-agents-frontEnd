import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiBookOpen } from "react-icons/fi";

const likelihoodBadgeStyles = {
  high: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const likelihoodDotStyles = {
  high: "bg-emerald-500",
  moderate: "bg-amber-500",
  low: "bg-gray-400",
};

// evidenceBasis بيرجعها differentialDiagnosisAgent صراحة لكل تشخيص - "referenced"
// لو مبني فعليًا على مرجع موثّق (Pinecone/PubMed/MedlinePlus)، أو
// "general_knowledge" لو معرفة عامة للموديل مش مستندة لمرجع مباشر. بنعرضها
// كـ badge صغير بس لما تكون "referenced" (إشارة إيجابية واضحة) - مفيش داعي
// نعرض badge لكل حالة "general_knowledge" لأنها هي الغالبية والافتراضي، وده
// كان هيغرق الشاشة ببادجز مالهاش قيمة إضافية
const evidenceBadgeStyles = "bg-sky-100 text-sky-700";

/**
 * عرض مضغوط لنتيجة إيجنت التشخيص التفريقي (Differential Diagnosis Agent):
 * القراءة السريرية + ليستة تشخيصات قابلة للطي (accordion) بدل ما كل تفاصيل
 * كل تشخيص (السبب المؤيد/الغير مؤيد/الفحوصات/البروتوكول) تتعرض مفتوحة مرة
 * واحدة وتطوّل الصفحة. أول تشخيص (الأرجح) بيبقى مفتوح افتراضيًا والباقي
 * مقفول، والدكتور بيدوس يفتح أي واحد يحب يشوف تفاصيله.
 *
 * ده component واحد مستخدم في 4 أماكن (فورم الكونسلتيشن، فورم الفولو أب،
 * الـ Patient History، وتفاصيل الفولو أب) عشان يبقى العرض متسق وسهل
 * الصيانة بدل تكرار نفس الكتلة الطويلة في كل ملف.
 */
const DifferentialDiagnosisPanel = ({
  clinicalReading,
  diagnoses = [],
  structuredNoteFallback,
  // ملفات التحاليل/الأشعة اللي الدكتور رفعها وكانت متاحة للإيجنت وقت
  // التوليد (اختياري) - بنعرض ليستة أسمائهم كـ badge صغير أسفل النتيجة
  // بس عشان الشفافية (الدكتور يعرف إن الإيجنت فعلاً شافهم)
  labFiles = [],
  className = "",
}) => {
  const { t } = useTranslation();
  // أول عنصر (الأرجح) مفتوح بشكل افتراضي، الباقي مقفول
  const [openIndex, setOpenIndex] = useState(0);

  const hasStructuredData = !!clinicalReading || diagnoses.length > 0;

  // كونسلتيشنز قديمة اتسجلت قبل إضافة الحقول المنظمة - بترجع للنص المجمّع
  if (!hasStructuredData) {
    return structuredNoteFallback ? (
      <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          {t("consultations.structuredNote")}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {structuredNoteFallback}
        </p>
      </div>
    ) : null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {clinicalReading && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t("consultations.clinicalReading")}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {clinicalReading}
          </p>
        </div>
      )}

      {diagnoses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t("consultations.possibleDiagnoses")}
          </p>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 overflow-hidden bg-white">
            {diagnoses.map((d, i) => {
              const isOpen = openIndex === i;
              const likelihoodKey = d.likelihood
                ? `consultations.likelihood${d.likelihood.charAt(0).toUpperCase()}${d.likelihood.slice(1)}`
                : null;
              const isReferenced = d.evidenceBasis === "referenced";

              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-start justify-between gap-2 px-3 py-2 text-start hover:bg-gray-50 transition"
                  >
                    <span className="flex items-start gap-2 min-w-0">
                      <span
                        className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                          likelihoodDotStyles[d.likelihood] || "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm font-bold text-gray-900 break-words">
                        {i + 1}. {d.diagnosis}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {isReferenced && (
                        <span
                          title={t(
                            "consultations.evidenceReferencedTooltip",
                            "Backed by a cited clinical reference",
                          )}
                          className={`hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${evidenceBadgeStyles}`}
                        >
                          <FiBookOpen className="shrink-0" size={10} />
                          {t("consultations.evidenceReferenced", "Referenced")}
                        </span>
                      )}
                      {likelihoodKey && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            likelihoodBadgeStyles[d.likelihood] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t(likelihoodKey, d.likelihood)}
                        </span>
                      )}
                      <FiChevronDown
                        className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs text-gray-600 leading-relaxed bg-gray-50/60">
                      {/* بادج referenced بتتخفي في الهيدر على الموبايل (sm:hidden أعلاه)
                          عشان تفضل مساحة العنوان مضغوطة - هنا بنعرضها تاني كاملة
                          جوه التفاصيل المفتوحة، فمتبقاش مخفية خالص على الموبايل */}
                      {isReferenced && (
                        <p className="sm:hidden flex items-center gap-1 text-sky-700 font-semibold">
                          <FiBookOpen className="shrink-0" size={11} />
                          {t("consultations.evidenceReferenced", "Referenced")}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold text-gray-500">
                          {t("consultations.supportingReasoning")}:{" "}
                        </span>
                        {d.supportingReasoning}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">
                          {t("consultations.againstReasoning")}:{" "}
                        </span>
                        {d.againstReasoning}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">
                          {t("consultations.recommendedTests")}:{" "}
                        </span>
                        {d.recommendedTests}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">
                          {t("consultations.recommendedProtocol")}:{" "}
                        </span>
                        {d.protocol}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {labFiles.length > 0 && (
        <p className="text-[11px] text-gray-400 flex items-center gap-1 flex-wrap">
          <span>📎 {t("consultations.labFilesAttached")}:</span>
          <span className="text-gray-500">
            {labFiles.map((f) => f.originalName).join(", ")}
          </span>
        </p>
      )}
    </div>
  );
};

export default DifferentialDiagnosisPanel;