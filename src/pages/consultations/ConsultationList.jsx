import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getConsultations, deleteConsultation } from '../../api/consultation';

const ITEMS_PER_PAGE = 10;

const Consultations = () => {
  
  const [consultations, setConsultations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConsultations();
      console.log(res);
      
      setConsultations(res.data);
      setFiltered(res.data);
    } catch {
      Swal.fire('Error', 'Failed to load consultations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const getPatientName = (patient) => {
    if (typeof patient === 'object' && patient !== null) {
      return patient.name || 'Unknown';
    }
    return patient || 'Unknown';
  };

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
    const query = value.toLowerCase().trim();

    if (!query) {
      setFiltered(consultations);
      return;
    }

    const result = consultations.filter((c) => {
      const patientName = getPatientName(c.patientId).toLowerCase();
      const symptoms = c.symptoms.join(', ').toLowerCase();
      const specialist = (c.suggestedSpecialist || '').toLowerCase();
      const status = (c.status || '').toLowerCase();
      const urgency = (c.urgencyLevel || '').toLowerCase();

      return (
        patientName.includes(query) ||
        symptoms.includes(query) ||
        specialist.includes(query) ||
        status.includes(query) ||
        urgency.includes(query)
      );
    });

    setFiltered(result);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await deleteConsultation(id);

        setConsultations((prev) => prev.filter((c) => c._id !== id));
        setFiltered((prev) => prev.filter((c) => c._id !== id));

        Swal.fire({
          title: 'Deleted!',
          text: 'Consultation deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch {
        Swal.fire('Error', 'Delete failed', 'error');
      }
    }
  };

  const getUrgencyBadge = (level) => {
    const styles = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return styles[level] || 'bg-gray-100 text-gray-700';
  };

  //  Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading consultations...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">Consultations</h2>
          <p className="text-sm text-gray-500 mt-1">Review clinical consult history and recommendations.</p>
        </div>
        <Link
          to="/consultations/search-patient"
          className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-sm w-full sm:w-auto"
        >
          + New Consultation
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search consultations by patient, symptoms, or status..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-blue-200">
        <table className="w-full min-w-[800px] text-sm table-auto">
        
      
        <thead className="bg-blue-700 text-white">
  <tr>
    <th className="px-4 py-4 font-semibold">Patient</th>
    <th className="px-4 py-4 font-semibold">Symptoms</th>
    <th className="px-4 py-4 font-semibold">Urgency</th>
    <th className="px-4 py-4 font-semibold">Specialist</th>
    <th className="px-4 py-4 font-semibold">Status</th>
    <th className="px-4 py-4 font-semibold">Follow-up</th>
    <th className="px-4 py-4 font-semibold">Actions</th>
  </tr>
</thead>
          <tbody>
            {paginatedData.map((c) => (
              <tr key={c._id} className="border-t hover:bg-gray-50/50">
<td className="px-4 py-3 font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
  {getPatientName(c.patientId)}
</td>
                 <td className="px-4 py-3 text-gray-600">{c.symptoms.join(', ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getUrgencyBadge(c.urgencyLevel)}`}>
                    {c.urgencyLevel}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.suggestedSpecialist || '—'}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{c.status}</td>
                <td className="px-4 py-3 text-gray-900">
                  {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/consultations/edit/${c._id}`}
                      className="border border-blue-600 text-blue-600 px-3 py-1 rounded-md text-xs hover:bg-blue-50 transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="border border-red-600 text-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No consultations found</p>
          </div>
        )}
      </div>

      {/*  Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-md text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;