import { calculateAge, getInitials } from '../../utils/patientUtils';

export default function PatientInfoHeader({ patient, doctorName, onBack, onNewConsultation, onEdit }) {
  const age = calculateAge(patient.dateOfBirth);
  const initials = getInitials(patient.name);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium uppercase">
                {patient.gender}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                Age {age}
              </span>
              {patient.bloodType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {patient.bloodType}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Patient Health Report</p>
            {doctorName && (
              <p className="text-xs text-gray-400 mt-1">Attending Physician: Dr. {doctorName}</p>
            )}
            <p className="text-xs text-gray-400">
              Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              ← Back
            </button>
          )}
          {onNewConsultation && (
            <button
              onClick={onNewConsultation}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              + New Consultation
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-800 text-white hover:bg-blue-900"
            >
              Edit Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Allergies</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies?.length > 0 ? (
              patient.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium"
                >
                  {allergy}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">None recorded</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Chronic Conditions</p>
          <div className="flex flex-wrap gap-1.5">
            {patient.chronicConditions?.length > 0 ? (
              patient.chronicConditions.map((condition, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium"
                >
                  {condition}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">None recorded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
