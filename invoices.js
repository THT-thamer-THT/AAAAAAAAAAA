/* ============================================================
   نظام الفواتير الاحترافية – Thamer SaaS
   ============================================================ */

/* ================================
   1) دوال التخزين
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
   2) إنشاء فاتورة جديدة
   ================================ */

function openCreateInvoice(merchantId) {
  const container = document.getElementById("invoiceFormContainer");
  const products = getProducts().filter(p => p.merchantId === merchantId);

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>إنشاء فاتورة جديدة</h4>
      </div>

      <div class="field">
        <label>اسم العميل</label>
        <input id="invCustomerName" type="text">
      </div>

      <div class="field">
        <label>رقم العميل</label>
        <input id="invCustomerPhone" type="text">
      </div>

      <div class="field">
        <label>المنتج</label>
        <select id="invProductSelect">
          ${products.map(p => `<option value="${p.id}">${p.name} - ${p.price} رس</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>الكمية</label>
        <input id="invQty" type="number" value="1">
      </div>

      <button class="primary-btn" onclick="addProductToInvoice('${merchantId}')">إضافة المنتج</button>

      <h4>المنتجات المختارة</h4>
      <div id="invoiceItems"></div>

      <h4>الملخص</h4>
      <p>الإجمالي قبل الضريبة: <span id="invSubtotal">0</span> رس</p>
      <p>الضريبة (15%): <span id="invVAT">0</span> رس</p>
      <p><b>الإجمالي النهائي: <span id="invTotal">0</span> رس</b></p>

      <button class="primary-btn" onclick="saveInvoice('${merchantId}')">حفظ الفاتورة</button>
    </div>
  `;

  container.innerHTML = html;
  switchMerchantView("merchantCreateInvoice");

  window.currentInvoiceItems = [];
}

/* إضافة منتج للفاتورة */
function addProductToInvoice(merchantId) {
  const productId = document.getElementById("invProductSelect").value;
  const qty = Number(document.getElementById("invQty").value);
  const product = getProducts().find(p => p.id === productId);

  window.currentInvoiceItems.push({
    id: productId,
    name: product.name,
    price: product.price,
    qty
  });

  renderInvoiceItems();
}

/* عرض المنتجات المختارة */
function renderInvoiceItems() {
  const container = document.getElementById("invoiceItems");
  let subtotal = 0;

  let html = `
    <table class="invoice-table">
      <thead>
        <tr>
          <th>المنتج</th>
          <th>السعر</th>
          <th>الكمية</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
  `;

  window.currentInvoiceItems.forEach(item => {
    const total = item.price * item.qty;
    subtotal += total;

    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.price} رس</td>
        <td>${item.qty}</td>
        <td>${total} رس</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  document.getElementById("invSubtotal").innerText = subtotal;
  document.getElementById("invVAT").innerText = vat.toFixed(2);
  document.getElementById("invTotal").innerText = total.toFixed(2);
}

/* ================================
   3) حفظ الفاتورة
   ================================ */

function saveInvoice(merchantId) {
  const invoice = {
    id: generateId("INV"),
    merchantId,
    customerName: document.getElementById("invCustomerName").value,
    customerPhone: document.getElementById("invCustomerPhone").value,
    items: window.currentInvoiceItems,
    subtotal: Number(document.getElementById("invSubtotal").innerText),
    vat: Number(document.getElementById("invVAT").innerText),
    total: Number(document.getElementById("invTotal").innerText),
    date: new Date().toISOString().slice(0, 10)
  };

  addInvoice(invoice);
  alert("تم حفظ الفاتورة بنجاح");

  renderMerchantInvoices(merchantId);
  switchMerchantView("merchantInvoices");
}

/* ================================
   4) عرض فواتير التاجر
   ================================ */

function renderMerchantInvoices(merchantId) {
  const container = document.getElementById("merchantInvoicesContainer");
  const invoices = getInvoices().filter(inv => inv.merchantId === merchantId);

  let html = `
    <div class="table-card">
      <div class="table-card-header">
        <h4>فواتيري</h4>
      </div>

      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>الإجمالي</th>
            <th>التاريخ</th>
            <th>عرض</th>
          </tr>
        </thead>
        <tbody>
  `;

  invoices.forEach(inv => {
    html += `
      <tr>
        <td>${inv.id}</td>
        <td>${inv.customerName}</td>
        <td>${inv.total} رس</td>
        <td>${inv.date}</td>
        <td><button onclick="viewInvoice('${inv.id}')">عرض</button></td>
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

/* ================================
   5) عرض الفاتورة
   ================================ */

function viewInvoice(invoiceId) {
  const invoice = getInvoices().find(i => i.id === invoiceId);
  const merchant = getMerchants().find(m => m.id === invoice.merchantId);
  const systemLogo = load("systemLogo", null);

  const container = document.getElementById("invoiceViewContainer");

  let html = `
    <div class="invoice-container">

      <div class="invoice-header">
        <div class="store-info">
          <h2>${merchant.storeName}</h2>
          <p>رقم السجل: ${merchant.cr}</p>
          <p>رقم الضريبة: ${merchant.vat}</p>
          <p>${merchant.address}</p>
        </div>

        <img src="${merchant.logo || ""}" class="invoice-logo">
      </div>

      <div class="invoice-details">
        <p>رقم الفاتورة: ${invoice.id}</p>
        <p>التاريخ: ${invoice.date}</p>
        <p>اسم العميل: ${invoice.customerName}</p>
        <p>رقم العميل: ${invoice.customerPhone}</p>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>السعر</th>
            <th>الكمية</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
  `;

  invoice.items.forEach(item => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.price} رس</td>
        <td>${item.qty}</td>
        <td>${item.price * item.qty} رس</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="invoice-summary">
        <p>الإجمالي قبل الضريبة: ${invoice.subtotal} رس</p>
        <p>الضريبة (15%): ${invoice.vat} رس</p>
        <p><b>الإجمالي النهائي: ${invoice.total} رس</b></p>
      </div>

      <div class="invoice-qr">
        <img src="${generateZATCA_QR(merchant, invoice)}">
      </div>

      <div class="invoice-footer">
        ${systemLogo ? `<img src="${systemLogo}">` : ""}
        <p>Powered by Thamer SaaS</p>
      </div>

      <button class="print-btn" onclick="window.print()">طباعة</button>
    </div>
  `;

  container.innerHTML = html;
  switchDashboardView("invoiceView");
}

/* ================================
   6) QR Code السعودي (ZATCA TLV)
   ================================ */

function generateZATCA_QR(merchant, invoice) {
  function tlv(tag, value) {
    const textEncoder = new TextEncoder();
    const valueBytes = textEncoder.encode(value);
    return new Uint8Array([tag, valueBytes.length, ...valueBytes]);
  }

  const data = new Uint8Array([
    ...tlv(1, merchant.storeName),
    ...tlv(2, merchant.vat),
    ...tlv(3, invoice.date),
    ...tlv(4, invoice.total.toString()),
    ...tlv(5, invoice.vat.toString())
  ]);

  const base64 = btoa(String.fromCharCode(...data));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${base64}`;
}

/* ================================
   7) استخراج شعار PDF
   ================================ */

async function extractLogoFromPDF(file, callback) {
  const reader = new FileReader();
  reader.onload = async function () {
    const pdfData = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument(pdfData).promise;
    const page = await pdf.getPage(1);
    const ops = await page.getOperatorList();

    for (let i = 0; i < ops.fnArray.length; i++) {
      if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
        const imgName = ops.argsArray[i][0];
        const img = await page.objs.get(imgName);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.putImageData(img, 0, 0);
        callback(canvas.toDataURL());
        return;
      }
    }

    alert("لم يتم العثور على صورة داخل ملف PDF");
  };

  reader.readAsArrayBuffer(file);
}

/* ================================
   8) حفظ شعار التاجر
   ================================ */

function saveMerchantSettings() {
  const merchant = getCurrentMerchant();

  merchant.storeName = document.getElementById("storeNameInput").value;
  merchant.cr = document.getElementById("storeCRInput").value;
  merchant.vat = document.getElementById("storeVATInput").value;
  merchant.address = document.getElementById("storeAddressInput").value;
  merchant.phone = document.getElementById("storePhoneInput").value;
  merchant.email = document.getElementById("storeEmailInput").value;

  const file = document.getElementById("storeLogoPDF").files[0];

  if (file) {
    extractLogoFromPDF(file, function (logo) {
      merchant.logo = logo;
      updateMerchant(merchant);
      alert("تم حفظ الإعدادات بنجاح");
    });
  } else {
    updateMerchant(merchant);
    alert("تم حفظ الإعدادات بنجاح");
  }
}

/* ================================
   9) حفظ شعار الموقع
   ================================ */

function saveSystemLogo() {
  const file = document.getElementById("systemLogoPDF").files[0];

  if (!file) {
    alert("الرجاء رفع ملف PDF");
    return;
  }

  extractLogoFromPDF(file, function (logo) {
    save("systemLogo", logo);
    alert("تم حفظ شعار الموقع بنجاح");
  });
}