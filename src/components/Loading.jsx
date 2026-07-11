import React from 'react'
import { useTranslation } from 'react-i18next';

const Loading = () => {
    const { t, i18n } = useTranslation();
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium text-xs mt-4 tracking-wider uppercase">
          {t("common.loading")}
        </p>
      </div>
  )
}

export default Loading
