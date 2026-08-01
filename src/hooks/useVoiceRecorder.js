import { useState, useRef, useCallback } from "react";
import { transcribeAudio } from "../api/transcription";

/**
 * بيسجل صوت من الميكروفون (MediaRecorder API - مدعومة في كل المتصفحات
 * الحديثة تقريبًا، على عكس Web Speech API)، ولما التسجيل يوقف، بيبعت
 * الملف لـ Groq Whisper (عن طريق الباك اند) ويرجّع النص.
 *
 * @param {object} options
 * @param {string} options.language - "ar" أو "en"، بتتبعت لـ Whisper
 *   لتحسين الدقة (اختيارية)
 * @param {(text: string) => void} options.onResult
 */
const useVoiceRecorder = ({ language, onResult } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // بنقفل الميكروفون فورًا وقت ما التسجيل يوقف - مش لازم يفضل
        // مفتوح لحد ما التفريغ يخلص
        streamRef.current?.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        // تسجيل فاضي (دوس تشغيل ثم إيقاف فورًا من غير كلام) - نتجاهله
        if (audioBlob.size < 1000) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const result = await transcribeAudio(audioBlob, language);
          if (result?.data?.text) {
            onResult?.(result.data.text);
          }
        } catch (err) {
          setError(
            err.response?.data?.message || err.message || "Transcription failed",
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      // ممكن يحصل لو المستخدم رفض إذن الميكروفون، أو مفيش ميكروفون أصلاً
      setError(err.message || "Could not access microphone");
    }
  }, [language, onResult]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  return { isRecording, isTranscribing, error, start, stop, toggle };
};

export default useVoiceRecorder;
