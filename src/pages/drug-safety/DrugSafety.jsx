import { useState } from 'react';
import { checkDrugSafety } from '../../api/drugSafety';

function parseResult(text) {
  if (!text) return { riskLevel: '', sections: [] };
  const riskMatch = text.match(/\[(LOW RISK|MODERATE RISK|HIGH RISK|CRITICAL)\]/i);
  const riskLevel = riskMatch ? riskMatch[1].toUpperCase() : '';
  const body = text.replace(/\[.*?\]/, '').trim();
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let current = null;
  lines.forEach((line) => {
    if (line.startsWith('*')) {
      current = { title: line.replace(/^\*\s*/, ''), items: [] };
      sections.push(current);
    } else if (line.startsWith('+')) {
      const item = line.replace(/^\+\s*/, '');
      if (current) current.items.push(item);
      else sections.push({ title: '', items: [item] });
    } else if (current) {
      current.items.push(line);
    }
  });
  return { riskLevel, sections };
}

const riskConfig = {
  'LOW RISK': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-600', icon: '✓' },
  'MODERATE RISK': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-500', icon: '⚠' },
  'HIGH RISK': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-600', icon: '⚠' },
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-600', icon: '✕' },
};

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

  const addMedication = () => setMedications([...medications, { name: '', dosage: '' }]);
  const removeMedication = (index) => setMedications(medications.filter((_, i) => i !== index));

  const handleCheck = async () => {
    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length === 0) { setError('Please add at least one medication.'); return; }
    setIsLoading(true); setError(''); setResult(null);
    try {
      const res = await checkDrugSafety(validMeds, language);
      setResult(res.data.content);
    } catch {
      setError('Failed to check drug safety. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parsed = result ? parseResult(result) : null;
  const config = parsed ? riskConfig[parsed.riskLevel] || riskConfig['MODERATE RISK'] : null;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg sm:text-xl">🛡️</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900">Drug Safety Check</h1>
          <p className="text-xs text-gray-500 hidden sm:block">Detect interactions, contraindications & risks</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 flex-shrink-0">
          <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 rounded text-xs font-medium ${language === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>EN</button>
          <button onClick={() => setLanguage('ar')} className={`px-2.5 py-1 rounded text-xs font-medium ${language === 'ar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>AR</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-5 sm:mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Medications</h2>
        {medications.map((med, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-3">
            <input
              type="text"
              placeholder="Medication name"
              value={med.name}
              onChange={(e) => handleMedChange(index, 'name', e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
              className="sm:w-36 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {medications.length > 1 && (
              <button onClick={() => removeMedication(index)} className="text-red-500 hover:text-red-700 text-sm px-2 self-end sm:self-auto">✕</button>
            )}
          </div>
        ))}
        <button onClick={addMedication} className="text-blue-600 text-sm font-medium hover:underline mt-1">+ Add another medication</button>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="w-full mt-5 bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition cursor-pointer"
        >
          {isLoading ? 'Checking...' : 'Check Drug Safety'}
        </button>
      </div>

      {parsed && config && (
        <div className={`border ${config.border} ${config.bg} rounded-xl overflow-hidden`}>
          <div className={`${config.badge} text-white px-4 sm:px-5 py-3 flex items-center gap-2`}>
            <span className="text-lg">{config.icon}</span>
            <span className="font-semibold text-sm tracking-wide">{parsed.riskLevel}</span>
          </div>
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            {parsed.sections.map((section, i) => (
              <div key={i}>
                {section.title && <h3 className={`text-sm font-semibold ${config.text} mb-2`}>{section.title}</h3>}
                <ul className="space-y-1.5">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full ${config.badge} flex-shrink-0`}></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}