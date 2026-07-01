import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        color: '#475569',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
      }}
    >
      {i18n.language === 'ar' ? 'EN' : 'AR'}
    </button>
  );
}