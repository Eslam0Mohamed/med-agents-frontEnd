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

// أسماء عرض للمصادر الخارجية. groundingSourcesUsed بيتعرض مرة واحدة على
// مستوى الحالة كلها (كل المصادر اللي اتسألت خلال التوليد). لكن كل تشخيص
// كمان بيرجع referenceSource بتاعه (لو evidenceBasis === "referenced") -
// بيتحدد بالكود (تطابق كلمات مفتاحية مع نص كل مصدر لوحده)، فبنعرضه جوه
// بادج الـ "Referenced" الخاصة بالتشخيص ده نفسه، مش بس على مستوى الحالة
const sourceDisplayLabels = {
  pinecone: "consultations.sourcePinecone",
  pubmed: "consultations.sourcePubmed",
  medlineplus: "consultations.sourceMedlineplus",
};
const sourceDisplayFallback = {
  pinecone: "Internal knowledge base",
  pubmed: "PubMed",
  medlineplus: "MedlinePlus",
};

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
  // أسماء المصادر الخارجية اللي فعليًا رجّعت بيانات استُخدمت في توليد
  // التشخيص التفريقي ده كله (مش لكل تشخيص لوحده) - جاية من
  // differentialDiagnosisAgent.groundingSourcesUsed، مضمونة من الكود
  groundingSourcesUsed = [],
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
          <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t("consultations.possibleDiagnoses")}
            </p>
            {groundingSourcesUsed.length > 0 && (
              <p className="text-[11px] text-sky-700 flex items-center gap-1 flex-wrap">
                <FiBookOpen className="shrink-0" size={11} />
                <span>
                  {t("consultations.sourcesConsulted", "Sources consulted")}:
                </span>
                <span className="font-medium">
                  {groundingSourcesUsed
                    .map((s) =>
                      t(
                        sourceDisplayLabels[s] || "",
                        sourceDisplayFallback[s] || s,
                      ),
                    )
                    .join(", ")}
                </span>
              </p>
            )}
          </div>
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
                    className="w-full flex flex-col gap-1.5 px-3 py-2 text-start hover:bg-gray-50 transition"
                  >
                    {/* الصف الأول: اسم التشخيص + السهم بس - العنوان بياخد
                        المساحة كلها ومبيتزنقش أبدًا مع أي بادج */}
                    <span className="flex items-start justify-between gap-2">
                      <span className="flex items-start gap-2 min-w-0 flex-1">
                        <span
                          className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                            likelihoodDotStyles[d.likelihood] || "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm font-bold text-gray-900 break-words">
                          {i + 1}. {d.diagnosis}
                        </span>
                      </span>
                      <FiChevronDown
                        className={`shrink-0 mt-0.5 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>

                    {/* الصف التاني: البادجات - بعد ما العنوان يظهر كامل،
                        مش على نفس السطر خالص، فمالهاش أي تأثير على مساحته */}
                    {(isReferenced || likelihoodKey) && (
                      <span className="flex items-center gap-2 flex-wrap ps-4">
                        {isReferenced && (
                          <span
                            title={t(
                              "consultations.evidenceReferencedTooltip",
                              "Backed by a cited clinical reference",
                            )}
                            className={`flex items-center gap-1 whitespace-nowrap text-[10px] px-2 py-0.5 rounded-full font-semibold ${evidenceBadgeStyles}`}
                          >
                            <FiBookOpen className="shrink-0" size={10} />
                            {t(
                              "consultations.evidenceReferenced",
                              "Referenced",
                            )}
                            {d.referenceSource && (
                              <span className="opacity-80">
                                (
                                {t(
                                  sourceDisplayLabels[d.referenceSource] || "",
                                  sourceDisplayFallback[d.referenceSource] ||
                                    d.referenceSource,
                                )}
                                )
                              </span>
                            )}
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
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs text-gray-600 leading-relaxed bg-gray-50/60">
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
