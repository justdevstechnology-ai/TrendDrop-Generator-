import { 
  TENORA_URL, 
  TENORA_ANON_KEY, 
  PAYSTACK_PUBLIC_KEY 
} from './config.js';

// 🛑 Fix #3: State flag to prevent double-payment initialization spam
let isPaymentInProgress = false;

/**
 * Handles the secure premium initialization and server-to-server verification flow.
 * @param {string} storeId - The UUID target key of the generated merchant store.
 * @param {string} customerEmail - Email of the merchant purchasing the tier.
 */
export async function initializePremiumPayment(storeId, customerEmail) {
  // Prevent concurrent execution thread pipelines
  if (isPaymentInProgress) {
    console.warn("⚠️ An active payment pipeline session is already processing.");
    return;
  }

  // 🛡️ Fix #4 & #5: Advanced client-side Regex sanitization inputs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!storeId || !uuidRegex.test(storeId)) {
    alert("❌ Payment initialization failed: Invalid Store ID format.");
    return;
  }

  if (!customerEmail || !emailRegex.test(customerEmail)) {
    alert("❌ Payment initialization failed: Invalid merchant contact token.");
    return;
  }

  // Lock the UI thread
  isPaymentInProgress = true;

  // Define payment constants for local currency conversion (₦5,000 in Kobo)
  const PREMIUM_AMOUNT_KOBO = 5000 * 100; 

  console.log(`🎬 Initializing checkout pipeline for Store: ${storeId}`);

  // Check if the payment gateway popup SDK is available globally
  if (typeof PaystackPop !== 'undefined') {
    try {
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, // 🏷️ Fix #1: Abstracted out hardcoded string keys
        email: customerEmail,
        amount: PREMIUM_AMOUNT_KOBO,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: "Store ID", variable_name: "store_id", value: storeId }
          ]
        },
        callback: async function(response) {
          console.log("💰 Gateway settlement recorded locally. Launching secure backend validation node...");
          
          // Execute edge verification
          await verifyTransactionOnBackend(response.reference, storeId);
          
          // Release state lock post-callback processing execution
          isPaymentInProgress = false;
        },
        onClose: function() {
          alert("⚠️ Payment checkout screen dismissed. Your storefront tier remains on the Free Ad tier.");
          isPaymentInProgress = false; // Release lock on screen dismissal
        }
      });
      
      handler.openIframe();
    } catch (sdkError) {
      console.error("SDK Execution Failure:", sdkError);
      isPaymentInProgress = false; // Release lock if the setup crashes
    }
  } else {
    // 🏦 SECURE FALLBACK: Bank Transfer Agent Model routing verification
    const confirmManual = confirm(`🏛️ Proceed with direct bank transfer settlement?\n\nTransfer exactly ₦5,000 to:\nBank: OPay\nAccount: 07039105089\nName: Tenora Labs / JustDevs\n\nClick OK once payment is complete to notify our validation terminal.`);
    
    if (confirmManual) {
      await requestManualAdminVerification(storeId, customerEmail);
    }
    
    // Always release state lock for manual alternative channels
    isPaymentInProgress = false;
  }
}

/**
 * Sends transaction references directly to your Supabase Edge Function framework.
 */
async function verifyTransactionOnBackend(transactionReference, storeId) {
  try {
    const verificationUrl = `${SUPABASE_URL}/functions/v1/verify-payment`;
    
    // 🔒 Fix #2: Removed invalid bearer authentication header wrappers
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference: transactionReference,
        store_id: storeId
        // 🔒 Fix #6 NOTE: The Edge function backend MUST verify amount (500000), 
        // currency (NGN), and status (success) via Paystack API using this reference!
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP server error code: ${response.status}`);
    }

    const result = await response.json();

    if (result.verified === true) {
      alert("🎉 Verification Locked! Payment verified directly via banking network. Your Premium layout is now fully live with Zero Ads!");
      
      // 🔄 Fix #7: Secure client redirect instead of aggressive cache-refresh loop state anomalies
      window.location.href = 'dashboard.html?premium=activated';
    } else {
      throw new Error(result.message || "Cryptographic validation handoff failed.");
    }

  } catch (error) {
    console.error("🚨 Verification Warning:", error);
    alert(`❌ Fraud Protection Alert: Server verification failed (${error.message}). If you were charged, please contact justdevstechnology@gmail.com with your store ID.`);
  }
}

/**
 * Signals your dashboard log entries that a manual transfer requires processing review.
 */
async function requestManualAdminVerification(storeId, email) {
  try {
    const notifyUrl = `${SUPABASE_URL}/functions/v1/manual-payment-alert`;
    
    // 🔒 Fix #2: Removed invalid bearer authentication header wrappers
    const response = await fetch(notifyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      // 🕒 Fix #8: Added ISO standard timestamps to the logging telemetry payloads
      body: JSON.stringify({ 
        store_id: storeId, 
        user_email: email,
        requested_at: new Date().toISOString()
      })
    });

    if (!response.ok) throw new Error("Verification network endpoint rejected request packet.");

    alert(`📥 Notification dispatched to Tenora Lab command systems. Your account tier will update immediately after automated bank statement processing verification.`);
  } catch (err) {
    console.error("Telemetry Logging Error:", err);
    alert("Network timeout synchronization error. Please notify support directly.");
  }
      }
      
