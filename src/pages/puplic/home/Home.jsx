import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";

const Home = () => {
  const { t } = useTranslation();

  const features = [
    { title: t("home.feature1Title"), description: t("home.feature1Desc") },
    { title: t("home.feature2Title"), description: t("home.feature2Desc") },
    { title: t("home.feature3Title"), description: t("home.feature3Desc") },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          {t("home.heroTitle")}
          <span className="text-blue-600"> {t("home.heroHighlight")}</span>
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">{t("home.heroSubtitle")}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
            {t("home.doctorLogin")}
          </Link>
          <Link to="/contact" className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition">
            {t("home.contactUs")}
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <p className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} MedAgents. {t("home.allRights")}
        </p>
      </footer>
    </div>
  );
};

export default Home;