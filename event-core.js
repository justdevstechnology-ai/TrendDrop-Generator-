// BLOCKER 4 RESOLVED: Cleaned and completely validated structural implementation imports
import {
  CoreState,
  validateProductCatalog,
  validateStoreMetadata,
  checkPasswordStrength,
  supabaseAuthProxy,
  deployStoreNode,
  optimizeImage,
  showSizeWarning
} from './app-core.js';

import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from './config.js';

window.addEventListener('DOMContentLoaded', () => {
  // Bind presentation monitoring changes
  document.getElementById('bizName').addEventListener('input', syncLivePreview);
  document.getElementById('bizTagline').addEventListener('input', syncLivePreview);
  document.getElementById('bizVideoUrl').addEventListener('input', syncLivePreview);
  document.getElementById('bizInstagram').addEventListener('input', syncLivePreview);
  document.getElementById('bizFacebook').addEventListener('input', syncLivePreview);
  
  // Merchant Logo Listener Bind Hook
  document.getElementById('merchantLogo').addEventListener('change', previewMerchantLogo);
  
  // BLOCKER 1 & 2 RESOLVED: Safely hooks the base native row without crashing initialization loops
  const firstProductImage = document.querySelector('.prod-image');
  if (firstProductImage) {
    firstProductImage.addEventListener('change', renderCatalogLivePreview);
  }

  document.getElementById('addMoreProductBtn').addEventListener('click', injectProductInputField);
  document.getElementById('storeGeneratorForm').addEventListener('submit', handleFormIntercept);
  
  document.getElementById('tabSignUp').addEventListener('click', toggleSignUpTab);
  document.getElementById('tabLogin').addEventListener('click', toggleLoginTab);
  document.getElementById('btnSubmitAuth').addEventListener('click', executionAuthPipeline);
  document.getElementById('closeAuthModalBtn').addEventListener('click', () => { document.getElementById('authGateModal').style.display = 'none'; });

  document.getElementById('passwordToggleEye').addEventListener('click', togglePasswordVisibility);
  document.getElementById('btnForgotPasswordTrigger').addEventListener('click', handlePasswordRecovery);
  document.getElementById('inlineLoginTrigger').addEventListener('click', launchDirectLoginModal);

  // Privacy and Terms Modals
  document.getElementById('btnPrivacy').addEventListener('click', () => { document.getElementById('privacyModal').style.display = 'flex'; });
  document.getElementById('closePrivacyBtn').addEventListener('click', () => { document.getElementById('privacyModal').style.display = 'none'; });
  document.getElementById('btnTerms').addEventListener('click', () => { document.getElementById('termsModal').style.display = 'flex'; });
  document.getElementById('closeTermsBtn').addEventListener('click', () => { document.getElementById('termsModal').style.display = 'none'; });
});

