import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { patientSchema } from '../../schemas/patientSchema';
import {
  createPatient,
  updatePatient,
  fetchPatientById,
} from '../../api/patient';
import {clearSelectedPatient} from "../../slices/patientsSlice"
export default function PatientForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedPatient, isSubmitting } = useSelector((state) => state.patients);

  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: '',
      nationalID: '',
      dateOfBirth: '',
      gender: '',
      bloodType: '',
      allergies: [],
      chronicConditions: [],
    },
  });

  const allergies = watch('allergies');
  const chronicConditions = watch('chronicConditions');

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchPatientById(id));
    }
    return () => dispatch(clearSelectedPatient());
  }, [id, isEditMode, dispatch]);

  useEffect(() => {
    if (isEditMode && selectedPatient) {
      reset({
        ...selectedPatient,
        dateOfBirth: selectedPatient.dateOfBirth?.split('T')[0] || '',
      });
    }
  }, [selectedPatient, isEditMode, reset]);

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val) {
      setValue('allergies', [...allergies, val]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index) => {
    setValue('allergies', allergies.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    const val = conditionInput.trim();
    if (val) {
      setValue('chronicConditions', [...chronicConditions, val]);
      setConditionInput('');
    }
  };

  const removeCondition = (index) => {
    setValue('chronicConditions', chronicConditions.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setServerError('');
    try {
      if (isEditMode) {
        await dispatch(updatePatient({ id, patientData: data })).unwrap();
      } else {
        await dispatch(createPatient(data)).unwrap();
      }
      navigate('/patients');
    } catch (err) {
      setServerError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900">Patient Information</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Manage demographics and medical history for new or existing patients.
        </p>

        {serverError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                {...register('name')}
                placeholder="e.g. Sarah Jenkins"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.name ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
              <input
                {...register('nationalID')}
                placeholder="14 digit number"
                maxLength={14}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.nationalID ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.nationalID && (
                <p className="text-red-500 text-xs mt-1">{errors.nationalID.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.dateOfBirth ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                {...register('gender')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.gender ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select
                {...register('bloodType')}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 ${
                  errors.bloodType ? 'border-red-400' : 'border-gray-300'
                }`}
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
              {errors.bloodType && (
                <p className="text-red-500 text-xs mt-1">{errors.bloodType.message}</p>
              )}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5">
              {allergies.map((a, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {a}
                  <button type="button" onClick={() => removeAllergy(i)} className="font-bold">×</button>
                </span>
              ))}
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                placeholder="Add allergy..."
                className="flex-1 min-w-30 outline-none text-sm"
              />
            </div>
          </div>

          {/* Chronic Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
            <div className="flex flex-wrap items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5">
              {chronicConditions.map((c, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                >
                  {c}
                  <button type="button" onClick={() => removeCondition(i)} className="font-bold">×</button>
                </span>
              ))}
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                placeholder="Add condition..."
                className="flex-1 min-w-30 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:bg-gray-400 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Patient Record'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4 flex gap-3">
        <span className="text-blue-500">ℹ️</span>
        <div>
          <p className="text-sm font-medium text-gray-900">Privacy Compliance</p>
          <p className="text-sm text-gray-600 mt-0.5">
            All data entered here is encrypted and stored in compliance with local healthcare
            regulations. This record will be accessible to authorized medical personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
