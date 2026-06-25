import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Application Logic Engine State Allocation Memory
let currentStoresMemory = [];
let currentReportsMemory = [];

// Service Endpoint Routings
const LOGIN_ENDPOINT = `${SUPABASE_URL}/functions/v1/admin-login`;
const AI_ENDPOINT = `${SUPABASE_URL}/functions/v1/chat-ai`;

// --- BOOTSTRAP EVENT LISTENERS ENGINE ---
window.addEventListener('DOMContentLoaded', () => {
  // Handle Master Security Authorization Core Triggers
  document.getElementById('loginBtn').addEventListener('click', verifyAdminLogin);
  document.getElementById('logoutBtn').addEventListener('click', logOutAdmin);
  
  // Connect Sub-View Navigation Switch Nodes
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', handleTabSwitchAction);
  });

  // Cognitive Console Interaction Anchors
  document.getElementById('btnSendAdminAi').addEventListener('click', processAdminAiCommandFlow);
  document.getElementById('adminAiInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processAdminAiCommandFlow();
  });

  // Run Integrity Check Routine against Active System Buffers
  checkActiveSession();
});

// --- ENGINE PIPELINE 0: AUTHENTICATION FLOWS ---
async function checkActiveSession() {
  const token = localStorage.getItem('sb_token');
  if (!token) return;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }
    });
    if (res.ok) {
      showDashboardView();
    } else {
      localStorage.removeItem('sb_token');
    }
  } catch (err) { 
    console.error("Session verification system fault:", err); 
  }
}

async function verifyAdminLogin() {
  const password = document.getElementById('adminPassInput').value;
  if (!password) { 
    alert("Authorization entry space cannot match blank parameters."); 
    return; 
  }

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Root clearance denied via cloud authority.");
    }

    localStorage.setItem('sb_token', data.access_token);
    showDashboardView();
    
    // Clear credential string immediately from Document Input node cache
    document.getElementById('adminPassInput').value = '';
  } catch(err) { 
    alert("Authorization Engine Failed: " + err.message); 
  }
}

function logOutAdmin() {
  localStorage.removeItem('sb_token');
  alert("Console session buffer purged completely.");
  window.location.reload();
}

function showDashboardView() {
  document.getElementById('authGateCard').style.display = 'none';
  document.getElementById('dashboardCore').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'inline-flex';
  
  // Hydrate Data Buffers Immediately upon Core Mounting
  fetchRegisteredMerchants();
  fetchPayoutRequestsQueue();
  fetchAbuseSecurityReports();
}

function handleTabSwitchAction(e) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-sub-view').forEach(v => v.classList.remove('active'));

  e.currentTarget.classList.add('active');
  const targetId = e.currentTarget.getAttribute('data-target');
  document.getElementById(targetId).classList.add('active');
}

// --- ENGINE PIPELINE 1: LOAD ACTIVE STORES METRICS ---
async function fetchRegisteredMerchants() {
  const token = localStorage.getItem('sb_token');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/merchant_stores?order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) {
      currentStoresMemory = await res.json();
      renderStoresTable(currentStoresMemory);
    }
  } catch (err) { 
    console.error("Merchant stream recovery error:", err); 
  }
}

function renderStoresTable(stores) {
  const container = document.getElementById('merchantDataRows');
  container.innerHTML = '';
  
  if (stores.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray; padding:16px;">Zero store nodes active.</td></tr>`;
    return;
  }

  stores.forEach(s => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><small>${new Date(s.created_at).toLocaleDateString()}</small></td>
      <td><strong>${s.business_name || 'Unnamed Node'}</strong></td>
      <td>${s.whatsapp_number || 'N/A'}</td>
      <td><span style="color:${s.tier_status === 'Premium' ? '#2563eb' : '#64748b'}; font-weight:700;">${s.tier_status || 'Standard'}</span></td>
      <td style="font-family:monospace; font-weight:700; color:#16a34a;">₦${(s.account_balance || 0).toLocaleString()}</td>
      <td><a href="store.html?id=${s.id}" target="_blank" class="nav-link" style="padding:4px 8px; font-size:0.75rem; background:#e2e8f0; text-decoration:none; border-radius:4px;">🔗 Visit Bio</a></td>
    `;
    container.appendChild(row);
  });
}

// --- ENGINE PIPELINE 2: LOAD WITHDRAWAL CLAIMS OPERATIONS ---
async function fetchPayoutRequestsQueue() {
  const token = localStorage.getItem('sb_token');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/platform_payout_requests?payout_status=eq.PENDING_REVIEW&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) renderPayoutsTable(await res.json());
  } catch (e){
    console.error("Payout data payload fetch error:", e);
  }
}

function renderPayoutsTable(claims) {
  const container = document.getElementById('payoutDataRows');
  container.innerHTML = '';
  
  if(claims.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:16px;">No settlement queues initialized.</td></tr>`;
    return;
  }
  
  claims.forEach(c => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><small>${new Date(c.created_at).toLocaleDateString()}</small></td>
      <td><small>${c.store_id}</small></td>
      <td style="font-weight:700; color:#16a34a;">₦${parseFloat(c.requested_amount).toLocaleString()}</td>
      <td><strong>${c.bank_details || 'Missing Routing Arrays'}</strong></td>
      <td>
        <button class="nav-link" style="background:#16a34a; color:white; border:none; padding:4px 8px; font-size:0.72rem; cursor:pointer; border-radius:4px;" data-id="${c.id}">💸 Mark Paid</button>
      </td>
    `;
    // Attach event listener natively via dataset arrays rather than raw inline properties
    row.querySelector('button').addEventListener('click', (e) => {
      settlePayoutNode(e.currentTarget.getAttribute('data-id'));
    });
    container.appendChild(row);
  });
}

async function settlePayoutNode(id) {
  if(!confirm("Have you sent the bank transfer to this user? Clicking OK will remove this request from your pending queue lists.")) return;
  const token = localStorage.getItem('sb_token');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/platform_payout_requests?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ payout_status: 'SETTLED_SUCCESS' })
    });
    if(res.ok) {
      alert('Payment tracked successfully!');
      fetchPayoutRequestsQueue();
    } else {
      alert('Operation rejected by DB constraints.');
    }
  } catch(e){
    console.error("Payout settlement resolution failure:", e);
  }
}

// --- ENGINE PIPELINE 3: SECURITY COMPLIANCE TRACKER ---
async function fetchAbuseSecurityReports() {
  const token = localStorage.getItem('sb_token');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/platform_abuse_reports?order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) {
      currentReportsMemory = await res.json();
      renderReportsTable(currentReportsMemory);
    }
  } catch (e){
    console.error("Abuse telemetry stream processing anomaly:", e);
  }
}

function renderReportsTable(logs) {
  const container = document.getElementById('reportDataRows');
  container.innerHTML = '';
  
  if(logs.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:16px;">System ecosystem clear. Zero abuse logs recorded.</td></tr>`;
    return;
  }
  
  logs.forEach(l => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><small>${new Date(l.created_at).toLocaleDateString()}</small></td>
      <td style="color:#dc2626;"><strong>${l.merchant_name || 'Unknown Subject'}</strong></td>
      <td><span style="background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:700;">${l.report_reason || 'General'}</span></td>
      <td><p style="margin:0; font-size:0.8rem; color:#475569;">${l.evidence_details || 'No structural metrics contextual text verified.'}</p></td>
    `;
    container.appendChild(row);
  });
}

// --- MASTER CORE COGNITIVE INTERFACE ---
async function processAdminAiCommandFlow() {
  const inputEl = document.getElementById('adminAiInput');
  const commandText = inputEl.value.trim();
  if(!commandText) return;

  appendAdminAiBubble(commandText, 'user');
  inputEl.value = '';

  try {
    const res = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commandText,
        context: `You are the master root ops assistant for Tenora Labs ecosystem. System data context maps: Registered active merchants database: ${JSON.stringify(currentStoresMemory)}. Flagged compliance risk abuse reports logs data values: ${JSON.stringify(currentReportsMemory)}.`
      })
    });
    
    const data = await res.json();
    if(data.response) {
      appendAdminAiBubble(data.response, 'bot');
    } else {
      throw new Error();
    }
  } catch(err) {
    appendAdminAiBubble("⚠️ System Execution Failure. Verify Cloud Edge runtime state conditions.", 'bot');
  }
}

function appendAdminAiBubble(text, sender) {
  const windowLog = document.getElementById('adminAiChatLogWindow');
  const bubble = document.createElement('div');
  bubble.className = `admin-chat-bubble admin-bubble-${sender}`;
  bubble.innerText = text;
  windowLog.appendChild(bubble);
  windowLog.scrollTop = windowLog.scrollHeight;
}
