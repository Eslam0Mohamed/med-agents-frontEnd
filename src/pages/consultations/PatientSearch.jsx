import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAllPatients } from "../../api/patient";

const PatientSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [allPatients, setAllPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // زي صفحة الفولو أب بالظبط: نجيب القايمة كلها مرة واحدة أول ما الصفحة
  // تفتح، وبعدين الفلترة بتتم في المتصفح نفسه (useMemo) من غير أي نداء
  // تاني للباك مع كل حرف بيتكتب — يبقى أسرع ومفيش أي تأخير/debounce
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getAllPatients({});
        setAllPatients(res.data || []);
      } catch (err) {
        console.error("Failed to load patients", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const patients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return allPatients.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.nationalID?.toLowerCase().includes(query),
    );
  }, [allPatients, search]);

  const handleSelectPatient = (patient) => {
    navigate(`/consultations/patient/${patient._id}/history`);
  };

  const calculateAge = (dob) => {
    if (!dob) return "—";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      {/* Banner: نفس الستايل بتاع ConsultationList.jsx / PatientsList.jsx
          (خلفية متدرجة زرقاء + زرار رجوع + عنوان) عشان الصفحة تبقى متسقة
          مع باقي صفحات الموقع */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-8 px-4 sm:px-6 shadow-lg rounded-3xl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mb-4 border border-white/10 backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {t("common.back")}
          </button>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            {t("consultations.searchPatient")}{" "}
            <span className="w-2 h-2 rounded-full bg-blue-300"></span>
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
            {t("consultations.searchSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-2xl shadow p-5 sm:p-6">
          <div className="mb-6 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("consultations.searchPatientPlaceholder")}
              className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-base bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all duration-200"
            />
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">
                {t("consultations.searchingPatients")}
              </p>
            </div>
          )}

          {!loading && !search.trim() && (
            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                <svg
                  className="w-7 h-7 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-bold text-lg">
                {t("consultations.searchPatientPlaceholder")}
              </p>
            </div>
          )}

          {!loading && search.trim() && patients.length === 0 && (
            <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                <svg
                  className="w-7 h-7 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-600 font-bold text-lg">
                {t("consultations.noPatientsFound")}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {t("consultations.noPatientsHint")}
              </p>
            </div>
          )}

          {!loading && search.trim() && patients.length > 0 && (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {patients.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelectPatient(p)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex w-12 h-12 bg-blue-50 text-blue-600 font-bold rounded-xl items-center justify-center text-lg shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-sm">
                      {p.name ? p.name.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 text-base">
                        {p.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs mt-2 font-medium">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/40">
                          ID: {p.nationalID}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/40">
                          {t("consultations.yrs") !== "Yrs"
                            ? `${calculateAge(p.dateOfBirth)} ${t("consultations.yrs")}`
                            : `Age: ${calculateAge(p.dateOfBirth)} Yrs`}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-lg border uppercase ${p.gender?.toLowerCase() === "male" ? "bg-blue-50/60 text-blue-600 border-blue-100" : "bg-rose-50/60 text-rose-600 border-rose-100"}`}
                        >
                          {p.gender?.toLowerCase() === "male"
                            ? t("patients.male")
                            : p.gender?.toLowerCase() === "female"
                              ? t("patients.female")
                              : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50/80 border border-blue-100/50 px-3 py-2 rounded-xl group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-200 self-start sm:self-center shadow-sm">
                    {t("consultations.viewHistory")}
                    <svg
                      className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSearch;
