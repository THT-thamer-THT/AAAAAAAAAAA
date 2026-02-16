// تسجيل الدخول والتحقق من الصلاحيات
function loginUser() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  if (!email || !password) {
    errorEl.textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور";
    return;
  }

  const users = getUsers(); // جلب جميع المستخدمين من storage.js
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    errorEl.textContent = "بيانات الدخول غير صحيحة";
    return;
  }

  setSession({ id: user.id, email: user.email, role: user.role });
  redirectByRole(user.role);
}

function redirectByRole(role) {
  if (role === "admin") {
    window.location.href = "admin.html";
  } else if (role === "merchant") {
    window.location.href = "merchant.html";
  }
}

function logoutUser() {
  clearSession();
  window.location.href = "index.html";
}

// حماية الصفحات: استدعاء عند تحميل أي لوحة
function protectPage(requiredRole) {
  const session = getSession();
  if (!session || session.role !== requiredRole) {
    alert("ليس لديك صلاحية للوصول لهذه الصفحة");
    window.location.href = "index.html";
  }
}

function hideAllSections() {
  // إخفاء صفحات التاجر
  const merchantSections = document.querySelectorAll("#merchantDashboard .merchant-main > div");
  merchantSections.forEach(sec => sec.style.display = "none");

  // إخفاء صفحة الدفع
  document.getElementById("paymentPage").style.display = "none";
}

function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  // بيانات الأدمن الحقيقية
  const adminEmail = "thamerman033@icloud.com";
  const adminPassword = "THT.ThaMer-123";

  if (email === adminEmail && password === adminPassword) {
    setCurrentUser({
      id: "ADMIN",
      email: adminEmail,
      role: "admin"
    });

    switchView("adminDashboard");
  } else {
    alert("بيانات الدخول غير صحيحة");
  }
}