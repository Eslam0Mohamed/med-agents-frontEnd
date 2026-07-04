import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { getConsultationById } from '../../api/consultation';
import { getPrescriptionByConsultation } from '../../api/prescription';

const ConsultationDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await getConsultationById(id);
        const found = res?.data || res;

        if (found) {
          setConsultation(found);

          try {
            const presRes = await getPrescriptionByConsultation(id);
            setPrescription(presRes?.data || null);
          } catch {
            setPrescription(null);
          }
        } else {
          Swal.fire(t('common.error'), t('consultations.notFound'), 'error');
        }
      } catch {
        Swal.fire(t('common.error'), t('consultations.failedLoad'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f8fafc]">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center py-20 bg-[#f8fafc] h-screen flex flex-col justify-center items-center p-4">
        <p className="text-slate-500 font-medium text-sm capitalize">{t('consultations.noRecordsFound')}</p>
        <Link to="/consultations" className="text-blue-500 font-bold mt-2 underline text-xs capitalize">{t('consultations.backToConsultations')}</Link>
      </div>
    );
  }

  const getPatientName = (patient) => {
    if (typeof patient === 'object' && patient !== null) {
      return patient.name || t('common.unknown');
    }
    return patient || t('common.unknown');
  };

  const renderSymptoms = (symptoms) => {
    if (Array.isArray(symptoms)) {
      return symptoms.length > 0 ? symptoms.join(', ') : t('consultations.noSymptoms');
    }
    return symptoms || t('consultations.noSymptoms');
  };

  const renderPrescription = () => {
    const medications = prescription?.medications;
    if (!Array.isArray(medications) || medications.length === 0) {
      return t('consultations.noPrescription');
    }

    return medications
      .map((med) => {
        const name = med.name || '';
        const dosage = med.dose ? ` - ${med.dose}` : '';
        const frequency = med.frequency ? ` (${med.frequency})` : '';
        return `${name}${dosage}${frequency}`;
      })
      .join('\n');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] antialiased text-slate-800 pt-6 sm:pt-10 pb-20 font-sans tracking-tight w-full box-border">
      
      {/* Advanced Micro-Interaction Cinema Transitions */}
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
      `}</style>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        
       
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-slate-200/50 gap-4 animate-premium-header">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-blue-600 tracking-tight capitalize">{t('consultations.detailsTitle')}</h2>
            <p className="text-slate-400 text-xs mt-0.5 font-medium capitalize">{t('consultations.detailsSubtitle')}</p>
          </div>
          <Link 
            to="/consultations" 
            className="group inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500 bg-white px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm transition-all duration-200 hover:bg-blue-50/80 active:scale-[0.98] capitalize w-full sm:w-auto"
          >
            <svg className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t('consultations.backToConsultations')}
          </Link>
        </div>

        {/* Premium Cinematic Container Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-500 p-5 sm:p-8 shadow-md hover:shadow-xl hover:shadow-blue-500/[0.02] transition-shadow duration-300 animate-premium-box space-y-5">
          
          {/* Patient Profile Identity */}
          <div className="stagger-row stagger-1 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.patient')}</span>
            <div className="sm:col-span-2 text-sm font-extrabold text-slate-900 break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {getPatientName(consultation.patientId)}
            </div>
          </div>

          {/* Doctor's Notes */}
          <div className="stagger-row stagger-2 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.doctorNotes')}</span>
            <div className="sm:col-span-2 text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {consultation.rawInput || t('consultations.noNotes')}
            </div>
          </div>

          {/* Observed Symptoms */}
          <div className="stagger-row stagger-3 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.symptomsLabel')}</span>
            <div className="sm:col-span-2 text-sm text-slate-700 font-medium break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {renderSymptoms(consultation.symptoms)}
            </div>
          </div>

          {/* Established Diagnosis */}
          <div className="stagger-row stagger-4 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.diagnosis')}</span>
            <div className="sm:col-span-2 text-sm text-slate-900 font-bold break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {consultation.diagnosis || t('consultations.pendingDiagnosis')}
            </div>
          </div>

          {/* Active Prescription Block */}
          <div className="stagger-row stagger-5 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 border-b border-blue-50/60 pb-3.5 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.prescription')}</span>
            <div className="sm:col-span-2 text-sm text-slate-800 font-semibold whitespace-pre-line leading-relaxed break-words">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {renderPrescription()}
            </div>
          </div>

          {/* Next Planned Follow-Up */}
          <div className="stagger-row stagger-6 grid grid-cols-1 sm:grid-cols-3 items-start gap-1 sm:gap-4 pt-1 px-1 rounded-xl hover:bg-slate-50/40 transition">
            <span className="text-[11px] font-bold text-blue-500 tracking-widest uppercase pt-0.5 shrink-0 capitalize">{t('consultations.followUpDate')}</span>
            <div className="sm:col-span-2 text-sm text-slate-800 font-bold">
              <span className="inline sm:hidden text-slate-400 font-normal mr-1">:</span>
              {consultation.followUpDate ? (
                new Date(consultation.followUpDate).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                })
              ) : (
                <span className="text-slate-400 font-medium">{t('consultations.noScheduledReturn')}</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ConsultationDetails;