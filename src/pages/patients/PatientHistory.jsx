import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatientHistory} from '../../api/patient';
import {  clearHistory} from '../../slices/patientsSlice';

const urgencyStyles = {
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-100 text-red-700',
};

export default function PatientHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { history, isHistoryLoading, error } = useSelector((state) => state.patients);

  useEffect(() => {
    dispatch(fetchPatientHistory(id));
    return () => dispatch(clearHistory());
  }, [id, dispatch]);

  const calculateAge = (dob) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const initials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (isHistoryLoading) {
    return <div className="text-center text-gray-400 py-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!history) return null;

  const { patient, history: consultations } = history;

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/patients')}
        className="text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        ← Back to Patients
      </button>

      {/* Patient summary card */}
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
            {initials(patient.name)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium uppercase">
                {patient.gender}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                Age: {calculateAge(patient.dateOfBirth)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                {patient.bloodType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Allergies</p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies?.length > 0 ? (
                    patient.allergies.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">
                        ⚠ {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Chronic Conditions</p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.chronicConditions?.length > 0 ? (
                    patient.chronicConditions.map((c, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

    <div className="flex items-center gap-2">
  <button
    onClick={() => navigate(`/consultations/add/${patient._id}`)}
    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
  >
    + New Consultation
  </button>
  <button
    onClick={() => navigate(`/patients/edit/${patient._id}`)}
    className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900"
  >
    ✏️ Edit Record
  </button>
</div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Consultation History ({consultations.length})
      </h2>

      {consultations.length === 0 && (
        <div className="text-center text-gray-400 py-10 bg-white rounded-xl shadow-sm">
          No consultations recorded yet.
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {consultations.map((item) => (
          <div key={item.consultationId} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">
                {new Date(item.date).toLocaleString()}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                  urgencyStyles[item.urgencyLevel?.toLowerCase()] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {item.urgencyLevel}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.symptoms.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {s}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Diagnosis</p>
                <p className="text-sm text-gray-900">{item.diagnosis || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">Follow-up Date</p>
                <p className="text-sm text-gray-900">
                  {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'}
                </p>
              </div>
              {item.suggestedSpecialist && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Specialist</p>
                  <p className="text-sm text-gray-900">{item.suggestedSpecialist}</p>
                </div>
              )}
            </div>

            {item.structuredNote && (
              <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3 mb-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">🤖 AI Clinical Note</p>
                <p className="text-sm text-gray-700">{item.structuredNote}</p>
              </div>
            )}

            {item.prescription && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Prescription</p>
                <div className="flex flex-col gap-1.5">
                  {item.prescription.medications.map((med, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-gray-900">{med.name}</span>
                      {med.dosage && <span className="text-gray-500"> — {med.dosage}</span>}
                      {med.frequency && <span className="text-gray-500"> ({med.frequency})</span>}
                    </div>
                  ))}
                </div>

                {item.prescription.interactions?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 text-xs text-amber-800">
                    <strong>Interactions:</strong>
                    <ul className="list-disc ml-4 mt-1">
                      {item.prescription.interactions.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                )}

                {item.prescription.warnings?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2 text-xs text-red-800">
                    <strong>Warnings:</strong>
                    <ul className="list-disc ml-4 mt-1">
                      {item.prescription.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
