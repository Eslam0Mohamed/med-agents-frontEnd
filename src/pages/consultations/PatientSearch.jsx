import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPatients } from '../../api/patient';

const PatientSearch = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPatients = useCallback(async (search) => {
    try {
      setLoading(true);
      const res = await getAllPatients({ search });
      console.log(res);
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients('');
  }, [loadPatients]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadPatients(search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, loadPatients]);

  const handleSelectPatient = (patient) => {
    navigate(`/consultations/patient/${patient._id}/history`);
  };

  const calculateAge = (dob) => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gradient-to-tr from-slate-50 via-gray-50 to-blue-50/30 antialiased text-slate-800">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-all duration-200 group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm hover:shadow"
      >
        <span className="text-base transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
        Back
      </button>

      {/* Header Section */}
      <div className="mb-8">
        {/* تم التعديل هنا ليكون باللون الأزرق بالكامل بناءً على طلبك */}
        <h2 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-2">
          Search Patient<span className="text-blue-700">.</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Find a patient by name or National ID to start a new consultation
        </p>
      </div>

      {/* Search Input Box */}
      <div className="mb-6 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type patient name or National ID..."
          className="w-full border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-base bg-white shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Searching patients dashboard...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && patients.length === 0 && (
        <div className="text-center py-20 bg-white/70 backdrop-blur-sm border border-dashed border-slate-200 rounded-2xl shadow-sm">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-600 font-bold text-lg">No patients found</p>
          <p className="text-slate-400 text-sm mt-1">Please check the spelling or check the National ID number.</p>
        </div>
      )}

      {/* Patients Results List */}
      {!loading && patients.length > 0 && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {patients.map((p) => (
            <button
              key={p._id}
              onClick={() => handleSelectPatient(p)}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                {/* Patient Avatar (Initial Letter) */}
                <div className="hidden sm:flex w-12 h-12 bg-blue-50 text-blue-600 font-bold rounded-xl items-center justify-center text-lg shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-sm">
                  {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 text-base">
                    {p.name}
                  </p>
                  
                  {/* Badges Info Row */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs mt-2 font-medium">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/40">
                      ID: {p.nationalID}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/40">
                      Age: {calculateAge(p.dateOfBirth)} Yrs
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg border uppercase ${
                      p.gender?.toLowerCase() === 'male' 
                        ? 'bg-blue-50/60 text-blue-600 border-blue-100' 
                        : 'bg-rose-50/60 text-rose-600 border-rose-100'
                    }`}>
                      {p.gender || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Button Indicator */}
              <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50/80 border border-blue-100/50 px-3 py-2 rounded-xl group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-200 self-start sm:self-center shadow-sm">
                View History
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;