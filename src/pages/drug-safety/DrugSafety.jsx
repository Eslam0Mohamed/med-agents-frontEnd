import { useState } from 'react';
import { checkDrugSafety } from '../../api/drugSafety';

export default function DrugSafety() {
  const [medications, setMedications] = useState([{ name: '', dosage: '' }]);
  const [language, setLanguage] = useState('en');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMedChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '' }]);
  };

  const removeMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const getRiskColor = (text) => {
    if (text?.includes('[CRITICAL]')) return 'bg-red-50 border-red-300 text-red-800';
    if (text?.includes('[HIGH RISK]')) return 'bg-orange-50 border-orange-300 text-orange-800';
    if (text?.includes('[MODERATE RISK]')) return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    return 'bg-green-50 border-green-300 text-green-800';
  };

  const handleCheck = async () => {
    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length === 0) {
      setError('Please add at least one medication.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await checkDrugSafety(validMeds, language);
      setResult(res.data.content);
    } catch (err) {
      setError('Failed to check drug safety. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-xl">
          🛡️
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Drug Safety Check</h1>
          <p className="text-xs text-gray-500">Detect interactions, contraindications & risks</p>
        </div>
        <div className="ml-auto flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              language === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              language === 'ar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            AR
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Medications</h2>

        {medications.map((med, index) => (
          <div key={index} className="flex items-center gap-3 mb-3">
            <input
              type="text"
              placeholder="Medication name (e.g. Warfarin)"
              value={med.name}
              onChange={(e) => handleMedChange(index, 'name', e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Dosage (e.g. 5mg)"
              value={med.dosage}
              onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
              className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {medications.length > 1 && (
              <button
                onClick={() => removeMedication(index)}
                className="text-red-500 hover:text-red-700 text-sm px-2"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addMedication}
          className="text-blue-600 text-sm font-medium hover:underline mt-1"
        >
          + Add another medication
        </button>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="w-full mt-5 bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition"
        >
          {isLoading ? 'Checking...' : 'Check Drug Safety'}
        </button>
      </div>

      {result && (
        <div className={`border rounded-xl p-5 whitespace-pre-wrap text-sm leading-relaxed ${getRiskColor(result)}`}>
          {result}
        </div>
      )}
    </div>
  );
}