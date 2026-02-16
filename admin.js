/* ============================================================
   لوحة الأدمن – Thamer SaaS
   إدارة التجار – الفواتير – الاشتراكات – الملفات – الحالات
   ============================================================ */

/* ============================================
   1) التنقل داخل لوحة الأدمن
   ============================================ */

function switchDashboardView(viewId) {
  if (!requireAdmin()) return;

  const sections = [
    "dashboardMerchants",
    "dashboardInvoices",
    "dashboardSubscriptions",
    "dashboardSettings"
  ];

  sections.forEach(id => {
    document.getElementById(id).classList.remove("active");
  });


  document.getElementById(viewId).classList.add("active");

  // تحديث القائمة الجانبية
  const navMap = {
    dashboardMerchants: "navMerchants",
    dashboardInvoices: "navInvoices",
    dashboardSubscriptions: "navSubscriptions",
    dashboardSettings: "navSettings"
  };

  Object.values(navMap).forEach(id => {
    document.getElementById(id).classList.remove("active");
  });

  document.getElementById(navMap[viewId]).classList.add("active");

  // إعادة تحميل القسم
  if (viewId === "dashboardMerchants") renderAdminMerchants();
  if (viewId === "dashboardInvoices") renderAdminInvoices();
  if (viewId === "dashboardSubscriptions") renderAdminSubscriptions();
}

/* ============================================
   2) عرض التجار داخل لوحة الأدمن
   ============================================ */

function renderAdminMerchants() {
  if (!requireAdmin()) return;

  const container = document.getElementById("merchantsTableContainer");
  const merchants = getMerchants();

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>قائمة التجار</h4>
        <span>إدارة التجار وحالاتهم</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>المتجر</th>
            <th>البريد</th>
            <th>الحالة</th>
            <th>التسجيل</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
  `;

  merchants.forEach(m => {
    html += `
      <tr>
        <td>${m.storeName}</td>
        <td>${m.email}</td>
        <td>${renderMerchantStatus(m.status)}</td>
        <td>${m.createdAt}</td>
        <td>
          <button onclick="openMerchantDetails('${m.id}')">عرض التفاصيل</button>
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
   3) عرض حالة التاجر
   ============================================ */

function renderMerchantStatus(status) {
  if (!requireAdmin()) return;

  switch (status) {
    case "approved":
      return `<span class="status-pill status-paid">مقبول</span>`;
    case "pending":
      return `<span class="status-pill status-pending">معلق</span>`;
    case "rejected":
      return `<span class="status-pill status-cancelled">مرفوض</span>`;
    case "suspended":
      return `<span class="status-pill status-cancelled">موقوف</span>`;
    default:
      return "—";
  }
}

/* ============================================
   4) صفحة تفاصيل تاجر
   ============================================ */

function openMerchantDetails(merchantId) {
  if (!requireAdmin()) return;

  const merchants = getMerchants();
  const m = merchants.find(x => x.id === merchantId);

  const container = document.getElementById("merchantsTableContainer");

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>تفاصيل التاجر</h4>
        <span>${m.storeName}</span>
      </div>

      <p><strong>البريد:</strong> ${m.email}</p>
      <p><strong>الحالة:</strong> ${renderMerchantStatus(m.status)}</p>
      <p><strong>تاريخ التسجيل:</strong> ${m.createdAt}</p>

      <h4>تغيير حالة التاجر</h4>
      <select id="merchantStatusSelect">
        <option value="pending" ${m.status === "pending" ? "selected" : ""}>معلق</option>
        <option value="approved" ${m.status === "approved" ? "selected" : ""}>مقبول</option>
        <option value="rejected" ${m.status === "rejected" ? "selected" : ""}>مرفوض</option>
        <option value="suspended" ${m.status === "suspended" ? "selected" : ""}>موقوف</option>
      </select>

      <button class="primary-btn" onclick="saveMerchantStatus('${m.id}')">حفظ الحالة</button>

      <br><br>

      <h4>الملفات</h4>
      ${renderAdminFiles(m.id)}

      <br>

      <h4>الاشتراك</h4>
      ${renderAdminMerchantSubscription(m)}

      <br>

      <button onclick="renderAdminMerchants()">رجوع</button>
    </div>
  `;

  container.innerHTML = html;
}

/* ============================================
   5) حفظ حالة التاجر
   ============================================ */

function saveMerchantStatus(merchantId) {
  if (!requireAdmin()) return;

  const newStatus = document.getElementById("merchantStatusSelect").value;
  updateMerchantStatus(merchantId, newStatus);
  alert("تم تحديث حالة التاجر");
  openMerchantDetails(merchantId);
}

/* ============================================
   6) عرض اشتراك التاجر داخل لوحة الأدمن
   ============================================ */

function renderAdminMerchantSubscription(merchant) {
  if (!requireAdmin()) return;

  const sub = merchant.subscription;

  if (!sub) {
    return `
      <p>لا يوجد اشتراك</p>
      <button onclick="createSubscription('${merchant.id}', 'basic')">تفعيل Basic</button>
      <button onclick="createSubscription('${merchant.id}', 'pro')">تفعيل Pro</button>
    `;
  }

  return `
    <p><strong>الباقة:</strong> ${sub.plan.toUpperCase()}</p>
    <p><strong>السعر:</strong> ${sub.price} رس</p>
    <p><strong>البداية:</strong> ${sub.start}</p>
    <p><strong>الانتهاء:</strong> ${sub.end}</p>
  `;
}

/* ============================================
   7) تحديث صفحة تفاصيل التاجر بعد تعديل الملفات
   ============================================ */

function refreshAdminMerchantDetails(id) {
  if (!requireAdmin()) return;
  openMerchantDetails(id);
}

/* ============================================
   8) عرض الفواتير داخل لوحة الأدمن (تجريبية)
   ============================================ */

function renderAdminInvoices() {
  if (!requireAdmin()) return;

  const container = document.getElementById("invoicesTableContainer");
  const invoices = getInvoices();

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>الفواتير</h4>
        <span>عرض تجريبي</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>التاجر</th>
            <th>الإجمالي</th>
            <th>التاريخ</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
  `;

  invoices.forEach(inv => {
    html += `
      <tr>
        <td>${inv.number}</td>
        <td>${inv.merchant}</td>
        <td>${inv.total} رس</td>
        <td>${inv.date}</td>
        <td>${renderInvoiceStatus(inv.status)}</td>
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
   9) حالة الفاتورة
   ============================================ */

function renderInvoiceStatus(status) {
  if (!requireAdmin()) return;

  switch (status) {
    case "paid":
      return `<span class="status-pill status-paid">مدفوعة</span>`;
    case "pending":
      return `<span class="status-pill status-pending">قيد الدفع</span>`;
    case "cancelled":
      return `<span class="status-pill status-cancelled">ملغاة</span>`;
    default:
      return "—";
  }
}