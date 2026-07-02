import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import {
  getAllPrescriptions,
  deletePrescription,
  getPrescriptionDates,
} from "../../api/prescription";
import PrescriptionModal from "../../components/prescriptions/PrescriptionModal";
import "../followups/followups.css";

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

function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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
    t("prescriptions.months.january"), t("prescriptions.months.february"),
    t("prescriptions.months.march"), t("prescriptions.months.april"),
    t("prescriptions.months.may"), t("prescriptions.months.june"),
    t("prescriptions.months.july"), t("prescriptions.months.august"),
    t("prescriptions.months.september"), t("prescriptions.months.october"),
    t("prescriptions.months.november"), t("prescriptions.months.december"),
  ];

  const weekDays = [
    t("prescriptions.weekDays.sun"), t("prescriptions.weekDays.mon"),
    t("prescriptions.weekDays.tue"), t("prescriptions.weekDays.wed"),
    t("prescriptions.weekDays.thu"), t("prescriptions.weekDays.fri"),
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
        <button type="button" onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>‹</button>
        <span>{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</span>
        <button type="button" onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>›</button>
      </div>

      <div className="calendar-grid">
        {weekDays.map((day, index) => (
          <span key={`${day}-${index}`} className="calendar-day-name">{day}</span>
        ))}
        {calendarDays.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} className="calendar-empty" />;
          const key = toDateKey(day);
          const count = dateCounts?.[key] || 0;
          const isSelected = selectedDate && key === toDateKey(selectedDate);
          const isToday = key === todayKey;
          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={["calendar-day", isSelected ? "selected" : "", isToday ? "today" : "", count > 0 ? "has-followups" : ""].join(" ")}
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
              {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
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

function PatientPrescriptionCard({ prescription, onEdit, onDelete }) {
  const { t } = useTranslation();
  const patient = prescription.patientId;
  const age = calculateAge(patient?.dateOfBirth);
  const medications = (prescription.medications || []).filter(Boolean);
  const isFromFollowup = !!prescription.consultationId?.followupId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5">
      <div className="bg-gray-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
            {initials(patient?.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
              {patient?.name || t("prescriptions.unknownPatient")}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isFromFollowup ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"}`}>
                {isFromFollowup ? t("prescriptions.followupTag") : t("prescriptions.consultationTag")}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {t("prescriptions.id")}: #{patient?._id?.slice(-6) || "—"}
              {age !== null && <> • {t("prescriptions.age")}: {age}</>}
              {" • "}
              {t("patients.allergies")}:{" "}
              {patient?.allergies?.length > 0 ? patient.allergies.join(", ") : t("prescriptions.noneReported")}
              {" • "}
              {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => onEdit(prescription)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            ✏️ {t("common.edit")}
          </button>
          <button onClick={() => onDelete(prescription)} className="text-sm text-red-500 hover:text-red-700 font-medium">
            🗑️ {t("common.delete")}
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase">
              <th className="px-5 py-3">{t("prescriptions.medication")}</th>
              <th className="px-5 py-3">{t("prescriptions.dosageFrequency")}</th>
              <th className="px-5 py-3">{t("prescriptions.safetyScreening")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medications.map((med, i) => (
              <tr key={i}>
                <td className="px-5 py-4 align-top">
                  <p className="text-sm font-semibold text-gray-900">{med.name || t("prescriptions.unknownMedication")}</p>
                  {med.activeIngredient && <p className="text-xs text-gray-400">{med.activeIngredient}</p>}
                  {med.isChronic && <p className="text-xs text-gray-400">{t("prescriptions.chronic")}</p>}
                </td>
                <td className="px-5 py-4 align-top">
                  <p className="text-sm text-gray-700">{med.dose || "—"}</p>
                  <p className="text-sm text-gray-500">
                    {med.frequency || "—"}
                    {!med.isChronic && med.duration && <> · {med.duration}</>}
                  </p>
                </td>
                <td className="px-5 py-4 align-top">
                  <SafetyCell medication={med} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="md:hidden divide-y divide-gray-100">
        {medications.map((med, i) => (
          <div key={i} className="px-4 py-4">
            <div className="mb-1">
              <p className="text-sm font-semibold text-gray-900">{med.name || t("prescriptions.unknownMedication")}</p>
              {med.activeIngredient && <p className="text-xs text-gray-400">{med.activeIngredient}</p>}
              <p className="text-xs text-gray-500">{med.dose || "—"}</p>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {med.frequency || "—"}
              {!med.isChronic && med.duration && <> · {med.duration}</>}
              {med.isChronic && <> · {t("prescriptions.chronic")}</>}
            </p>
            <SafetyCell medication={med} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateCounts, setDateCounts] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadPrescriptions = useCallback(async (searchValue, dateValue, pageValue) => {
    try {
      setLoading(true);
      const res = await getAllPrescriptions({
        search: searchValue,
        date: dateValue ? toDateKey(dateValue) : "",
        page: pageValue,
        limit: PAGE_LIMIT,
      });
      setPrescriptions(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch {
      Swal.fire(t("common.error"), t("prescriptions.loadError"), "error");
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadDateCounts = useCallback(async () => {
    try {
      const res = await getPrescriptionDates();
      const counts = {};
      (res.data || []).forEach((key) => { counts[key] = (counts[key] || 0) + 1; });
      setDateCounts(counts);
    } catch {
      setDateCounts({});
    }
  }, []);

  useEffect(() => {
    loadPrescriptions("", null, 1);
    loadDateCounts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      loadPrescriptions(search, selectedDate, 1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, selectedDate]);

  const handlePageChange = (next) => {
    setPage(next);
    loadPrescriptions(search, selectedDate, next);
  };

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
    setShowEditModal(true);
  };

  const handleDelete = async (prescription) => {
    const result = await Swal.fire({
      title: t("prescriptions.deleteTitle"),
      text: t("prescriptions.deleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("prescriptions.deleteConfirm"),
      cancelButtonText: t("common.cancel"),
    });
    if (!result.isConfirmed) return;

    try {
      await deletePrescription(prescription._id);
      Swal.fire(t("prescriptions.deleted"), t("prescriptions.deleteSuccess"), "success");
      loadPrescriptions(search, selectedDate, page);
      loadDateCounts();
    } catch (err) {
      Swal.fire(t("common.error"), err.response?.data?.message || t("prescriptions.deleteError"), "error");
    }
  };

  const handleModalSaved = () => {
    setShowEditModal(false);
    setEditingPrescription(null);
    loadPrescriptions(search, selectedDate, page);
    loadDateCounts();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t("prescriptions.title")}</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t("prescriptions.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div>
          <div className="mb-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("prescriptions.searchPlaceholder")}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>

          {loading && <div className="text-center text-gray-400 py-16">{t("prescriptions.loading")}</div>}

          {!loading && prescriptions.length === 0 && (
            <div className="text-center text-gray-400 py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              {t("prescriptions.noData")}
            </div>
          )}

          {!loading && prescriptions.map((prescription) => (
            <PatientPrescriptionCard
              key={prescription._id}
              prescription={prescription}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 px-1">
              <p className="text-xs text-gray-500">
                {t("prescriptions.showing")} {prescriptions.length} {t("prescriptions.of")} {total}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  {t("common.previous")}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                  .map((p) => (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                      {p}
                    </button>
                  ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-4">
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
          onClose={() => { setShowEditModal(false); setEditingPrescription(null); }}
          consultationId={typeof editingPrescription.consultationId === "object" ? editingPrescription.consultationId?._id : editingPrescription.consultationId}
          patient={editingPrescription.patientId}
          language={editingPrescription.language || "en"}
          existingPrescription={editingPrescription}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}