export function calculateAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// بيفتح نافذة منفصلة فيها نسخة نضيفة قابلة للطباعة من الروشتة، وبينده
// print() تلقائيًا. مش بيعتمد على تنسيق الصفحة نفسها عشان الطباعة تطلع
// نظيفة من غير الهيدر/السايدبار/الأزرار
export function printPrescription(prescription, t, isArabic) {
  const patient = prescription.patientId;
  const age = calculateAge(patient?.dateOfBirth);
  const medications = (prescription.medications || []).filter(Boolean);
  const dateStr = new Date(prescription.createdAt).toLocaleDateString();
  const dir = isArabic ? "rtl" : "ltr";

  const rows = medications
    .map(
      (med) => `
        <tr>
          <td>
            <strong>${med.name || ""}</strong>
            ${med.activeIngredient ? `<div class="muted">${med.activeIngredient}</div>` : ""}
            ${med.isChronic ? `<span class="badge">${t("prescriptions.chronic")}</span>` : ""}
          </td>
          <td>${med.dose || "—"}</td>
          <td>${med.frequency || "—"}${!med.isChronic && med.duration ? ` · ${med.duration}` : ""}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html dir="${dir}" lang="${isArabic ? "ar" : "en"}">
<head>
<meta charset="UTF-8" />
<title>${t("prescriptions.title")} — ${patient?.name || ""}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { margin: 0; color: #1d4ed8; font-size: 22px; }
  .header p { margin: 2px 0; color: #64748b; font-size: 13px; }
  .patient-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; background: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
  .patient-info div span.label { display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: ${isArabic ? "right" : "left"}; background: #2563eb; color: #fff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  .muted { color: #94a3b8; font-size: 11px; }
  .badge { display: inline-block; margin-top: 4px; font-size: 10px; font-weight: bold; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 20px; padding: 2px 8px; }
  .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0 24px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${t("prescriptions.title")}</h1>
      <p>${t("common.date")}: ${dateStr}</p>
    </div>
  </div>
  <div class="patient-info">
    <div><span class="label">${t("common.name")}</span>${patient?.name || t("prescriptions.unknownPatient")}</div>
    <div><span class="label">${t("prescriptions.id")}</span>${patient?.phone || "—"}</div>
    <div><span class="label">${t("prescriptions.age")}</span>${age !== null ? age : "—"}</div>
    <div><span class="label">${t("patients.allergies")}</span>${patient?.allergies?.length ? patient.allergies.join(", ") : t("prescriptions.noneReported")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>${t("prescriptions.medication")}</th>
        <th>${t("prescriptions.dosageFrequency")}</th>
        <th>${t("common.date")}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">${t("prescriptions.title")} · ${new Date().toLocaleString()}</div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
