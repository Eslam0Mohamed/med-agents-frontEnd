import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { consultationSchema } from '../../schemas/consultation';
import { getPatients } from '../../api/patient';
import {
  createConsultation,
  getConsultationById,
  updateConsultation,
} from '../../api/consultation';

const ConsultationForm = () => {
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      language: 'en',
    },
  });

  const loadConsultation = useCallback(
    async (patientsList) => {
      try {
        const res = await getConsultationById(id);
        const data = res.data;

        const patient = patientsList.find((p) => p._id === data.patientId);

        setValue('patientId', data.patientId);
        setSelectedPatientId(data.patientId);
        setPatientSearch(patient?.name || '');
        setValue('rawInput', data.rawInput);
        setValue(
          'symptoms',
          Array.isArray(data.symptoms) ? data.symptoms.join(', ') : data.symptoms
        );
        setValue('diagnosis', data.diagnosis || '');
        setValue('language', data.language || 'en');
        setValue(
          'followUpDate',
          data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : ''
        );
      } catch (err) {
        console.error('Failed to load consultation', err);
      }
    },
    [id, setValue]
  );

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await getPatients();
        const list = res.data || res;
        setPatients(list);

        if (isEditMode) {
          loadConsultation(list);
        }

        if (patientId) {
          const patient = list.find((p) => p._id === patientId);
          if (patient) {
            setSelectedPatientId(patient._id);
            setPatientSearch(patient.name);
            setValue('patientId', patient._id);
            setShowDropdown(false);
          }
        }
      } catch (err) {
        console.error('Failed to load patients', err);
      }
    };

    loadPatients();
  }, [isEditMode, patientId, loadConsultation, setValue]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setPatientSearch(patient.name);
    setSelectedPatientId(patient._id);
    setValue('patientId', patient._id);
    setShowDropdown(false);
  };

  //  Get AI Recommendation
  const handleGetAIRecommendation = async () => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const formValues = watch();

    if (!selectedPatientId) {
      Swal.fire('Missing Patient', 'Please select a patient first', 'warning');
      return;
    }
    if (!formValues.rawInput || formValues.rawInput.trim().length < 10) {
      Swal.fire('Missing Notes', "Doctor's Notes must be at least 10 characters", 'warning');
      return;
    }
    if (!formValues.symptoms || !formValues.symptoms.trim()) {
      Swal.fire('Missing Symptoms', 'Please enter symptoms', 'warning');
      return;
    }

    setIsGenerating(true);
    setAiResult(null);

    const payload = {
      patientId: selectedPatientId,
      rawInput: formValues.rawInput,
      diagnosis: formValues.diagnosis || '',
      language: formValues.language || 'en',
      symptoms: formValues.symptoms
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      followUpDate: formValues.followUpDate || undefined,
    };

    try {
      const res = await createConsultation(payload);
      setAiResult(res.data);
      setIsSaved(true);
    } catch {
      Swal.fire('Error', 'Failed to get AI recommendation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (formData) => {
    
    if (isSaved && !isEditMode) {
      navigate('/consultations');
      return;
    }

    setIsLoading(true);

    const payload = {
      patientId: formData.patientId,
      rawInput: formData.rawInput,
      diagnosis: formData.diagnosis,
      language: formData.language,
      symptoms: formData.symptoms
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      followUpDate: formData.followUpDate || undefined,
    };

    try {
      if (isEditMode) {
        await updateConsultation(id, payload);
      } else {
        await createConsultation(payload);
      }
      navigate('/consultations');
    } catch {
      Swal.fire('Error', 'Failed to save consultation', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 6);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const getUrgencyColor = (level) => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {isEditMode ? 'Edit Consultation' : 'New Consultation'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
            Document patient encounter and receive real-time clinical decision support.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Patient */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient
                </label>

                <input
                  type="text"
                  value={patientSearch}
                  disabled={!!patientId}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatientId('');
                    setShowDropdown(true);
                  }}
                  onFocus={() => !patientId && setShowDropdown(true)}
                  placeholder="Type patient name..."
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    patientId ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />

                <input type="hidden" {...register('patientId')} value={selectedPatientId} />

                {!patientId && showDropdown && filteredPatients.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                    {filteredPatients.map((p) => (
                      <li
                        key={p._id}
                        onClick={() => handlePatientSelect(p)}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                      >
                        {p.name}
                      </li>
                    ))}
                  </ul>
                )}

                {errors.patientId && (
                  <p className="text-red-500 text-xs mt-1">{errors.patientId.message}</p>
                )}
              </div>

              {/* Doctor's Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
                <textarea
                  {...register('rawInput')}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.rawInput && (
                  <p className="text-red-500 text-xs mt-1">{errors.rawInput.message}</p>
                )}
              </div>

              {/* Symptoms */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms (comma separated)
                </label>
                <input
                  type="text"
                  {...register('symptoms')}
                  placeholder="headache, fever, cough"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.symptoms && (
                  <p className="text-red-500 text-xs mt-1">{errors.symptoms.message}</p>
                )}
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis (optional)
                </label>
                <input
                  type="text"
                  {...register('diagnosis')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  {...register('language')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              {/* Follow-up Date */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date (optional)
                </label>
                <input
                  type="date"
                  {...register('followUpDate')}
                  min={minDate}
                  max={maxDate}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.followUpDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.followUpDate.message}</p>
                )}
              </div>

            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t">
              <button
                type="button"
                onClick={handleGetAIRecommendation}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                🤖 {isGenerating ? 'Analyzing...' : 'Get AI Recommendation'} →
              </button>

              <div className="flex gap-3 ms-auto">
                <Link
                  to="/consultations"
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-md font-medium text-sm disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Save Record'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">

          {/* Clinical Insights Card */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-100">
              <span className="font-semibold text-blue-800 text-sm flex items-center gap-1.5">
                ⚡ Clinical Insights
              </span>
              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                BETA
              </span>
            </div>

            <div className="p-5">
              {!aiResult && !isGenerating && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    🧠
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">Agent Ready</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Fill out the consultation form to receive automated diagnosis
                    suggestions and drug safety warnings.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse text-2xl">
                    🧠
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">Analyzing...</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    The AI agent is reviewing the clinical data.
                  </p>
                </div>
              )}

              {aiResult && !isGenerating && (
                <div className="space-y-3">
                  <div className={`border rounded-lg p-3 ${getUrgencyColor(aiResult.urgencyLevel)}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                      Urgency Level
                    </p>
                    <p className="text-sm font-bold capitalize">{aiResult.urgencyLevel}</p>
                  </div>

                  {aiResult.suggestedSpecialist && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Suggested Specialist
                      </p>
                      <p className="text-sm text-gray-800">{aiResult.suggestedSpecialist}</p>
                    </div>
                  )}

                  {aiResult.structuredNote && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Structured Note
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {aiResult.structuredNote}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationForm;