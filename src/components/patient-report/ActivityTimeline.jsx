import { formatDateTime, getUrgencyStyle } from '../../utils/patientUtils';
import EmptyState from './EmptyState';

const typeConfig = {
  consultation: {
    icon: '🩺',
    dotColor: 'bg-blue-500',
    badge: 'Consultation',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  followup: {
    icon: '📋',
    dotColor: 'bg-purple-500',
    badge: 'Follow-up',
    badgeClass: 'bg-purple-50 text-purple-700',
  },
};

export default function ActivityTimeline({ timeline }) {
  if (!timeline.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h2>
        <EmptyState
          title="No activity recorded"
          description="Consultations and follow-ups will appear in chronological order."
          icon="🕐"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Activity Timeline</h2>
        <p className="text-xs text-gray-400 mt-0.5">Consultations and follow-ups combined</p>
      </div>
      <div className="px-6 py-4">
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {timeline.map((item) => {
              const config = typeConfig[item.type] || typeConfig.consultation;
              return (
                <div key={item.id} className="relative flex gap-4 pl-10">
                  <div
                    className={`absolute left-2.5 w-3 h-3 rounded-full ring-4 ring-white ${config.dotColor}`}
                  />
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeClass}`}>
                        {config.badge}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(item.date)}</span>
                      {item.urgencyLevel && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${getUrgencyStyle(item.urgencyLevel)}`}
                        >
                          {item.urgencyLevel}
                        </span>
                      )}
                      {item.status === 'done' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.subtitle}</p>
                    )}
                    {item.meta && (
                      <p className="text-xs text-blue-600 mt-1">Referral: {item.meta}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
