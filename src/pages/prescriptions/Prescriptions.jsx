import { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { getAllPrescriptions, deletePrescription, getPrescriptionDates } from '../../api/prescription';
import PrescriptionModal from '../../components/prescriptions/PrescriptionModal';

const PAGE_LIMIT = 10;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Small self-contained month-view calendar (no external date-picker
// dependency) for searching prescriptions issued on a specific day.
function PrescriptionCalendar({ selectedDate, onSelectDate, highlightedDates }) {
  const [viewDate, setViewDate] = useState(() => selectedDate ? new Date(selectedDate) : new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const todayKey = toDateKey(new Date());

  const goToMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full sm:w-72">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="text-gray-400 hover:text-gray-700 px-2"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="text-gray-400 hover:text-gray-700 px-2"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-400 mb-1.5">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const cellDate = new Date(year, month, day);
          const key = toDateKey(cellDate);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          const hasPrescriptions = highlightedDates?.has(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`relative h-8 rounded-md text-xs flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : isToday
                    ? 'border border-blue-400 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              {day}
              {hasPrescriptions && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          type="button"
          onClick={() => onSelectDate(null)}
          className="mt-3 text-xs text-blue-600 hover:underline w-full text-center"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}

// One medication's safety screening cell — shows the Quick Drug Check
// agent's single short sentence for this medication (or a clean checkmark).
function SafetyCell({ medication }) {
  const message = medication?.quickCheckMessage;

  if (!message) {
    return (
      <div className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-xs font-medium">
        <span>✓</span> No issues
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-md">
      <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
        <span>⚠</span> WARNING
      </p>
      <p className="text-xs text-amber-700 mt-0.5">{message}</p>
    </div>
  );
}

// Card for one patient's prescription. One Edit + one Delete for the whole
// prescription (not per medication row).
function PatientPrescriptionCard({ prescription, onEdit, onDelete }) {
  const patient = prescription.patientId;
  const age = calculateAge(patient?.dateOfBirth);
  const medications = (prescription.medications || []).filter(Boolean);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-5">
      {/* Patient header */}
      <div className="bg-gray-50 px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
            {initials(patient?.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{patient?.name || 'Unknown patient'}</p>
            <p className="text-xs text-gray-500">
              ID: #{patient?._id?.slice(-6) || '—'}
              {age !== null && <> • Age: {age}</>}
              {' • '}
              Allergies:{' '}
              {patient?.allergies?.length > 0 ? patient.allergies.join(', ') : 'None Reported'}
              {' • '}
              {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onEdit(prescription)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(prescription)}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Medications table (desktop) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase">
              <th className="px-5 py-3">Medication</th>
              <th className="px-5 py-3">Dosage &amp; Frequency</th>
              <th className="px-5 py-3">Safety Screening</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medications.map((med, i) => (
              <tr key={i}>
                <td className="px-5 py-4 align-top">
                  <p className="text-sm font-semibold text-gray-900">{med.name || 'Unknown medication'}</p>
                  {med.isChronic && (
                    <p className="text-xs text-gray-400">Chronic</p>
                  )}
                </td>
                <td className="px-5 py-4 align-top">
                  <p className="text-sm text-gray-700">{med.dose || '—'}</p>
                  <p className="text-sm text-gray-500">
                    {med.frequency || '—'}
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

      {/* Medications list (mobile) */}
      <div className="md:hidden divide-y divide-gray-100">
        {medications.map((med, i) => (
          <div key={i} className="px-4 py-4">
            <div className="mb-1">
              <p className="text-sm font-semibold text-gray-900">{med.name || 'Unknown medication'}</p>
              <p className="text-xs text-gray-500">{med.dose || '—'}</p>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {med.frequency || '—'}
              {!med.isChronic && med.duration && <> · {med.duration}</>}
              {med.isChronic && <> · Chronic</>}
            </p>
            <SafetyCell medication={med} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedDates, setHighlightedDates] = useState(new Set());
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
        date: dateValue || '',
        page: pageValue,
        limit: PAGE_LIMIT,
      });
      setPrescriptions(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotal(res.pagination?.total || 0);
    } catch {
      Swal.fire('Error', 'Failed to load prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHighlightedDates = useCallback(async () => {
    try {
      const res = await getPrescriptionDates();
      setHighlightedDates(new Set(res.data || []));
    } catch {
      setHighlightedDates(new Set());
    }
  }, []);

  useEffect(() => {
    loadPrescriptions('', null, 1);
    loadHighlightedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      loadPrescriptions(search, selectedDate, 1);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedDate]);

  const handlePageChange = (next) => {
    setPage(next);
    loadPrescriptions(search, selectedDate, next);
  };

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
  };

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
    setShowEditModal(true);
  };

  const handleDelete = async (prescription) => {
    const result = await Swal.fire({
      title: 'Delete this prescription?',
      text: 'This will remove the prescription record permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;

    try {
      await deletePrescription(prescription._id);
      Swal.fire('Deleted', 'Prescription deleted successfully', 'success');
      loadPrescriptions(search, selectedDate, page);
      loadHighlightedDates();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to delete prescription', 'error');
    }
  };

  const handleModalSaved = () => {
    setShowEditModal(false);
    setEditingPrescription(null);
    loadPrescriptions(search, selectedDate, page);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingPrescription(null);
  };

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return null;
    return new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          All prescriptions you've issued, with live safety screening.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 mb-5">
        {/* Search (full width) */}
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or national ID..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {selectedDateLabel && (
            <p className="text-xs text-blue-700 mt-2">
              Showing prescriptions from <strong>{selectedDateLabel}</strong>
            </p>
          )}
        </div>

        {/* Calendar */}
        <PrescriptionCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          highlightedDates={highlightedDates}
        />
      </div>

      {/* List */}
      {loading && (
        <div className="text-center text-gray-400 py-16">Loading prescriptions...</div>
      )}

      {!loading && prescriptions.length === 0 && (
        <div className="text-center text-gray-400 py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          No prescriptions found.
        </div>
      )}

      {!loading &&
        prescriptions.map((prescription) => (
          <PatientPrescriptionCard
            key={prescription._id}
            prescription={prescription}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 px-1">
          <p className="text-xs text-gray-500">
            Showing {prescriptions.length} of {total} prescriptions
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-md text-sm font-medium ${
                    p === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingPrescription && (
        <PrescriptionModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          consultationId={
            typeof editingPrescription.consultationId === 'object'
              ? editingPrescription.consultationId?._id
              : editingPrescription.consultationId
          }
          patient={editingPrescription.patientId}
          language={editingPrescription.language || 'en'}
          existingPrescription={editingPrescription}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
