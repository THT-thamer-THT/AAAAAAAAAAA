/* ============================================================
   العملاء – Thamer SaaS
   متوافق مع النظام الموحد (JWT + RLS)
   ============================================================ */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!role || !token) {
  window.location.href = "login.html";
}

// فقط الأدمن يشوف صفحة العملاء
if (role !== "admin") {
  window.location.href = "orders.html";
}

let offset = 0;
let loading = false;
let sort = "name_asc";
let search = "";

const customersList = document.getElementById("customersList");

/* ============================================================
   جلب العملاء
   ============================================================ */

async function loadCustomers(reset = false) {
  if (loading) return;
  loading = true;

  if (reset) {
    offset = 0;
    customersList.innerHTML = "";
  }

  const url = `${SUPABASE_URL}/functions/v1/get_customers?limit=20&offset=${offset}&sort=${sort}&search=${search}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY
      }
    });

    const data = await res.json();

    if (!data.customers || data.customers.length === 0) {
      loading = false;
      return;
    }

    data.customers.forEach(c => {
      const div = document.createElement("div");
      div.className = "order-item";
      div.innerHTML = `
        <strong>الاسم:</strong> ${c.name || "—"}<br>
        <strong>البريد:</strong> ${c.email || "—"}<br>
        <strong>عدد الطلبات:</strong> ${c.orders_count || 0}<br>
        <strong>إجمالي المبالغ:</strong> ${c.total_spent || 0} ريال<br>
        <button onclick="openCustomer('${c.id}')">عرض التفاصيل</button>
      `;
      customersList.appendChild(div);
    });

    offset += 20;

  } catch (err) {
    console.error("خطأ في تحميل العملاء:", err);
  }

  loading = false;
}

/* ============================================================
   Infinite Scroll
   ============================================================ */

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadCustomers();
  }
});

/* ============================================================
   البحث
   ============================================================ */

document.getElementById("searchInput").addEventListener("input", (e) => {
  search = e.target.value;
  loadCustomers(true);
});

/* ============================================================
   الترتيب
   ============================================================ */

document.getElementById("sortSelect").addEventListener("change", (e) => {
  sort = e.target.value;
  loadCustomers(true);
});

/* ============================================================
   فتح تفاصيل العميل
   ============================================================ */

function openCustomer(id) {
  window.location.href = `customer-details.html?id=${id}`;
}

/* ============================================================
   تشغيل الصفحة
   ============================================================ */

loadCustomers();
