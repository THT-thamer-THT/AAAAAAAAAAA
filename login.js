import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://aesmaafngzsztroqycto.supabase.co",
  "sb_publishable_2ctpIU8-GlVXwq_5E8hLig_pdLZHne7"
);

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    message.innerHTML = "الرجاء إدخال البريد وكلمة المرور";
    return;
  }

  // تسجيل الدخول عبر Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.innerHTML = "بيانات الدخول غير صحيحة";
    return;
  }

  const session = data.session;

  // حفظ التوكن
  localStorage.setItem("token", session.access_token);

  // جلب بيانات التاجر من جدول merchants
  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("email", email)
    .single();

  if (!merchant) {
    message.innerHTML = "لم يتم العثور على حساب التاجر";
    return;
  }

  // حفظ الدور
  localStorage.setItem("role", merchant.role);

  // 🔥 حفظ merchant_id (مهم جدًا)
  localStorage.setItem("merchant_id", merchant.id);

  // توجيه حسب الدور
  if (merchant.role === "admin") {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "orders.html";
  }
});
