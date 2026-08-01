import { useTranslation } from "react-i18next";
import useVoiceRecorder from "../../hooks/useVoiceRecorder";

/**
 * زرار ميكروفون - بيسجل صوت، وقت ما توقفه بيبعته لـ Groq Whisper ويضيف
 * النص المُفرَّغ لآخر الحقل الحالي (مش بيستبدل اللي مكتوب قبل كده).
 *
 * @param {(newText: string) => void} onTranscript
 * @param {boolean} disabled
 */
const MicButton = ({ onTranscript, disabled = false }) => {
  const { i18n, t } = useTranslation();

  const { isRecording, isTranscribing, error, toggle } = useVoiceRecorder({
    language: i18n.language === "ar" ? "ar" : "en",
    onResult: onTranscript,
  });

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || isTranscribing}
        title={
          isRecording
            ? t("consultations.stopRecording")
            : t("consultations.startRecording")
        }
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isRecording
            ? "bg-red-500 text-white animate-pulse"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`}
      >
        {isRecording ? "⏹" : isTranscribing ? "⏳" : "🎤"}
      </button>
      {isTranscribing && (
        <span className="text-xs text-gray-500">
          {t("consultations.transcribing")}
        </span>
      )}
      {error && (
        <span className="text-xs text-red-500" title={error}>
          {t("consultations.recordingError")}
        </span>
      )}
    </span>
  );
};

export default MicButton;
