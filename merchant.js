/* ============================================================
   Thamer SaaS – Merchant Dashboard (Refactored)
   إعادة هيكلة كاملة – تنظيم – حماية – أداء أفضل
   ============================================================ */

/* ============================================
   0) المتغيرات العامة
   ============================================ */

let currentMerchant = null;
let currentCustomer = null;
let currentTicket = null;
let currentPaymentLinkId = null;

let infinitePage = 1;
let infiniteLoading = false;
let infiniteFinished = false;

/* ============================================
   1) حماية التاجر
   ============================================ */

function requireMerchant() {
  if (!currentMerchant) {
    logout();
    return false;
  }
  return true;
}

/* ============================================
   2) تسجيل الدخول العام (أدمن + تاجر)
   ============================================ */

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const error = document.getElementById("loginError");

  error.textContent = "";

  if (!email || !password) {
    error.textContent = "الرجاء إدخال البريد وكلمة المرور";
    return;
  }

  // تسجيل دخول الأدمن
  if (email === "thamerman033@icloud.com" && password === "THT.ThaMer-123") {
    document.getElementById("adminAvatar").textContent = email.charAt(0).toUpperCase();
    switchView("adminDashboard");
    switchDashboardView("dashboardMerchants");
    renderAdminMerchants();
    return;
  }

  // تسجيل دخول تاجر
  const merchant = loginMerchant(email, password);

  if (!merchant) {
    error.textContent = "بيانات الدخول غير صحيحة";
    return;
  }

  if (merchant.status === "pending") {
    error.textContent = "حسابك قيد المراجعة";
    return;
  }

  if (merchant.status === "rejected") {
    error.textContent = "تم رفض حسابك";
    return;
  }

  if (merchant.status === "suspended") {
    error.textContent = "تم إيقاف حسابك";
    return;
  }

  openMerchantDashboard(merchant);
}

/* ============================================
   3) فتح لوحة التاجر
   ============================================ */

function openMerchantDashboard(merchant) {
  currentMerchant = merchant;

  switchView("merchantDashboard");
  document.getElementById("merchantStoreName").textContent = merchant.storeName;

  // تحميل الصفحات الأساسية
  renderMerchantOverview(merchant.id);
  renderMerchantProducts(merchant.id, true);
  renderMerchantCustomers();
  renderMerchantOrders();
  renderMerchantOffers();
  renderMerchantCoupons();
  renderMerchantLists();
  renderMerchantPaymentLinks();
  renderMerchantSubscription(merchant.id);
  renderMerchantFiles(merchant.id);
}

/* ============================================
   4) إدارة التنقل بين صفحات التاجر
   ============================================ */

function switchMerchantView(view) {
  if (!requireMerchant()) return;

  // إخفاء كل الصفحات
  document.querySelectorAll(".merchant-section").forEach(sec => {
    sec.style.display = "none";
  });

  const page = document.getElementById(view);
  if (page) page.style.display = "block";

  // تشغيل دوال التحميل حسب الصفحة
  switch (view) {
    case "merchantProducts":
      renderMerchantProducts(currentMerchant.id, true);
      break;

    case "merchantCustomers":
      renderMerchantCustomers();
      break;

    case "merchantOrders":
      renderMerchantOrders();
      break;

    case "merchantOffers":
      renderMerchantOffers();
      break;

    case "merchantCoupons":
      renderMerchantCoupons();
      break;

    case "merchantLists":
      renderMerchantLists();
      break;

    case "merchantPaymentLinks":
      renderMerchantPaymentLinks();
      break;

    case "merchantOverview":
      renderMerchantOverview(currentMerchant.id);
      break;
  }
}

/* ============================================
   5) تسجيل تاجر جديد
   ============================================ */

