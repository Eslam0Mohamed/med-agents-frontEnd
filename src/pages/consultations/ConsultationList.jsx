import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { getConsultations } from '../../api/consultation'; 

const ITEMS_PER_PAGE = 10;

const Consultations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const getUrgencyBadge = (level) => {
    const styles = {
      low: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
      medium: 'bg-amber-50 text-amber-600 border-amber-200/50',
      critical: 'bg-rose-50 text-rose-600 border-rose-200/60 animate-pulse font-bold',
    };
    return styles[level?.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-slate-300">—</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        <p className="text-slate-400 font-medium text-xs mt-4 tracking-wider uppercase">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">

      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-24 px-4 sm:px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mb-4 border border-white/10 backdrop-blur-sm"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t('common.back')}
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                {t('consultations.title')} <span className="w-2 h-2 rounded-full bg-blue-300"></span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
                {t('consultations.listSubtitle')}
              </p>
            </div>
            <Link
              to="/consultations/search-patient"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
            >
              <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('nav.addConsultation')}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12">

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
            placeholder={t('common.search') + '...'}
            className="w-full border-0 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base bg-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-slate-400 font-medium text-slate-700"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse text-left">
              <thead className="bg-blue-600 text-white/95">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('common.name')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('consultations.symptomsColumn')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('consultations.urgencyColumn')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('consultations.specialist')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('common.status')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">{t('consultations.followUpDate')}</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70">
                {paginatedData.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-all duration-150 group">
                    <td className="px-6 py-4 font-black text-blue-600 text-base">
                      {getPatientName(c.patientId)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate font-medium">
                      {c.symptoms.join(', ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border capitalize tracking-wide shadow-sm ${getUrgencyBadge(c.urgencyLevel)}`}>
                        {c.urgencyLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">
                      {c.suggestedSpecialist ? (
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/40">
                          {c.suggestedSpecialist}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 capitalize font-bold">
                      <span className="inline-flex items-center gap-2 text-slate-700 text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full ring-4 shadow-sm ${c.status?.toLowerCase() === 'completed' ? 'bg-emerald-500 ring-emerald-100' : 'bg-amber-400 ring-amber-100'}`}></span>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold text-xs tracking-wide">
                      {formatDate(c.followUpDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1.5 justify-end items-center">
                        <Link to={`/consultations/${c._id}`} className="inline-flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 p-2 rounded-xl transition shadow-sm" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link to={`/consultations/edit/${c._id}`} className="inline-flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition">
                          {t('common.edit')}
                        </Link>
                        <button disabled className="bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed opacity-60">
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-4">
          {paginatedData.map((c) => (
            <div key={c._id} className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3">
                <div>
                  <h4 className="font-black text-blue-700 text-lg">{getPatientName(c.patientId)}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${c.status?.toLowerCase() === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                    <span className="text-xs font-bold text-slate-500 capitalize">{c.status}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border capitalize tracking-wide shadow-sm shrink-0 ${getUrgencyBadge(c.urgencyLevel)}`}>
                  {c.urgencyLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium mb-0.5">Symptoms:</span>
                  <p className="text-slate-600 font-semibold bg-slate-50/60 p-2 rounded-lg border border-slate-100">{c.symptoms.join(', ')}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium mb-0.5">{t('consultations.specialist')}:</span>
                  <p className="text-slate-700 font-bold truncate">
                    {c.suggestedSpecialist || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium mb-0.5">{t('consultations.followUpDate')}:</span>
                  <p className="text-slate-700 font-bold">{formatDate(c.followUpDate)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <Link to={`/consultations/${c._id}`} className="flex-1 inline-flex items-center justify-center bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold border border-slate-200 transition gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Link>
                <Link to={`/consultations/edit/${c._id}`} className="flex-1 inline-flex items-center justify-center bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-bold border border-blue-100 transition">
                  {t('common.edit')}
                </Link>
                <button disabled className="flex-1 bg-slate-100 text-slate-400 py-2.5 rounded-xl text-xs font-bold border border-slate-200 cursor-not-allowed opacity-60">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-100 shadow-md">
            <p className="text-slate-500 font-bold text-base sm:text-lg">{t('common.noData')}</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <p className="text-[10px] sm:text-xs text-slate-400 font-extrabold tracking-wider uppercase">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1} – {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 shadow-sm transition">
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`w-8 h-8 rounded-xl text-xs font-black border transition-all ${page === currentPage ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 shadow-sm transition">
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