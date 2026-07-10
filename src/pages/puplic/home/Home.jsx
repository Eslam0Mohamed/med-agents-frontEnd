import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../context/ThemeContext";
import PublicNavbar from "../puplicNavbar/PuplicNavbar";
import doctorHero from "../../../assets/doctor-hero.png";

const Home = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";
  const { isDark } = useTheme();

  // AI Sandbox State
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const symptoms = [
    { 
      id: "s1", 
      label: isRtl ? "حمى وسعال" : "Fever & Cough",
      value: "Fever & Cough"
    },
    { 
      id: "s2", 
      label: isRtl ? "ارتفاع ضغط الدم" : "High Blood Pressure",
      value: "High Blood Pressure"
    },
    { 
      id: "s3", 
      label: isRtl ? "صداع وغثيان" : "Headache & Nausea",
      value: "Headache & Nausea"
    },
  ];

  const handleSymptomSelect = (value) => {
    setCustomInput(value);
    setAnalysisResult(null);
  };

  const handleAnalyze = () => {
    if (!customInput.trim()) return;
    setLoading(true);
    setAnalysisResult(null);

    setTimeout(() => {
      let result = {
        symptom: customInput,
        diagnosis: "Presumptive Respiratory Infection (Probable Influenza)",
        diagnosisAr: "عدوى تنفسية محتملة (اشتباه إنفلونزا)",
        safetyAlert: "Alert: Check for history of gastric ulcers before prescribing NSAIDs (like Ibuprofen). Avoid prescribing if active ulcer is present.",
        safetyAlertAr: "تنبيه: تحقق من تاريخ قرحة المعدة لدى المريض قبل وصف مضادات الالتهاب غير الستيروئيدية (مثل الإيبوبروفين). تجنب وصفها في حالة وجود قرحة نشطة.",
        nextSteps: "Schedule clinical follow-up in 3 days. Recommend hydration and symptomatic relief.",
        nextStepsAr: "جدولة متابعة سريرية في غضون 3 أيام. يوصى بالترطيب الجيد وعلاج الأعراض.",
      };

      const text = customInput.toLowerCase();
      if (text.includes("pressure") || text.includes("ضغط") || text.includes("hypertension")) {
        result = {
          symptom: customInput,
          diagnosis: "Suspected Stage 1 Essential Hypertension",
          diagnosisAr: "ارتفاع ضغط الدم الأساسي من الدرجة الأولى (اشتباه)",
          safetyAlert: "Alert: Avoid combining ACE Inhibitors and ARBs due to risk of hyperkalemia and renal impairment.",
          safetyAlertAr: "تنبيه: تجنب الجمع بين مثبطات الإنزيم المحول للأنجيوتنسين (ACE) وحاصرات مستقبلات الأنجيوتنسين (ARBs) لتجنب خطر زيادة البوتاسيوم في الدم وقصور الكلى.",
          nextSteps: "Request a 7-day home blood pressure monitoring log. Schedule follow-up consultation.",
          nextStepsAr: "طلب سجل قياس ضغط الدم المنزلي لمدة 7 أيام. جدولة استشارة للمتابعة.",
        };
      } else if (text.includes("headache") || text.includes("صداع") || text.includes("nausea")) {
        result = {
          symptom: customInput,
          diagnosis: "Tension Headache vs. Migraine prodrome",
          diagnosisAr: "صداع توتري مقابل بداية نوبة صداع نصفي (شقيقة)",
          safetyAlert: "Alert: Monitor frequency of analgesics use to prevent medication-overuse headache (MOH).",
          safetyAlertAr: "تنبيه: راقب وتيرة استخدام المسكنات لتجنب حدوث الصداع الناتج عن الإفراط في تناول الأدوية (MOH).",
          nextSteps: "Identify triggers (stress, lack of sleep). Suggest lifestyle counseling and follow-up if symptoms persist.",
          nextStepsAr: "تحديد المحفزات (التوتر، قلة النوم). اقتراح نمط حياة صحي ومتابعة إذا استمرت الأعراض.",
        };
      }

      setAnalysisResult(result);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-800"
    }`} dir={isRtl ? "rtl" : "ltr"}>
      
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Radial Ambient Glow */}
        <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-300 ${
          isDark ? "bg-blue-900/20" : "bg-blue-100/40"
        }`}></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-colors ${
              isDark 
                ? "bg-blue-950/40 border-blue-900/50 text-blue-400" 
                : "bg-blue-50 border-blue-100/80 text-blue-600"
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              {t("home.aiPowered", "AI-Powered Healthcare")}
            </div>
            
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight transition-colors ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              {t("home.heroTitle")}
              <span className="text-blue-500 drop-shadow-sm block lg:inline"> {t("home.heroHighlight")}</span>
            </h1>
            
            <p className={`text-lg max-w-xl leading-relaxed transition-colors ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}>
              {t("home.heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              
              <Link 
                to="/contact" 
                className={`flex items-center justify-center gap-2 border font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 ${
                  isDark 
                    ? "border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-200 shadow-sm" 
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                }`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                {t("home.contactUs")}
              </Link>
            </div>

            {/* Micro Badges */}
            <div className={`flex flex-wrap items-center gap-6 pt-6 text-sm border-t transition-colors ${
              isDark ? "border-slate-900 text-slate-400" : "border-slate-100 text-slate-500"
            }`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                <span>{t("home.securePrivate", "Secure & Private")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <span>{t("home.aiPoweredBadge", "AI-Powered")}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{t("home.trustedDoctors", "Trusted by Doctors")}</span>
              </div>
            </div>
          </div>
          
          {/* Right Image Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className={`relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden p-4 flex items-center justify-center transition-colors ${
              isDark ? "bg-gradient-to-tr from-blue-900/20 to-blue-800/10" : "bg-gradient-to-tr from-blue-500/10 to-blue-600/5"
            }`}>
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
        <div className={`rounded-2xl border p-8 grid grid-cols-2 md:grid-cols-4 gap-8 transition-colors ${
          isDark 
            ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-950/50" 
            : "bg-white border-slate-100 shadow-xl shadow-slate-100/50"
        }`}>
          <div className="text-center space-y-1.5">
            <div className={`text-3xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>10K+</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsPatients", "Patients Managed")}</div>
          </div>
          <div className={`text-center space-y-1.5 border-slate-100 ${isRtl ? "border-r" : "border-l"} ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className={`text-3xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>500+</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsDoctors", "Doctors Trust Us")}</div>
          </div>
          <div className={`text-center space-y-1.5 border-slate-100 ${isRtl ? "border-r" : "border-l"} ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className={`text-3xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>98%</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsAccuracy", "AI Accuracy")}</div>
          </div>
          <div className={`text-center space-y-1.5 border-slate-100 ${isRtl ? "border-r" : "border-l"} ${isDark ? "border-slate-800" : "border-slate-100"}`}>
            <div className={`text-3xl font-extrabold transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>24/7</div>
            <div className="text-xs text-slate-400 font-medium tracking-wide uppercase">{t("home.statsSupport", "AI Support")}</div>
          </div>
        </div>
      </section>

      {/* 3-Column Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Patient Management */}
          <div className={`group rounded-2xl border p-8 transition-all duration-300 transform hover:-translate-y-1 ${
            isDark 
              ? "bg-slate-900 border-slate-800 hover:border-blue-900/80 hover:shadow-2xl hover:shadow-blue-950/20" 
              : "bg-white border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:text-white transition-all duration-300 ${
              isDark ? "bg-slate-800 text-blue-400 group-hover:bg-blue-600" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600"
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-3 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{t("home.feature1Title")}</h3>
            <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("home.feature1Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-400">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

          {/* Card 2: AI Consultations */}
          <div className={`group rounded-2xl border p-8 transition-all duration-300 transform hover:-translate-y-1 ${
            isDark 
              ? "bg-slate-900 border-slate-800 hover:border-blue-900/80 hover:shadow-2xl hover:shadow-blue-950/20" 
              : "bg-white border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:text-white transition-all duration-300 ${
              isDark ? "bg-slate-800 text-purple-400 group-hover:bg-purple-600" : "bg-purple-50 text-purple-600 group-hover:bg-purple-600"
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-3 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{t("home.feature2Title")}</h3>
            <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("home.feature2Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-400">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

          {/* Card 3: Digital Prescriptions */}
          <div className={`group rounded-2xl border p-8 transition-all duration-300 transform hover:-translate-y-1 ${
            isDark 
              ? "bg-slate-900 border-slate-800 hover:border-blue-900/80 hover:shadow-2xl hover:shadow-blue-950/20" 
              : "bg-white border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:text-white transition-all duration-300 ${
              isDark ? "bg-slate-800 text-emerald-400 group-hover:bg-emerald-600" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600"
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 className={`text-lg font-bold mb-3 transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>{t("home.feature3Title")}</h3>
            <p className={`text-sm leading-relaxed mb-6 transition-colors ${isDark ? "text-slate-400" : "text-slate-500"}`}>{t("home.feature3Desc")}</p>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-400">
              {t("home.learnMore", "Learn more")}
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>

        </div>
      </section>

      {/* Unique and Strong Footer (Permanently Dark) */}
      <footer className="py-16 border-t bg-slate-950 border-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 text-left">
          {/* Logo & Description */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="text-xl font-bold tracking-tight text-white">
              Med<span className="text-blue-600">Agents</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm text-slate-400">
              {t("footer.description", "AI-powered platform for doctors to manage patients, consultations, and prescriptions with ease.")}
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-200">
              {isRtl ? "الموقع" : "Navigation"}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-slate-400 hover:text-blue-500 transition">{t("nav.home")}</Link></li>
              <li><Link to="/contact" className="text-slate-400 hover:text-blue-500 transition">{t("nav.contactUs")}</Link></li>
              <li><Link to="/login" className="text-slate-400 hover:text-blue-500 transition">{t("home.doctorLogin")}</Link></li>
            </ul>
          </div>

          {/* Column 3: Features */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-200">
              {isRtl ? "المميزات" : "Key Features"}
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{t("home.feature1Title")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span>{t("home.feature2Title")}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{t("home.feature3Title")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="max-w-6xl mx-auto px-6 pt-8 mt-10 border-t border-slate-900 text-center text-xs tracking-wide text-slate-500">
          <p>© {new Date().getFullYear()} MedAgents. {t("home.allRights")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;