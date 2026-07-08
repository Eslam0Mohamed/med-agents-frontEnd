import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { fetchPatientHistory } from "../../api/patient";
import { clearHistory } from "../../slices/patientsSlice";
import LoadingState from "../../components/patient-report/LoadingState";
const urgencyStyles = {
  low: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-100 text-red-700",
};

export default function PatientHistory() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { history, isHistoryLoading, error } = useSelector(
    (state) => state.patients,
  );

  useEffect(() => {
    dispatch(fetchPatientHistory(id));
    return () => dispatch(clearHistory());
  }, [id, dispatch]);

  const calculateAge = (dob) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (isHistoryLoading) {
    return (
 <LoadingState></LoadingState>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!history) return null;

  const { patient, history: consultations } = history;

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/patients")}
        className="text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        ← {t("patients.backToPatients")}
      </button>

      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row gap-8 md:gap-0 items-start justify-between mb-6">
        <div className="flex items-start flex-col sm:flex-row gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
            {initials(patient.name)}
          </div>
          <div>
            <div className="flex items-start sm:items-center  sm:flex-row gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                <bdi>{patient.name}</bdi>
              </h1>
            <div className="flex items-center flex-wrap gap-2">
              <span className=" text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium uppercase">
                <bdi>
                  {patient.gender === "male"
                    ? t("patients.male")
                    : t("patients.female")}
                </bdi>
              </span>
              <span className=" text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                {t("patients.age")}: <bdi>{calculateAge(patient.dateOfBirth)}</bdi>
              </span>
              <span className=" text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                <bdi>{patient.bloodType}</bdi>
              </span>
            </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  {t("patients.allergies")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies?.length > 0 ? (
                    patient.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium"
                      >
                        ⚠ {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t("patients.none")}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  {t("patients.chronicConditions")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.chronicConditions?.length > 0 ? (
                    patient.chronicConditions.map((c, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t("patients.none")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => navigate(`/patients/report/${patient._id}`)}
            className="flex items-center gap-2 w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            📊 {t("patients.viewReport")}
          </button>
          <button
            onClick={() => navigate(`/consultations/add/${patient._id}`)}
            className="flex items-center gap-2 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + {t("patients.newConsultation")}
          </button>
          <button
            onClick={() => navigate(`/patients/edit/${patient._id}`)}
            className="flex items-center gap-2 w-full sm:w-auto bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-900"
          >
            ✏️ {t("patients.editPatient")}
          </button>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {t("patients.consultationHistory")} ({consultations.length})
      </h2>

      {consultations.length === 0 && (
        <div className="text-center text-gray-400 py-10 bg-white rounded-xl shadow-sm">
          {t("patients.noConsultations")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {consultations.map((item) => (
          <div
            key={item.consultationId}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(item.date).toLocaleString()}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                    item.isFollowup
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.isFollowup
                    ? t("consultations.followUpVisit")
                    : t("consultations.consultation")}
                </span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${urgencyStyles[item.urgencyLevel?.toLowerCase()] || "bg-gray-100 text-gray-700"}`}
              >
                {t(`consultations.urgency.${item.urgencyLevel?.toLowerCase()}`, item.urgencyLevel)}
              </span>
            </div>

            {item.doctorNotes && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                  {t("consultations.doctorNotes")}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {item.doctorNotes}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                {t("consultations.symptomsColumn")}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {item.symptoms.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  {t("consultations.diagnosis")}
                </p>
                <p className="text-sm text-gray-900">{item.diagnosis || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase">
                  {t("consultations.followUpDate")}
                </p>
                <p className="text-sm text-gray-900">
                  {item.followUpDate
                    ? new Date(item.followUpDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              {item.suggestedSpecialist && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    {t("consultations.specialist")}
                  </p>
                  <p className="text-sm text-gray-900">
                    {item.suggestedSpecialist}
                  </p>
                </div>
              )}
            </div>

            {item.structuredNote && (
              <div className="bg-blue-50 border-s-4 border-blue-400 rounded-e-lg p-3 mb-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  🤖 {t("consultations.aiClinicalNote")}
                </p>
                <p className="text-sm text-gray-700">{item.structuredNote}</p>
              </div>
            )}

            {item.prescription && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  {t("consultations.prescription")}
                </p>
                <div className="flex flex-col gap-1.5">
                  {item.prescription.medications.map((med, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-gray-900">
                        {med.name}
                      </span>
                      {med.dose && (
                        <span className="text-gray-500"> — {med.dose}</span>
                      )}
                      {med.frequency && (
                        <span className="text-gray-500">
                          {" "}
                          ({med.frequency})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}