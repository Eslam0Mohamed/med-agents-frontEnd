import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAllPatients } from "../../api/patient";
import apiInstance from "../../config/apiInstance";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** يكلم /reports/generate في الباك */
const generateReportAPI = async (payload) => {
  const { data } = await apiInstance.post("/reports/generate", payload);
  return data;
};

export default function Reports() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";
  const lang = i18n.language === "ar" ? "ar" : "en";

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [scope, setScope] = useState("year");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // قايمة الكونسلتيشنز للـ picker (scope = consultation)
  const [consultations, setConsultations] = useState([]);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [consultationId, setConsultationId] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [report, setReport] = useState(null); // { data, meta, patientName, mrn, dob, generatedAt }

  const blurTimeout = useRef(null);
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // بحث المرضى
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await getAllPatients({ search: search.trim() });
        const query = search.trim().toLowerCase();
        setResults(
          (res.data || []).filter((p) => p.name?.toLowerCase().includes(query)),
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // لما يتغير المريض أو الـ scope لـ consultation، نجيب قايمة الكونسلتيشنز
  useEffect(() => {
    if (scope !== "consultation" || !selectedPatient) return;
    setConsultations([]);
    setConsultationId("");
    setLoadingConsultations(true);
    apiInstance
      .get(`/patients/${selectedPatient._id}/history`)
      .then((res) => setConsultations(res.data?.data?.history || []))
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsultations(false));
  }, [scope, selectedPatient]);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearch(patient.name);
    setResults([]);
    setShowDropdown(false);
    setConsultationId("");
    setReport(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    if (selectedPatient && value !== selectedPatient.name) {
      setSelectedPatient(null);
      setConsultations([]);
      setReport(null);
      setConsultationId("");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString();
  };

  const generateReport = async () => {
    if (!selectedPatient) {
      setGenerateError(t("reports.selectPatientFirst"));
      return;
    }
    if (scope === "consultation" && !consultationId) {
      setGenerateError(t("reports.selectConsultationFirst"));
      return;
    }

    setGenerating(true);
    setGenerateError("");
    setReport(null);

    try {
      const payload = {
        patientId: selectedPatient._id,
        scope,
        language: lang,
        ...(scope === "year" || scope === "month" ? { year } : {}),
        ...(scope === "month" ? { month } : {}),
        ...(scope === "consultation" ? { consultationId } : {}),
      };

      const res = await generateReportAPI(payload);

      if (!res.success) {
        setGenerateError(res.message || "Failed to generate report.");
        return;
      }
      if (res.empty || !res.data) {
        setGenerateError(res.message || t("reports.noEntries"));
        return;
      }

      setReport({
        data: res.data,
        meta: res.meta,
        patientName: selectedPatient.name,
        mrn: selectedPatient.phone,
        dob: selectedPatient.dateOfBirth,
        generatedAt: new Date(res.meta.generatedAt),
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate report.";
      setGenerateError(msg);
      console.error("[generateReport] error:", err?.response?.data || err);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setSearch("");
    setSelectedPatient(null);
    setResults([]);
    setScope("year");
    setYear(currentYear);
    setMonth(new Date().getMonth() + 1);
    setConsultationId("");
    setConsultations([]);
    setReport(null);
    setGenerateError("");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      <style>{`@media print { .no-print { display: none !important; } .print-area { box-shadow: none !important; border: none !important; } }`}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-8 px-4 sm:px-6 shadow-lg rounded-3xl no-print">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mb-4 border border-white/10 backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {t("common.back")}
          </button>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            ⚡ {t("reports.title")}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
            {t("reports.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6 space-y-5">
        {/* Form card */}
        <div
          dir={isRtl ? "rtl" : "ltr"}
          className={`bg-white rounded-2xl shadow p-5 sm:p-6 no-print ${isRtl ? "text-right" : "text-left"}`}
        >
          {/* Patient search */}
          <div className="mb-5 relative">
            <label className="block text-sm font-semibold text-blue-700 mb-1">
              {t("reports.selectPatient")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  blurTimeout.current = setTimeout(
                    () => setShowDropdown(false),
                    150,
                  );
                }}
                placeholder={t("reports.searchPlaceholder")}
                autoComplete="off"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition"
              />
              {searching && (
                <div className="absolute inset-y-0 end-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {showDropdown && results.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-1 max-h-56 overflow-y-auto shadow-lg">
                {results.map((p) => (
                  <li key={p._id}>
                    <button
                      type="button"
                      onMouseDown={() => selectPatient(p)}
                      className="w-full text-start px-4 py-2.5 hover:bg-blue-50 transition border-b border-slate-50 last:border-0"
                    >
                      <p className="text-sm font-bold text-slate-900">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t("reports.mrn")}: {p.phone || "N/A"}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Scope */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-blue-700 mb-2">
              {t("reports.reportScope")} <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "year", label: t("reports.scopeYear") },
                { value: "month", label: t("reports.scopeMonth") },
                {
                  value: "consultation",
                  label: t("reports.scopeConsultation"),
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScope(opt.value);
                    setReport(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${scope === opt.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Year / Month pickers */}
          {(scope === "year" || scope === "month") && (
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-blue-700 mb-1">
                  {t("reports.year")}
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {scope === "month" && (
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-blue-700 mb-1">
                    {t("reports.month")}
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {t(`reports.months.${m}`)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Consultation picker */}
          {scope === "consultation" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                {t("reports.selectConsultation")}{" "}
                <span className="text-red-500">*</span>
              </label>
              {!selectedPatient ? (
                <p className="text-sm text-amber-600">
                  ⚠️ {t("reports.selectPatientFirst")}
                </p>
              ) : loadingConsultations ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {t("reports.loadingHistory")}
                </div>
              ) : consultations.length === 0 ? (
                <p className="text-sm text-slate-400">
                  ℹ️ {t("reports.noConsultations")}
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {consultations.map((c) => (
                    <li key={c.consultationId}>
                      <button
                        type="button"
                        onClick={() => setConsultationId(c.consultationId)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-sm border transition ${consultationId === c.consultationId ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                      >
                        <span className="truncate">
                          {c.diagnosis || t("reports.noDiagnosis")}
                        </span>
                        <span
                          className={
                            consultationId === c.consultationId
                              ? "text-blue-100"
                              : "text-slate-400"
                          }
                        >
                          {formatDate(c.date)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {generateError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
              ❌ {generateError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={generating}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              {t("common.reset")}
            </button>
            <button
              type="button"
              onClick={generateReport}
              disabled={generating || !selectedPatient}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
            >
              {generating
                ? t("reports.generating")
                : t("reports.generateReport")}
            </button>
          </div>
        </div>

        {/* AI Report result */}
        {report && (
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className={`print-area bg-white rounded-2xl shadow p-5 sm:p-6 ${isRtl ? "text-right" : "text-left"}`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h3 className="text-lg font-black text-blue-700">
                  🩺 {report.meta.scopeLabel}
                </h3>
                <p className="text-sm text-slate-500">
                  {report.meta.rangeLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                🖨️ {t("reports.printReport")}
              </button>
            </div>

            {/* Patient info */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 border-b border-slate-100 pb-4 mb-6">
              <span>
                <strong className="text-slate-800">
                  {t("reports.patient")}:
                </strong>{" "}
                {report.patientName}
              </span>
              <span>
                <strong className="text-slate-800">{t("reports.mrn")}:</strong>{" "}
                {report.mrn || "N/A"}
              </span>
              <span>
                <strong className="text-slate-800">{t("reports.dob")}:</strong>{" "}
                {formatDate(report.dob) || "N/A"}
              </span>
              <span>
                <strong className="text-slate-800">
                  {t("reports.consultationsReviewed") ||
                    "Consultations reviewed"}
                  :
                </strong>{" "}
                {report.meta.consultationCount}
              </span>
            </div>

            {/* AI sections */}
            <div className="space-y-5">
              {/* Executive Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2">
                  📋 {report.data.reportTitle}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {report.data.executiveSummary}
                </p>
              </div>

              {/* 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    🏥 {t("reports.patientCondition") || "Patient Condition"}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {report.data.patientCondition}
                  </p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    🔬 {t("reports.clinicalFindings") || "Clinical Findings"}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {report.data.clinicalFindings}
                  </p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    💊 {t("reports.treatmentPlan") || "Treatment Plan"}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {report.data.treatmentPlan}
                  </p>
                </div>
                <div className="border border-slate-100 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">
                    ✅ {t("reports.recommendations") || "Recommendations"}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {report.data.recommendations}
                  </p>
                </div>
              </div>

              {/* Follow-up */}
              <div className="border border-slate-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-700 mb-2">
                  📅 {t("reports.followupNotes") || "Follow-up Notes"}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {report.data.followupNotes}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">
              {t("reports.generatedAt")}: {report.generatedAt.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
