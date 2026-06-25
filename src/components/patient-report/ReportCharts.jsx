import EmptyState from './EmptyState';

const URGENCY_COLORS = {
  low: 'bg-green-500',
  moderate: 'bg-amber-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
  critical: 'bg-red-600',
  unknown: 'bg-gray-400',
};

const URGENCY_LABELS = {
  low: 'Low',
  moderate: 'Moderate',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
  unknown: 'Unknown',
};

export default function UrgencyChart({ urgencyCounts }) {
  const entries = Object.entries(urgencyCounts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (!total) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Urgency Distribution</h2>
        <EmptyState
          title="No urgency data"
          description="Urgency levels from consultations will be visualized here."
          icon="📊"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Urgency Distribution</h2>
      <p className="text-xs text-gray-400 mb-5">Across {total} consultation{total !== 1 ? 's' : ''}</p>
      <div className="space-y-3">
        {entries.map(([level, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={level}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 capitalize">
                  {URGENCY_LABELS[level] || level}
                </span>
                <span className="text-gray-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${URGENCY_COLORS[level] || URGENCY_COLORS.unknown}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsultationTrendChart({ monthChartData }) {
  if (!monthChartData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Consultation Trend</h2>
        <EmptyState
          title="No trend data"
          description="Monthly consultation frequency will appear here."
          icon="📈"
        />
      </div>
    );
  }

  const maxCount = Math.max(...monthChartData.map((d) => d.count));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Consultation Trend</h2>
      <p className="text-xs text-gray-400 mb-5">Visits per month (last 6 months)</p>
      <div className="flex items-end justify-between gap-2 h-36">
        {monthChartData.map(({ month, count }) => {
          const heightPct = maxCount ? (count / maxCount) * 100 : 0;
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-gray-700">{count}</span>
              <div className="w-full flex items-end justify-center h-24">
                <div
                  className="w-full max-w-10 bg-blue-500 rounded-t-md transition-all"
                  style={{ height: `${Math.max(heightPct, 8)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 text-center leading-tight">{month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopSymptomsChart({ topSymptoms }) {
  if (!topSymptoms.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top Symptoms</h2>
        <EmptyState
          title="No symptom data"
          description="Most frequently reported symptoms will appear here."
          icon="🌡️"
        />
      </div>
    );
  }

  const maxCount = topSymptoms[0].count;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Top Symptoms</h2>
      <p className="text-xs text-gray-400 mb-5">Most reported across consultations</p>
      <div className="space-y-3">
        {topSymptoms.map(({ symptom, count }) => {
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={symptom}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 truncate pr-2">{symptom}</span>
                <span className="text-gray-500 shrink-0">{count}×</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