// Merchant Logo Local Preview Renderer Function
function previewMerchantLogo() {
  const file = document.getElementById('merchantLogo').files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const logo = document.getElementById('previewLogo');
    logo.src = e.target.result;
    logo.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function syncLivePreview() {
  document.getElementById('previewName').textContent = document.getElementById('bizName').value.trim() || "Your Business Name";
  document.getElementById('previewTagline').textContent = document.getElementById('bizTagline').value.trim() || "Your business definition metrics value.";
  
  const videoInput = document.getElementById('bizVideoUrl').value.trim();
  const videoContainer = document.getElementById('previewVideoContainer');
  const videoElement = document.getElementById('previewVideoElement');

  if (videoInput) {
    try {
      new URL(videoInput);
      videoElement.src = videoInput;
      videoContainer.style.display = 'block';
    } catch (_) {
      videoContainer.style.display = 'none';
      videoElement.src = '';
    }
  } else {
    videoContainer.style.display = 'none';
    videoElement.src = '';
  }

  document.getElementById('previewInstaLink').style.display = document.getElementById('bizInstagram').value.trim() ? 'inline-flex' : 'none';
  document.getElementById('previewFbLink').style.display = document.getElementById('bizFacebook').value.trim() ? 'inline-flex' : 'none';
  renderCatalogLivePreview();
}

// Inject upgraded input row template parameters
function injectProductInputField() {
  const wrapper = document.createElement('div');
  wrapper.className = 'product-input-row';
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'prod-name';
  nameInput.placeholder = 'Item Name';
  nameInput.addEventListener('input', renderCatalogLivePreview);

  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.className = 'prod-price';
  priceInput.placeholder = 'Price (₦)';
  priceInput.addEventListener('input', renderCatalogLivePreview);

  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.accept = 'image/*';
  imageInput.className = 'prod-image';
  imageInput.addEventListener('change', renderCatalogLivePreview);

  wrapper.appendChild(nameInput);
  wrapper.appendChild(priceInput);
  wrapper.appendChild(imageInput);
  document.getElementById('productInputContainer').appendChild(wrapper);
}

function renderCatalogLivePreview() {
  const container = document.getElementById('previewCatalog');
  container.innerHTML = '';
  
  const names = document.querySelectorAll('.prod-name');
  const prices = document.querySelectorAll('.prod-price');
  let count = 0;

  names.forEach((el, i) => {
    const rawName = el.value.trim();
    if (rawName) {
      count++;
      const card = document.createElement('div');
      card.className = 'live-product-card';
      
      // Local Dynamic Product Image Attachment Rendering Vector
      const imageInputs = document.querySelectorAll('.prod-image');
      const imageFile = imageInputs[i]?.files?.[0];

      if (imageFile) {
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '180px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginBottom = '8px';

        const reader = new FileReader();
        reader.onload = e => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);
        card.appendChild(img);
      }
      
      const metaDiv = document.createElement('div');
      metaDiv.className = 'live-product-meta';
      
      const h4Title = document.createElement('h4');
      h4Title.textContent = rawName;
      
      const rawPrice = prices[i].value.trim();
      const spanPrice = document.createElement('span');
      spanPrice.textContent = `₦${rawPrice || '0'}`;
      
      metaDiv.appendChild(h4Title);
      metaDiv.appendChild(spanPrice);

      const actionRow = document.createElement('div');
      actionRow.style.display = 'flex';
      actionRow.style.gap = '6px';
      actionRow.style.marginTop = '8px';
      actionRow.style.width = '100%';

      const buyBtn = document.createElement('a');
      buyBtn.href = '#';
      buyBtn.className = 'btn-live-buy';
      buyBtn.style.flex = '2';
      buyBtn.style.textDecoration = 'none';
      buyBtn.style.display = 'flex';
      buyBtn.style.alignItems = 'center';
      buyBtn.style.justifyContent = 'center';
      buyBtn.textContent = '🛒 Order Item';
      buyBtn.addEventListener('click', (e) => e.preventDefault());

      const shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'btn-share-item';
      shareBtn.style.flex = '1';
      shareBtn.style.background = '#f1f5f9';
      shareBtn.style.border = '1px solid var(--border)';
      shareBtn.style.borderRadius = '6px';
      shareBtn.style.cursor = 'pointer';
      shareBtn.style.display = 'flex';
      shareBtn.style.alignItems = 'center';
      shareBtn.style.justifyContent = 'center';
      shareBtn.style.fontSize = '0.75rem';
      shareBtn.textContent = '🔗 Share';
      shareBtn.setAttribute('data-title', rawName);
      shareBtn.addEventListener('click', (e) => {
        executeProductWebShareAction(e.currentTarget.getAttribute('data-title'));
      });

      actionRow.appendChild(buyBtn);
      actionRow.appendChild(shareBtn);
      card.appendChild(metaDiv);
      card.appendChild(actionRow);
      container.appendChild(card);
    }
  });

  if (count === 0) {
    const fallback = document.createElement('p');
    fallback.style.textAlign = 'center';
    fallback.style.color = 'var(--text-muted)';
    fallback.style.fontSize = '0.8rem';
    fallback.style.marginTop = '40px';
    fallback.textContent = 'No items currently in display catalog grid.';
    container.appendChild(fallback);
  }
}

function executeProductWebShareAction(productTitle) {
  const shareData = {
    title: `Check out ${productTitle}!`,
    text: `Look at this find on Tenora Labs.`,
    url: window.location.href
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => console.log('Share dismissed.'));
  } else {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(`${shareData.text} Link: ${shareData.url}`);
      alert(`📋 Link copied to clipboard!`);
    } else {
      prompt('Copy product showcase link:', shareData.url);
    }
  }
}

