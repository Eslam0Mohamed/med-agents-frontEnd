import { formatDate, getUrgencyStyle } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function DiagnosesHistory({ diagnoses }) {
  if (!diagnoses.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Diagnoses History</h2>
        <EmptyState
          title="No diagnoses recorded"
          description="Diagnoses from consultations will be listed chronologically."
          icon="🔬"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Diagnoses History</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {diagnoses.map((item, i) => (
          <div key={`${item.consultationId}-${i}`} className="px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.diagnosis}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>
            </div>
            {item.urgencyLevel && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase shrink-0 ${getUrgencyStyle(item.urgencyLevel)}`}
              >
                {item.urgencyLevel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
