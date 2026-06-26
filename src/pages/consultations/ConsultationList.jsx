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
      confirmButtonColor: '#f43f5e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-4 py-2 font-bold',
        cancelButton: 'rounded-xl px-4 py-2 font-bold'
      }
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
      low: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
      medium: 'bg-amber-50 text-amber-600 border-amber-200/50',
      critical: 'bg-rose-50 text-rose-600 border-rose-200/60 animate-pulse font-bold',
    };
    return styles[level?.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

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
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium text-xs mt-4 tracking-wider uppercase">Loading ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12">
      
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-10 pb-28 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
              Consultations <span className="w-2 h-2 rounded-full bg-blue-300"></span>
            </h2>
            <p className="text-blue-100 text-sm font-medium mt-1 opacity-90">
              Review clinical consult history, specialist notes, and digital recommendations.
            </p>
          </div>
          <Link
            to="/consultations/search-patient"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
          >
            <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Consultation
          </Link>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-6 -mt-14">
        
       
        <div className="mb-6 relative group shadow-sm rounded-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search Consultation..."
            className="w-full border-0 rounded-2xl pl-12 pr-4 py-4.5 text-base bg-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-slate-400 font-medium text-slate-700"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm table-auto border-collapse text-left">
            
              <thead className="bg-blue-600 text-white/95">
                <tr>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Patient Name</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Clinical Symptoms</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Urgency Level</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Suggested Specialist</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Status</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90">Follow-up Date</th>
                  <th className="px-6 py-4.5 font-bold tracking-wide text-xs uppercase opacity-90 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {paginatedData.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-all duration-150 group">
                    {/* Patient Name */}
                    <td className="px-6 py-5 font-black text-blue-600 hover:text-blue-800 transition-colors cursor-pointer text-base">
                      {getPatientName(c.patientId)}
                    </td>
                    
                    {/* Symptoms */}
                    <td className="px-6 py-5 text-slate-500 max-w-[240px] truncate font-medium" title={c.symptoms.join(', ')}>
                      {c.symptoms.join(', ')}
                    </td>
                    
                    {/* Urgency Badge */}
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border capitalize tracking-wide shadow-sm ${getUrgencyBadge(c.urgencyLevel)}`}>
                        {c.urgencyLevel}
                      </span>
                    </td>
                    
                    {/* Specialist */}
                    <td className="px-6 py-5 text-slate-700 font-semibold">
                      {c.suggestedSpecialist ? (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/40">
                          {c.suggestedSpecialist}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-5 capitalize font-bold">
                      <span className="inline-flex items-center gap-2 text-slate-700 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ring-4 shadow-sm ${
                          c.status?.toLowerCase() === 'completed' 
                            ? 'bg-emerald-500 ring-emerald-100' 
                            : 'bg-amber-400 ring-amber-100'
                        }`}></span>
                        {c.status}
                      </span>
                    </td>
                    
                    {/* Follow-up Date */}
                    <td className="px-6 py-5 text-slate-600 font-bold text-xs tracking-wide">
                      {c.followUpDate ? (
                        new Date(c.followUpDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex gap-2 justify-end opacity-90 group-hover:opacity-100 transition-all duration-150">
                        <Link
                          to={`/consultations/edit/${c._id}`}
                          className="inline-flex items-center justify-center bg-slate-50 hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 hover:border-blue-600 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="inline-flex items-center justify-center bg-slate-50 hover:bg-rose-600 text-slate-600 hover:text-white border border-slate-200 hover:border-rose-600 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </div>
              <p className="text-slate-500 font-bold text-lg">No consultations found</p>
              <p className="text-slate-400 text-sm mt-1">Try refining your search query or add a new entry.</p>
            </div>
          )}
        </div>

      
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <p className="text-xs text-slate-400 font-extrabold tracking-wider uppercase">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-black border transition-all ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform scale-105'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultations;