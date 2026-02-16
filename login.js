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

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");

/* Auto redirect if already logged in */
window.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await redirectByRole(data.session.user.id);
  }
});

loginBtn.addEventListener("click", async () => {

  message.innerHTML = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    return showError("الرجاء إدخال البريد وكلمة المرور");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session) {
    return showError("بيانات الدخول غير صحيحة");
  }

  await redirectByRole(data.user.id);
});

async function redirectByRole(userId) {

  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !roleData) {
    await supabase.auth.signOut();
    return showError("لم يتم العثور على دور المستخدم");
  }

  if (roleData.role === "admin") {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "orders.html";
  }
}

function showError(text) {
  message.innerHTML = text;
}
