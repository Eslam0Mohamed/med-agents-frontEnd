import { formatDateTime, getUrgencyStyle } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function MedicalSummary({ latestConsultation, uniqueDiagnoses, stats }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Medical Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Latest Diagnosis</p>
          {latestConsultation?.diagnosis ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{latestConsultation.diagnosis}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDateTime(latestConsultation.date)}
              </p>
              {latestConsultation.urgencyLevel && (
                <span
                  className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${getUrgencyStyle(latestConsultation.urgencyLevel)}`}
                >
                  {latestConsultation.urgencyLevel}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No diagnosis recorded yet</p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Clinical Overview</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex justify-between">
              <span className="text-gray-500">Total consultations</span>
              <span className="font-medium">{stats.totalConsultations}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Unique diagnoses</span>
              <span className="font-medium">{stats.uniqueDiagnosisCount}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Active follow-ups</span>
              <span className="font-medium">{stats.activeFollowUps}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">High urgency cases</span>
              <span className="font-medium text-red-600">{stats.highUrgencyCount}</span>
            </li>
          </ul>
        </div>
      </div>

      {uniqueDiagnoses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">All Diagnoses</p>
          <div className="flex flex-wrap gap-2">
            {uniqueDiagnoses.map((diagnosis, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium"
              >
                {diagnosis}
              </span>
            ))}
          </div>
        </div>
      )}

      {!latestConsultation && uniqueDiagnoses.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="No medical summary available"
            description="Consultation records will appear here once documented."
            icon="🩺"
          />
        </div>
      )}
    </div>
  );
}
