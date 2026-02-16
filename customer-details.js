/* ============================================================
   تفاصيل العميل – Thamer SaaS
   متوافق مع النظام الموحد (JWT + RLS)
   ============================================================ */

// ⚠️ تأكد أنك حاط القيم الصحيحة هنا أو تجيبها من ملف config
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!role || !token) {
  window.location.href = "login.html";
}

// فقط الأدمن يقدر يشوف صفحة تفاصيل العميل
if (role !== "admin") {
  window.location.href = "orders.html";
}

// قراءة ID من الرابط
const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get("id");

const customerInfo = document.getElementById("customerInfo");
const ordersList = document.getElementById("ordersList");

if (!customerId) {
  customerInfo.innerHTML = "معرف العميل غير موجود";
}

/* ============================================================
   جلب تفاصيل العميل
   ============================================================ */

async function loadCustomerDetails() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get_customer_details?id=${customerId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        }
      }
    );

    const data = await res.json();

    if (!data.customer) {
      customerInfo.innerHTML = "لم يتم العثور على العميل";
      return;
    }

    const c = data.customer;

    customerInfo.innerHTML = `
      <strong>الاسم:</strong> ${c.name || "—"}<br>
      <strong>البريد:</strong> ${c.email || "—"}<br>
      <strong>عدد الطلبات:</strong> ${c.orders_count || 0}<br>
      <strong>إجمالي المبالغ:</strong> ${c.total_spent || 0} ريال<br>
      <strong>آخر طلب:</strong> ${c.last_order_date || "لا يوجد"}<br>
    `;

    // عرض الطلبات
    if (!data.orders || data.orders.length === 0) {
      ordersList.innerHTML = "لا توجد طلبات";
      return;
    }

    ordersList.innerHTML = data.orders
      .map(
        (o) => `
        <div class="order-item">
          <strong>رقم الطلب:</strong> ${o.id}<br>
          <strong>السعر:</strong> ${o.total_amount} ريال<br>
          <strong>الحالة:</strong> ${o.status}<br>
          <strong>التاريخ:</strong> ${new Date(o.created_at).toLocaleString("ar-SA")}<br>
          <button onclick="openOrder('${o.id}')">عرض التفاصيل</button>
        </div>
      `
      )
      .join("");

  } catch (err) {
    customerInfo.innerHTML = "حدث خطأ أثناء تحميل البيانات";
  }
}

/* ============================================================
   فتح تفاصيل الطلب
   ============================================================ */

function openOrder(id) {
  window.location.href = `order-details.html?id=${id}`;
}

/* ============================================================
   تشغيل الصفحة
   ============================================================ */

loadCustomerDetails();
