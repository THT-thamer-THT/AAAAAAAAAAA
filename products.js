/* ============================================================
   نظام المنتجات – Thamer SaaS
   متوافق مع النظام الموحد (JWT + RLS)
   ============================================================ */

const role = localStorage.getItem("role");

if (!role) window.location.href = "login.html";

/* ============================================================
   1) جلب المنتجات (النظام الموحد)
   ============================================================ */

async function fetchProducts() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get_all_products`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "apikey": SUPABASE_ANON_KEY
    }
  });

  const data = await res.json();
  return data.products || data; // يدعم الحالتين
}

/* ============================================================
   2) إضافة منتج جديد (للتاجر فقط)
   ============================================================ */

async function createProduct(data) {
  if (role !== "merchant") return;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/create_product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify(data)
  });

  return await res.json();
}

/* ============================================================
   3) تعديل منتج
   ============================================================ */

async function updateProduct(productId, data) {
  if (role !== "merchant") return;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/update_product?id=${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify(data)
  });

  return await res.json();
}

/* ============================================================
   4) حذف منتج
   ============================================================ */

async function deleteProduct(productId) {
  if (role !== "merchant") return;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/delete_product?id=${productId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
      "apikey": SUPABASE_ANON_KEY
    }
  });

  return await res.json();
}

/* ============================================================
   5) عرض المنتجات
   ============================================================ */

async function renderProducts() {
  const container = document.getElementById("merchantProducts");
  const products = await fetchProducts();

  let html = "";

  if (role === "merchant") {
    html += `<button class="primary-btn" onclick="openProductForm()">+ إضافة منتج</button>`;
  }

  html += `<div class="products-grid">`;

  products.forEach(p => {
    html += `
      <div class="product-card">
        <h4>${p.name}</h4>
        <p class="price">${p.price} رس</p>
        <p>${p.description || ""}</p>
    `;

    if (role === "merchant") {
      html += `
        <div class="actions">
          <button class="edit-btn" onclick="editProduct('${p.id}', '${p.name}', '${p.description}', '${p.price}', '${p.image_url}')">تعديل</button>
          <button class="delete-btn" onclick="deleteProductAction('${p.id}')">حذف</button>
        </div>
      `;
    }

    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

/* ============================================================
   6) فورم إضافة / تعديل
   ============================================================ */

function openProductForm(productId = null, name = "", description = "", price = "", image_url = "") {
  if (role !== "merchant") return;

  const form = document.getElementById("merchantProductForm");
  form.style.display = "block";

  form.innerHTML = `
    <div class="product-form">
      <h3>${productId ? "تعديل المنتج" : "إضافة منتج جديد"}</h3>

      <div class="field">
        <label>اسم المنتج</label>
        <input id="pName" type="text" value="${name}">
      </div>

      <div class="field">
        <label>الوصف</label>
        <textarea id="pDesc">${description}</textarea>
      </div>

      <div class="field">
        <label>السعر</label>
        <input id="pPrice" type="number" value="${price}">
      </div>

      <div class="field">
        <label>رابط الصورة</label>
        <input id="pImage" type="text" value="${image_url}">
      </div>

      <button class="primary-btn" onclick="${productId ? `saveEditedProduct('${productId}')` : `saveNewProduct()`}">
        حفظ
      </button>
    </div>
  `;
}

/* ============================================================
   7) حفظ جديد
   ============================================================ */

async function saveNewProduct() {
  if (role !== "merchant") return;

  const data = {
    name: document.getElementById("pName").value,
    description: document.getElementById("pDesc").value,
    price: Number(document.getElementById("pPrice").value),
    image_url: document.getElementById("pImage").value
  };

  await createProduct(data);
  alert("تم إضافة المنتج بنجاح");

  document.getElementById("merchantProductForm").style.display = "none";
  renderProducts();
}

/* ============================================================
   8) حفظ تعديل
   ============================================================ */

async function saveEditedProduct(productId) {
  if (role !== "merchant") return;

  const data = {
    name: document.getElementById("pName").value,
    description: document.getElementById("pDesc").value,
    price: Number(document.getElementById("pPrice").value),
    image_url: document.getElementById("pImage").value
  };

  await updateProduct(productId, data);
  alert("تم تعديل المنتج بنجاح");

  document.getElementById("merchantProductForm").style.display = "none";
  renderProducts();
}

/* ============================================================
   9) حذف
   ============================================================ */

async function deleteProductAction(productId) {
  if (role !== "merchant") return;

  if (confirm("هل أنت متأكد من حذف المنتج؟")) {
    await deleteProduct(productId);
    renderProducts();
  }
}

/* ============================================================
   10) تشغيل الصفحة
   ============================================================ */

renderProducts();
