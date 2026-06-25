import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  createFollowUp,
  getFollowUpById,
  updateFollowUp,
} from '../../api/followup';
import { createConsultation } from '../../api/consultation';

const initialForm = {
  rawInput: '',
  symptoms: '',
  diagnosis: '',
  language: 'en',
  followUpDate: '',
};

const StartFollowUp = () => {
  const { followupId } = useParams();
  const navigate = useNavigate();

  const [followUp, setFollowUp] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.id || '';
  };

  const formatDate = (date) => {
    if (!date) return 'No date';

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const loadFollowUp = async () => {
    try {
      setLoading(true);

      const res = await getFollowUpById(followupId);
      const data = res?.data;

      setFollowUp(data);
      setForm((prev) => ({
        ...prev,
        language: data?.language || 'en',
      }));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to load follow-up details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUp();
  }, [followupId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPatientName = () => {
    return followUp?.patientId?.name || 'Unknown Patient';
  };

  const getPatientId = () => {
    return getId(followUp?.patientId);
  };

  const getPreviousConsultation = () => {
    return followUp?.consultationId || null;
  };

  const getPreviousSymptoms = () => {
    const consultation = getPreviousConsultation();

    if (!consultation?.symptoms) return 'No symptoms recorded';

    if (Array.isArray(consultation.symptoms)) {
      return consultation.symptoms.join(', ');
    }

    return consultation.symptoms;
  };

  const getPreviousNotes = () => {
    const consultation = getPreviousConsultation();

    return consultation?.rawInput || 'No previous notes recorded';
  };

  const getPreviousDiagnosis = () => {
    const consultation = getPreviousConsultation();

    return consultation?.diagnosis || 'No diagnosis recorded';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.rawInput || !form.symptoms || !form.diagnosis) {
      Swal.fire(
        'Missing data',
        'Doctor notes, symptoms, and diagnosis are required.',
        'warning'
      );
      return;
    }

    const patientId = getPatientId();

    if (!patientId) {
      Swal.fire('Error', 'Patient data is missing from this follow-up.', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const consultationPayload = {
        patientId,
        rawInput: form.rawInput.trim(),
        diagnosis: form.diagnosis.trim(),
        language: form.language,
        symptoms: form.symptoms
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        followUpDate: form.followUpDate || undefined,

        // دول لو الباك عندكم بيدعمهم هيبقوا مفيدين للـ history label
        visitType: 'followup',
        sourceFollowupId: followupId,
        parentConsultationId: getId(followUp?.consultationId),
      };

      const consultationRes = await createConsultation(consultationPayload);
      const newConsultation = consultationRes?.data;

      await updateFollowUp(followupId, {
        status: 'done',
      });

      if (form.followUpDate && newConsultation?._id) {
        await createFollowUp({
          consultationId: newConsultation._id,
          patientId,
          instructions: `Follow-up after ${form.diagnosis}`,
          scheduledDate: form.followUpDate,
          status: 'pending',
          language: form.language,
        });
      }

      Swal.fire({
        title: 'Follow-up completed',
        text: 'The follow-up session was saved successfully.',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
      });

      navigate('/followups');
    } catch (error) {
      console.error(error);
      Swal.fire(
        'Error',
        error?.response?.data?.message || 'Failed to save follow-up session',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500">Loading follow-up session...</p>
      </div>
    );
  }

  if (!followUp) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-gray-500">Follow-up not found.</p>
        <Link to="/followups" className="text-blue-700 font-semibold">
          Back to Follow-ups
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6 sm:p-8">
          <h2 className="text-xl font-bold text-blue-700 mb-1">
            Start Follow-up
          </h2>

          <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
            Complete a follow-up visit based on the previous consultation.
          </p>

          <div className="mb-6 p-5 bg-blue-50 border border-blue-100 rounded-xl">
            <h3 className="font-bold text-blue-800 mb-3">
              Past instructions from last consultation
            </h3>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Patient:</strong> {getPatientName()}
              </p>

              <p>
                <strong>Scheduled Follow-up:</strong>{' '}
                {formatDate(followUp.scheduledDate)}
              </p>

              <p>
                <strong>Previous Instructions:</strong>{' '}
                {followUp.instructions || 'No instructions recorded'}
              </p>

              <p>
                <strong>Previous Diagnosis:</strong> {getPreviousDiagnosis()}
              </p>

              <p>
                <strong>Previous Symptoms:</strong> {getPreviousSymptoms()}
              </p>

              <p>
                <strong>Previous Notes:</strong> {getPreviousNotes()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Patient
                </label>
                <input
                  type="text"
                  value={getPatientName()}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Follow-up Doctor Notes
                </label>
                <textarea
                  name="rawInput"
                  rows={4}
                  value={form.rawInput}
                  onChange={handleChange}
                  placeholder="Write what happened during this follow-up visit..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Symptoms / Current Findings
                </label>
                <input
                  type="text"
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  placeholder="blood pressure improved, headache reduced"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Diagnosis / Follow-up Result
                </label>
                <input
                  type="text"
                  name="diagnosis"
                  value={form.diagnosis}
                  onChange={handleChange}
                  placeholder="Follow-up assessment..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Language
                </label>
                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Next Follow-up Date, if needed
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={form.followUpDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t">
              <Link
                to="/followups"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-medium text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Complete Follow-up'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
              <span className="font-semibold text-blue-800 text-sm">
                Follow-up Status
              </span>
            </div>

            <div className="p-5 space-y-3 text-sm text-gray-700">
              <p>
                This form will save a new follow-up consultation record.
              </p>

              <p>
                After saving, the original follow-up will move to Completed.
              </p>

              {form.followUpDate && (
                <p>
                  A new pending follow-up will be scheduled for{' '}
                  {formatDate(form.followUpDate)}.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartFollowUp;