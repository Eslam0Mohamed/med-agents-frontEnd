import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { uploadLabFiles, resolveLabFileUrl } from "../../api/consultation";

const MAX_FILES = 6;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

const isImage = (mimeType) => mimeType?.startsWith("image/");

const formatSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * حقل رفع اختياري لملفات التحاليل المعملية/تقارير الأشعة (صور أو PDF).
 * الرفع بيحصل فورًا أول ما الدكتور يختار الملفات (مش وقت الحفظ)، والفورم
 * الأب بس بيحتفظ بميتاداتا الملفات (url/originalName/mimeType/size) عن
 * طريق `files` + `onChange` - مش بيلمس الملف نفسه خالص.
 *
 * مستخدم في فورم الكونسلتيشن وفورم إكمال الفولو أب الاتنين.
 */
const LabFilesUploader = ({ files = [], onChange, disabled = false }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = ""; // يسمح باختيار نفس الملف تاني لو اتشال
    if (!selected.length) return;

    if (files.length + selected.length > MAX_FILES) {
      Swal.fire({
        icon: "warning",
        text: t("consultations.labFilesTooMany"),
      });
      return;
    }

    const invalidType = selected.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalidType) {
      Swal.fire({
        icon: "warning",
        text: t("consultations.labFilesInvalidType"),
      });
      return;
    }

    const tooLarge = selected.find((f) => f.size > MAX_SIZE_BYTES);
    if (tooLarge) {
      Swal.fire({
        icon: "warning",
        text: t("consultations.labFilesTooLarge"),
      });
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadLabFiles(selected);
      onChange([...files, ...(res.data || [])]);
    } catch (err) {
      Swal.fire({
        icon: "error",
        text: t("consultations.labFilesUploadFailed"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-blue-700">
          {t("consultations.labFiles")}{" "}
          <span className="text-gray-400 font-normal">
            ({t("consultations.labFilesOptional")})
          </span>
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || files.length >= MAX_FILES}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isUploading ? (
              <>
                <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                {t("consultations.labFilesUploading")}
              </>
            ) : (
              <>📎 {t("consultations.labFilesAddMore")}</>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {t("consultations.labFilesHint")}
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
        onChange={handleFilesSelected}
        className="hidden"
        disabled={disabled}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-md py-4 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📎 {t("consultations.labFilesEmpty")}
        </button>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.url}-${index}`}
              className="flex items-center gap-2 border border-gray-200 rounded-md px-2.5 py-2 bg-gray-50"
            >
              {isImage(file.mimeType) ? (
                <img
                  src={resolveLabFileUrl(file.url)}
                  alt={file.originalName}
                  className="w-9 h-9 rounded object-cover shrink-0 border border-gray-200"
                />
              ) : (
                <span className="w-9 h-9 rounded bg-red-50 text-red-500 flex items-center justify-center shrink-0 text-lg">
                  📄
                </span>
              )}

              <a
                href={resolveLabFileUrl(file.url)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1"
                title={file.originalName}
              >
                <p className="text-xs font-medium text-gray-700 truncate">
                  {file.originalName}
                </p>
                <p className="text-[11px] text-gray-400">
                  {formatSize(file.size)}
                </p>
              </a>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  title={t("consultations.labFilesRemove")}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition text-sm px-1"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LabFilesUploader;
