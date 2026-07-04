import { useTranslation } from 'react-i18next';
import { formatDateTime, getUrgencyStyle } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

export default function RecentConsultations({ consultations }) {
  const { t } = useTranslation();

  if (!consultations.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('patientReport.recentConsultations.title')}</h2>
        <EmptyState
          title={t('patientReport.recentConsultations.emptyTitle')}
          description={t('patientReport.recentConsultations.emptyDesc')}
          icon="📅"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{t('patientReport.recentConsultations.title')}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{t('patientReport.recentConsultations.subtitle')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
              <th className="text-left px-6 py-3 font-medium">{t('patientReport.recentConsultations.date')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('patientReport.recentConsultations.symptoms')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('patientReport.recentConsultations.diagnosis')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('patientReport.recentConsultations.urgency')}</th>
              <th className="text-left px-6 py-3 font-medium">{t('patientReport.recentConsultations.specialist')}</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((item) => (
              <tr key={item.consultationId} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                  {formatDateTime(item.date)}
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(item.symptoms || []).slice(0, 3).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {s}
                      </span>
                    ))}
                    {(item.symptoms || []).length > 3 && (
                      <span className="text-xs text-gray-400">+{item.symptoms.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-900 font-medium">{item.diagnosis || '—'}</td>
                <td className="px-6 py-3">
                  {item.urgencyLevel ? (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${getUrgencyStyle(item.urgencyLevel)}`}
                    >
                      {item.urgencyLevel}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-6 py-3 text-gray-600">{item.suggestedSpecialist || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}