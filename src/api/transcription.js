import apiInstance from "../config/apiInstance";

// بيبعت ملف صوتي (Blob من MediaRecorder) لـ Groq Whisper عن طريق الباك
// اند، وبيرجّع النص المُفرَّغ منه
export const transcribeAudio = async (audioBlob, language) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  if (language) formData.append("language", language);

  const res = await apiInstance.post("/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
