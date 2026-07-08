import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { fetchPatients, deletePatient } from "../../api/patient";
import LoadingState from "../../components/patient-report/LoadingState";
export default function PatientsList() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, isLoading } = useSelector((state) => state.patients);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // زي صفحة الفولو أب: بنجيب المرضى كلهم مرة واحدة بس (من غير search
  // parameter)، وبعدين الفلترة والـ pagination بيتعملوا في المتصفح على
  // طول، من غير أي نداء تاني للباك مع كل حرف بيتكتب
  useEffect(() => {
    dispatch(fetchPatients({ search: "", page: 1, limit: 1000 }));
  }, [dispatch]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return list || [];
    return (list || []).filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.nationalID?.toLowerCase().includes(query),
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / limit));
  const pagedPatients = filteredPatients.slice(
    (page - 1) * limit,
    page * limit,
  );

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
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: t("common.delete") + "?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#3B5BDB",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deletePatient(id)).then(() => {
          Swal.fire(t("common.delete"), "", "success");
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-24 px-4 sm:px-6 shadow-lg rounded-3xl">
        <div className="max-w-7xl mx-auto">
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

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                {t("patients.title")}{" "}
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
                {t("patients.title")}
              </p>
            </div>
            <button
              onClick={() => navigate("/patients/add")}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
            >
              <svg
                className="w-4 h-4 stroke-[3]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t("patients.addPatient")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12">
        <div className="mb-6 relative group shadow-sm rounded-2xl">
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
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t("patients.searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border-0 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base bg-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-slate-400 font-medium text-slate-700"
          />
        </div>

        {isLoading && (
          <LoadingState></LoadingState>
          // <div className="text-center text-gray-400 py-10">{t('common.loading')}</div>
        )}

        {!isLoading && filteredPatients.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            {t("common.noData")}
          </div>
        )}

        {!isLoading && pagedPatients.length > 0 && (
          <div className="hidden md:block bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table
                dir={i18n.language === "ar" ? "rtl" : "ltr"}
                className={`w-full text-sm table-auto border-collapse ${i18n.language === "ar" ? "text-right" : "text-left"}`}
              >
                <thead className="bg-blue-600 text-white/95">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">
                      {t("common.name")}
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">
                      {t("patients.nationalId")}
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">
                      {t("patients.age")}
                    </th>
                    <th className="px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90">
                      {t("patients.gender")}
                    </th>
                    <th
                      className={`px-6 py-4 font-bold tracking-wide text-xs uppercase opacity-90 ${i18n.language === "ar" ? "text-left" : "text-right"}`}
                    >
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70">
                  {pagedPatients.map((patient) => (
                    <tr
                      key={patient._id}
                      className="hover:bg-slate-50/70 transition-all duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials(patient.name)}
                          </div>
                          <span className="font-black text-blue-600 text-base">
                            {patient.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        {patient.nationalID}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">
                        {calculateAge(patient.dateOfBirth)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border capitalize tracking-wide shadow-sm ${
                            patient.gender === "male"
                              ? "bg-blue-50 text-blue-600 border-blue-200/50"
                              : "bg-pink-50 text-pink-600 border-pink-200/50"
                          }`}
                        >
                          {patient.gender === "male"
                            ? t("patients.male")
                            : t("patients.female")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 items-center justify-end">
                          <button
                            onClick={() =>
                              navigate(`/patients/history/${patient._id}`)
                            }
                            className="inline-flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 p-2 rounded-xl transition shadow-sm"
                            title={t("common.history")}
                          >
                            🕓
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/patients/report/${patient._id}`)
                            }
                            className="inline-flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 p-2 rounded-xl transition shadow-sm"
                            title={t("common.report")}
                          >
                            📊
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/patients/edit/${patient._id}`)
                            }
                            className="inline-flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            {t("common.edit")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && pagedPatients.length > 0 && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 divide-y divide-slate-100">
            {pagedPatients.map((patient) => (
              <div
                key={patient._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(patient.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t("patients.age")}: {calculateAge(patient.dateOfBirth)} ·
                      <span
                        className={`ms-1 ${patient.gender === "male" ? "text-blue-600" : "text-pink-600"}`}
                      >
                        {patient.gender === "male"
                          ? t("patients.male")
                          : t("patients.female")}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => navigate(`/patients/history/${patient._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
                  >
                    🕓
                  </button>
                  <button
                    onClick={() => navigate(`/patients/report/${patient._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => navigate(`/patients/edit/${patient._id}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(patient._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredPatients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white rounded-2xl shadow-xl shadow-slate-100/80 border border-slate-100 px-4 py-3">
            <p className="text-xs text-gray-500 font-semibold">
              {t("common.showing")} {pagedPatients.length} {t("common.of")}{" "}
              {filteredPatients.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {t("common.previous")}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-md text-sm font-medium ${p === page ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
