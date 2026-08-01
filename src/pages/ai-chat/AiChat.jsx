import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sendMedicalChat } from "../../api/aiChat";
import MicButton from "../../components/consultations/MicButton";

// أنواع الصور المسموح برفعها للشات - نفس النوع اللي الموديلات (Gemini)
// بتقدر تشوفه فعليًا
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// بيحوّل ملف لـ base64 خام (من غير data:image/...;base64, prefix) عشان
// يتوافق مع fileParts بتاعة الباك اند
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AiChat() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [pendingImage, setPendingImage] = useState(null); // {file, previewUrl, base64, mimeType}
  const [imageError, setImageError] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const isAr = language === "ar";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // بننضّف preview URL القديم من الذاكرة لما يتشال أو الكومبوننت يتقفل
  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl)
        URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // يسمح تختار نفس الملف تاني لو مسحته
    if (!file) return;

    setImageError("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError(t("aiChat.imageTypeError"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(t("aiChat.imageSizeError"));
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPendingImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type,
      });
    } catch {
      setImageError(t("aiChat.imageTypeError"));
    }
  };

  const removePendingImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || isLoading) return;

    const userMessage = {
      role: "user",
      content:
        input.trim() ||
        (isAr ? t("aiChat.imageOnlyMessageAr") : t("aiChat.imageOnlyMessage")),
      // بنحتفظ بالـ preview محليًا بس (للعرض) - مش بيتبعت للباك اند جوه
      // messages، بيتبعت منفصل في حقل image
      imagePreviewUrl: pendingImage?.previewUrl,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const imageToSend = pendingImage
      ? { mimeType: pendingImage.mimeType, data: pendingImage.base64 }
      : null;

    setInput("");
    setPendingImage(null);
    setIsLoading(true);
    try {
      // مبنبعتش imagePreviewUrl (Blob URL محلي) للباك اند - بنبني نسخة
      // نضيفة من الرسائل بس للـ API نفسه
      const apiMessages = newMessages.map(({ role, content }) => ({
        role,
        content,
      }));
      const res = await sendMedicalChat(apiMessages, language, imageToSend);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isAr ? t("aiChat.errorAr") : t("aiChat.errorEn"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-base sm:text-lg">
            🤖
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-gray-900">
              {t("aiChat.title")}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {t("aiChat.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 rounded text-xs font-medium ${language === "en" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("ar")}
            className={`px-2.5 py-1 rounded text-xs font-medium ${language === "ar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
          >
            AR
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-16 sm:mt-20 px-4">
            <p className="text-sm">
              {isAr ? t("aiChat.emptyStateAr") : t("aiChat.emptyState")}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs sm:max-w-xl rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}
            >
              {m.imagePreviewUrl && (
                <img
                  src={m.imagePreviewUrl}
                  alt=""
                  className="rounded-lg mb-2 max-h-48 object-contain"
                />
              )}
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
              {isAr ? t("aiChat.thinkingAr") : t("aiChat.thinking")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
        {pendingImage && (
          <div className="flex items-center gap-2 mb-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 w-fit">
            <img
              src={pendingImage.previewUrl}
              alt=""
              className="w-10 h-10 object-cover rounded"
            />
            <span className="text-xs text-gray-500 max-w-[120px] truncate">
              {pendingImage.file.name}
            </span>
            <button
              type="button"
              onClick={removePendingImage}
              className="text-gray-400 hover:text-red-500 text-sm px-1"
              title={t("aiChat.removeImage")}
            >
              ✕
            </button>
          </div>
        )}
        {imageError && (
          <p className="text-xs text-red-500 mb-2">{imageError}</p>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title={t("aiChat.attachImage")}
            className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>

          <MicButton
            disabled={isLoading}
            onTranscript={(text) =>
              setInput((prev) => (prev ? `${prev} ${text}` : text))
            }
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAr ? t("aiChat.placeholderAr") : t("aiChat.placeholder")
            }
            className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !pendingImage)}
            className="bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition"
          >
            {isAr ? t("aiChat.sendAr") : t("aiChat.send")}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center hidden sm:block">
          🔒 {isAr ? t("aiChat.encryptedAr") : t("aiChat.encrypted")} · ⚕️{" "}
          {isAr ? t("aiChat.evidenceBasedAr") : t("aiChat.evidenceBased")}
        </p>
      </div>
    </div>
  );
}
