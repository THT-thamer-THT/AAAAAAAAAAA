/* ============================================================
   نظام الاشتراكات – Thamer SaaS
   باقتين فقط: Basic – Pro
   أسعار أساسية + أسعار خاصة لكل تاجر
   خصومات – إدارة كاملة من الأدمن
   ============================================================ */

/* ============================================
   1) عرض صفحة الاشتراكات داخل لوحة الأدمن
   ============================================ */

function renderAdminSubscriptions() {
  const container = document.getElementById("subscriptionsContainer");
  const basePlans = getBasePlans();
  const merchants = getMerchants();

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>الأسعار الأساسية للباقات</h4>
        <span>هذه الأسعار تظهر للتجار الجدد</span>
      </div>

      <div class="field">
        <label>سعر الباقة الأساسية (Basic)</label>
        <input id="baseBasic" type="number" value="${basePlans.basic}">
      </div>

      <div class="field">
        <label>سعر الباقة الاحترافية (Pro)</label>
        <input id="basePro" type="number" value="${basePlans.pro}">
      </div>

      <button class="primary-btn" onclick="saveBasePlanPrices()">حفظ الأسعار الأساسية</button>
    </div>

    <br>

    <div class="table-card">
      <div class="table-card-header">
        <h4>أسعار خاصة للتجار</h4>
        <span>يمكنك تعديل سعر الباقة لكل تاجر</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>التاجر</th>
            <th>الباقة</th>
            <th>السعر الأساسي</th>
            <th>السعر الخاص</th>
            <th>الخصم</th>
            <th>السعر النهائي</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
  `;

  merchants.forEach(m => {
    const sub = m.subscription || null;
    const base = getBasePlans();

    let basePrice = sub?.plan === "pro" ? base.pro : base.basic;
    let customPrice = m.customPricing?.price || "—";
    let discount = m.customPricing?.discount || "—";
    let finalPrice = m.customPricing?.final || basePrice;

    html += `
      <tr>
        <td>${m.storeName}</td>
        <td>${sub ? sub.plan.toUpperCase() : "—"}</td>
        <td>${basePrice} رس</td>
        <td>${customPrice}</td>
        <td>${discount}</td>
        <td>${finalPrice} رس</td>
        <td>
          <button onclick="openMerchantPricingEditor('${m.id}')">تعديل</button>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/* ============================================
   2) حفظ الأسعار الأساسية
   ============================================ */

function saveBasePlanPrices() {
  const basic = Number(document.getElementById("baseBasic").value);
  const pro = Number(document.getElementById("basePro").value);

  saveBasePlans({ basic, pro });

  alert("تم حفظ الأسعار الأساسية بنجاح");
  renderAdminSubscriptions();
}

/* ============================================
   3) نافذة تعديل سعر تاجر
   ============================================ */

function openMerchantPricingEditor(merchantId) {
  const merchants = getMerchants();
  const m = merchants.find(x => x.id === merchantId);
  const base = getBasePlans();

  const sub = m.subscription || { plan: "basic" };
  const basePrice = sub.plan === "pro" ? base.pro : base.basic;

  const custom = m.customPricing || {
    price: basePrice,
    discount: 0,
    final: basePrice
  };

  const html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>تعديل سعر التاجر: ${m.storeName}</h4>
        <span>الباقة الحالية: ${sub.plan.toUpperCase()}</span>
      </div>

      <div class="field">
        <label>السعر الخاص</label>
        <input id="customPrice" type="number" value="${custom.price}">
      </div>

      <div class="field">
        <label>الخصم (٪ أو مبلغ)</label>
        <input id="customDiscount" type="number" value="${custom.discount}">
      </div>

      <button class="primary-btn" onclick="saveMerchantCustomPrice('${merchantId}')">حفظ</button>
    </div>
  `;

  document.getElementById("subscriptionsContainer").innerHTML = html;
}

/* ============================================
   4) حفظ السعر الخاص للتاجر
   ============================================ */

function saveMerchantCustomPrice(merchantId) {
  const price = Number(document.getElementById("customPrice").value);
  const discount = Number(document.getElementById("customDiscount").value);

  let final = price;

  if (discount > 0) {
    if (discount <= 100) {
      final = price - (price * (discount / 100));
    } else {
      final = price - discount;
    }
  }

  updateMerchantPricing(merchantId, {
    price,
    discount,
    final
  });

  alert("تم حفظ السعر الخاص للتاجر");
  renderAdminSubscriptions();
}

/* ============================================
   5) عرض اشتراك التاجر داخل لوحة التاجر
   ============================================ */

function renderMerchantSubscription(merchantId) {
  const container = document.getElementById("merchantSubscription");
  const sub = getMerchantSubscription(merchantId);
  const base = getBasePlans();
  const merchant = getMerchants().find(x => x.id === merchantId);

  let price = sub?.plan === "pro" ? base.pro : base.basic;

  if (merchant.customPricing) {
    price = merchant.customPricing.final;
  }

  const html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>اشتراك المتجر</h4>
        <span>تفاصيل الباقة الحالية</span>
      </div>

      <p>الباقة: <strong>${sub?.plan.toUpperCase() || "—"}</strong></p>
      <p>السعر: <strong>${price} رس</strong></p>
      <p>تاريخ البداية: ${sub?.start || "—"}</p>
      <p>تاريخ الانتهاء: ${sub?.end || "—"}</p>
    </div>
  `;

  container.innerHTML = html;
}

/* ============================================
   6) إنشاء اشتراك جديد لتاجر
   ============================================ */

function createSubscription(merchantId, plan) {
  const base = getBasePlans();
  const merchant = getMerchants().find(x => x.id === merchantId);

  let price = plan === "pro" ? base.pro : base.basic;

  if (merchant.customPricing) {
    price = merchant.customPricing.final;
  }

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  const subscription = {
    plan,
    price,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };

  saveMerchantSubscription(merchantId, subscription);
  alert("تم تفعيل الاشتراك بنجاح");
  renderMerchantSubscription(merchantId);
}