import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getAllPrescriptions,
  getPrescriptionDates,
} from "../../api/prescription";
import PrescriptionModal from "../../components/prescriptions/PrescriptionModal";
import "../followups/followups.css";
import { calculateAge, printPrescription } from "../../utils/prescriptionPrint";
import Loading from "../../components/Loading";
import InlineError from "../../components/InlineError";
const PAGE_LIMIT = 10;

function toDateKey(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PrescriptionCalendar({ selectedDate, onSelectDate, dateCounts }) {
  const { t } = useTranslation();

  const monthNames = [
    t("prescriptions.months.january"),
    t("prescriptions.months.february"),
    t("prescriptions.months.march"),
    t("prescriptions.months.april"),
    t("prescriptions.months.may"),
    t("prescriptions.months.june"),
    t("prescriptions.months.july"),
    t("prescriptions.months.august"),
    t("prescriptions.months.september"),
    t("prescriptions.months.october"),
    t("prescriptions.months.november"),
    t("prescriptions.months.december"),
  ];

  const weekDays = [
    t("prescriptions.weekDays.sun"),
    t("prescriptions.weekDays.mon"),
    t("prescriptions.weekDays.tue"),
    t("prescriptions.weekDays.wed"),
    t("prescriptions.weekDays.thu"),
    t("prescriptions.weekDays.fri"),
    t("prescriptions.weekDays.sat"),
  ];

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const todayKey = toDateKey(new Date());

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startWeekDay; i += 1) days.push(null);
    for (let day = 1; day <= daysInMonth; day += 1)
      days.push(new Date(year, month, day));
    return days;
  }, [calendarMonth]);

  return (
    <div className="mini-calendar-card">
      <div className="calendar-title">
        <button
          type="button"
          onClick={() =>
            setCalendarMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
            )
          }
        >
          ‹
        </button>
        <span>
          {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() =>
            setCalendarMonth(
              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
            )
          }
        >
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {weekDays.map((day, index) => (
          <span key={`${day}-${index}`} className="calendar-day-name">
            {day}
          </span>
        ))}
        {calendarDays.map((day, index) => {
          if (!day)
            return <span key={`empty-${index}`} className="calendar-empty" />;
          const key = toDateKey(day);
          const count = dateCounts?.[key] || 0;
          const isSelected = selectedDate && key === toDateKey(selectedDate);
          const isToday = key === todayKey;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={[
                "calendar-day",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                count > 0 ? "has-followups" : "",
              ].join(" ")}
            >
              <span>{day.getDate()}</span>
              {count > 0 && <small>{count}</small>}
            </button>
          );
        })}
      </div>

      <div className="calendar-footer">
        {selectedDate ? (
          <>
            <p>
              {t("prescriptions.filterDate")}{" "}
              {selectedDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <button type="button" onClick={() => onSelectDate(null)}>
              {t("prescriptions.showAll")}
            </button>
          </>
        ) : (
          <p>{t("prescriptions.clickToFilter")}</p>
        )}
      </div>
    </div>
  );
}

