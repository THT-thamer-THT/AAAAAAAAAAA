/* ============================================================
   نظام الطلبات – Thamer SaaS
   عرض احترافي: جدول + Side Panel
   ============================================================ */

const role = localStorage.getItem("role");
const merchantId = localStorage.getItem("merchant_id");
const token = localStorage.getItem("token");

if (!role) window.location.href = "login.html";

const ordersList = document.getElementById("ordersList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const statusFilter = document.getElementById("statusFilter");

let allOrders = [];

/* ============================================================
   1) جلب الطلبات حسب الدور
   ============================================================ */

async function fetchOrders() {
 const url = `${SUPABASE_URL}/functions/v1/get_orders`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  return await res.json();
}

/* ============================================================
   2) عرض الطلبات في جدول
   ============================================================ */

function renderOrders() {
  let filtered = [...allOrders];

  // البحث
  const search = searchInput.value.trim();
  if (search) {
    filtered = filtered.filter((o) =>
      o.id.toLowerCase().includes(search.toLowerCase())
    );
  }

  // الفلترة حسب الحالة
  const status = statusFilter.value;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }

  // الفرز
  const sort = sortSelect.value;
  filtered.sort((a, b) => {
    switch (sort) {
      case "created_desc":
        return new Date(b.created_at) - new Date(a.created_at);
      case "created_asc":
        return new Date(a.created_at) - new Date(b.created_at);
      case "price_desc":
        return b.total_amount - a.total_amount;
      case "price_asc":
        return a.total_amount - b.total_amount;
      case "status":
        return a.status.localeCompare(b.status);
    }
  });

  // بناء الجدول
  let html = `
    <table class="orders-table">
      <thead>
        <tr>
          <th>رقم الطلب</th>
          <th>العميل</th>
          ${role === "admin" ? "<th>التاجر</th>" : ""}
          <th>المبلغ</th>
          <th>الحالة</th>
          <th>الدفع</th>
          <th>التاريخ</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  filtered.forEach((o) => {
    html += `
      <tr>
        <td>${o.id}</td>
        <td>${o.customers?.name || "—"}</td>
        ${
          role === "admin"
            ? `<td>${o.merchants?.storename || o.merchants?.storeName || "—"}</td>`
            : ""
        }
        <td>${o.total_amount} رس</td>
        <td><span class="status-badge status-${o.status}">${translateStatus(
      o.status
    )}</span></td>
        <td>${translatePayment(o.payment_status)}</td>
        <td>${formatDate(o.created_at)}</td>
        <td>
          <button class="details-btn" onclick="openOrderDetails('${o.id}')">
            عرض
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  ordersList.innerHTML = html;
}

/* ============================================================
   3) فتح تفاصيل الطلب في Side Panel
   ============================================================ */

function openOrderDetails(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  const panel = document.getElementById("orderDetailsPanel");
  const overlay = document.getElementById("panelOverlay");
  const content = document.getElementById("orderDetailsContent");

  let html = `
    <h3>رقم الطلب: ${order.id}</h3>

    <h4>العميل</h4>
    <p><strong>الاسم:</strong> ${order.customers?.name || "—"}</p>
    <p><strong>الجوال:</strong> ${order.customers?.phone || "—"}</p>
  `;

  if (role === "admin") {
    html += `
      <h4>التاجر</h4>
      <p><strong>المتجر:</strong> ${
        order.merchants?.storename || order.merchants?.storeName || "—"
      }</p>
      <p><strong>الإيميل:</strong> ${order.merchants?.email || "—"}</p>
    `;
  }

  html += `
    <h4>تفاصيل الطلب</h4>
    <p><strong>الحالة:</strong> ${translateStatus(order.status)}</p>
    <p><strong>الدفع:</strong> ${translatePayment(order.payment_status)}</p>
    <p><strong>الإجمالي:</strong> ${order.total_amount} رس</p>

    <h4>المنتجات</h4>
  `;

  order.order_items.forEach((item) => {
    html += `
      <div class="order-item">
        <div style="display:flex;align-items:center;">
          <img src="${item.products?.image_url || ""}">
          <div>
            <p><strong>${item.products?.name || "منتج"}</strong></p>
            <p>الكمية: ${item.quantity}</p>
            <p>السعر: ${item.price} رس</p>
          </div>
        </div>
      </div>
    `;
  });

  content.innerHTML = html;

  panel.classList.add("open");
  overlay.classList.add("show");
}

function closeOrderDetails() {
  document.getElementById("orderDetailsPanel").classList.remove("open");
  document.getElementById("panelOverlay").classList.remove("show");
}

/* ============================================================
   4) أدوات مساعدة
   ============================================================ */

function translateStatus(s) {
  return {
    pending: "قيد الانتظار",
    processing: "قيد التجهيز",
    completed: "مكتمل",
    canceled: "ملغي",
  }[s] || s;
}

function translatePayment(s) {
  return {
    unpaid: "غير مدفوع",
    paid: "مدفوع",
  }[s] || s;
}

function formatDate(d) {
  return new Date(d).toLocaleString("ar-SA");
}

/* ============================================================
   5) تشغيل الصفحة
   ============================================================ */

async function init() {
  allOrders = await fetchOrders();
  renderOrders();
}

searchInput.addEventListener("input", renderOrders);
sortSelect.addEventListener("change", renderOrders);
statusFilter.addEventListener("change", renderOrders);

init();