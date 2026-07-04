import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function PrescriptionsList({ prescriptions }) {
  const { t } = useTranslation();

  if (!prescriptions.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('patientReport.prescriptionsList.title')}</h2>
        <EmptyState
          title={t('patientReport.prescriptionsList.emptyTitle')}
          description={t('patientReport.prescriptionsList.emptyDesc')}
          icon="💊"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{t('patientReport.prescriptionsList.title')}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{t('patientReport.prescriptionsList.subtitle')}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {prescriptions.map((med, i) => (
          <div key={`${med.consultationId}-${med.name}-${i}`} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{med.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[med.dosage, med.frequency].filter(Boolean).join(' · ') || t('patientReport.prescriptionsList.dosageNotSpecified')}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{formatDate(med.consultationDate)}</span>
            </div>
            {med.quickCheckMessage && (
              <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-800">
                <strong>⚠ </strong>{med.quickCheckMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}