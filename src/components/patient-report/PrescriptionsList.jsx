import { formatDate } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function PrescriptionsList({ prescriptions }) {
  if (!prescriptions.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Prescriptions</h2>
        <EmptyState
          title="No prescriptions recorded"
          description="Medications prescribed during consultations will appear here."
          icon="💊"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Prescriptions</h2>
        <p className="text-xs text-gray-400 mt-0.5">From consultation records</p>
      </div>
      <div className="divide-y divide-gray-100">
        {prescriptions.map((med, i) => (
          <div key={`${med.consultationId}-${med.name}-${i}`} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[med.dosage, med.frequency].filter(Boolean).join(' · ') || 'Dosage not specified'}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{formatDate(med.consultationDate)}</span>
            </div>
            {med.warnings?.length > 0 && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-700">
                <strong>Warnings:</strong> {med.warnings.join('; ')}
              </div>
            )}
            {med.interactions?.length > 0 && (
              <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800">
                <strong>Interactions:</strong> {med.interactions.join('; ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
