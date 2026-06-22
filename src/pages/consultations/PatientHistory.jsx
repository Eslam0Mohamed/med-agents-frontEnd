import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPatientHistory } from '../../api/patient';

const PatientHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPatientHistory(id);
      setPatient(res.data.patient);
      setHistory(res.data.history);
    } catch (err) {
      console.error('Failed to load patient history', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const calculateAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const getUrgencyBadge = (level) => {
    const styles = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return styles[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading patient history...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>Patient not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">

      {/* Back link */}
      <button
        onClick={() => navigate('/consultations/search-patient')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        ← Back to search
      </button>

      {/* Patient Summary Card */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Age: {calculateAge(patient.dateOfBirth)} · {patient.gender} · Blood: {patient.bloodType}
            </p>
          </div>
          <Link
            to={`/consultations/add/${patient._id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition text-sm"
          >
            + New Consultation
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Allergies</p>
            <p className="text-sm text-gray-700">
              {patient.allergies?.length ? patient.allergies.join(', ') : 'None'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Chronic Conditions</p>
            <p className="text-sm text-gray-700">
              {patient.chronicConditions?.length ? patient.chronicConditions.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Consultation History</h3>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          <p>No previous consultations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.consultationId} className="bg-white rounded-xl shadow p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs text-gray-400">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getUrgencyBadge(item.urgencyLevel)}`}>
                  {item.urgencyLevel}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Diagnosis:</span> {item.diagnosis}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <span className="font-medium">Symptoms:</span> {item.symptoms.join(', ')}
              </p>
              {item.suggestedSpecialist && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Specialist:</span> {item.suggestedSpecialist}
                </p>
              )}

              {item.prescription && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-1">Prescription</p>
                  <p className="text-sm text-gray-700">
                    {item.prescription.medications?.map((m) => m.name).join(', ') || '—'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;