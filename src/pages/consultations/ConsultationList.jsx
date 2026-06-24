import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getConsultations, deleteConsultation } from '../../api/consultation';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConsultations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getConsultations();
      // console.log(res.data[0].followUpId);
      
      setConsultations(res.data);
      setFiltered(res.data);
    } catch {
      Swal.fire('Error', 'Failed to load consultations', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const getPatientName = (patient) => {
    if (typeof patient === 'object' && patient !== null) {
      return patient.name || 'Unknown';
    }
    return patient || 'Unknown';
  };

  const handleSearch = (value) => {
    setSearch(value);
    const query = value.toLowerCase().trim();

    if (!query) {
      setFiltered(consultations);
      return;
    }

    const result = consultations.filter((c) => {
      const patientName = getPatientName(c.patientId).toLowerCase();
      const symptoms = c.symptoms.join(', ').toLowerCase();
      const specialist = (c.suggestedSpecialist || '').toLowerCase();
      const status = (c.status || '').toLowerCase();
      const urgency = (c.urgencyLevel || '').toLowerCase();

      return (
        patientName.includes(query) ||
        symptoms.includes(query) ||
        specialist.includes(query) ||
        status.includes(query) ||
        urgency.includes(query)
      );
    });

    setFiltered(result);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await deleteConsultation(id);

        setConsultations((prev) => prev.filter((c) => c._id !== id));
        setFiltered((prev) => prev.filter((c) => c._id !== id));

        Swal.fire({
          title: 'Deleted!',
          text: 'Consultation deleted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch {
        Swal.fire('Error', 'Delete failed', 'error');
      }
    }
  };

  const getUrgencyBadge = (level) => {
    const styles = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return styles[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading consultations...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Header */}
<div className="mb-5">
  <h2 className="text-2xl font-bold text-blue-700">Consultations</h2>
</div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search consultations..."
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-175 text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700">Patient</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Symptoms</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Urgency</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Specialist</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Follow-up</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              
              <tr key={c._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">{getPatientName(c.patientId)}</td>
                <td className="px-4 py-3">{c.symptoms.join(', ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getUrgencyBadge(c.urgencyLevel)}`}>
                    {c.urgencyLevel}
                  </span>
                </td>
                <td className="px-4 py-3">{c.suggestedSpecialist}</td>
                <td className="px-4 py-3 capitalize">{c.status}</td>
                <td className="px-4 py-3">
                  {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '—'
                    }
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/consultations/edit/${c._id}`}
                      className="border border-blue-600 text-blue-600 px-3 py-1 rounded-md text-xs hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="border border-red-600 text-red-600 px-3 py-1 rounded-md text-xs hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No consultations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultations;