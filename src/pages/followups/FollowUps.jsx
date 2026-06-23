import  { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiPlayCircle,
  FiTrash2,
  FiCheckCircle,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { deleteFollowUp, getFollowUps } from '../../api/followup';
import './followups.css';

const FollowUps = () => {
  const navigate = useNavigate();

  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);

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

  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.id || '';
  };

  const isPastDue = (item) => {
    if (item.status === 'done') return false;
    if (!item.scheduledDate) return false;

    const scheduledDate = new Date(item.scheduledDate);
    const today = new Date();

    scheduledDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return scheduledDate < today;
  };

  const validFollowUps = useMemo(() => {
    return followUps.filter((item) => item.patientId && item.consultationId);
  }, [followUps]);

  const filteredFollowUps = useMemo(() => {
    return validFollowUps.filter((item) => {
      if (activeTab === 'completed') {
        return item.status === 'done';
      }

      if (activeTab === 'pastDue') {
        return isPastDue(item);
      }

      return item.status !== 'done' && !isPastDue(item);
    });
  }, [validFollowUps, activeTab]);

  const pastDueCount = useMemo(() => {
    return validFollowUps.filter(
      (item) => item.status !== 'done' && isPastDue(item)
    ).length;
  }, [validFollowUps]);

  const getPatientName = (item) => {
    return item.patientId?.name || 'Unknown Patient';
  };

  const getPatientId = (item) => {
    return getId(item.patientId);
  };

  const getConsultationId = (item) => {
    return getId(item.consultationId);
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

  const formatDate = (date) => {
    if (!date) return 'No date';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getConsultationSummary = (item) => {
    const consultation = item.consultationId;

    if (!consultation) return 'No consultation details';

    if (consultation.diagnosis) {
      return consultation.diagnosis;
    }

    if (Array.isArray(consultation.symptoms) && consultation.symptoms.length > 0) {
      return consultation.symptoms.join(', ');
    }

    if (consultation.rawInput) {
      return consultation.rawInput;
    }

    return 'Consultation details unavailable';
  };

  const handleStartFollowUp = (item) => {
    const patientId = getPatientId(item);
    const consultationId = getConsultationId(item);

    if (!patientId || !consultationId) {
      Swal.fire(
        'Missing data',
        'This follow-up is missing patient or consultation data.',
        'warning'
      );
      return;
    }

    navigate(
      `/consultations?mode=followup&followupId=${item._id}&patientId=${patientId}&consultationId=${consultationId}`
    );
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete follow-up?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteFollowUp(id);

      setFollowUps((prev) => prev.filter((item) => item._id !== id));

      Swal.fire({
        title: 'Deleted!',
        text: 'Follow-up deleted successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to delete follow-up', 'error');
    }
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
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>

        <button
          className={activeTab === 'pastDue' ? 'active' : ''}
          onClick={() => setActiveTab('pastDue')}
        >
          Past Due
        </button>

        <button
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      <div className="followups-layout">
        <aside className="followups-sidebar">
          <div className="mini-calendar-card">
            <div className="calendar-title">
              <span>September 2024</span>
              <span>‹ ›</span>
            </div>

            <div className="calendar-grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <span key={`${day}-${index}`} className="calendar-day-name">
                  {day}
                </span>
              ))}

              {[28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7].map((day, index) => (
                <span
                  key={`${day}-${index}`}
                  className={day === 4 ? 'calendar-day active' : 'calendar-day'}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          <div className="ai-insights-card">
            <h3>AI Insights</h3>
            <p>
              You have {pastDueCount} follow-ups that may need attention today.
            </p>
            <button>View Analysis</button>
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
                      {item.status === 'done'
                        ? 'Completed'
                        : isPastDue(item)
                          ? 'Past Due'
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
                    {item.status !== 'done' && (
                      <button
                        className="start-btn"
                        onClick={() => handleStartFollowUp(item)}
                      >
                        <FiPlayCircle />
                        Start Follow-up
                      </button>
                    )}

                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(item._id)}
                      title="Delete follow-up"
                    >
                      <FiTrash2 />
                    </button>
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