/* ============================================================
   لوحة التحكم – Thamer SaaS (Enterprise Version)
============================================================ */

const SUPABASE_URL = "https://aesmaafngzsztroqycto.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc21hYWZuZ3pzenRyb3F5Y3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTkxNTYsImV4cCI6MjA4NTg3NTE1Nn0.SQUx6nigie9kyHL7PtqeQNzXQEr4hKMCWmRT5CSQaBU";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

/* ============================================================
   INIT
============================================================ */

window.addEventListener("DOMContentLoaded", async () => {

  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    window.location.href = "login.html";
    return;
  }

  await loadDashboard(data.session.access_token);
});

/* ============================================================
   LOAD DASHBOARD
============================================================ */

async function loadDashboard(token) {

  try {

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get_dashboard`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    if (res.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "login.html";
      return;
    }

    if (res.status === 403) {
      window.location.href = "orders.html";
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    document.getElementById("totalOrders").innerHTML =
      `إجمالي الطلبات<br>${data.total_orders || 0}`;

    document.getElementById("totalCustomers").innerHTML =
      `إجمالي العملاء<br>${data.total_customers || 0}`;

    document.getElementById("totalRevenue").innerHTML =
      `إجمالي المبيعات<br>${data.total_revenue || 0} ريال`;

    document.getElementById("todayOrders").innerHTML =
      `طلبات اليوم<br>${data.today_orders || 0}`;

    document.getElementById("latestOrders").innerHTML =
      (data.latest_orders || [])
        .map(o => `
          <div class="order-item">
            <strong>${o.id}</strong> — ${o.total_amount} ريال — ${o.status}
          </div>
        `)
        .join("");

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
