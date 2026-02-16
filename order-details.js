/* ============================================================
   تفاصيل الطلب – Thamer SaaS
   متوافق مع النظام الموحد (JWT + RLS)
   ============================================================ */

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!role || !token) {
  window.location.href = "login.html";
}

// التاجر يرجع لصفحته
if (role !== "merchant") {
  window.location.href = "dashboard.html";
}

// قراءة ID من الرابط
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get("id");

const container = document.getElementById("orderDetails");

/* ============================================================
   تحميل تفاصيل الطلب
   ============================================================ */

async function loadOrderDetails() {
  if (!orderId) {
    container.innerHTML = "رقم الطلب غير موجود";
    return;
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get_order_details?id=${orderId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        }
      }
    );

    const data = await res.json();

    if (!data.order) {
      container.innerHTML = "لم يتم العثور على الطلب";
      return;
    }

    const order = data.order;

    container.innerHTML = `
      <strong>رقم الطلب:</strong> ${order.id}<br>
      <strong>السعر:</strong> ${order.total_amount} ريال<br>
      <strong>الحالة:</strong> ${order.status}<br>
      <strong>الدفع:</strong> ${order.payment_status}<br>
      <strong>التاريخ:</strong> ${new Date(order.created_at).toLocaleString("ar-SA")}<br>
      <hr>
      <h3>المنتجات</h3>
      ${(order.order_items || [])
        .map(item => `
          <div>
            ${item.products?.name || "منتج"} —
            ${item.quantity} × ${item.price} ريال
          </div>
        `).join("")}
    `;

  } catch (err) {
    container.innerHTML = "حدث خطأ أثناء تحميل الطلب";
  }
}

/* ============================================================
   تحديث حالة الطلب
   ============================================================ */

document.getElementById("updateStatusBtn").addEventListener("click", async () => {
  const newStatus = document.getElementById("statusSelect").value;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/update_order_status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          id: orderId,
          status: newStatus
        })
      }
    );

    const data = await res.json();

    if (data.success) {
      document.getElementById("statusMessage").innerHTML = "تم تحديث الحالة بنجاح";
      loadOrderDetails();
    } else {
      document.getElementById("statusMessage").innerHTML = "حدث خطأ أثناء التحديث";
    }

  } catch (err) {
    document.getElementById("statusMessage").innerHTML = "حدث خطأ أثناء التحديث";
  }
});

/* ============================================================
   تحميل الملاحظات
   ============================================================ */

async function loadNotes() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get_order_notes?id=${orderId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        }
      }
    );

    const data = await res.json();
    const notesDiv = document.getElementById("notesList");

    if (!data.notes || data.notes.length === 0) {
      notesDiv.innerHTML = "لا توجد ملاحظات";
      return;
    }

    notesDiv.innerHTML = data.notes
      .map(n => `
        <div style="padding:10px; border:1px solid #ddd; margin-bottom:8px; border-radius:6px;">
          <strong>${new Date(n.created_at).toLocaleString("ar-SA")}</strong><br>
          ${n.note}
        </div>
      `)
      .join("");

  } catch (err) {
    document.getElementById("notesList").innerHTML = "حدث خطأ أثناء تحميل الملاحظات";
  }
}

/* ============================================================
   إضافة ملاحظة
   ============================================================ */

document.getElementById("addNoteBtn").addEventListener("click", async () => {
  const note = document.getElementById("noteInput").value;

  if (!note.trim()) {
    document.getElementById("noteMessage").innerHTML = "اكتب ملاحظة أولاً";
    return;
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/add_order_note`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          order_id: orderId,
          note
        })
      }
    );

    const data = await res.json();

    if (data.success) {
      document.getElementById("noteMessage").innerHTML = "تمت إضافة الملاحظة";
      document.getElementById("noteInput").value = "";
      loadNotes();
    } else {
      document.getElementById("noteMessage").innerHTML = "حدث خطأ أثناء الإضافة";
    }

  } catch (err) {
    document.getElementById("noteMessage").innerHTML = "حدث خطأ أثناء الإضافة";
  }
});

/* ============================================================
   تشغيل الصفحة
   ============================================================ */

loadOrderDetails();
loadNotes();
