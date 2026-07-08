import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";
import doctorHero from "../../../assets/doctor-hero.png";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50/50 text-gray-800 font-sans antialiased overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Section with Radial Background */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Radial Ambient Glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              {t("home.aiPowered", "AI-Powered Healthcare")}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              {t("home.heroTitle")}
              <span className="text-blue-600 drop-shadow-sm block lg:inline"> {t("home.heroHighlight")}</span>
            </h1>
            
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t("home.heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                {t("home.doctorLogin")}
              </Link>
              
              <Link 
                to="/contact" 
                className="flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                {t("home.contactUs")}
              </Link>
            </div>

            {/* Micro Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                <span>{t("home.securePrivate", "Secure & Private")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>{t("home.aiPoweredBadge", "AI-Powered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{t("home.trustedDoctors", "Trusted by Doctors")}</span>
              </div>
            </div>
          </div>
          
          {/* Right Image/Dashboard Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-500/10 to-blue-600/5 p-4 flex items-center justify-center">
              <img 
                src={doctorHero} 
                alt="MedAgents Doctor" 
                className="w-full h-full object-contain filter drop-shadow-xl transform hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-1.5">
            <div className="text-3xl font-extrabold text-slate-900">10K+</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsPatients", "Patients Managed")}</div>
          </div>
          <div className="text-center space-y-1.5 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-slate-900">500+</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsDoctors", "Doctors Trust Us")}</div>
          </div>
          <div className="text-center space-y-1.5 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-slate-900">98%</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsAccuracy", "AI Accuracy")}</div>
          </div>
          <div className="text-center space-y-1.5 border-l border-slate-100">
            <div className="text-3xl font-extrabold text-slate-900">24/7</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsSupport", "AI Support")}</div>
          </div>
        </div>
      </section>

      {/* 3-Column Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Patient Management */}
          <div className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 p-8 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">{t("home.feature1Title")}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{t("home.feature1Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

          {/* Card 2: AI Consultations */}
          <div className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 p-8 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">{t("home.feature2Title")}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{t("home.feature2Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

          {/* Card 3: Digital Prescriptions */}
          <div className="group bg-white rounded-2xl border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 p-8 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">{t("home.feature3Title")}</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{t("home.feature3Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

        </div>
      </section>

      {/* Premium Dark Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Info */}
          <div className="space-y-4">
            <Link to="/" className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>Med<span className="text-blue-500">Agents</span></span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("footer.description", "AI-powered platform for doctors to manage patients, consultations, and prescriptions with ease.")}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer"><i className="fab fa-facebook-f text-xs"></i></span>
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer"><i className="fab fa-twitter text-xs"></i></span>
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer"><i className="fab fa-linkedin-in text-xs"></i></span>
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center hover:bg-blue-600 hover:text-white transition cursor-pointer"><i className="fab fa-instagram text-xs"></i></span>
            </div>
          </div>

          {/* Links 1 */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-semibold tracking-wider uppercase">{t("footer.product", "Product")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">{t("footer.features", "Features")}</a></li>
              <li><a href="#" className="hover:text-white transition">{t("footer.pricing", "Pricing")}</a></li>
              <li><a href="#" className="hover:text-white transition">{t("footer.security", "Security")}</a></li>
              <li><a href="#" className="hover:text-white transition">{t("footer.updates", "Updates")}</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-semibold tracking-wider uppercase">{t("footer.company", "Company")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">{t("footer.about", "About Us")}</a></li>
              <li><a href="#" className="hover:text-white transition">{t("footer.blog", "Blog")}</a></li>
              <li><a href="#" className="hover:text-white transition">{t("footer.careers", "Careers")}</a></li>
              <li><Link to="/contact" className="hover:text-white transition">{t("footer.contact", "Contact Us")}</Link></li>
            </ul>
          </div>

          {/* Subscribe */}
          <div className="space-y-4">
            <h4 className="text-white text-xs font-semibold tracking-wider uppercase">{t("footer.stayInLoop", "Stay in the loop")}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("footer.subscribeText", "Get the latest updates and tips for better patient care.")}
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder={t("footer.placeholderEmail", "Enter your email")} 
                className="bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-lg text-white w-full focus:outline-none focus:border-blue-600 transition" 
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-lg text-xs font-semibold transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-12 mt-12 border-t border-slate-900/50 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} MedAgents. {t("home.allRights")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;