// Internal asset distribution gateway helper to push binary artifacts up to Supabase storage buckets
// Internal asset distribution gateway helper to push binary artifacts up to Supabase Storage
async function uploadAssetToStorageBucket(fileBlob, pathString) {

  const bucket = 'merchant_assets';

  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${pathString}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'image/webp',
        'x-upsert': 'true'
      },
      body: fileBlob
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Storage upload failed: ${errorText}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathString}`;
}

async function handleFormIntercept(e) {
  e.preventDefault();
  
  try {
    const metadata = validateStoreMetadata();
    const validatedProducts = validateProductCatalog();

    if (validatedProducts.length === 0) {
      alert('⚠️ Validation Failure: You must define at least 1 functional catalog product.');
      return;
    }

    // BLOCKER 3 FIXED: Full pipeline image optimization & live asset storage injection architecture
    const storageUniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Process and optimize Merchant Brand Logo
    let uploadedLogoUrl = "";
    const logoFileElement = document.getElementById('merchantLogo').files[0];
    if (logoFileElement) {
      const optimizedLogoBlob = await optimizeImage(logoFileElement);
      showSizeWarning(logoFileElement.size, optimizedLogoBlob.size);
      uploadedLogoUrl = await uploadAssetToStorageBucket(optimizedLogoBlob, `logos/${storageUniqueId}.webp`);
    }

    // 2. Map, loop, compress, and upload matched catalog item photos sequentially
    const productImagesElements = document.querySelectorAll('.prod-image');
    const finalProductCatalogWithImages = [];

    for (let i = 0; i < validatedProducts.length; i++) {
      const product = validatedProducts[i];
      const imageFile = productImagesElements[i]?.files?.[0];
      let uploadedProductImageUrl = "";

      if (imageFile) {
        const optimizedProdBlob = await optimizeImage(imageFile);
        showSizeWarning(imageFile.size, optimizedProdBlob.size);
        uploadedProductImageUrl = await uploadAssetToStorageBucket(optimizedProdBlob, `products/${storageUniqueId}-${i}.webp`);
      }

      finalProductCatalogWithImages.push({
        name: product.name,
        price: product.price,
        image_url: uploadedProductImageUrl
      });
    }

    CoreState.pendingStorePayload = {
      business_name: metadata.businessName,
      tagline: document.getElementById('bizTagline').value.trim(),
      logo_url: uploadedLogoUrl, 
      video_url: metadata.videoUrl,
      whatsapp_number: metadata.whatsapp,
      instagram_username: document.getElementById('bizInstagram').value.trim(),
      facebook_url: metadata.fbUrl,
      tier_status: document.querySelector('input[name="tierSelection"]:checked').value,
      product_catalog: finalProductCatalogWithImages
    };

    const { data: { user } } = await supabaseAuthProxy.getUser();

    if (user) {
      CoreState.pendingStorePayload.user_id = user.id;
      const createdStore = await deployStoreNode(CoreState.pendingStorePayload);
      handleDeploymentSuccess(createdStore);
    } else {
      document.getElementById('authModalHeading').innerText = "Account Verification Required";
      document.getElementById('authModalDescription').innerText = "To protect platform processing integrity, please create an account or sign in to verify identity records.";
      document.getElementById('authTabsRow').style.display = 'flex';
      toggleSignUpTab();
      document.getElementById('authGateModal').style.display = 'flex';
    }
  } catch (err) {
    alert(`⚠️ Error processing form: ${err.message}`);
  }
}

function toggleSignUpTab() {
  CoreState.authMode = 'signUp';
  document.getElementById('tabSignUp').style.background = 'white';
  document.getElementById('tabLogin').style.background = 'transparent';
  document.getElementById('tabLogin').style.color = 'var(--text-muted)';
  document.getElementById('forgotPasswordContainer').style.display = 'none';
  document.getElementById('passwordFieldWrapper').style.display = 'block';
  document.getElementById('passwordComplexityHint').style.display = 'block';
  document.getElementById('btnSubmitAuth').innerHTML = `<span class="material-icons-round">cloud_done</span> Create Account & Verify`;
}

function toggleLoginTab() {
  CoreState.authMode = 'login';
  document.getElementById('tabLogin').style.background = 'white';
  document.getElementById('tabSignUp').style.background = 'transparent';
  document.getElementById('tabSignUp').style.color = 'var(--text-muted)';
  document.getElementById('forgotPasswordContainer').style.display = 'block';
  document.getElementById('passwordFieldWrapper').style.display = 'block';
  document.getElementById('passwordComplexityHint').style.display = 'none';
  document.getElementById('btnSubmitAuth').innerHTML = `<span class="material-icons-round">login</span> Login to Account`;
}

function launchDirectLoginModal() {
  CoreState.pendingStorePayload = null;
  document.getElementById('authModalHeading').innerText = "Merchant Console Access";
  document.getElementById('authModalDescription').innerText = "Log into your Tenora account to manage your active digital trendDrop-stores.";
  document.getElementById('authTabsRow').style.display = 'flex';
  toggleLoginTab();
  document.getElementById('authPassword').type = 'password';
  document.getElementById('passwordToggleEye').innerText = 'visibility';
  document.getElementById('authGateModal').style.display = 'flex';
}

function togglePasswordVisibility() {
  const pwdField = document.getElementById('authPassword');
  const eyeIcon = document.getElementById('passwordToggleEye');
  if (pwdField.type === 'password') {
    pwdField.type = 'text';
    eyeIcon.innerText = 'visibility_off';
  } else {
    pwdField.type = 'password';
    eyeIcon.innerText = 'visibility';
  }
}

async function handlePasswordRecovery() {
  const email = document.getElementById('authEmail').value.trim();
  if (!email) { 
    alert('Please provide your account email to receive reset validation packages.');
    return;
  }
  try {
    const { error } = await supabaseAuthProxy.resetPassword(email);
    if (error) throw error;
    alert(`📨 Recovery vector channeled to ${email}. Verify your inbox folder parameters.`);
    document.getElementById('authGateModal').style.display = 'none';
  } catch (err) { 
    alert(`Recovery Failure: ${err.message}`); 
  }
}

async function executionAuthPipeline() {
  if (CoreState.authRunning) return;
  
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!email || !password) { alert('Please fill in fields completely.'); return; }

  if (CoreState.authMode === 'signUp') {
    const complexityError = checkPasswordStrength(password);
    if (complexityError) {
      alert(`⚠️ Weak Password Blocked:\n${complexityError}`);
      return;
    }
  }

  CoreState.authRunning = true;
  try {
    if (CoreState.authMode === 'signUp') {
      const response = await supabaseAuthProxy.signUp(email, password);
      if (response.error) throw response.error;
      
      alert('📬 Verification email dispatched! Please confirm registration parameters via your inbox BEFORE attempting configuration loops.');
      document.getElementById('authGateModal').style.display = 'none';
      return;
    }

    const response = await supabaseAuthProxy.signIn(email, password);
    if (response.error) throw response.error;

    if (CoreState.pendingStorePayload) {
      if (response.data && response.data.user) {
        CoreState.pendingStorePayload.user_id = response.data.user.id;
      }
      document.getElementById('authGateModal').style.display = 'none';
      const createdStore = await deployStoreNode(CoreState.pendingStorePayload);
      handleDeploymentSuccess(createdStore);
    } else {
      document.getElementById('authGateModal').style.display = 'none';
      alert('🔒 Login successful! Welcome back.');
      window.location.href = 'dashboard.html';
    }
  } catch (err) { 
    alert(`Authentication Error: ${err.message}`); 
  } finally {
    CoreState.authRunning = false;
  }
}

function handleDeploymentSuccess(store) {
  if (!store || !store.id) {
    window.location.href = 'dashboard.html';
    return;
  }
  if (store.tier_status === 'Premium') {
    alert(`💎 Premium Link Created! To clear the branding, transfer ₦5,000 to OPay (07039105089) then email justdevstechnology@gmail.com with ID: ${store.id}`);
  } else {
    alert(`🎉 Free Link live! URL: ${window.location.origin}/store.html?id=${store.id}`);
  }
  window.location.href = 'dashboard.html';
}
