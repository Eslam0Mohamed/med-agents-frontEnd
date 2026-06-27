import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiPlayCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { getFollowUps } from '../../api/followup';
import './followups.css';

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FollowUps = () => {
  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(null);

  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.id || '';
  };

  const isCompleted = (item) => {
    return item.status === 'confirmed' || item.status === 'done';
  };

  const isCancelled = (item) => {
    return item.status === 'cancelled' || item.status === 'canceled';
  };

  const toDateKey = (date) => {
    if (!date) return '';

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  function formatDate(date) {
    if (!date) return 'No date';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const todayKey = toDateKey(new Date());

  const isPastDue = (item) => {
    if (isCompleted(item)) return false;

    if (isCancelled(item)) return true;

    if (!item.scheduledDate) return false;

    return item.status === 'pending' && toDateKey(item.scheduledDate) < todayKey;
  };

  const loadFollowUps = async () => {
    try {
      setLoading(true);

      const res = await getFollowUps();
      setFollowUps(res?.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to load follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const validFollowUps = useMemo(() => {
    return followUps.filter((item) => item.patientId && item.consultationId);
  }, [followUps]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < startWeekDay; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [calendarMonth]);

  const filteredFollowUps = useMemo(() => {
    return validFollowUps.filter((item) => {
      const matchesTab =
        activeTab === 'completed'
          ? isCompleted(item)
          : activeTab === 'pastDue'
            ? isPastDue(item)
            : !isCompleted(item) && !isPastDue(item);

      const matchesSelectedDate = selectedDate
        ? toDateKey(item.scheduledDate) === toDateKey(selectedDate)
        : true;

      return matchesTab && matchesSelectedDate;
    });
  }, [validFollowUps, activeTab, selectedDate]);

  const pastDueCount = useMemo(() => {
    return validFollowUps.filter((item) => !isCompleted(item) && isPastDue(item))
      .length;
  }, [validFollowUps]);

  const completedCount = useMemo(() => {
    return validFollowUps.filter((item) => isCompleted(item)).length;
  }, [validFollowUps]);

  const selectedDateCount = useMemo(() => {
    if (!selectedDate) return 0;

    return validFollowUps.filter(
      (item) => toDateKey(item.scheduledDate) === toDateKey(selectedDate)
    ).length;
  }, [validFollowUps, selectedDate]);

  const insightDateCount = useMemo(() => {
    const targetDate = selectedDate || new Date();

    return validFollowUps.filter(
      (item) =>
        !isCompleted(item) &&
        toDateKey(item.scheduledDate) === toDateKey(targetDate)
    ).length;
  }, [validFollowUps, selectedDate]);

  const insightDateLabel = selectedDate
    ? `on ${formatDate(selectedDate)}`
    : 'today';

  const getFollowUpsCountForDate = (date) => {
    if (!date) return 0;

    const key = toDateKey(date);

    return validFollowUps.filter((item) => toDateKey(item.scheduledDate) === key)
      .length;
  };

  const getPatientName = (item) => {
    return item.patientId?.name || 'Unknown Patient';
  };

  const getPatientId = (item) => {
    return getId(item.patientId);
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown Patient') return 'P';

    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getConsultationSummary = (item) => {
    const consultation = item.consultationId;

    if (!consultation) return 'No consultation details';

    if (consultation.diagnosis) return consultation.diagnosis;

    if (Array.isArray(consultation.symptoms) && consultation.symptoms.length > 0) {
      return consultation.symptoms.join(', ');
    }

    if (consultation.rawInput) return consultation.rawInput;

    return 'Consultation details unavailable';
  };

  const handlePreviousMonth = () => {
    setCalendarMonth((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedDate(null);
  };

  const handleStartFollowUp = (item) => {
    navigate(`/followups/start/${item._id}`);
  };

  const handleInsightAction = () => {
    if (pastDueCount > 0) {
      setSelectedDate(null);
      setActiveTab('pastDue');
      return;
    }

    setSelectedDate(new Date());
    setActiveTab('upcoming');
  };

  return (
    <section className="followups-page">
      <div className="followups-header">
        <div>
          <h1>Patient Follow-ups</h1>
          <p>Manage scheduled reviews and continuity of care for your clinic.</p>
        </div>

        <div className="header-note">
          Created automatically from consultations
        </div>
      </div>

      <div className="followups-tabs">
        <button
          className={activeTab === 'upcoming' ? 'active' : ''}
          onClick={() => handleTabChange('upcoming')}
        >
          Upcoming
        </button>

        <button
          className={activeTab === 'pastDue' ? 'active' : ''}
          onClick={() => handleTabChange('pastDue')}
        >
          Past Due
        </button>

        <button
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => handleTabChange('completed')}
        >
          Completed
        </button>
      </div>

      <div className="followups-layout">
        <aside className="followups-sidebar">
          <div className="mini-calendar-card">
            <div className="calendar-title">
              <button type="button" onClick={handlePreviousMonth}>
                ‹
              </button>

              <span>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </span>

              <button type="button" onClick={handleNextMonth}>
                ›
              </button>
            </div>

            <div className="calendar-grid">
              {weekDays.map((day, index) => (
                <span key={`${day}-${index}`} className="calendar-day-name">
                  {day}
                </span>
              ))}

              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`empty-${index}`} className="calendar-empty" />;
                }

                const count = getFollowUpsCountForDate(day);
                const isSelected =
                  selectedDate && toDateKey(day) === toDateKey(selectedDate);
                const isToday = toDateKey(day) === todayKey;

                return (
                  <button
                    type="button"
                    key={toDateKey(day)}
                    onClick={() => setSelectedDate(day)}
                    className={[
                      'calendar-day',
                      isSelected ? 'selected' : '',
                      isToday ? 'today' : '',
                      count > 0 ? 'has-followups' : '',
                    ].join(' ')}
                  >
                    <span>{day.getDate()}</span>
                    {count > 0 && <small>{count}</small>}
                  </button>
                );
              })}
            </div>

            <div className="calendar-footer">
              {selectedDate ? (
                <>
                  <p>
                    Showing {selectedDateCount} follow-up(s) for{' '}
                    {formatDate(selectedDate)}
                  </p>

                  <button type="button" onClick={() => setSelectedDate(null)}>
                    Show all
                  </button>
                </>
              ) : (
                <p>Click a day to filter follow-ups.</p>
              )}
            </div>
          </div>

          <div className="ai-insights-card">
            <h3>AI Insights</h3>

            <div className="insight-list">
              <p>
                {insightDateCount} follow-up(s) scheduled {insightDateLabel}.
              </p>

              <p>{pastDueCount} pending follow-up(s) are past due.</p>

              <p>{completedCount} follow-up(s) completed.</p>
            </div>

            <button type="button" onClick={handleInsightAction}>
              {pastDueCount > 0 ? 'Review Past Due' : "View Today's Follow-ups"}
            </button>
          </div>
        </aside>

        <main className="followups-content">
          <div className="section-title">
            {activeTab === 'completed' ? <FiCheckCircle /> : <FiAlertTriangle />}

            <span>
              {activeTab === 'upcoming' && 'Upcoming Follow-ups'}
              {activeTab === 'pastDue' && 'Past Due Follow-ups'}
              {activeTab === 'completed' && 'Completed Follow-ups'}
            </span>
          </div>

          {loading && <p className="state-text">Loading follow-ups...</p>}

          {!loading && filteredFollowUps.length === 0 && (
            <p className="state-text">No follow-ups found.</p>
          )}

          <div className="followups-grid">
            {filteredFollowUps.map((item) => {
              const patientName = getPatientName(item);

              return (
                <article className="followup-card" key={item._id}>
                  <div className="card-top">
                    <div className="patient-avatar">
                      {getInitials(patientName)}
                    </div>

                    <div>
                      <h3>{patientName}</h3>
                      <p>Patient ID: {getPatientId(item)}</p>
                    </div>

                    <span
                      className={
                        isPastDue(item) ? 'urgent-badge danger' : 'urgent-badge'
                      }
                    >
                      {isCompleted(item)
                        ? 'Completed'
                        : isPastDue(item)
                          ? isCancelled(item)
                            ? 'Missed'
                            : 'Past Due'
                          : 'Pending'}
                    </span>
                  </div>

                  <div className="followup-meta">
                    <p>
                      <FiCalendar />
                      Follow-up date: {formatDate(item.scheduledDate)}
                    </p>

                    <p>
                      <FiClock />
                      {item.instructions || 'No follow-up instructions'}
                    </p>
                  </div>

                  <div className="followup-context">
                    <span>Linked consultation</span>
                    <p>{getConsultationSummary(item)}</p>
                  </div>

                  <div className="card-actions">
                    {!isCompleted(item) ? (
                      <button
                        className="start-btn"
                        onClick={() => handleStartFollowUp(item)}
                      >
                        <FiPlayCircle />
                        Start Follow-up
                      </button>
                    ) : (
                      <div className="completed-note">
                        Completed after follow-up session
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </section>
  );
};

export default FollowUps;