import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function FollowUpsSection({ followUps }) {
  const { t } = useTranslation();

  if (!followUps.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('patientReport.followUpsSection.title')}</h2>
        <EmptyState
          title={t('patientReport.followUpsSection.emptyTitle')}
          description={t('patientReport.followUpsSection.emptyDesc')}
          icon="📋"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{t('patientReport.followUpsSection.title')}</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {followUps.map((item) => (
          <div key={item._id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {item.status === 'done'
                  ? t('patientReport.followUpsSection.completedFollowUp')
                  : t('patientReport.followUpsSection.scheduledFollowUp')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.instructions || t('patientReport.followUpsSection.noInstructions')}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-600">{formatDate(item.scheduledDate)}</p>
              <span
                className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.status === 'done'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {item.status === 'done'
                  ? t('patientReport.followUpsSection.done')
                  : t('patientReport.followUpsSection.pending')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UnavailableSection({ title, description }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 border-dashed">
      <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
      <EmptyState title={t('patientReport.followUpsSection.unavailableTitle')} description={description} icon="🚫" />
    </div>
  );
}