import { Link } from "react-router-dom";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";

const features = [
  {
    title: "Patient Management",
    description:
      "Keep every patient's history, consultations, and follow-ups organized in one place.",
  },
  {
    title: "AI-Assisted Consultations",
    description:
      "Get intelligent support during consultations, from drug safety checks to smart suggestions.",
  },
  {
    title: "Digital Prescriptions",
    description:
      "Create and manage prescriptions digitally, reducing errors and saving time.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          Smarter tools for
          <span className="text-blue-600"> better patient care</span>
        </h1>
        <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
          MedAgents helps doctors manage patients, consultations, and
          prescriptions - backed by AI assistance every step of the way.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Doctor Login
          </Link>
          <Link
            to="/contact"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition"
          >
            Contact Us
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <p className="text-center text-sm text-gray-400">
          © {new Date().getFullYear()} MedAgents. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;