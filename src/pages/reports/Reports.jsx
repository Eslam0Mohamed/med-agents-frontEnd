import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAllPatients, getPatientHistory } from "../../api/patient";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const urgencyStyles = {
  low: "bg-green-100 text-green-700",
  routine: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-100 text-red-700",
  emergency: "bg-red-100 text-red-700",
  unknown: "bg-slate-100 text-slate-500",
};

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function Reports() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === "ar";

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [scope, setScope] = useState("year");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [consultationId, setConsultationId] = useState("");

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [report, setReport] = useState(null);

  const blurTimeout = useRef(null);
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // بحث بالاسم بس، وبين مرضى الدكتور الحالي بس (getAllPatients بتنده على
  // /patients/doctor أصلاً، مش /patients اللي بقت للأدمن بس) - بنعمل فلترة
  // إضافية بالاسم فقط عشان الباك بيدور بالاسم أو الرقم القومي مع بعض
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await getAllPatients({ search: search.trim() });
        const query = search.trim().toLowerCase();
        const nameOnly = (res.data || []).filter((p) =>
          p.name?.toLowerCase().includes(query),
        );
        setResults(nameOnly);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadHistory = useCallback(async (patientId) => {
    try {
      setLoadingHistory(true);
      setHistoryError("");
      const res = await getPatientHistory(patientId);
      setHistory(res?.data?.history || []);
    } catch {
      setHistoryError(t("reports.historyLoadError"));
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [t]);

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearch(patient.name);
    setResults([]);
    setShowDropdown(false);
    setConsultationId("");
    setReport(null);
    loadHistory(patient._id);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    if (selectedPatient && value !== selectedPatient.name) {
      setSelectedPatient(null);
      setHistory([]);
      setReport(null);
      setConsultationId("");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  };

  const generateReport = () => {
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

    let filtered = [];
    let scopeLabel = "";
    let rangeLabel = "";

    if (scope === "year") {
      filtered = history.filter(
        (c) => new Date(c.date).getFullYear() === Number(year),
      );
      scopeLabel = t("reports.scopeYear");
      rangeLabel = `${t("reports.year")} ${year}`;
    } else if (scope === "month") {
      filtered = history.filter((c) => {
        const d = new Date(c.date);
        return (
          d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
        );
      });
      scopeLabel = t("reports.scopeMonth");
      rangeLabel = `${t(`reports.months.${MONTHS[month - 1]}`)} ${year}`;
    } else {
      filtered = history.filter((c) => c.consultationId === consultationId);
      scopeLabel = t("reports.scopeConsultation");
      rangeLabel = filtered.length
        ? `${filtered[0].diagnosis || t("reports.noDiagnosis")} — ${formatDate(filtered[0].date)}`
        : t("reports.selectedConsultation");
    }

    filtered = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setReport({
      patientName: selectedPatient.name,
      mrn: selectedPatient.nationalID,
      dob: selectedPatient.dateOfBirth,
      age: calculateAge(selectedPatient.dateOfBirth),
      scopeLabel,
      rangeLabel,
      generatedAt: new Date(),
      entries: filtered,
    });
    setGenerating(false);
  };

  const resetForm = () => {
    setSearch("");
    setSelectedPatient(null);
    setResults([]);
    setScope("year");
    setYear(currentYear);
    setMonth(new Date().getMonth() + 1);
    setConsultationId("");
    setHistory([]);
    setHistoryError("");
    setReport(null);
    setGenerateError("");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="bg-linear-to-r from-blue-700 to-blue-600 text-white pt-6 pb-8 px-4 sm:px-6 shadow-lg rounded-3xl no-print">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mb-4 border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
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
              {t("reports.selectPatient")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  blurTimeout.current = setTimeout(() => setShowDropdown(false), 150);
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
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {t("reports.mrn")}: {p.nationalID || "N/A"}
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
                { value: "consultation", label: t("reports.scopeConsultation") },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setScope(opt.value);
                    setReport(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                    scope === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

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
                    <option key={y} value={y}>{y}</option>
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
                      <option key={m} value={i + 1}>{t(`reports.months.${m}`)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {scope === "consultation" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold text-blue-700 mb-2">
                {t("reports.selectConsultation")} <span className="text-red-500">*</span>
              </label>
              {!selectedPatient ? (
                <p className="text-sm text-amber-600">⚠️ {t("reports.selectPatientFirst")}</p>
              ) : loadingHistory ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {t("reports.loadingHistory")}
                </div>
              ) : historyError ? (
                <p className="text-sm text-red-600">❌ {historyError}</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400">ℹ️ {t("reports.noConsultations")}</p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {history.map((c) => (
                    <li key={c.consultationId}>
                      <button
                        type="button"
                        onClick={() => setConsultationId(c.consultationId)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-sm border transition ${
                          consultationId === c.consultationId
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{c.diagnosis || t("reports.noDiagnosis")}</span>
                        <span className={consultationId === c.consultationId ? "text-blue-100" : "text-slate-400"}>
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
              {generating ? t("reports.generating") : t("reports.generateReport")}
            </button>
          </div>
        </div>

        {/* Result card */}
        {report && (
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className={`print-area bg-white rounded-2xl shadow p-5 sm:p-6 ${isRtl ? "text-right" : "text-left"}`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <div>
                <h3 className="text-lg font-black text-blue-700">🩺 {report.scopeLabel}</h3>
                <p className="text-sm text-slate-500">{report.rangeLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                🖨️ {t("reports.printReport")}
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 border-b border-slate-100 pb-4 mb-4">
              <span><strong className="text-slate-800">{t("reports.patient")}:</strong> {report.patientName}</span>
              <span><strong className="text-slate-800">{t("reports.mrn")}:</strong> {report.mrn || "N/A"}</span>
              <span><strong className="text-slate-800">{t("reports.dob")}:</strong> {formatDate(report.dob) || "N/A"}</span>
              {report.age !== null && (
                <span><strong className="text-slate-800">{t("reports.age")}:</strong> {report.age}</span>
              )}
            </div>

            {report.entries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">
                {t("reports.noEntries")}
              </p>
            ) : (
              <div className="space-y-3">
                {report.entries.map((entry) => (
                  <div key={entry.consultationId} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold text-slate-400">
                        📅 {formatDate(entry.date)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${urgencyStyles[entry.urgencyLevel] || urgencyStyles.unknown}`}
                      >
                        {entry.urgencyLevel || "unknown"}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 mb-1">
                      {entry.diagnosis || t("reports.noDiagnosis")}
                    </h4>

                    {entry.symptoms?.length > 0 && (
                      <p className="text-sm text-slate-600 mb-1">
                        <strong>{t("reports.symptoms")}:</strong> {entry.symptoms.join(", ")}
                      </p>
                    )}

                    {entry.structuredNote && (
                      <p className="text-sm text-slate-600 mb-1">
                        <strong>{t("reports.notes")}:</strong> {entry.structuredNote}
                      </p>
                    )}

                    {entry.suggestedSpecialist && (
                      <p className="text-sm text-slate-600 mb-1">
                        <strong>{t("reports.referral")}:</strong> {entry.suggestedSpecialist}
                      </p>
                    )}

                    {entry.prescription?.medications?.length > 0 && (
                      <div className="mt-2 bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">
                          💊 {t("reports.prescribedMedications")}
                        </p>
                        <ul className="space-y-0.5">
                          {entry.prescription.medications.map((med, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              {med.name} — {med.dose || med.dosage} ({med.frequency})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.isFollowup && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-full px-2.5 py-0.5 uppercase">
                        {t("reports.followupVisit")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-6">
              {t("reports.generatedAt")}: {report.generatedAt.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
