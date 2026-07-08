import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle,
  FiCalendar,
  FiPlayCircle,
  FiCheckCircle,
  FiEdit3,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { getFollowUps } from "../../api/followup";
import "./followups.css";

const FollowUps = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const monthNames = [
    t("followups.months.january"),
    t("followups.months.february"),
    t("followups.months.march"),
    t("followups.months.april"),
    t("followups.months.may"),
    t("followups.months.june"),
    t("followups.months.july"),
    t("followups.months.august"),
    t("followups.months.september"),
    t("followups.months.october"),
    t("followups.months.november"),
    t("followups.months.december"),
  ];

  const weekDays = [
    t("followups.weekDays.sun"),
    t("followups.weekDays.mon"),
    t("followups.weekDays.tue"),
    t("followups.weekDays.wed"),
    t("followups.weekDays.thu"),
    t("followups.weekDays.fri"),
    t("followups.weekDays.sat"),
  ];

  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");

  const getId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value._id || value.id || "";
  };

  const isCompleted = (item) =>
    item.status === "confirmed" || item.status === "done";

  const isCancelled = (item) =>
    item.status === "cancelled" || item.status === "canceled";

  const toDateKey = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const todayKey = toDateKey(new Date());

  // للعناصر المكتملة، التاريخ اللي يهمنا نفلتر ونعرض بيه في الكاليندر هو
  // تاريخ الإكمال الفعلي (completedAt) مش تاريخ الجدولة الأصلي
  // (scheduledDate) — عشان الفولو أب يظهر في اليوم اللي حصل فيه Complete
  // بالفعل، مش اليوم اللي كان متوقع فيه من الأول
  const getDisplayDate = (item) => {
    if (isCompleted(item)) return item.completedAt || item.scheduledDate;
    return item.scheduledDate;
  };

  const isPastDue = (item) => {
    if (isCompleted(item)) return false;
    if (isCancelled(item)) return true;
    if (!item.scheduledDate) return false;
    return (
      item.status === "pending" && toDateKey(item.scheduledDate) < todayKey
    );
  };

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      // /followups دلوقتي بيرجّع فولو أبس الدكتور بس من الباك مباشرة
      // (بالاعتماد على doctorId المسجل على الفولو أب نفسه)، فمش محتاجين
      // نجيب كونسلتيشنز الدكتور تاني ونعمل cross-reference يدوي زي الأول —
      // الطريقة القديمة دي كانت بتستبعد غلط أي فولو أب جديدة الكونسلتيشن
      // بتاعتها جاية من إكمال فولو أب تاني (لأن /consultations/doctor
      // بيستبعد الكونسلتيشنز دي عمدًا)
      const followupsRes = await getFollowUps();
      setFollowUps(followupsRes?.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire(t("common.error"), t("followups.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const validFollowUps = useMemo(() => {
    return followUps.filter((item) => item.patientId && item.consultationId);
  }, [followUps]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startWeekDay; i += 1) days.push(null);
    for (let day = 1; day <= daysInMonth; day += 1)
      days.push(new Date(year, month, day));
    return days;
  }, [calendarMonth]);

  const filteredFollowUps = useMemo(() => {
    const query = search.trim().toLowerCase();

    return validFollowUps.filter((item) => {
      const matchesTab =
        activeTab === "completed"
          ? isCompleted(item)
          : activeTab === "pastDue"
            ? isPastDue(item)
            : !isCompleted(item) && !isPastDue(item);

      const matchesSelectedDate = selectedDate
        ? toDateKey(getDisplayDate(item)) === toDateKey(selectedDate)
        : true;

      const matchesSearch =
        !query ||
        (item.patientId?.name || "").toLowerCase().includes(query) ||
        (item.patientId?.nationalID || "").toLowerCase().includes(query);

      return matchesTab && matchesSelectedDate && matchesSearch;
    });
  }, [validFollowUps, activeTab, selectedDate, search]);

  const pastDueCount = useMemo(
    () =>
      validFollowUps.filter((item) => !isCompleted(item) && isPastDue(item))
        .length,
    [validFollowUps],
  );

  const completedCount = useMemo(
    () => validFollowUps.filter((item) => isCompleted(item)).length,
    [validFollowUps],
  );

  const selectedDateCount = useMemo(() => {
    if (!selectedDate) return 0;
    return validFollowUps.filter((item) => {
      const matchesTab =
        activeTab === "completed"
          ? isCompleted(item)
          : activeTab === "pastDue"
            ? isPastDue(item)
            : !isCompleted(item) && !isPastDue(item);
      return (
        matchesTab &&
        toDateKey(getDisplayDate(item)) === toDateKey(selectedDate)
      );
    }).length;
  }, [validFollowUps, selectedDate, activeTab]);

  const insightDateCount = useMemo(() => {
    const targetDate = selectedDate || new Date();
    return validFollowUps.filter(
      (item) =>
        !isCompleted(item) &&
        toDateKey(item.scheduledDate) === toDateKey(targetDate),
    ).length;
  }, [validFollowUps, selectedDate]);

  const insightDateLabel = selectedDate
    ? `${t("followups.on")} ${formatDate(selectedDate)}`
    : t("followups.today");

  const getFollowUpsCountForDate = (date) => {
    if (!date) return 0;
    const key = toDateKey(date);
    return validFollowUps.filter((item) => {
      const matchesTab =
        activeTab === "completed"
          ? isCompleted(item)
          : activeTab === "pastDue"
            ? isPastDue(item)
            : !isCompleted(item) && !isPastDue(item);
      return matchesTab && toDateKey(getDisplayDate(item)) === key;
    }).length;
  };

  const getPatientName = (item) =>
    item.patientId?.name || t("followups.unknownPatient");

  const getPatientId = (item) => getId(item.patientId);

  const getInitials = (name) => {
    if (!name || name === t("followups.unknownPatient")) return "P";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getConsultationSummary = (item) => {
    const consultation = item.consultationId;
    if (!consultation) return "—";
    if (consultation.diagnosis) return consultation.diagnosis;
    if (
      Array.isArray(consultation.symptoms) &&
      consultation.symptoms.length > 0
    )
      return consultation.symptoms.join(", ");
    if (consultation.rawInput) return consultation.rawInput;
    return "—";
  };

  const handlePreviousMonth = () => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedDate(null);
  };

  const handleStartFollowUp = (item) => {
    navigate(`/followups/start/${item._id}`, {
      state: { followUp: item, mode: "start" },
    });
  };

  const handleViewDetails = (item) => {
    navigate(`/followups/${item._id}`, {
      state: { followUp: item },
    });
  };

  const handleEditFollowUp = (item) => {
    navigate(`/followups/start/${item._id}`, {
      state: { followUp: item, mode: "edit" },
    });
  };

  const handleInsightAction = () => {
    if (pastDueCount > 0) {
      setSelectedDate(null);
      setActiveTab("pastDue");
      return;
    }
    setSelectedDate(new Date());
    setActiveTab("upcoming");
  };

  const getSectionTitle = () => {
    if (activeTab === "upcoming") return t("followups.upcomingTitle");
    if (activeTab === "pastDue") return t("followups.pastDueTitle");
    return t("followups.completedTitle");
  };

  const getStatusLabel = (item) => {
    if (isCompleted(item)) return t("followups.status.confirmed");
    if (isPastDue(item))
      return isCancelled(item)
        ? t("followups.status.cancelled")
        : t("followups.status.pastDue");
    return t("followups.status.pending");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 antialiased text-slate-800 pb-12 w-full box-border">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white pt-6 pb-14 px-4 sm:px-6 shadow-lg rounded-3xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition mb-4 border border-white/10 backdrop-blur-sm"
          >
            <svg
              className="w-4 h-4 stroke-[2.5]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            {t("common.back")}
          </button>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            {t("followups.title")}{" "}
            <span className="w-2 h-2 rounded-full bg-blue-300"></span>
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 opacity-90">
            {t("followups.subtitle")}
          </p>

          <div className="mt-5 flex justify-end">
            <div className="followups-tabs">
              <button
                className={activeTab === "upcoming" ? "active" : ""}
                onClick={() => handleTabChange("upcoming")}
              >
                {t("followups.upcoming")}
              </button>
              <button
                className={activeTab === "pastDue" ? "active" : ""}
                onClick={() => handleTabChange("pastDue")}
              >
                {t("followups.pastDue")}
              </button>
              <button
                className={activeTab === "completed" ? "active" : ""}
                onClick={() => handleTabChange("completed")}
              >
                {t("followups.completed")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12">
        <section className="followups-page">
          <div className="mb-6 relative group shadow-sm rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("followups.searchPlaceholder")}
              className="w-full border-0 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base bg-white shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 placeholder-slate-400 font-medium text-slate-700"
            />
          </div>

          <div className="followups-layout">
            <aside className="followups-sidebar">
              <div className="mini-calendar-card">
                <div className="calendar-title">
                  <button type="button" onClick={handlePreviousMonth}>
                    ‹
                  </button>
                  <span>
                    {monthNames[calendarMonth.getMonth()]}{" "}
                    {calendarMonth.getFullYear()}
                  </span>
                  <button type="button" onClick={handleNextMonth}>
                    ›
                  </button>
                </div>

                <div className="calendar-grid">
                  {weekDays.map((day, index) => (
                    <span key={`${day}-${index}`} className="calendar-day-name">
                      {day}
                    </span>
                  ))}
                  {calendarDays.map((day, index) => {
                    if (!day)
                      return (
                        <span
                          key={`empty-${index}`}
                          className="calendar-empty"
                        />
                      );
                    const count = getFollowUpsCountForDate(day);
                    const isSelected =
                      selectedDate &&
                      toDateKey(day) === toDateKey(selectedDate);
                    const isToday = toDateKey(day) === todayKey;
                    return (
                      <button
                        type="button"
                        key={toDateKey(day)}
                        onClick={() => setSelectedDate(day)}
                        className={[
                          "calendar-day",
                          isSelected ? "selected" : "",
                          isToday ? "today" : "",
                          count > 0 ? "has-followups" : "",
                        ].join(" ")}
                      >
                        <span>{day.getDate()}</span>
                        {count > 0 && <small>{count}</small>}
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-footer">
                  {selectedDate ? (
                    <>
                      <p>
                        {t("followups.showingCount", {
                          count: selectedDateCount,
                          date: formatDate(selectedDate),
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(null)}
                      >
                        {t("followups.showAll")}
                      </button>
                    </>
                  ) : (
                    <p>{t("followups.clickToFilter")}</p>
                  )}
                </div>
              </div>

              <div className="ai-insights-card">
                <h3>{t("followups.aiInsights")}</h3>
                <div className="insight-list">
                  <p>
                    {insightDateCount} {t("followups.insightScheduled")}{" "}
                    {insightDateLabel}.
                  </p>
                  <p>
                    {pastDueCount} {t("followups.insightPastDue")}
                  </p>
                  <p>
                    {completedCount} {t("followups.insightCompleted")}
                  </p>
                </div>
                <button type="button" onClick={handleInsightAction}>
                  {pastDueCount > 0
                    ? t("followups.reviewPastDue")
                    : t("followups.viewToday")}
                </button>
              </div>
            </aside>

            <main className="followups-content">
              <div className="section-title">
                {activeTab === "completed" ? (
                  <FiCheckCircle />
                ) : (
                  <FiAlertTriangle />
                )}
                <span>{getSectionTitle()}</span>
              </div>

              {loading && <p className="state-text">{t("common.loading")}</p>}
              {!loading && filteredFollowUps.length === 0 && (
                <p className="state-text">{t("common.noData")}</p>
              )}

              <div className="followups-grid">
                {filteredFollowUps.map((item) => {
                  const patientName = getPatientName(item);
                  return (
                    <article className="followup-card" key={item._id}>
                      <div className="card-top">
                        <div className="patient-avatar">
                          {getInitials(patientName)}
                        </div>
                        <div>
                          <h3>{patientName}</h3>
                          <p>
                            {t("followups.patientId")}:{" "}
                            {item.patientId?.nationalID ||
                              t("followups.unknownPatient")}
                          </p>
                        </div>
                        <span
                          className={
                            isPastDue(item)
                              ? "urgent-badge danger"
                              : "urgent-badge"
                          }
                        >
                          {getStatusLabel(item)}
                        </span>
                      </div>

                      <div className="followup-meta">
                        <p>
                          <FiCalendar />
                          {t("followups.scheduledDate")}:{" "}
                          {formatDate(item.scheduledDate)}
                        </p>
                        {isCompleted(item) && item.completedAt && (
                          <p>
                            <FiCheckCircle />
                            {t("followups.finished")}:{" "}
                            {formatDate(item.completedAt)}
                          </p>
                        )}
                      </div>

                      <div className="card-actions">
                        {!isCompleted(item) ? (
                          <button
                            className="start-btn"
                            onClick={() => handleStartFollowUp(item)}
                          >
                            <FiPlayCircle />
                            {t("followups.startFollowUp")}
                          </button>
                        ) : (
                          <>
                            <button
                              className="details-btn"
                              onClick={() => handleViewDetails(item)}
                            >
                              <FiCheckCircle />
                              {t("followups.viewDetails")}
                            </button>
                            <button
                              className="edit-btn"
                              onClick={() => handleEditFollowUp(item)}
                            >
                              <FiEdit3 />
                              {t("common.edit")}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </main>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FollowUps;
