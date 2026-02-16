/* ============================================
   نظام رفع الملفات للتاجر
   Thamer SaaS – File Upload Engine
   ============================================ */

/* أنواع الملفات المطلوبة لكل تاجر */
const REQUIRED_FILES = [
  { key: "commercial", label: "السجل التجاري" },
  { key: "id", label: "الهوية الوطنية" },
  { key: "vat", label: "شهادة ضريبة القيمة المضافة" }
];

/* ============================================
   1) رفع ملف وتحويله Base64
   ============================================ */

function uploadFile(inputElement, merchantId, fileKey) {
  const file = inputElement.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;

    const files = getMerchantFiles(merchantId);
    files[fileKey] = {
      name: file.name,
      type: file.type,
      data: base64,
      status: "pending" // pending | approved | rejected
    };

    saveMerchantFiles(merchantId, files);
    renderMerchantFiles(merchantId);
  };

  reader.readAsDataURL(file);
}

/* ============================================
   2) عرض الملفات داخل لوحة التاجر
   ============================================ */

function renderMerchantFiles(merchantId) {
  const container = document.getElementById("merchantFiles");
  const files = getMerchantFiles(merchantId);

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>الملفات المطلوبة</h4>
        <span>قم برفع الملفات المطلوبة لإكمال التحقق</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>الملف</th>
            <th>الحالة</th>
            <th>رفع</th>
          </tr>
        </thead>
        <tbody>
  `;

  REQUIRED_FILES.forEach(f => {
    const file = files[f.key];

    html += `
      <tr>
        <td>${f.label}</td>
        <td>
          ${file ? renderFileStatus(file.status) : '<span class="status-pill status-pending">لم يُرفع</span>'}
        </td>
        <td>
          <input type="file" onchange="uploadFile(this, '${merchantId}', '${f.key}')">
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/* ============================================
   3) عرض الملفات داخل لوحة الأدمن
   ============================================ */

function renderAdminFiles(merchantId) {
  const files = getMerchantFiles(merchantId);

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>ملفات التاجر</h4>
        <span>مراجعة الملفات والتحقق منها</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>الملف</th>
            <th>الحالة</th>
            <th>عرض</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
  `;

  REQUIRED_FILES.forEach(f => {
    const file = files[f.key];

    html += `
      <tr>
        <td>${f.label}</td>
        <td>${file ? renderFileStatus(file.status) : "—"}</td>
        <td>
          ${file ? `<button onclick="openFile('${file.data}')">عرض</button>` : "—"}
        </td>
        <td>
          ${file ? renderAdminFileActions(merchantId, f.key) : "—"}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/* ============================================
   4) فتح الملف في نافذة جديدة
   ============================================ */

function openFile(base64) {
  const win = window.open();
  win.document.write(`<iframe src="${base64}" style="width:100%;height:100%"></iframe>`);
}

/* ============================================
   5) قبول / رفض الملفات
   ============================================ */

function approveFile(merchantId, fileKey) {
  const files = getMerchantFiles(merchantId);
  if (files[fileKey]) {
    files[fileKey].status = "approved";
    saveMerchantFiles(merchantId, files);
  }
  refreshAdminMerchantDetails(merchantId);
}

function rejectFile(merchantId, fileKey) {
  const files = getMerchantFiles(merchantId);
  if (files[fileKey]) {
    files[fileKey].status = "rejected";
    saveMerchantFiles(merchantId, files);
  }
  refreshAdminMerchantDetails(merchantId);
}

/* ============================================
   6) عناصر واجهة الأدمن
   ============================================ */

function renderAdminFileActions(merchantId, fileKey) {
  return `
    <button onclick="approveFile('${merchantId}', '${fileKey}')">قبول</button>
    <button onclick="rejectFile('${merchantId}', '${fileKey}')">رفض</button>
  `;
}

function renderFileStatus(status) {
  switch (status) {
    case "approved":
      return `<span class="status-pill status-paid">مقبول</span>`;
    case "rejected":
      return `<span class="status-pill status-cancelled">مرفوض</span>`;
    default:
      return `<span class="status-pill status-pending">قيد المراجعة</span>`;
  }
}