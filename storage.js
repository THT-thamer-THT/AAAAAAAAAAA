/* ============================================================
   Thamer SaaS – Storage Engine (Clean Version)
   نسخة موحدة – بدون تكرار – بدون تضارب – متوافقة 100%
   ============================================================ */

/* ================================
   0) دوال أساسية
   ================================ */

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback = null) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

/* ================================
   1) توليد ID موحد
   ================================ */

function generateId(prefix = "ID") {
  return prefix + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

/* ================================
   2) نظام المستخدم الحالي
   ================================ */

function setCurrentUser(user) {
  save("currentUser", user);
}

function getCurrentUser() {
  return load("currentUser", null);
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

/* ================================
   3) التجار (Merchants)
   ================================ */

function getMerchants() {
  return load("merchants", []);
}

function saveMerchants(list) {
  save("merchants", list);
}

function addMerchant(merchant) {
  const list = getMerchants();
  list.push(merchant);
  saveMerchants(list);
}

function updateMerchant(updated) {
  const list = getMerchants();
  const index = list.findIndex(m => m.id === updated.id);
  if (index !== -1) {
    list[index] = updated;
    saveMerchants(list);
  }
}

function updateMerchantStatus(id, newStatus) {
  const list = getMerchants();
  const m = list.find(x => x.id === id);
  if (m) {
    m.status = newStatus;
    saveMerchants(list);
  }
}

function updateMerchantPricing(id, pricing) {
  const list = getMerchants();
  const m = list.find(x => x.id === id);
  if (m) {
    m.customPricing = pricing;
    saveMerchants(list);
  }
}

function getCurrentMerchant() {
  const user = getCurrentUser();
  if (!user) return null;
  return getMerchants().find(m => m.id === user.id);
}

/* ================================
   4) ملفات التاجر
   ================================ */

function saveMerchantFiles(id, files) {
  const list = getMerchants();
  const m = list.find(x => x.id === id);
  if (m) {
    m.files = files;
    saveMerchants(list);
  }
}

function getMerchantFiles(id) {
  const m = getMerchants().find(x => x.id === id);
  return m?.files || {};
}

/* ================================
   5) الاشتراكات
   ================================ */

function getBasePlans() {
  return load("basePlans", { basic: 99, pro: 199 });
}

function saveBasePlans(plans) {
  save("basePlans", plans);
}

function getMerchantSubscription(id) {
  const m = getMerchants().find(x => x.id === id);
  return m?.subscription || null;
}

function saveMerchantSubscription(id, subscription) {
  const list = getMerchants();
  const m = list.find(x => x.id === id);
  if (m) {
    m.subscription = subscription;
    saveMerchants(list);
  }
}

/* ================================
   6) المنتجات
   ================================ */

function getProducts() {
  return load("products", []);
}

function saveProducts(list) {
  save("products", list);
}

function addProduct(product) {
  const list = getProducts();
  list.push(product);
  saveProducts(list);
}

function updateProduct(productId, data) {
  const list = getProducts();
  const p = list.find(x => x.id === productId);
  if (p) {
    Object.assign(p, data);
    saveProducts(list);
  }
}

function deleteProduct(productId) {
  let list = getProducts();
  list = list.filter(x => x.id !== productId);
  saveProducts(list);
}

/* ================================
   7) الفواتير
   ================================ */

function getInvoices() {
  return load("invoices", []);
}

function saveInvoices(list) {
  save("invoices", list);
}

function addInvoice(invoice) {
  const list = getInvoices();
  list.push(invoice);
  saveInvoices(list);
}

/* ================================
   8) روابط الدفع
   ================================ */

function getPaymentLinks() {
  return load("paymentLinks", []);
}

function savePaymentLinks(list) {
  save("paymentLinks", list);
}

/* ================================
   9) إعدادات الدفع (HyperPay)
   ================================ */

function getPaymentSettings() {
  return load("paymentSettings", null);
}

function savePaymentSettings(settings) {
  save("paymentSettings", settings);
}

/* ================================
   10) الطلبات
   ================================ */

function getOrders() {
  return load("orders", []);
}

function saveOrders(list) {
  save("orders", list);
}

/* ================================
   11) العملاء
   ================================ */

function getCustomers() {
  return load("customers", []);
}

function saveCustomers(list) {
  save("customers", list);
}

/* ================================
   12) القوائم
   ================================ */

function getLists() {
  return load("lists", []);
}

function saveLists(list) {
  save("lists", list);
}

/* ================================
   13) العروض
   ================================ */

function getOffers() {
  return load("offers", []);
}

function saveOffers(list) {
  save("offers", list);
}

/* ================================
   14) الكوبونات
   ================================ */

function getCoupons() {
  return load("coupons", []);
}

function saveCoupons(list) {
  save("coupons", list);
}

/* ================================
   15) شعار النظام
   ================================ */

function saveSystemLogo(logo) {
  save("systemLogo", logo);
}

function getSystemLogo() {
  return load("systemLogo", null);
}

// إدارة الجلسة وصلاحيات المستخدم
function setSession(user) {
  // user = { id, email, role }
  localStorage.setItem("session", JSON.stringify(user));
}

function getSession() {
  const session = localStorage.getItem("session");
  return session ? JSON.parse(session) : null;
}

function clearSession() {
  localStorage.removeItem("session");
}

function isAdmin() {
  const session = getSession();
  return session?.role === "admin";
}

function isMerchant() {
  const session = getSession();
  return session?.role === "merchant";
}