function SafetyCell({ medication }) {
  const { t } = useTranslation();
  const message = medication?.quickCheckMessage;

  if (!message) {
    return (
      <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium">
        <span>✓</span> {t("prescriptions.noIssues")}
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md">
      <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
        <span>⚠</span> {t("prescriptions.warning")}
      </p>
      <p className="text-xs text-amber-700 mt-0.5">{message}</p>
    </div>
  );
}

function PatientPrescriptionCard({ prescription, onEdit }) {
  const { t, i18n } = useTranslation();
  // في الإنجليزي عايزين الاسم/الدواء يبقوا على الشمال (يعني الجدول
  // بيتعكس LTR)، وفي العربي يفضلوا على اليمين زي الأصل (RTL)
  const tableDir = i18n.language === "ar" ? "rtl" : "ltr";
  const tableAlign = i18n.language === "ar" ? "text-right" : "text-left";
  const patient = prescription.patientId;
  const age = calculateAge(patient?.dateOfBirth);
  const medications = (prescription.medications || []).filter(Boolean);
  const isFromFollowup = !!prescription.consultationId?.followupId;

  // زرار الـ Edit بيتقفل بعد 5 دقايق من وقت إنشاء الروشتة
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  const EDIT_LOCK_MS = 4 * 60 * 60 * 1000; // 4 ساعات
  const createdAtMs = new Date(prescription.createdAt).getTime();
  const editLocked =
    !Number.isNaN(createdAtMs) && nowTick - createdAtMs > EDIT_LOCK_MS;

  return (
    <div className="bg-white rounded-2xl shadow-md shadow-slate-100/80 border border-slate-100 overflow-hidden mb-5">
      {/* Patient info header — table style, like the Consultations page */}
      <div className="hidden md:block overflow-x-auto">
        <table
          dir={tableDir}
          className={`w-full text-sm table-auto border-collapse ${tableAlign}`}
        >
          <thead className="bg-blue-600 text-white/95">
            <tr>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("common.name")}
              </th>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("prescriptions.id")}
              </th>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("prescriptions.age")}
              </th>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("patients.allergies")}
              </th>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("common.type")}
              </th>
              <th className="px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90">
                {t("common.date")}
              </th>
              <th
                className={`px-5 py-3 font-bold tracking-wide text-xs uppercase opacity-90 ${i18n.language === "ar" ? "text-left" : "text-right"}`}
              >
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-50/60">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(patient?.name)}
                  </div>
                  <span className="font-black text-blue-600 text-base">
                    {patient?.name || t("prescriptions.unknownPatient")}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-600 font-semibold">
                {patient?.phone || "—"}
              </td>
              <td className="px-5 py-4 text-slate-600 font-semibold">
                {age !== null ? age : "—"}
              </td>
              <td className="px-5 py-4 text-slate-600 font-semibold max-w-[220px] truncate">
                {patient?.allergies?.length > 0
                  ? patient.allergies.join(", ")
                  : t("prescriptions.noneReported")}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border tracking-wide uppercase shadow-sm ${isFromFollowup ? "bg-purple-50 text-purple-600 border-purple-200/50" : "bg-blue-50 text-blue-600 border-blue-200/50"}`}
                >
                  {isFromFollowup
                    ? t("prescriptions.followupTag")
                    : t("prescriptions.consultationTag")}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-600 font-semibold whitespace-nowrap">
                {new Date(prescription.createdAt).toLocaleDateString()}
              </td>
              <td
                className={`px-5 py-4 ${i18n.language === "ar" ? "text-left" : "text-right"}`}
              >
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() =>
                      printPrescription(prescription, t, i18n.language === "ar")
                    }
                    title={t("prescriptions.print")}
                    className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    🖨️ {t("prescriptions.print")}
                  </button>
                  <button
                    onClick={() => onEdit(prescription)}
                    disabled={editLocked}
                    title={
                      editLocked ? t("prescriptions.editLocked") : undefined
                    }
                    className={
                      editLocked
                        ? "inline-flex items-center gap-1.5 bg-slate-50 text-slate-300 border border-slate-100 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed"
                        : "inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    }
                  >
                    ✏️ {t("common.edit")}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Patient info header — mobile card style */}
      <div className="md:hidden px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
            {initials(patient?.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-black text-blue-600 truncate">
                {patient?.name || t("prescriptions.unknownPatient")}
              </p>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border tracking-wide uppercase shadow-sm ${isFromFollowup ? "bg-purple-50 text-purple-600 border-purple-200/50" : "bg-blue-50 text-blue-600 border-blue-200/50"}`}
              >
                {isFromFollowup
                  ? t("prescriptions.followupTag")
                  : t("prescriptions.consultationTag")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 font-semibold">
              <span>
                {t("prescriptions.id")}: {patient?.phone || "—"}
              </span>
              {age !== null && (
                <span>
                  {t("prescriptions.age")}: {age}
                </span>
              )}
              <span>
                {t("patients.allergies")}:{" "}
                {patient?.allergies?.length > 0
                  ? patient.allergies.join(", ")
                  : t("prescriptions.noneReported")}
              </span>
              <span>
                {new Date(prescription.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() =>
              printPrescription(prescription, t, i18n.language === "ar")
            }
            title={t("prescriptions.print")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-600 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            🖨️ {t("prescriptions.print")}
          </button>
          <button
            onClick={() => onEdit(prescription)}
            disabled={editLocked}
            title={editLocked ? t("prescriptions.editLocked") : undefined}
            className={
              editLocked
                ? "flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-50 text-slate-300 border border-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold cursor-not-allowed"
                : "flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
            }
          >
            ✏️ {t("common.edit")}
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border-t-2 border-slate-100 bg-slate-50/50 px-5 pt-4 pb-3">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          💊 {t("prescriptions.medication")}
        </h4>
        <div className="bg-white rounded-xl border border-slate-200">
          <table
            dir={tableDir}
            className={`w-full ${tableAlign} border-collapse`}
          >
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                <th className="px-4 py-2.5">{t("prescriptions.medication")}</th>
                <th className="px-4 py-2.5 border-r border-slate-100">
                  {t("prescriptions.dosageFrequency")}
                </th>
                <th className="px-4 py-2.5 border-r border-slate-100">
                  {t("prescriptions.safetyScreening")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medications.map((med, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 align-top">
                    <p className="text-sm font-bold text-slate-900">
                      {med.name || t("prescriptions.unknownMedication")}
                    </p>
                    {med.activeIngredient && (
                      <p className="text-xs text-slate-400">
                        {med.activeIngredient}
                      </p>
                    )}
                    {med.isChronic && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                        {t("prescriptions.chronic")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top border-r border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">
                      {med.dose || "—"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {med.frequency || "—"}
                      {!med.isChronic && med.duration && <> · {med.duration}</>}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 align-top border-r border-slate-100">
                    <SafetyCell medication={med} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden border-t-2 border-slate-100 bg-slate-50/50 px-4 pt-4 pb-2">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          💊 {t("prescriptions.medication")}
        </h4>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {medications.map((med, i) => (
            <div key={i} className="px-4 py-3.5">
              <div className="mb-1">
                <p className="text-sm font-bold text-slate-900">
                  {med.name || t("prescriptions.unknownMedication")}
                </p>
                {med.activeIngredient && (
                  <p className="text-xs text-slate-400">
                    {med.activeIngredient}
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {med.dose || "—"}
                </p>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {med.frequency || "—"}
                {!med.isChronic && med.duration && <> · {med.duration}</>}
                {med.isChronic && (
                  <span className="inline-block ms-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                    {t("prescriptions.chronic")}
                  </span>
                )}
              </p>
              <SafetyCell medication={med} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allPrescriptions, setAllPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateCounts, setDateCounts] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadError, setLoadError] = useState("");

  // زي صفحة الفولو أب بالظبط: نجيب الروشتات كلها مرة واحدة بس أول ما
  // الصفحة تفتح، وبعدين الفلترة بالبحث والتاريخ والـ pagination كلها
  // بتتم في المتصفح على طول من غير أي نداء تاني للباك
  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await getAllPrescriptions({
        search: "",
        date: "",
        page: 1,
        limit: 1000,
      });
      setAllPrescriptions(res.data || []);
    } catch {
      setLoadError(t("prescriptions.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadDateCounts = useCallback(async () => {
    try {
      const res = await getPrescriptionDates();
      const counts = {};
      (res.data || []).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
      setDateCounts(counts);
    } catch {
      setDateCounts({});
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
    loadDateCounts();
  }, [loadPrescriptions, loadDateCounts]);

  const filteredPrescriptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const selectedKey = selectedDate ? toDateKey(selectedDate) : "";
    return allPrescriptions.filter((p) => {
      const matchesDate = selectedKey
        ? toDateKey(p.createdAt) === selectedKey
        : true;
      const matchesSearch = query
        ? p.patientId?.name?.toLowerCase().includes(query) ||
          (p.medications || []).some((m) =>
            m?.name?.toLowerCase().includes(query),
          )
        : true;
      return matchesDate && matchesSearch;
    });
  }, [allPrescriptions, search, selectedDate]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPrescriptions.length / PAGE_LIMIT),
  );
  const total = filteredPrescriptions.length;
  const prescriptions = filteredPrescriptions.slice(
    (page - 1) * PAGE_LIMIT,
    page * PAGE_LIMIT,
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedDate]);

  const handlePageChange = (next) => {
    setPage(next);
  };

  const handleEdit = (prescription) => {
    // نوديه لصفحة الكونسلتيشن أو الفولو أب اللي الروشتة دي جاية منها، عشان
    // يشوف السياق الكامل (الأعراض/التشخيص)، بس من غير ما يقدر يعدّل أي حاجة
    // فيها غير الروشتة نفسها (prescriptionOnlyEdit بيقفل باقي الفورم)
    const consultation = prescription.consultationId;
    const consultationId =
      typeof consultation === "object" ? consultation?._id : consultation;
    const followupId =
      typeof consultation === "object" ? consultation?.followupId : null;

    if (followupId) {
      const resolvedFollowupId =
        typeof followupId === "object" ? followupId?._id : followupId;
      navigate(`/followups/start/${resolvedFollowupId}`, {
        state: { mode: "edit", prescriptionOnlyEdit: true },
      });
      return;
    }

    if (consultationId) {
      navigate(`/consultations/edit/${consultationId}`, {
        state: { prescriptionOnlyEdit: true },
      });
      return;
    }

    // احتياطي: لو مقدرناش نحدد الكونسلتيشن الأصلية لأي سبب، نفضل بالمودال المحلي
    setEditingPrescription(prescription);
    setShowEditModal(true);
  };

  const handleModalSaved = () => {
    setShowEditModal(false);
    setEditingPrescription(null);
    loadPrescriptions();
    loadDateCounts();
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-24 px-4 sm:px-6 shadow-lg rounded-3xl">
        <div className="max-w-7xl mx-auto">
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

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            {t("prescriptions.title")}{" "}
            <span className="w-2 h-2 rounded-full bg-blue-300"></span>
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
            {t("prescriptions.subtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
          <div>
            <InlineError message={loadError} />
            <div className="mb-6 relative group shadow-sm rounded-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("prescriptions.searchPlaceholder")}
                className="w-full bg-white rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base font-medium border-0 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
              />
            </div>

            {loading && <Loading />}

            {!loading && prescriptions.length === 0 && (
              <div className="text-center text-gray-400 py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                {t("prescriptions.noData")}
              </div>
            )}

            {!loading &&
              prescriptions.map((prescription) => (
                <PatientPrescriptionCard
                  key={prescription._id}
                  prescription={prescription}
                  onEdit={handleEdit}
                />
              ))}

            {!loading && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 px-4 py-3">
                <p className="text-xs text-gray-500 font-semibold">
                  {t("common.showing")} {prescriptions.length} {t("common.of")}{" "}
                  {total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {t("common.previous")}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                    .map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, page + 1))
                    }
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="order-first lg:order-2 lg:sticky lg:top-4 mt-16 lg:mt-16">
            <PrescriptionCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              dateCounts={dateCounts}
            />
          </aside>
        </div>

        {editingPrescription && (
          <PrescriptionModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingPrescription(null);
            }}
            consultationId={
              typeof editingPrescription.consultationId === "object"
                ? editingPrescription.consultationId?._id
                : editingPrescription.consultationId
            }
            patient={editingPrescription.patientId}
            language={editingPrescription.language || "en"}
            existingPrescription={editingPrescription}
            onSaved={handleModalSaved}
          />
        )}
      </div>
    </div>
  );
}