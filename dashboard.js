/* ============================================================
   لوحة التحكم – Thamer SaaS
   متوافق مع النظام الموحد (JWT + RLS)
   ============================================================ */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!role || !token) {
  window.location.href = "login.html";
}

// فقط الأدمن يشوف لوحة التحكم
if (role !== "admin") {
  window.location.href = "orders.html";
}

/* ============================================================
   تحميل بيانات الداشبورد
   ============================================================ */

async function loadDashboard() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get_dashboard`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        }
      }
    );

    const data = await res.json();

    // الإحصائيات
    document.getElementById("totalOrders").innerHTML = `
      إجمالي الطلبات<br>${data.total_orders || 0}
    `;

    document.getElementById("totalCustomers").innerHTML = `
      إجمالي العملاء<br>${data.total_customers || 0}
    `;

    document.getElementById("totalRevenue").innerHTML = `
      إجمالي المبيعات<br>${data.total_revenue || 0} ريال
    `;

    document.getElementById("todayOrders").innerHTML = `
      طلبات اليوم<br>${data.today_orders || 0}
    `;

    // آخر 5 طلبات
    document.getElementById("latestOrders").innerHTML =
      (data.latest_orders || [])
        .map(o => `
          <div class="order-item">
            <strong>${o.id}</strong> — ${o.total_amount} ريال — ${o.status}
          </div>
        `)
        .join("");

    // آخر 5 عملاء
    document.getElementById("latestCustomers").innerHTML =
      (data.latest_customers || [])
        .map(c => `
          <div class="order-item">
            <strong>${c.name}</strong> — ${c.email || "—"}
          </div>
        `)
        .join("");

  } catch (err) {
    console.error("خطأ في تحميل الداشبورد:", err);
  }
}

/* ============================================================
   تشغيل الصفحة
   ============================================================ */

loadDashboard();
