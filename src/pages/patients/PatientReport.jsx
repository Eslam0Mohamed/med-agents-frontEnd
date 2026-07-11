import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { usePatientReport } from '../../hooks/usePatientReport';
import PatientInfoHeader from '../../components/patient-report/PatientInfoHeader';
import StatCard from '../../components/patient-report/StatCard';
import MedicalSummary from '../../components/patient-report/MedicalSummary';
import RecentConsultations from '../../components/patient-report/RecentConsultations';
import DiagnosesHistory from '../../components/patient-report/DiagnosesHistory';
import PrescriptionsList from '../../components/patient-report/PrescriptionsList';
import UrgencyChart, {
  ConsultationTrendChart,
  TopSymptomsChart,
} from '../../components/patient-report/ReportCharts';
import ActivityTimeline from '../../components/patient-report/ActivityTimeline';
import FollowUpsSection, {
  UnavailableSection,
} from '../../components/patient-report/FollowUpsSection';
import Loading from '../../components/Loading';

export default function PatientReport() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { report, loading, error } = usePatientReport(id);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto text-center py-16">
        <p className="text-red-500 font-medium mb-2">{t('patientReport.failedToLoad')}</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/patients')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          ← {t('patientReport.backToPatients')}
        </button>
      </div>
    );
  }

  if (!report) return null;

  const { patient, stats, charts } = report;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PatientInfoHeader
        patient={patient}
        doctorName={user?.name}
        onBack={() => navigate('/patients')}
        onNewConsultation={() => navigate(`/consultations/add/${patient._id}`)}
        onEdit={() => navigate(`/patients/edit/${patient._id}`)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label={t('patientReport.stats.consultations')} value={stats.totalConsultations} icon="🩺" accent="blue" />
        <StatCard label={t('patientReport.stats.activeFollowUps')} value={stats.activeFollowUps} icon="📋" accent="purple" />
        <StatCard label={t('patientReport.stats.highUrgency')} value={stats.highUrgencyCount} icon="⚠️" accent="red" />
        <StatCard label={t('patientReport.stats.prescriptions')} value={stats.prescriptionsIssued} icon="💊" accent="green" />
        <StatCard label={t('patientReport.stats.diagnoses')} value={stats.uniqueDiagnosisCount} icon="🔬" accent="amber" />
        <StatCard label={t('patientReport.stats.chronicConditions')} value={stats.chronicConditionsCount} icon="❤️" accent="gray" />
      </div>

      <MedicalSummary
        latestConsultation={report.latestConsultation}
        uniqueDiagnoses={report.uniqueDiagnoses}
        stats={stats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentConsultations consultations={report.recentConsultations} />
        </div>
        <FollowUpsSection followUps={report.followUps} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DiagnosesHistory diagnoses={report.diagnoses} />
        <PrescriptionsList prescriptions={report.prescriptions} />
      </div>

      <UnavailableSection
        title={t('patientReport.labResultsTitle')}
        description={t('patientReport.labResultsDesc')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UrgencyChart urgencyCounts={charts.urgencyCounts} />
        <ConsultationTrendChart monthChartData={charts.monthChartData} />
        <TopSymptomsChart topSymptoms={charts.topSymptoms} />
      </div>

      <ActivityTimeline timeline={report.timeline} />
    </div>
  );
}