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
      const res = await getAllPatients({search});
      console.log(res)
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
    <div className="p-4 max-w-4xl mx-auto">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-1">Search Patient</h2>
        <p className="text-gray-500 text-sm">
          Search by name or National ID to start a new consultation
        </p>
      </div>

      <div className="mb-5">
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name or National ID..."
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <p className="text-center text-gray-400 py-10">Searching...</p>
      )}

      {!loading && patients.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No patients found</p>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className="space-y-2 h-125 overflow-auto">
          {patients.map((p) => (
            <button
              key={p._id}
              onClick={() => handleSelectPatient(p)}
              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition text-left"
            >
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  National ID: {p.nationalID} · Age: {calculateAge(p.dateOfBirth)} · {p.gender}
                </p>
              </div>
              <span className="text-blue-600 text-sm font-medium">View History →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSearch;