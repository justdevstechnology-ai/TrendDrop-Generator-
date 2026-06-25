import { SUPABASE_URL, SUPABASE_ANON_KEY, PAYSTACK_PUBLIC_KEY } from './config.js';

let currentStorePayload = null;
let activeCheckoutItem = null;

// Isolated Endpoint configurations targeting dedicated Edge processing infrastructure
const BASE_EDGE_URL = `${SUPABASE_URL}/functions/v1`;
const AI_ENDPOINT = `${BASE_EDGE_URL}/chat-ai`;
const GET_STORE_ENDPOINT = `${BASE_EDGE_URL}/get-store`;
const CREATE_ORDER_ENDPOINT = `${BASE_EDGE_URL}/process-store-order`;
const REPORT_ENDPOINT = `${BASE_EDGE_URL}/report-abuse`;

window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get('id');

  // STORE VALIDATION: Confirm query structure formats match UUID standards
  if (!storeId || !validateUUID(storeId)) {
    renderFatalError("Invalid or missing storefront reference.");
    return;
  }

  await loadLiveStorefrontProfile(storeId);

  // Bind Standard Actions and Modal Visibility listeners
  document.getElementById('closeDrawerBtn').addEventListener('click', toggleCheckoutDrawerWindow);
  document.getElementById('drawerInvoiceForm').addEventListener('submit', initPaystackPaymentFlow);

  // System Reporting Infrastructure Event Links
  document.getElementById('triggerReportBtn').addEventListener('click', () => { document.getElementById('reportMerchantModal').style.display = 'flex'; });
  document.getElementById('closeReportModalBtn').addEventListener('click', () => { document.getElementById('reportMerchantModal').style.display = 'none'; });
  document.getElementById('merchantAbuseReportForm').addEventListener('submit', handleAbuseReportSubmission);

  // AI Interface Drawer Triggers
  document.getElementById('aiToggleTriggerBtn').addEventListener('click', toggleAiChatDrawer);
  document.getElementById('closeAiDrawerBtn').addEventListener('click', toggleAiChatDrawer);
  document.getElementById('btnSendStoreAi').addEventListener('click', processPublicAiConversation);
  document.getElementById('aiStoreInput').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') processPublicAiConversation();
  });
});

// UUID Pattern regex verification to break array enumeration sweeps
function validateUUID(uuid) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

// SECURE STORE ROUTING: Pull profile datasets safely outside regular browser PostgREST frameworks
async function loadLiveStorefrontProfile(storeId) {
  try {
    const res = await fetch(`${GET_STORE_ENDPOINT}?id=${storeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (!res.ok) throw new Error("Store profile connection fault.");
    
    const data = await res.json();
    
    if (!data || data.error || Object.keys(data).length === 0) {
      renderFatalError("The storefront you are looking for does not exist.");
      return;
    }

    currentStorePayload = data;
    renderPublicLayout(currentStorePayload);
  } catch (err) {
    console.error(err);
    renderFatalError("Network fault encountered mapping store configurations.");
  }
}

// MUTATION HARDENING: Native node textContent mapping variables prevent arbitrary structural XSS attacks
function renderPublicLayout(store) {
  // BUG 4 FIXED: Merchant brand logo image asset distribution rendering parameters
  if (store.logo_url) {
    const logo = document.getElementById('storeLogo');
    logo.src = store.logo_url;
    logo.style.display = 'block';
  }

  document.getElementById('storeViewTitle').textContent = store.business_name;
  document.getElementById('storeViewTagline').textContent = store.tagline || "";

  // BUG 1 FIXED: Handled cinematic platform configurations natively inside isolated scope parameters
  if (store.video_url) {
    const hero = document.getElementById('videoHeroContainer');
    const video = document.getElementById('templateCinematicVideo');
    video.src = store.video_url;
    hero.style.display = 'block';
  }

  const grid = document.getElementById('publicCatalogGrid');
  grid.innerHTML = ''; // Safely clear out any initial shell elements

  (store.product_catalog || []).forEach((item) => {
    const card = document.createElement('div');
    card.className = 'live-product-card';

    // BUG 3 FIXED: Process dynamic visual storefront display grids
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.style.width = '100%';
      img.style.height = '180px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.marginBottom = '8px';
      card.appendChild(img);
    }

    const metaDiv = document.createElement('div');
    metaDiv.className = 'live-product-meta';

    const h4 = document.createElement('h4');
    h4.textContent = item.name; // Escaped text node parsing injection protection

    const span = document.createElement('span');
    span.textContent = `₦${Number(item.price).toLocaleString() || '0'}`;

    metaDiv.appendChild(h4);
    metaDiv.appendChild(span);
    card.appendChild(metaDiv);

    const actionRow = document.createElement('div');
    actionRow.className = 'product-action-row';

    const buyBtn = document.createElement('button');
    buyBtn.type = 'button';
    buyBtn.className = 'btn-wrapped-buy';
    buyBtn.innerHTML = '<span class="material-icons-round">shopping_cart</span> Order Item';
    buyBtn.addEventListener('click', () => {
      activeCheckoutItem = item;
      document.getElementById('lblSelectedProductName').textContent = `${item.name} (₦${Number(item.price).toLocaleString()})`;
      toggleCheckoutDrawerWindow();
    });

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn-native-share';
    shareBtn.innerHTML = '<span class="material-icons-round">link</span> Share';
    shareBtn.addEventListener('click', () => {
      if(navigator.share) {
        navigator.share({ title: item.name, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Store URL copied to clipboard.");
      }
    });

    actionRow.appendChild(buyBtn);
    actionRow.appendChild(shareBtn);
    card.appendChild(actionRow);
    grid.appendChild(card);
  });

  // UI TRANSITION: Strip out operational loading frames to uncover layouts
  document.getElementById('storeLoadingState').classList.add('hidden');
  document.getElementById('storeMainContent').classList.remove('hidden');
}

function renderFatalError(message) {
  const loader = document.getElementById('storeLoadingState');
  loader.innerHTML = `<h3 style="color: #ef4444; font-family: sans-serif;">⚠️ Access Error</h3><p style="color: #64748b; font-size:0.9rem;">${message}</p>`;
}

function toggleCheckoutDrawerWindow() {
  document.getElementById('cartCheckoutDrawer').classList.toggle('active');
}

function toggleAiChatDrawer() {
  document.getElementById('publicAiDrawerWindow').classList.toggle('active');
}

// CHAT INPUT COMPRESSION LIMITERS: Intercept buffer sizes prior to passing upstream data 
async function processPublicAiConversation() {
  const inputEl = document.getElementById('aiStoreInput');
  const query = inputEl.value.trim();
  if(!query || !currentStorePayload) return;

  if (query.length > 1000) {
    alert("Protocol violation alert: Transmission lengths exceed bounds definitions.");
    return;
  }

  appendAiBubble(query, 'user');
  inputEl.value = '';

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY 
      },
      body: JSON.stringify({
        message: query,
        store_id: currentStorePayload.id // Pass index coordinates exclusively, server resolves details context
      })
    });
    const data = await res.json();
    if(data.response) {
      appendAiBubble(data.response, 'bot');
    } else {
      throw new Error();
    }
  } catch(err) {
    appendAiBubble("Sorry, request speed rules restrict calculation frequencies. Please verify your prompt momentarily.", 'bot');
  }
}

function appendAiBubble(text, sender) {
  const chatLog = document.getElementById('aiStoreChatLog');
  const b = document.createElement('div');
  b.className = `store-bubble bubble-${sender}`;
  b.textContent = text; // Isolated string assignment safely neutralizes markup inputs
  chatLog.appendChild(b);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// CHECKOUT PRICE TRUST VECTORS: Offload value setting configurations completely to secure engine roots
async function initPaystackPaymentFlow(e) {
  e.preventDefault();
  const payButton = document.getElementById('btnSubmitPayment');
  payButton.disabled = true;
  payButton.textContent = "Securing transaction parameters...";

  const customerEmail = document.getElementById('custEmail').value.trim();
  const customerName = document.getElementById('custName').value.trim();
  const deliveryAddress = document.getElementById('custAddress').value.trim();
  
  try {
    const tokenFetch = await fetch(CREATE_ORDER_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "apikey": SUPABASE_ANON_KEY 
      },
      body: JSON.stringify({
        store_id: currentStorePayload.id,
        product_name: activeCheckoutItem.name, 
        buyer_name: customerName,
        delivery_address: deliveryAddress,
        customer_email: customerEmail
      })
    });

    const initResult = await tokenFetch.json();
    if (!tokenFetch.ok) throw new Error(initResult.message || "Calculation matching processing parameters broken.");

    toggleCheckoutDrawerWindow();

    // Spawn checkout engine tracking strictly with values signed by server
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY, 
      email: customerEmail,
      amount: initResult.server_verified_amount, 
      currency: 'NGN',
      reference: initResult.order_reference,
      callback: function(response) {
        // BUG 2 FIXED: Cleared verification callback nesting to stabilize production logic paths
        alert("✅ Payment successful!");

        const phoneCleaned = String(currentStorePayload.whatsapp_number || '').replace(/\D/g, '');

        if (phoneCleaned.length >= 10) {
          const whatsappText = `✅ PAID ORDER CONFIRMED!\n\n🛍️ Product: ${activeCheckoutItem.name}\n👤 Buyer: ${customerName}\n💳 Ref: ${response.reference}`;

          window.open(
            `https://wa.me/${phoneCleaned}?text=${encodeURIComponent(whatsappText)}`,
            '_blank'
          );
        }
      },
      onClose: function() {
        alert('⚠️ Checkout transaction route closed by client-side operations.');
      }
    });
    
    handler.openIframe();
  } catch (err) {
    alert(`Transaction processing error: ${err.message || "Contact Engineering Systems Platform."}`);
  } finally {
    payButton.disabled = false;
    payButton.innerHTML = '<span class="material-icons-round">payment</span> Pay Securely Now';
  }
}

// SECURITY MONITOR VECTOR: Safe collection pipelines passing straight to management dashboards
async function handleAbuseReportSubmission(e) {
  e.preventDefault();
  const payload = {
    store_id: currentStorePayload.id,
    report_reason: document.getElementById('reportReason').value,
    evidence_details: document.getElementById('reportDetails').value
  };

  try {
    const res = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error();

    document.getElementById('reportMerchantModal').style.display = 'none';
    document.getElementById('merchantAbuseReportForm').reset();
    alert('📥 Misbehavior ticket filed securely. Assessment processing parameters initialized.');
  } catch(err) {
    alert('⚠️ Limits reached or protocol dropped. Ticket transmission aborted.');
  }
}
