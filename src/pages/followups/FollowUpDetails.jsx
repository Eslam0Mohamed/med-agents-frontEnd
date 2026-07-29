import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFollowUpById } from '../../api/followup';
import { getPrescriptionByConsultation } from '../../api/prescription';
import DifferentialDiagnosisPanel from '../../components/consultations/DifferentialDiagnosisPanel';

const FollowUpDetails = () => {
  const { t } = useTranslation();
  const { followupId } = useParams();

  const [followUp, setFollowUp] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await getFollowUpById(followupId);
        const data = res?.data || res;

        if (data) {
          setFollowUp(data);

          // البريسكربشن مش متضمنة جوه الفولو أب أو الكونسلتيشن — لازم تتجاب
          // لوحدها، من زيارة الإكمال (لو موجودة) وإلا الكونسلتيشن الأصلية
          const effectiveConsultation =
            (typeof data?.completionConsultationId === 'object' && data.completionConsultationId) ||
            (typeof data?.consultationId === 'object' && data.consultationId) ||
            null;

          if (effectiveConsultation?._id) {
            try {
              const presRes = await getPrescriptionByConsultation(effectiveConsultation._id);
              setPrescription(presRes?.data || null);
            } catch {
              setPrescription(null);
            }
          }
        } else {
          setError(t('followups.start.notFound'));
        }
      } catch (error) {
        console.error(error);
        setError(t('followups.messages.errorLoadDetails'));
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [followupId, t]);

  const getPatientName = (patient) => {
    if (typeof patient === 'object' && patient !== null) {
      return patient.name || t('common.unknown');
    }

    return patient || t('common.unknown');
  };

  const getConsultation = () => {
    // زيارة الإكمال (لو الفولو أب اتكملت) فيها البيانات الفعلية للزيارة —
    // نفضّلها عن الكونسلتيشن الأصلية اللي جدولت الفولو أب بس
    if (
      typeof followUp?.completionConsultationId === 'object' &&
      followUp?.completionConsultationId !== null
    ) {
      return followUp.completionConsultationId;
    }

    if (
      typeof followUp?.consultationId === 'object' &&
      followUp?.consultationId !== null
    ) {
      return followUp.consultationId;
    }

    return null;
  };

  const renderSymptoms = (symptoms) => {
    if (Array.isArray(symptoms)) {
      return symptoms.length > 0 ? symptoms.join(', ') : t('followups.details.noSymptoms');
    }

    return symptoms || t('followups.details.noSymptoms');
  };

  const renderDate = (date) => {
    if (!date) return null;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStatus = (status) => {
    if (status === 'confirmed') return t('followups.status.confirmed');
    if (status === 'done') return t('followups.status.completed');
    if (status === 'cancelled' || status === 'canceled') return t('followups.status.cancelled');

    return status || t('followups.status.pending');
  };

  const renderPrescription = (prescription) => {
    if (!prescription) return t('followups.details.noPrescription');

    if (typeof prescription === 'string') {
      return prescription;
    }

    if (Array.isArray(prescription)) {
      return prescription.length > 0
        ? prescription.map((item) => item.name || item).join(', ')
        : t('followups.details.noPrescription');
    }

    if (prescription.medications && Array.isArray(prescription.medications)) {
      return prescription.medications.length > 0
        ? prescription.medications
            .map((med) => {
              const name = med.name || t('followups.details.medicationFallback');
              const dosage = med.dose ? ` - ${med.dose}` : '';
              const frequency = med.frequency ? ` (${med.frequency})` : '';

              return `${name}${dosage}${frequency}`;
            })
            .join('\n')
        : t('followups.details.noPrescription');
    }

    return t('followups.details.noPrescription');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f8fafc]">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!followUp) {
    return (
      <div className="text-center py-20 bg-[#f8fafc] h-screen flex flex-col justify-center items-center p-4">
        <p className="text-slate-500 font-medium text-sm capitalize">
          {error || t('followups.details.notFound')}
        </p>

        <Link
          to="/followups"
          className="text-blue-500 font-bold mt-2 underline text-xs capitalize"
        >
          {t('followups.details.back')}
        </Link>
      </div>
    );
  }

  const consultation = getConsultation();

  return (
    <div className="min-h-screen bg-[#f8fafc] antialiased text-slate-800 pt-6 sm:pt-10 pb-20 font-sans tracking-tight w-full box-border">
      <style>{`
        @keyframes customFetchReveal {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.99);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes rowStaggerReveal {
          from {
            opacity: 0;
            transform: translateX(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-premium-box {
          animation: customFetchReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-premium-header {
          animation: customFetchReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .stagger-row {
          opacity: 0;
          animation: rowStaggerReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .stagger-1 { animation-delay: 0.08s; }
        .stagger-2 { animation-delay: 0.14s; }
        .stagger-3 { animation-delay: 0.20s; }
        .stagger-4 { animation-delay: 0.26s; }
        .stagger-5 { animation-delay: 0.32s; }
        .stagger-6 { animation-delay: 0.38s; }
        .stagger-7 { animation-delay: 0.44s; }
        .stagger-8 { animation-delay: 0.50s; }
        .stagger-9 { animation-delay: 0.56s; }
      `}</style>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-200/50 gap-4 animate-premium-header">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight capitalize">
              {t('followups.details.title')}
            </h2>

            <p className="text-slate-400 text-xs mt-0.5 font-medium capitalize">
              {t('followups.details.subtitle')}
            </p>
          </div>

          <Link
            to="/followups"
            className="group inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500 bg-white px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm transition-all duration-200 hover:bg-blue-50/80 active:scale-[0.98] capitalize w-full sm:w-auto"
          >
            <svg
              className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>

            {t('followups.details.back')}
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-500 p-5 sm:p-8 shadow-md hover:shadow-xl hover:shadow-blue-500/[0.02] transition-shadow duration-300 animate-premium-box space-y-5">
          <div className="stagger-row stagger-1 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('consultations.patient')}
            </span>

            <div className="sm:col-span-2 text-sm font-extrabold text-slate-900 break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {getPatientName(followUp.patientId)}
            </div>
          </div>

          <div className="stagger-row stagger-2 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.status')}
            </span>

            <div className="sm:col-span-2 text-sm font-bold break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ${
                  followUp.status === 'confirmed' || followUp.status === 'done'
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}
              >
                {renderStatus(followUp.status)}
              </span>
            </div>
          </div>

          <div className="stagger-row stagger-3 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.scheduledDate')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-800 font-bold">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>

              {renderDate(followUp.scheduledDate) || (
                <span className="text-slate-400 font-medium">
                  {t('followups.details.noScheduledDate')}
                </span>
              )}
            </div>
          </div>

          <div className="stagger-row stagger-4 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.instructions')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {followUp.instructions || t('followups.details.noInstructions')}
            </div>
          </div>

          <div className="stagger-row stagger-5 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.symptoms')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-700 font-medium break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {renderSymptoms(consultation?.symptoms)}
            </div>
          </div>

          <div className="stagger-row stagger-6 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.doctorNotes')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {consultation?.rawInput || t('followups.details.noNotes')}
            </div>
          </div>

          {/* رؤية إيجنت التشخيص التفريقي (Differential Diagnosis Agent) -
              بتتعرض منظمة لو القطع الخام موجودة، وإلا بترجع لـ structuredNote
              كنص واحد للكونسلتيشنز القديمة */}
          {(consultation?.clinicalReading ||
            consultation?.possibleDiagnoses?.length > 0 ||
            consultation?.suggestedSpecialist ||
            consultation?.structuredNote) && (
            <div className="stagger-row stagger-7 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
              <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
                🤖 {t('consultations.aiClinicalNote')}
              </span>

              <div className="sm:col-span-2 text-sm text-slate-700 font-medium leading-relaxed break-words space-y-2">
                <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                  :
                </span>

                <DifferentialDiagnosisPanel
                  clinicalReading={consultation?.clinicalReading}
                  diagnoses={consultation?.possibleDiagnoses}
                  structuredNoteFallback={consultation?.structuredNote}
                />

                {consultation?.suggestedSpecialist && (
                  <p>
                    <span className="font-bold text-slate-500 text-xs uppercase me-1">
                      {t('consultations.specialist')}:
                    </span>
                    {consultation.suggestedSpecialist}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="stagger-row stagger-8 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.diagnosis')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-900 font-bold break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {consultation?.diagnosis || t('followups.details.pendingDiagnosis')}
            </div>
          </div>

          <div className="stagger-row stagger-9 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 pt-1 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">
              {t('followups.details.prescription')}
            </span>

            <div className="sm:col-span-2 text-sm text-slate-800 font-semibold whitespace-pre-line leading-relaxed break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">
                :
              </span>
              {renderPrescription(prescription)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowUpDetails;