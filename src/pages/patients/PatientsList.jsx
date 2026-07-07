import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { fetchPatients, deletePatient } from '../../api/patient';
import LoadingState from '../../components/patient-report/LoadingState';
export default function PatientsList() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, isLoading } = useSelector((state) => state.patients);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchPatients({ search, page, limit }));
  }, [dispatch, search, page]);

  const calculateAge = (dob) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const initials = (name) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: t('common.delete') + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#3B5BDB',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deletePatient(id)).then(() => {
          Swal.fire(t('common.delete'), '', 'success');
        });
      }
    });
  };

  const totalPages = pagination?.totalPages || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('patients.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('patients.title')}
          </p>
        </div>
        <button
          onClick={() => navigate('/patients/add')}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          + {t('patients.addPatient')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 my-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {isLoading && (
        <LoadingState></LoadingState>
        // <div className="text-center text-gray-400 py-10">{t('common.loading')}</div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="text-center text-gray-400 py-10">{t('common.noData')}</div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="text-start px-6 py-3 font-medium">{t('common.name')}</th>
                  <th className="text-start px-6 py-3 font-medium">{t('patients.nationalId')}</th>
                  <th className="text-start px-6 py-3 font-medium">{t('patients.age')}</th>
                  <th className="text-start px-6 py-3 font-medium">{t('patients.gender')}</th>
                  <th className="text-end px-6 py-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((patient) => (
                  <tr key={patient._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                          {initials(patient.name)}
                        </div>
                        <span className="font-medium text-gray-900">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{patient.nationalID}</td>
                    <td className="px-6 py-3 text-gray-600">{calculateAge(patient.dateOfBirth)}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        patient.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {patient.gender === 'male' ? t('patients.male') : t('patients.female')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1.5 items-center justify-end">
                        <button onClick={() => navigate(`/patients/history/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100" title={t('common.history')}>🕓</button>
                        <button onClick={() => navigate(`/patients/report/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100" title={t('common.report')}>📊</button>
                        <button onClick={() => navigate(`/patients/edit/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100" title={t('common.edit')}>✏️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {list.map((patient) => (
              <div key={patient._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(patient.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{patient.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('patients.age')}: {calculateAge(patient.dateOfBirth)} ·
                      <span className={`ms-1 ${patient.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}`}>
                        {patient.gender === 'male' ? t('patients.male') : t('patients.female')}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => navigate(`/patients/history/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100">🕓</button>
                  <button onClick={() => navigate(`/patients/report/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100">📊</button>
                  <button onClick={() => navigate(`/patients/edit/${patient._id}`)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100">✏️</button>
                  <button onClick={() => handleDelete(patient._id)} className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {list.length} / {pagination?.total || list.length}
            </span>
            {totalPages > 1 && !search && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40">←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded-md border ${page === p ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-sm rounded-md border border-gray-200 disabled:opacity-40">→</button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}