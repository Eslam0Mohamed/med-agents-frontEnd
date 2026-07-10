import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";
import Footer from "../../../components/Footer";
import { sendContactMessage } from "../../../api/contact";

const Contact = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";
  const { isDark } = useTheme();
  
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendContactMessage(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || t("contact.errorFallback"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-800"
    }`} dir={isRtl ? "rtl" : "ltr"}>
      <PublicNavbar />
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24 flex-1 w-full">
        <div className="text-center mb-10">
          <h1 className={`text-3xl font-bold transition-colors ${
            isDark ? "text-white" : "text-gray-900"
          }`}>{t("contact.title")}</h1>
          <p className={`mt-2 transition-colors ${
            isDark ? "text-slate-400" : "text-gray-500"
          }`}>{t("contact.subtitle")}</p>
        </div>

        <div className={`rounded-2xl shadow-sm border p-8 transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-950/50" : "bg-white border-gray-100"
        }`}>
          {submitted ? (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-green-600 mb-2">{t("contact.successTitle")}</h2>
              <p className={isDark ? "text-slate-400" : "text-gray-500"}>{t("contact.successText")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className={`block text-sm mb-1 transition-colors ${
                  isDark ? "text-slate-300" : "text-gray-600"
                }`}>{t("contact.fullName")}</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  placeholder={t("contact.namePlaceholder")}
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-gray-300 text-gray-850"
                  }`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 transition-colors ${
                  isDark ? "text-slate-300" : "text-gray-600"
                }`}>{t("contact.email")}</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange}
                  placeholder={t("contact.emailPlaceholder")}
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-gray-300 text-gray-850"
                  }`} />
              </div>
              <div>
                <label className={`block text-sm mb-1 transition-colors ${
                  isDark ? "text-slate-300" : "text-gray-600"
                }`}>{t("contact.message")}</label>
                <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder={t("contact.messagePlaceholder")}
                  className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none transition-colors ${
                    isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-gray-300 text-gray-850"
                  }`} />
              </div>
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? t("contact.sending") : t("contact.sendButton")}
              </button>
              {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            </form>
          )}
        </div>

        <div className={`text-center mt-8 text-sm transition-colors ${
          isDark ? "text-slate-400" : "text-gray-500"
        }`}>
          {t("contact.orEmail")}{" "}
          <a href="mailto:eslama202002@gmail.com" className="text-blue-600 font-medium">eslama202002@gmail.com</a>
        </div>
        <div className={`text-center mt-8 text-sm transition-colors ${
          isDark ? "text-slate-400" : "text-gray-500"
        }`}>
          {t("contact.whatsapp")}{" "}
          <a href="https://wa.me/201275772311" target="_blank" className="text-blue-600 font-medium" >01275772311</a>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;