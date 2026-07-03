import { useTranslation } from 'react-i18next';
import { formatDate, getUrgencyStyle } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function DiagnosesHistory({ diagnoses }) {
  const { t } = useTranslation();

  if (!diagnoses.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('patientReport.diagnosesHistory.title')}</h2>
        <EmptyState
          title={t('patientReport.diagnosesHistory.emptyTitle')}
          description={t('patientReport.diagnosesHistory.emptyDesc')}
          icon="🔬"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{t('patientReport.diagnosesHistory.title')}</h2>
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