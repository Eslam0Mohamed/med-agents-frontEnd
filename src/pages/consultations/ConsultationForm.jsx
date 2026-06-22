import { useState, useEffect } from 'react';
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


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      language: 'en',
    },
  });

  useEffect(() => {
    
     const loadPatients = async () => {
  try {
    const res = await getPatients();
    const list = res.data || res;

    setPatients(list);

    // Edit mode
    if (isEditMode) {
      loadConsultation(list);
    }

    // Coming from Patient History
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
  } ) ;

  const loadConsultation = async (patientsList) => {
    try {
      const res = await getConsultationById(id);
      const data = res.data;

      const patient = patientsList.find((p) => p._id === data.patientId);

      setValue('patientId', data.patientId);
      setSelectedPatientId(data.patientId);
      setPatientSearch(patient?.name || '');
      setValue('rawInput', data.rawInput);
      setValue('symptoms', Array.isArray(data.symptoms) ? data.symptoms.join(', ') : data.symptoms);
      setValue('diagnosis', data.diagnosis || '');
      setValue('language', data.language || 'en');
      setValue(
        'followUpDate',
        data.followUpDate ? new Date(data.followUpDate).toISOString().split('T')[0] : ''
      );
    } catch (err) {
      console.error('Failed to load consultation', err);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handlePatientSelect = (patient) => {
    setPatientSearch(patient.name);
    setSelectedPatientId(patient._id);
    setValue('patientId', patient._id);
    setShowDropdown(false);
  };

  const onSubmit = async (formData) => {
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
    } catch  {
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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow p-6 sm:p-8">

        <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b">
          {isEditMode ? 'Edit Consultation' : 'New Consultation'}
        </h2>

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

  <input
    type="hidden"
    {...register('patientId')}
    value={selectedPatientId}
  />

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
    <p className="text-red-500 text-xs mt-1">
      {errors.patientId.message}
    </p>
  )}
</div>l className="absolute z-10 w-full bg-wh




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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Link
              to="/consultations"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );


export default ConsultationForm;