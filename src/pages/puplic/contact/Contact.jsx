import { useState } from "react";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";
import { sendContactMessage } from "../../../api/contact";

const Contact = () => {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">{t("contact.title")}</h1>
          <p className="text-gray-500 mt-2">{t("contact.subtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {submitted ? (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-green-600 mb-2">{t("contact.successTitle")}</h2>
              <p className="text-gray-500">{t("contact.successText")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("contact.fullName")}</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  placeholder={t("contact.namePlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("contact.email")}</label>
                <input type="email" name="email" required value={form.email} onChange={handleChange}
                  placeholder={t("contact.emailPlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t("contact.message")}</label>
                <textarea name="message" required rows={5} value={form.message} onChange={handleChange}
                  placeholder={t("contact.messagePlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? t("contact.sending") : t("contact.sendButton")}
              </button>
              {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            </form>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          {t("contact.orEmail")}{" "}
          <a href="mailto:support@medagents.com" className="text-blue-600 font-medium">support@medagents.com</a>
        </div>
      </section>
    </div>
  );
};

export default Contact;