function registerMerchant() {
  const storeName = document.getElementById("regStoreName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const error = document.getElementById("regError");

  error.textContent = "";

  if (!storeName || !email || !password) {
    error.textContent = "الرجاء تعبئة جميع الحقول";
    return;
  }

  const merchants = getMerchants();
  if (merchants.some(m => m.email === email)) {
    error.textContent = "هذا البريد مستخدم مسبقاً";
    return;
  }

  const merchant = {
    id: generateId("MER"),
    storeName,
    email,
    password,
    status: "pending",
    files: {},
    subscription: null,
    customPricing: null,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  addMerchant(merchant);

  alert("تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن");

  switchView("loginScreen");
  document.getElementById("loginEmail").value = email;
}

/* ============================================
   6) تسجيل الدخول كتاجر (دالة مساعدة)
   ============================================ */

function loginMerchant(email, password) {
  const merchants = getMerchants();
  return merchants.find(m => m.email === email && m.password === password);
}

/* ============================================================
   7) إدارة المنتجات
   ============================================================ */

function renderMerchantProducts(merchantId, reset = false) {
  if (!requireMerchant()) return;

  const container = document.getElementById("productsList");

  if (reset) {
    infinitePage = 1;
    infiniteFinished = false;
    container.innerHTML = "";
  }

  if (infiniteFinished || infiniteLoading) return;
  infiniteLoading = true;

  const sortType = document.getElementById("productSort")?.value || "newest";
  const searchText = document.getElementById("productSearch")?.value.toLowerCase() || "";

  let products = getProducts().filter(p => p.merchantId === merchantId);

  products = products.filter(p => p.name.toLowerCase().includes(searchText));

  switch (sortType) {
    case "newest":
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "oldest":
      products.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case "priceLow":
      products.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "priceHigh":
      products.sort((a, b) => Number(b.price) - Number(a.price));
      break;
  }

  if (reset) {
    const countEl = document.getElementById("productCount");
    if (countEl) countEl.textContent = `عدد المنتجات: ${products.length}`;
  }

  const perPage = 8;
  const start = (infinitePage - 1) * perPage;
  const end = start + perPage;

  const batch = products.slice(start, end);

  if (batch.length === 0) {
    infiniteFinished = true;
    infiniteLoading = false;
    return;
  }

  let html = "";
  batch.forEach(p => {
    const isNew = (Date.now() - new Date(p.createdAt).getTime()) < 86400000;

    html += `
      <div class="product-card">
        ${isNew ? `<span class="new-badge">جديد</span>` : ""}
        <div class="add-to-list-btn" onclick="openAddToList('${p.id}')">+</div>

        <img src="${p.image}" class="product-img">

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">${p.price} رس</p>
        </div>

        <div class="product-actions">
          <button onclick="editProduct('${p.id}')">تعديل</button>
          <button onclick="deleteProduct('${p.id}')">حذف</button>
        </div>
      </div>
    `;
  });

  container.innerHTML += html;

  infinitePage++;
  infiniteLoading = false;
}

function openAddProduct() {
  document.getElementById("addProductModal").style.display = "block";
}

function closeAddProduct() {
  document.getElementById("addProductModal").style.display = "none";
}

function resetProductForm() {
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodDesc").value = "";
  document.getElementById("prodImage").value = "";
  editingProductId = null;
}

let editingProductId = null;

function handleProductSave() {
  if (editingProductId) updateProduct();
  else saveNewProduct();
}

function saveNewProduct() {
  if (!requireMerchant()) return;

  const name = document.getElementById("prodName").value.trim();
  const price = document.getElementById("prodPrice").value.trim();
  const desc = document.getElementById("prodDesc").value.trim();
  const imageFile = document.getElementById("prodImage").files[0];

  if (!name || !price || !imageFile) {
    alert("الرجاء تعبئة الحقول المطلوبة");
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const products = getProducts();

    products.push({
      id: generateId("PROD"),
      merchantId: currentMerchant.id,
      name,
      price,
      description: desc,
      image: reader.result,
      createdAt: new Date().toISOString()
    });

    saveProducts(products);
    closeAddProduct();
    resetProductForm();
    renderMerchantProducts(currentMerchant.id, true);
  };

  reader.readAsDataURL(imageFile);
}

function editProduct(id) {
  const products = getProducts();
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingProductId = id;

  document.getElementById("prodName").value = product.name;
  document.getElementById("prodPrice").value = product.price;
  document.getElementById("prodDesc").value = product.description;

  document.getElementById("addProductModal").style.display = "block";
}

function updateProduct() {
  const name = document.getElementById("prodName").value.trim();
  const price = document.getElementById("prodPrice").value.trim();
  const desc = document.getElementById("prodDesc").value.trim();
  const imageFile = document.getElementById("prodImage").files[0];

  const products = getProducts();
  const index = products.findIndex(p => p.id === editingProductId);
  if (index === -1) return;

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function () {
      products[index].image = reader.result;
      products[index].name = name;
      products[index].price = price;
      products[index].description = desc;

      saveProducts(products);
      closeAddProduct();
      resetProductForm();
      renderMerchantProducts(currentMerchant.id, true);
    };
    reader.readAsDataURL(imageFile);
  } else {
    products[index].name = name;
    products[index].price = price;
    products[index].description = desc;

    saveProducts(products);
    closeAddProduct();
    resetProductForm();
    renderMerchantProducts(currentMerchant.id, true);
  }
}

function deleteProduct(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

  let products = getProducts();
  products = products.filter(p => p.id !== id);

  saveProducts(products);
  renderMerchantProducts(currentMerchant.id, true);
}

/* ============================================================
   8) إدارة القوائم
   ============================================================ */

function openAddToList(productId) {
  window.selectedProductForList = productId;
  document.getElementById("addToListModal").style.display = "flex";
}

function closeAddToList() {
  document.getElementById("addToListModal").style.display = "none";
}

function getLists() {
  return JSON.parse(localStorage.getItem("lists") || "[]");
}

function saveLists(lists) {
  localStorage.setItem("lists", JSON.stringify(lists));
}

function createNewList() {
  const container = document.getElementById("listContainer");

  container.innerHTML = `
    <div class="field">
      <label>اسم القائمة</label>
      <input id="newListName" type="text" placeholder="مثال: منتجات مميزة">
    </div>

    <button class="primary-btn" onclick="saveNewList()">حفظ القائمة</button>
    <button class="close-btn" onclick="loadListsIntoModal()">إلغاء</button>
  `;
}

function saveNewList() {
  const name = document.getElementById("newListName").value.trim();
  if (!name) {
    alert("الرجاء إدخال اسم القائمة");
    return;
  }

  const lists = getLists();

  lists.push({
    id: generateId("LIST"),
    merchantId: currentMerchant.id,
    name,
    products: []
  });

  saveLists(lists);
  loadListsIntoModal();
}

function loadListsIntoModal() {
  const container = document.getElementById("listContainer");
  const lists = getLists().filter(l => l.merchantId === currentMerchant.id);

  if (lists.length === 0) {
    container.innerHTML = `<p style="font-size:14px;color:#6b7280;">لا توجد قوائم حالياً</p>`;
    return;
  }

  let html = "";
  lists.forEach(list => {
    html += `
      <div class="list-item" onclick="addProductToList('${list.id}')">
        ${list.name}
      </div>
    `;
  });

  container.innerHTML = html;
}

function addProductToList(listId) {
  const lists = getLists();
  const list = lists.find(l => l.id === listId);

  if (!list) {
    alert("القائمة غير موجودة");
    return;
  }

  const productId = window.selectedProductForList;

  if (!list.products.includes(productId)) {
    list.products.push(productId);
  }

  saveLists(lists);
  closeAddToList();

  alert("تمت إضافة المنتج إلى القائمة بنجاح");
}

function renderMerchantLists() {
  const container = document.getElementById("listsGrid");
  const lists = getLists().filter(l => l.merchantId === currentMerchant.id);

  if (lists.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد قوائم حالياً</p>`;
    return;
  }

  let html = "";
  lists.forEach(list => {
    html += `
      <div class="list-card">
        <h4>${list.name}</h4>
        <p>عدد المنتجات: ${list.products.length}</p>

        <button class="list-open-btn" onclick="openList('${list.id}')">فتح</button>
        <button class="list-delete-btn" onclick="deleteList('${list.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteList(listId) {
  if (!confirm("هل تريد حذف هذه القائمة؟")) return;

  let lists = getLists();
  lists = lists.filter(l => l.id !== listId);
  saveLists(lists);

  renderMerchantLists();
}

function openList(listId) {
  const lists = getLists();
  const list = lists.find(l => l.id === listId);

  if (!list) {
    alert("القائمة غير موجودة");
    return;
  }

  document.getElementById("listViewTitle").textContent = list.name;
  renderListProducts(list);

  switchMerchantView("merchantListView");
}

function renderListProducts(list) {
  const container = document.getElementById("listProductsGrid");
  const products = getProducts().filter(p => list.products.includes(p.id));

  if (products.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد منتجات في هذه القائمة</p>`;
    return;
  }

  let html = "";
  products.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.image}" class="product-img">

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">${p.price} رس</p>
        </div>

        <div class="product-actions">
          <button onclick="removeProductFromList('${list.id}', '${p.id}')">حذف من القائمة</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function removeProductFromList(listId, productId) {
  const lists = getLists();
  const list = lists.find(l => l.id === listId);

  if (!list) return;

  list.products = list.products.filter(id => id !== productId);

  saveLists(lists);
  renderListProducts(list);
}

/* ============================================================
   9) إدارة العروض
   ============================================================ */

function renderMerchantOffers() {
  const container = document.getElementById("offersGrid");
  const offers = getOffers().filter(o => o.merchantId === currentMerchant.id);

  if (offers.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد عروض حالياً</p>`;
    return;
  }

  let html = "";
  offers.forEach(offer => {
    html += `
      <div class="offer-card">
        <h4>${offer.name}</h4>
        <p>السعر: ${offer.price} رس</p>
        <p>عدد المنتجات: ${offer.products.length}</p>

        <button class="offer-open-btn" onclick="openOffer('${offer.id}')">فتح</button>
        <button class="offer-delete-btn" onclick="deleteOffer('${offer.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openCreateOffer() {
  document.getElementById("offerName").value = "";
  document.getElementById("offerPrice").value = "";

  loadOfferProductsList();

  document.getElementById("createOfferModal").style.display = "flex";
}

function closeCreateOffer() {
  document.getElementById("createOfferModal").style.display = "none";
}

function loadOfferProductsList() {
  const container = document.getElementById("offerProductsList");
  const products = getProducts().filter(p => p.merchantId === currentMerchant.id);

  if (products.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد منتجات</p>`;
    return;
  }

  let html = "";
  products.forEach(p => {
    html += `
      <label class="offer-product-item">
        <input type="checkbox" value="${p.id}">
        ${p.name} — ${p.price} رس
      </label>
    `;
  });

  container.innerHTML = html;
}

function saveNewOffer() {
  const name = document.getElementById("offerName").value.trim();
  const price = Number(document.getElementById("offerPrice").value);

  if (!name || !price) {
    alert("الرجاء إدخال اسم العرض والسعر");
    return;
  }

  const selectedProducts = Array.from(
    document.querySelectorAll("#offerProductsList input:checked")
  ).map(input => input.value);

  if (selectedProducts.length === 0) {
    alert("الرجاء اختيار منتج واحد على الأقل");
    return;
  }

  const offers = getOffers();

  offers.push({
    id: generateId("OFFER"),
    merchantId: currentMerchant.id,
    name,
    price,
    products: selectedProducts
  });

  saveOffers(offers);

  closeCreateOffer();
  renderMerchantOffers();

  alert("تم إنشاء العرض بنجاح");
}

function openOffer(offerId) {
  const offers = getOffers();
  const offer = offers.find(o => o.id === offerId);

  if (!offer) {
    alert("العرض غير موجود");
    return;
  }

  document.getElementById("offerViewTitle").textContent = offer.name;
  document.getElementById("offerViewPrice").textContent = "السعر: " + offer.price + " رس";

  renderOfferProducts(offer);

  switchMerchantView("merchantOfferView");
}

function renderOfferProducts(offer) {
  const container = document.getElementById("offerProductsGrid");
  const products = getProducts().filter(p => offer.products.includes(p.id));

  if (products.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد منتجات في هذا العرض</p>`;
    return;
  }

  let html = "";
  products.forEach(p => {
    html += `
      <div class="product-card">
        <img src="${p.image}" class="product-img">

        <div class="product-info">
          <h3>${p.name}</h3>
          <p class="price">${p.price} رس</p>
        </div>

        <div class="product-actions">
          <button onclick="removeProductFromOffer('${offer.id}', '${p.id}')">حذف من العرض</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function removeProductFromOffer(offerId, productId) {
  const offers = getOffers();
  const offer = offers.find(o => o.id === offerId);

  if (!offer) return;

  offer.products = offer.products.filter(id => id !== productId);

  saveOffers(offers);
  renderOfferProducts(offer);
}

/* ============================================================
   10) إدارة الكوبونات
   ============================================================ */

function renderMerchantCoupons() {
  const container = document.getElementById("couponsGrid");
  const coupons = getCoupons().filter(c => c.merchantId === currentMerchant.id);

  if (coupons.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد كوبونات حالياً</p>`;
    return;
  }

  let html = "";
  coupons.forEach(coupon => {
    html += `
      <div class="coupon-card">
        <h4>${coupon.code}</h4>

        <p>النوع: ${coupon.type === "percent" ? "خصم نسبة" : "خصم مبلغ"}</p>
        <p>القيمة: ${coupon.value} ${coupon.type === "percent" ? "%" : "رس"}</p>
        <p>ينتهي في: ${coupon.expires}</p>
        <p>الحالة: ${coupon.active ? "مفعل" : "غير مفعل"}</p>

        <button class="coupon-open-btn" onclick="openCoupon('${coupon.id}')">فتح</button>
        <button class="coupon-delete-btn" onclick="deleteCoupon('${coupon.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openCreateCoupon() {
  document.getElementById("couponCode").value = "";
  document.getElementById("couponValue").value = "";
  document.getElementById("couponExpires").value = "";
  document.getElementById("couponType").value = "percent";
  document.getElementById("couponActive").value = "true";

  document.getElementById("createCouponModal").style.display = "flex";
}

function closeCreateCoupon() {
  document.getElementById("createCouponModal").style.display = "none";
}

/* ============================================================
   حفظ الكوبون الجديد
   ============================================================ */

function saveNewCoupon() {
  const code = document.getElementById("couponCode").value.trim();
  const type = document.getElementById("couponType").value;
  const value = Number(document.getElementById("couponValue").value);
  const expires = document.getElementById("couponExpires").value;
  const active = document.getElementById("couponActive").value === "true";

  if (!code || !value || !expires) {
    alert("الرجاء إدخال جميع البيانات المطلوبة");
    return;
  }

  const coupons = getCoupons();

  // منع تكرار الكود
  if (coupons.some(c => c.code.toLowerCase() === code.toLowerCase())) {
    alert("هذا الكود مستخدم مسبقاً");
    return;
  }

  coupons.push({
    id: generateId("COUPON"),
    merchantId: currentMerchant.id,
    code,
    type,
    value,
    expires,
    active
  });

  saveCoupons(coupons);

  closeCreateCoupon();
  renderMerchantCoupons();

  alert("تم إنشاء الكوبون بنجاح");
}

/* ============================================================
   عرض تفاصيل كوبون معين
   ============================================================ */

function openCoupon(couponId) {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.id === couponId);

  if (!coupon) {
    alert("الكوبون غير موجود");
    return;
  }

  document.getElementById("couponViewCode").textContent = "الكود: " + coupon.code;
  document.getElementById("couponViewType").textContent =
    "النوع: " + (coupon.type === "percent" ? "خصم نسبة (%)" : "خصم مبلغ ثابت");
  document.getElementById("couponViewValue").textContent =
    "القيمة: " + coupon.value + (coupon.type === "percent" ? "%" : " رس");
  document.getElementById("couponViewExpires").textContent =
    "ينتهي في: " + coupon.expires;
  document.getElementById("couponViewStatus").textContent =
    "الحالة: " + (coupon.active ? "مفعل" : "غير مفعل");

  const toggleBtn = document.getElementById("toggleCouponBtn");
  toggleBtn.textContent = coupon.active ? "تعطيل الكوبون" : "تفعيل الكوبون";
  toggleBtn.onclick = () => toggleCouponStatus(coupon.id);

  switchMerchantView("merchantCouponView");
}

/* ============================================================
   تفعيل / تعطيل الكوبون
   ============================================================ */

function toggleCouponStatus(couponId) {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.id === couponId);

  if (!coupon) return;

  coupon.active = !coupon.active;

  saveCoupons(coupons);

  openCoupon(couponId); // إعادة تحميل الصفحة
}

/* ============================================================
   حذف كوبون
   ============================================================ */

function deleteCoupon(couponId) {
  if (!confirm("هل تريد حذف هذا الكوبون؟")) return;

  let coupons = getCoupons();
  coupons = coupons.filter(c => c.id !== couponId);
  saveCoupons(coupons);

  renderMerchantCoupons();
}

/* ============================================================
   11) إدارة الطلبات
   ============================================================ */

function renderMerchantOrders() {
  const container = document.getElementById("ordersGrid");
  const orders = getOrders().filter(o => o.merchantId === currentMerchant.id);

  if (orders.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد طلبات حالياً</p>`;
    return;
  }

  let html = "";
  orders.forEach(order => {
    html += `
      <div class="order-card">
        <h4>طلب رقم: ${order.id}</h4>
        <p>التاريخ: ${order.createdAt}</p>
        <p>طريقة الدفع: ${order.paymentMethod === "online" ? "دفع إلكتروني" : "دفع عند الاستلام"}</p>
        <p>الإجمالي: ${order.total} رس</p>
        <p>الحالة: ${translateOrderStatus(order.status)}</p>

        <button class="order-open-btn" onclick="openOrder('${order.id}')">فتح</button>
        <button class="order-delete-btn" onclick="deleteOrder('${order.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openOrder(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    alert("الطلب غير موجود");
    return;
  }

  document.getElementById("orderViewId").textContent = "طلب رقم: " + order.id;
  document.getElementById("orderViewDate").textContent = "التاريخ: " + order.createdAt;
  document.getElementById("orderViewPayment").textContent =
    "طريقة الدفع: " + (order.paymentMethod === "online" ? "دفع إلكتروني" : "دفع عند الاستلام");
  document.getElementById("orderViewSubtotal").textContent = "المجموع قبل الخصم: " + order.subtotal + " رس";
  document.getElementById("orderViewDiscount").textContent = "الخصم: " + order.discount + " رس";
  document.getElementById("orderViewTotal").textContent = "الإجمالي: " + order.total + " رس";
  document.getElementById("orderViewCoupon").textContent =
    "الكوبون المستخدم: " + (order.coupon ? order.coupon : "لا يوجد");
  document.getElementById("orderViewStatus").textContent =
    "الحالة: " + translateOrderStatus(order.status);

  document.getElementById("orderStatusSelect").value = order.status;

  renderOrderItems(order);

  switchMerchantView("merchantOrderView");
}

function renderOrderItems(order) {
  const container = document.getElementById("orderItemsGrid");

  if (order.items.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد منتجات في هذا الطلب</p>`;
    return;
  }

  let html = "";
  order.items.forEach(item => {
    const isProduct = item.type === "product";
    const data = isProduct
      ? getProducts().find(p => p.id === item.id)
      : getOffers().find(o => o.id === item.id);

    if (!data) return;

    html += `
      <div class="product-card">
        ${isProduct ? `<img src="${data.image}" class="product-img">` : ""}

        <div class="product-info">
          <h3>${data.name}</h3>
          <p class="price">السعر: ${item.price} رس</p>
          <p class="price">الكمية: ${item.qty}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function updateOrderStatus() {
  const newStatus = document.getElementById("orderStatusSelect").value;

  const orders = getOrders();
  const orderId = document.getElementById("orderViewId").textContent.replace("طلب رقم: ", "");
  const order = orders.find(o => o.id === orderId);

  if (!order) return;

  order.status = newStatus;

  logActivity(order.customerId, "تغيير حالة الطلب إلى: " + translateOrderStatus(newStatus));

  saveOrders(orders);

  document.getElementById("orderViewStatus").textContent =
    "الحالة: " + translateOrderStatus(newStatus);

  alert("تم تحديث حالة الطلب");
}

function deleteOrder(orderId) {
  if (!confirm("هل تريد حذف هذا الطلب؟")) return;

  let orders = getOrders();
  orders = orders.filter(o => o.id !== orderId);
  saveOrders(orders);

  renderMerchantOrders();
}

function createOrder({ merchantId, items, subtotal, discount, total, coupon, paymentMethod }) {
  const orders = getOrders();

  const newOrder = {
    id: generateId("ORDER"),
    merchantId,
    items,
    subtotal,
    discount,
    total,
    coupon,
    paymentMethod,
    status: "pending",
    createdAt: new Date().toLocaleString("ar-SA")
  };

  orders.push(newOrder);
  saveOrders(orders);

  return newOrder.id;
}

/* ============================================================
   12) إدارة العملاء
   ============================================================ */

function renderMerchantCustomers() {
  const container = document.getElementById("customersGrid");
  const customers = getCustomers();

  if (customers.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا يوجد عملاء حالياً</p>`;
    return;
  }

  let html = "";
  customers.forEach(customer => {
    html += `
      <div class="customer-card">
        <h4>${customer.name}</h4>
        <p>رقم الجوال: ${customer.phone}</p>
        <p>عدد الطلبات: ${customer.totalOrders}</p>
        <p>إجمالي المشتريات: ${customer.totalSpent} رس</p>
        <p>آخر طلب: ${customer.lastOrderId ? customer.lastOrderId : "لا يوجد"}</p>

        <button class="customer-open-btn" onclick="openCustomer('${customer.id}')">فتح</button>
        <button class="customer-delete-btn" onclick="deleteCustomer('${customer.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openCustomer(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    alert("العميل غير موجود");
    return;
  }

  currentCustomer = customer;

  document.getElementById("customerViewName").textContent = "الاسم: " + customer.name;
  document.getElementById("customerViewPhone").textContent = "الجوال: " + customer.phone;
  document.getElementById("customerViewEmail").textContent = "البريد: " + (customer.email || "لا يوجد");
  document.getElementById("customerViewCreated").textContent = "تاريخ التسجيل: " + customer.createdAt;
  document.getElementById("customerViewOrders").textContent = "عدد الطلبات: " + customer.totalOrders;
  document.getElementById("customerViewSpent").textContent = "إجمالي المشتريات: " + customer.totalSpent + " رس";
  document.getElementById("customerViewLastOrder").textContent =
    "آخر طلب: " + (customer.lastOrderId ? customer.lastOrderId : "لا يوجد");

  renderCustomerOrders(customer.id);
  renderCustomerTickets(customer.id);
  renderCustomerActivity(customer.id);
  renderCustomerMessages(customer.id);
  renderCustomerNotes(customer.id);
  renderCustomerAddresses(customer.id);
  renderCustomerAnalytics(customer.id);

  switchMerchantView("merchantCustomerView");
}

function deleteCustomer(customerId) {
  if (!confirm("هل تريد حذف هذا العميل؟")) return;

  let customers = getCustomers();
  customers = customers.filter(c => c.id !== customerId);
  saveCustomers(customers);

  renderMerchantCustomers();
}

/* ============================================================
   13) إدارة العناوين
   ============================================================ */

function saveCustomerAddress() {
  const city = document.getElementById("addressCity").value.trim();
  const district = document.getElementById("addressDistrict").value.trim();
  const street = document.getElementById("addressStreet").value.trim();
  const details = document.getElementById("addressDetails").value.trim();

  if (!city || !district || !street) {
    alert("المدينة والحي والشارع مطلوبة");
    return;
  }

  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  if (!customer.addresses) customer.addresses = [];

  const newAddress = {
    id: generateId("ADDR"),
    city,
    district,
    street,
    details,
    isDefault: customer.addresses.length === 0
  };

  logActivity(currentCustomer.id, "إضافة عنوان جديد");
  customer.addresses.push(newAddress);
  saveCustomers(customers);

  closeAddAddress();
  renderCustomerAddresses(customer.id);
}

function renderCustomerAddresses(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  const container = document.getElementById("customerAddresses");

  if (!customer.addresses || customer.addresses.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد عناوين</p>`;
    return;
  }

  let html = "";
  customer.addresses.forEach(addr => {
    html += `
      <div class="address-card">
        <p><strong>${addr.city}</strong> — ${addr.district}</p>
        <p>${addr.street}</p>
        <p style="color:#6b7280;">${addr.details || ""}</p>

        ${addr.isDefault ? `<span class="tag">العنوان الافتراضي</span>` : ""}

        <button class="close-btn" onclick="deleteCustomerAddress('${addr.id}')">حذف</button>
        ${!addr.isDefault ? `<button class="primary-btn" onclick="setDefaultAddress('${addr.id}')">تعيين كافتراضي</button>` : ""}
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteCustomerAddress(addressId) {
  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  customer.addresses = customer.addresses.filter(a => a.id !== addressId);

  if (!customer.addresses.some(a => a.isDefault) && customer.addresses.length > 0) {
    customer.addresses[0].isDefault = true;
  }

  logActivity(currentCustomer.id, "حذف عنوان");
  saveCustomers(customers);
  renderCustomerAddresses(customer.id);
}

function setDefaultAddress(addressId) {
  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  customer.addresses.forEach(a => a.isDefault = false);
  const addr = customer.addresses.find(a => a.id === addressId);
  addr.isDefault = true;

  logActivity(currentCustomer.id, "تعيين عنوان افتراضي");
  saveCustomers(customers);
  renderCustomerAddresses(customer.id);
}

/* ============================================================
   14) إدارة الملاحظات
   ============================================================ */

function saveCustomerNote() {
  const text = document.getElementById("noteText").value.trim();
  if (!text) {
    alert("الرجاء كتابة الملاحظة");
    return;
  }

  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  if (!customer.notes) customer.notes = [];

  customer.notes.push({
    id: generateId("NOTE"),
    text,
    date: new Date().toLocaleString("ar-SA")
  });

  logActivity(currentCustomer.id, "إضافة ملاحظة");

  saveCustomers(customers);

  closeAddNote();
  renderCustomerNotes(currentCustomer.id);
}

function renderCustomerNotes(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  const container = document.getElementById("customerNotes");

  if (!customer.notes || customer.notes.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد ملاحظات</p>`;
    return;
  }

  let html = "";
  customer.notes.forEach(note => {
    html += `
      <div class="note-card">
        <p>${note.text}</p>
        <small style="color:#6b7280;">${note.date}</small>
        <button class="close-btn" onclick="deleteCustomerNote('${note.id}')">حذف</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function deleteCustomerNote(noteId) {
  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  customer.notes = customer.notes.filter(n => n.id !== noteId);

  logActivity(currentCustomer.id, "حذف ملاحظة");

  saveCustomers(customers);
  renderCustomerNotes(currentCustomer.id);
}

/* ============================================================
   15) إدارة الرسائل
   ============================================================ */

function saveCustomerMessage() {
  const type = document.getElementById("messageType").value;
  const text = document.getElementById("messageText").value.trim();

  if (!text) {
    alert("الرجاء كتابة نص الرسالة");
    return;
  }

  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  if (!customer.messages) customer.messages = [];

  const newMessage = {
    id: generateId("MSG"),
    type,
    text,
    date: new Date().toLocaleString("ar-SA")
  };

  customer.messages.push(newMessage);
  saveCustomers(customers);

  logActivity(currentCustomer.id, `إرسال رسالة (${type.toUpperCase()})`);

  closeSendMessage();
  renderCustomerMessages(customer.id);

  document.getElementById("messageText").value = "";
}

function renderCustomerMessages(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  const container = document.getElementById("customerMessages");

  if (!customer.messages || customer.messages.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد رسائل</p>`;
    return;
  }

  let html = "";
  customer.messages.slice().reverse().forEach(m => {
    html += `
      <div class="message-card">
        <p><strong>${m.type.toUpperCase()}</strong></p>
        <p>${m.text}</p>
        <small style="color:#6b7280;">${m.date}</small>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* ============================================================
   16) إدارة التذاكر
   ============================================================ */

function saveCustomerTicket() {
  const title = document.getElementById("ticketTitle").value.trim();
  const message = document.getElementById("ticketMessage").value.trim();

  if (!title || !message) {
    alert("العنوان والوصف مطلوبان");
    return;
  }

  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  if (!customer.tickets) customer.tickets = [];

  const newTicket = {
    id: generateId("TKT"),
    title,
    message,
    status: "open",
    createdAt: new Date().toLocaleString("ar-SA"),
    replies: []
  };

  customer.tickets.push(newTicket);
  saveCustomers(customers);

  logActivity(currentCustomer.id, "فتح تذكرة دعم");

  closeAddTicket();
  renderCustomerTickets(customer.id);

  document.getElementById("ticketTitle").value = "";
  document.getElementById("ticketMessage").value = "";
}

function renderCustomerTickets(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  const container = document.getElementById("customerTickets");

  if (!customer.tickets || customer.tickets.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد تذاكر</p>`;
    return;
  }

  let html = "";
  customer.tickets.forEach(t => {
    html += `
      <div class="ticket-card">
        <h4>${t.title}</h4>
        <p>${t.message}</p>
        <p style="color:#6b7280;">${t.createdAt}</p>
        <p>الحالة: ${t.status === "open" ? "مفتوحة" : "مغلقة"}</p>

        <button class="primary-btn" onclick="openTicket('${t.id}')">عرض التذكرة</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openTicket(ticketId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === currentCustomer.id);

  currentTicket = customer.tickets.find(t => t.id === ticketId);

  document.getElementById("ticketDetails").innerHTML = `
    <h3>${currentTicket.title}</h3>
    <p>${currentTicket.message}</p>
    <p style="color:#6b7280;">${currentTicket.createdAt}</p>
    <p>الحالة: ${currentTicket.status === "open" ? "مفتوحة" : "مغلقة"}</p>
  `;

  renderTicketReplies();

  switchMerchantView("ticketView");
}

function renderTicketReplies() {
  const container = document.getElementById("ticketReplies");

  if (!currentTicket.replies || currentTicket.replies.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا توجد ردود</p>`;
    return;
  }

  let html = "";
  currentTicket.replies.forEach(r => {
    html += `
      <div class="reply-card">
        <p>${r.text}</p>
        <small style="color:#6b7280;">${r.date}</small>
      </div>
    `;
  });

  container.innerHTML = html;
}

function addTicketReply() {
  const text = document.getElementById("ticketReplyInput").value.trim();
  if (!text) return;

  let customers = getCustomers();
  let customer = customers.find(c => c.id === currentCustomer.id);

  logActivity(currentCustomer.id, "إضافة رد على تذكرة");

  const ticket = customer.tickets.find(t => t.id === currentTicket.id);

  ticket.replies.push({
    text,
    date: new Date().toLocaleString("ar-SA")
  });

  saveCustomers(customers);

  document.getElementById("ticketReplyInput").value = "";
  renderTicketReplies();
}

function logActivity(customerId, action) {
  let customers = getCustomers();
  let customer = customers.find(c => c.id === customerId);

  if (!customer.activity) customer.activity = [];

  customer.activity.push({
    id: generateId("ACT"),
    action,
    date: new Date().toLocaleString("ar-SA")
  });

  saveCustomers(customers);
}

function renderCustomerActivity(customerId) {
  const customers = getCustomers();
  const customer = customers.find(c => c.id === customerId);

  const container = document.getElementById("customerActivity");

  if (!customer.activity || customer.activity.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;">لا يوجد نشاط</p>`;
    return;
  }

  let html = "";
  customer.activity.slice().reverse().forEach(a => {
    html += `
      <div class="activity-card">
        <p>${a.action}</p>
        <small style="color:#6b7280;">${a.date}</small>
      </div>
    `;
  });

  container.innerHTML = html;
}

async function startOnlinePayment() {
  const settings = getPaymentSettings();
  const link = getPaymentLinks().find(l => l.id === currentPaymentLinkId);

  if (!settings || !settings.entityId || !settings.accessToken) {
    alert("إعدادات HyperPay غير مكتملة");
    return;
  }

  const amount = link.amount;
  const entityId = settings.entityId;
  const token = settings.accessToken;
  const mode = settings.mode;

  const url =
    mode === "test"
      ? "https://eu-test.oppwa.com/v1/checkouts"
      : "https://eu-prod.oppwa.com/v1/checkouts";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `entityId=${entityId}&amount=${amount}&currency=SAR&paymentType=DB`
    });

    const data = await response.json();

    if (data.id) {
      link.checkoutId = data.id;

      const links = getPaymentLinks();
      const index = links.findIndex(l => l.id === link.id);
      links[index] = link;
      savePaymentLinks(links);

      openHyperPayPage(data.id, mode);
    } else {
      alert("فشل إنشاء عملية الدفع");
    }
  } catch (err) {
    alert("خطأ أثناء الاتصال بـ HyperPay");
    console.error(err);
  }
}

function openHyperPayPage(checkoutId, mode) {
  window.location.href = `hyperpay.html?checkoutId=${checkoutId}&mode=${mode}`;
}

function markPaymentAsPaid(id) {
  const links = getPaymentLinks();
  const link = links.find(l => l.id === id);

  if (!link) return;

  link.status = "paid";
  link.paidAt = new Date().toISOString();

  savePaymentLinks(links);

  alert("تم تحديث حالة الدفع إلى مدفوع");
  renderPaymentLinks();
}

document.getElementById("cashConfirmBtn").onclick = function () {
  if (!currentPaymentLinkId) return;

  const orderId = createOrder({
    merchantId: currentMerchant.id,
    items: window.currentCartItems,
    subtotal: window.currentSubtotal,
    discount: window.currentDiscount,
    total: window.currentTotal,
    coupon: window.currentCoupon,
    paymentMethod: "cash"
  });

  markPaymentAsPaid(currentPaymentLinkId);
  goBackToMerchant();
};

function goBackToMerchant() {
  switchMerchantView("merchantPaymentLinks");
}

function openAddCustomer() {
  document.getElementById("addCustomerModal").style.display = "block";
}
function closeAddCustomer() {
  document.getElementById("addCustomerModal").style.display = "none";
}

function openAddNote() {
  document.getElementById("addNoteModal").style.display = "block";
}
function closeAddNote() {
  document.getElementById("addNoteModal").style.display = "none";
}

function openAddAddress() {
  document.getElementById("addAddressModal").style.display = "block";
}
function closeAddAddress() {
  document.getElementById("addAddressModal").style.display = "none";
}

function openAddTicket() {
  document.getElementById("addTicketModal").style.display = "block";
}
function closeAddTicket() {
  document.getElementById("addTicketModal").style.display = "none";
}

function openSendMessage() {
  document.getElementById("sendMessageModal").style.display = "block";
}
function closeSendMessage() {
  document.getElementById("sendMessageModal").style.display = "none";
}

function translateOrderStatus(status) {
  switch (status) {
    case "pending": return "قيد الانتظار";
    case "processing": return "قيد المعالجة";
    case "completed": return "مكتمل";
    case "canceled": return "ملغي";
    default: return status;
  }
}

function getCustomers() {
  return JSON.parse(localStorage.getItem("customers") || "[]");
}
function saveCustomers(customers) {
  localStorage.setItem("customers", JSON.stringify(customers));
}

function getOrders() {
  return JSON.parse(localStorage.getItem("orders") || "[]");
}
function saveOrders(orders) {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function getOffers() {
  return JSON.parse(localStorage.getItem("offers") || "[]");
}
function saveOffers(offers) {
  localStorage.setItem("offers", JSON.stringify(offers));
}

function getCoupons() {
  return JSON.parse(localStorage.getItem("coupons") || "[]");
}
function saveCoupons(coupons) {
  localStorage.setItem("coupons", JSON.stringify(coupons));
}

