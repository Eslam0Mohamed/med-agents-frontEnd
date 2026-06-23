import { useEffect, useMemo, useState } from 'react';
import { getPatientHistory } from '../api/patient';
import { getFollowUps } from '../api/followup';
import { getConsultations } from '../api/consultation';
import { getEntityId } from '../utils/patientUtils';

const normalizeHistoryResponse = (response) => {
  const payload = response?.data ?? response;
  if (payload?.patient) return payload;
  return null;
};

export function usePatientReport(patientId) {
  const [history, setHistory] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyRes, followUpsRes, consultationsRes] = await Promise.all([
          getPatientHistory(patientId),
          getFollowUps(),
          getConsultations(),
        ]);

        if (cancelled) return;

        const historyData = normalizeHistoryResponse(historyRes);
        if (!historyData?.patient) {
          throw new Error('Patient report data not found');
        }

        const allFollowUps = followUpsRes?.data || [];
        const allConsultations = consultationsRes?.data || [];

        setHistory(historyData);
        setFollowUps(
          allFollowUps.filter((item) => getEntityId(item.patientId) === patientId)
        );
        setConsultations(
          allConsultations.filter((item) => getEntityId(item.patientId) === patientId)
        );
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err.message || 'Failed to load patient report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadReport();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const report = useMemo(() => {
    if (!history) return null;

    const { patient, history: consultationHistory = [] } = history;

    const sortedConsultations = [...consultationHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const diagnoses = sortedConsultations
      .filter((item) => item.diagnosis)
      .map((item) => ({
        diagnosis: item.diagnosis,
        date: item.date,
        consultationId: item.consultationId,
        urgencyLevel: item.urgencyLevel,
      }));

    const prescriptions = sortedConsultations
      .filter((item) => item.prescription?.medications?.length)
      .flatMap((item) =>
        item.prescription.medications.map((med) => ({
          ...med,
          consultationDate: item.date,
          consultationId: item.consultationId,
          interactions: item.prescription.interactions || [],
          warnings: item.prescription.warnings || [],
        }))
      );

    const urgencyCounts = sortedConsultations.reduce((acc, item) => {
      const key = (item.urgencyLevel || 'unknown').toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const symptomCounts = sortedConsultations.reduce((acc, item) => {
      (item.symptoms || []).forEach((symptom) => {
        acc[symptom] = (acc[symptom] || 0) + 1;
      });
      return acc;
    }, {});

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    const consultationsByMonth = sortedConsultations.reduce((acc, item) => {
      const monthKey = new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    const monthChartData = Object.entries(consultationsByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);

    const activeFollowUps = followUps.filter((item) => item.status !== 'done');
    const highUrgencyCount = sortedConsultations.filter((item) => {
      const level = item.urgencyLevel?.toLowerCase();
      return level === 'high' || level === 'critical';
    }).length;

    const uniqueDiagnoses = [...new Set(diagnoses.map((d) => d.diagnosis))];

    const timeline = [
      ...sortedConsultations.map((item) => ({
        id: `consultation-${item.consultationId}`,
        type: 'consultation',
        date: item.date,
        title: item.diagnosis || 'Consultation',
        subtitle: (item.symptoms || []).join(', '),
        urgencyLevel: item.urgencyLevel,
        meta: item.suggestedSpecialist,
      })),
      ...followUps.map((item) => ({
        id: `followup-${getEntityId(item)}`,
        type: 'followup',
        date: item.scheduledDate,
        title: item.status === 'done' ? 'Follow-up completed' : 'Follow-up scheduled',
        subtitle: item.instructions || 'No instructions',
        status: item.status,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const latestConsultation = sortedConsultations[0] || null;

    return {
      patient,
      consultations: sortedConsultations,
      recentConsultations: sortedConsultations.slice(0, 5),
      diagnoses,
      uniqueDiagnoses,
      prescriptions,
      followUps,
      activeFollowUps,
      stats: {
        totalConsultations: sortedConsultations.length,
        activeFollowUps: activeFollowUps.length,
        highUrgencyCount,
        prescriptionsIssued: prescriptions.length,
        uniqueDiagnosisCount: uniqueDiagnoses.length,
        chronicConditionsCount: patient.chronicConditions?.length || 0,
        allergiesCount: patient.allergies?.length || 0,
      },
      charts: {
        urgencyCounts,
        topSymptoms,
        monthChartData,
      },
      timeline,
      latestConsultation,
      enrichedConsultations: consultations,
    };
  }, [history, followUps, consultations]);

  return { report, loading, error };
}
