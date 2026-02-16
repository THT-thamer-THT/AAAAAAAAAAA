const supabase = window.supabase.createClient(
  "https://aesmaafngzsztroqycto.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc21hYWZuZ3pzenRyb3F5Y3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTkxNTYsImV4cCI6MjA4NTg3NTE1Nn0.SQUx6nigie9kyHL7PtqeQNzXQEr4hKMCWmRT5CSQaBU"
);

const supabase = createClient(
  "https://aesmaafngzsztroqycto.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc21hYWZuZ3pzenRyb3F5Y3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTkxNTYsImV4cCI6MjA4NTg3NTE1Nn0.SQUx6nigie9kyHL7PtqeQNzXQEr4hKMCWmRT5CSQaBU"
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    message.innerHTML = "بيانات الدخول غير صحيحة";
    return;
  }

  const session = data.session;
  const user = data.user;

  // حفظ التوكن
  localStorage.setItem("token", session.access_token);

  // 🔥 جلب الدور من جدول user_roles باستخدام user_id
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleError || !roleData) {
    message.innerHTML = "لم يتم العثور على دور المستخدم";
    return;
  }

  localStorage.setItem("role", roleData.role);

  if (roleData.role === "admin") {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "orders.html";
  }
});
