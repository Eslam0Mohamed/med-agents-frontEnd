import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Swal from 'sweetalert2';
import { consultationSchema } from '../../schemas/consultation';
import { getAllPatients, getPatients } from '../../api/patient';
import {createConsultation,getAIRecommendation,getConsultationById,updateConsultation,
} from '../../api/consultation';
import { createFollowUp } from '../../api/followup';

const ConsultationForm = () => {
  const { id, patientId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [createdId, setCreatedId] = useState('');
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
    trigger,
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

        const patientIdValue = typeof data.patientId === 'object'
          ? data.patientId?._id
          : data.patientId;

        const patientName = typeof data.patientId === 'object'
          ? data.patientId?.name
          : patientsList.find((p) => p._id === data.patientId)?.name || '';

        setValue('patientId', patientIdValue);
        setSelectedPatientId(patientIdValue);
        setPatientSearch(patientName);
        setValue('rawInput', data.rawInput);
        setValue('symptoms',
          Array.isArray(data.symptoms) ? data.symptoms.join(', ') : data.symptoms
        );
        setValue('diagnosis', data.diagnosis || '');
        setValue('language', data.language || 'en');
        setValue('followUpDate',
          data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : ''
        );
        setAiResult(data);
      } catch (err) {
        console.error('Failed to load consultation', err);
      }
    },
    [id, setValue]
  );
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await getAllPatients();
        const list = res.data || res;
        setPatients(list);

        if (isEditMode) {
          loadConsultation(list);
        }

        if (patientId) {
  const patient = list.find(
    (p) => String(p._id) === String(patientId)
  );

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

useEffect(() => {
  if (!isEditMode && !patientId && patients.length > 0) {
    setShowDropdown(true);
  }
}, [patients, isEditMode, patientId]);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    
    setPatientSearch(patient.name);
    setSelectedPatientId(patient._id);
    setValue('patientId', patient._id, { shouldValidate: true, shouldDirty: true });
    setShowDropdown(false);
  };

  const handleGetAIRecommendation = async () => {
    const isValid = await trigger(['patientId', 'rawInput', 'symptoms']);
    if (!isValid) return;

    const formValues = watch();

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
      console.log("ai te 1");
      const res = await getAIRecommendation(payload);
      console.log(res);
      
      setAiResult(res.data);
      setCreatedId(res.data._id);
      setIsSaved(true);
      if (res.data.diagnosis) {
        setValue('diagnosis', res.data.diagnosis);
      }
    } catch(err) {
      console.log(err.response?.data);
      
      Swal.fire('Error', 'Failed to get AI recommendation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (formData) => {
    setIsLoading(true);

    const payload = {
      patientId: selectedPatientId || formData.patientId,
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
      } else if (createdId) {
        await createConsultation(payload);
        if (formData.followUpDate) {
          try {
            await createFollowUp({
              consultationId: createdId,
              patientId: formData.patientId,
              instructions: '-',
              scheduledDate: formData.followUpDate,
              language: formData.language || 'en',
            });
          } catch (followUpErr) {
            console.error('Failed to automatically create follow-up:', followUpErr);
          }
        }
      } else {
        const res = await createConsultation(payload);
        if (formData.followUpDate) {
          try {
            await createFollowUp({
              consultationId: res.data._id,
              patientId: formData.patientId,
              instructions: '-',
              scheduledDate: formData.followUpDate,
              language: formData.language || 'en',
            });
          } catch (followUpErr) {
            console.error('Failed to automatically create follow-up:', followUpErr);
          }
        }
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
          <h2 className="text-xl font-bold text-blue-700 mb-1">
            {isEditMode ? 'Edit Consultation' : 'New Consultation'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
            Document patient encounter and receive real-time clinical decision support.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Patient */}
  <div className="md:col-span-2 relative">
  <label className="block text-sm font-medium text-blue-700 mb-1">
    Patient
  </label>
  <input
    type="text"
    value={patientSearch}
    disabled={isEditMode || !!patientId}
    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
    onChange={(e) => {
      setPatientSearch(e.target.value);
      setSelectedPatientId('');
      setValue('patientId', '', { shouldValidate: true });
      setShowDropdown(true);
    }}
    onFocus={() => {
      if (!isEditMode && !patientId) setShowDropdown(true);
    }}
    placeholder="Type patient name..."
    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      (isEditMode || patientId) ? 'bg-gray-100' : ''
    }`}
  />
  <input type="hidden" {...register('patientId')} />

  {!isEditMode && patientId && showDropdown && filteredPatients.length > 0 && (
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
                <label className="block text-sm font-medium text-blue-700 mb-1">Doctor's Notes</label>
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
                <label className="block text-sm font-medium text-blue-700 mb-1">
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

              {/* Language */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-700 mb-1">Language</label>
                <select
                  {...register('language')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

            </div>

            {/* AI Recommendation Result - Separate Card for Diagnosis & Follow-up Date */}
            {(aiResult || isEditMode) && (
              <div className="mt-6 p-6 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm space-y-4">
                <h3 className="text-base font-bold text-blue-800 flex items-center gap-2">
                  <span>📋 Clinical Decision Support & Follow-up</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Please finalize the diagnosis and set a follow-up date if required.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diagnosis (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Diagnosis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('diagnosis')}
                      placeholder="Enter final diagnosis..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.diagnosis && (
                      <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>
                    )}
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      {...register('followUpDate')}
                      min={minDate}
                      max={maxDate}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.followUpDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.followUpDate.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t">
              <button
                type="button"
                onClick={handleGetAIRecommendation}
                disabled={isGenerating}
                className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md font-medium text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                🤖 {isGenerating ? 'Analyzing...' : 'Get AI Recommendation'} →
              </button>

              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <Link
                  to="/consultations"
                  className="w-1/2 sm:w-auto text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-1/2 sm:w-auto justify-center bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md font-medium text-sm disabled:opacity-50"
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
}

export default ConsultationForm;