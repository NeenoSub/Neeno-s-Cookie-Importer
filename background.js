try { importScripts('utils.js'); } catch (e) { /* Firefox MV3 uses manifest scripts array instead of importScripts */ }
let showBadgeCount = true;
let badgeUpdateTimeout = null;
const lastBadgeState = new Map(); // Cache to prevent duplicate IPC calls: { tabId: { text, color } }

// Load initial badge setting
chrome.storage.local.get(['showBadgeCount'], (result) => {
    if (result.showBadgeCount !== undefined) {
        showBadgeCount = result.showBadgeCount;
    }
});

// Listen for settings changes from the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.showBadgeCount) {
        showBadgeCount = changes.showBadgeCount.newValue;
        debouncedUpdateBadgeForActiveTab();
    }
});

function debouncedUpdateBadgeForActiveTab() {
    if (badgeUpdateTimeout) clearTimeout(badgeUpdateTimeout);
    badgeUpdateTimeout = setTimeout(() => {
        updateBadgeForActiveTab();
    }, 200);
}

async function updateBadgeForActiveTab() {
    if (!showBadgeCount) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const id = tabs[0].id;
                if (lastBadgeState.get(id)?.text !== '') {
                    chrome.action.setBadgeText({ text: '', tabId: id });
                    lastBadgeState.set(id, { text: '', color: null });
                }
            }
        });
        return;
    }

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return;
        const activeTab = tabs[0];

        // Skip restricted URLs
        if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('about:')) {
            if (lastBadgeState.get(activeTab.id)?.text !== '') {
                chrome.action.setBadgeText({ text: '', tabId: activeTab.id });
                lastBadgeState.set(activeTab.id, { text: '', color: null });
            }
            return;
        }

        const url = new URL(activeTab.url);
        const rootDomain = getRootDomain(url.hostname);

        // Determine correct cookie store (handles Containers/Incognito)
        let storeId = activeTab.cookieStoreId;
        if (!storeId && chrome.cookies.getAllCookieStores) {
            const stores = await chrome.cookies.getAllCookieStores();
            const store = stores.find(s => s.tabIds.includes(activeTab.id));
            if (store) storeId = store.id;
            else if (activeTab.incognito) {
                const incognitoStore = stores.find(s => s.id !== '0' && s.id !== 'default');
                if (incognitoStore) storeId = incognitoStore.id;
            }
        }
        if (!storeId) storeId = activeTab.incognito ? '1' : '0';

        const queryParams = { storeId: storeId, domain: rootDomain };
        const tabCookies = await chrome.cookies.getAll(queryParams);
        const count = tabCookies.length;

        let countText = count.toString();
        if (count >= 1000) {
            countText = (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }

        const currentState = lastBadgeState.get(activeTab.id) || {};
        if (currentState.text !== countText) {
            chrome.action.setBadgeText({ text: countText, tabId: activeTab.id });
            chrome.action.setBadgeBackgroundColor({ color: '#4f46e5', tabId: activeTab.id });
            if (chrome.action.setBadgeTextColor) {
                chrome.action.setBadgeTextColor({ color: '#ffffff', tabId: activeTab.id });
            }
            lastBadgeState.set(activeTab.id, { text: countText, color: '#4f46e5' });
        }

    } catch (e) {
        console.error("Cookie Importer: Error updating badge", e);
    }
}


// Global Event Listeners to trigger badge recalculation
chrome.tabs.onActivated.addListener((activeInfo) => {
    lastBadgeState.delete(activeInfo.tabId); // Force fresh render on tab switch
    debouncedUpdateBadgeForActiveTab();
});
chrome.tabs.onRemoved.addListener((tabId) => {
    lastBadgeState.delete(tabId); // Cleanup cache limit
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
        if (changeInfo.url) lastBadgeState.delete(tabId);
        debouncedUpdateBadgeForActiveTab();
    }
});
chrome.cookies.onChanged.addListener(debouncedUpdateBadgeForActiveTab);
chrome.windows.onFocusChanged.addListener(debouncedUpdateBadgeForActiveTab);

// Initialize badge immediately
debouncedUpdateBadgeForActiveTab();

// ========================================================
// AUTO-DELETE ENGINE
// ========================================================

let autoDeleteRules = {};
let autoDeleteEnabled = false;
let autoDeleteDelay = 15;
let autoReloadEnabled = true;
let adNotifyEnabled = true;
let lockedCookies = new Set();
const domainTabTracker = {}; // { domain: Set<tabId> }
const pendingCleanups = {};  // { domain: timeoutId }
const ALARM_PREFIX = 'ad_cleanup_';

// --- Persistent Auto-Delete Logging ---
async function adLog(type, message, details = null) {
    console.log(`[Auto-Delete] [${type}] ${message}${details ? ' | ' + JSON.stringify(details) : ''}`);
    try {
        const data = await chrome.storage.local.get(['autoDeleteLogs']);
        const logs = data.autoDeleteLogs || [];
        const timeStr = new Date().toTimeString().split(' ')[0];
        logs.push({ type, timeStr, message: `[AutoDel] ${message}`, detailsStr: details ? (typeof details === 'object' ? `\n  ${JSON.stringify(details, null, 2)}` : ` - ${details}`) : '' });
        while (logs.length > 50) logs.shift();
        await chrome.storage.local.set({ autoDeleteLogs: logs });
    } catch (e) { /* storage error, ignore */ }
}

// Load auto-delete settings
async function loadAutoDeleteConfig() {
    const result = await chrome.storage.local.get(['autoDeleteEnabled', 'autoDeleteRules', 'autoDeleteDelay', 'lockedCookies', 'autoReloadEnabled', 'adNotifyEnabled']);
    autoDeleteEnabled = result.autoDeleteEnabled || false;
    autoDeleteRules = result.autoDeleteRules || {};
    autoDeleteDelay = result.autoDeleteDelay ?? 0;
    lockedCookies = new Set(result.lockedCookies || []);
    autoReloadEnabled = result.autoReloadEnabled ?? true;
    adNotifyEnabled = result.adNotifyEnabled !== undefined ? result.adNotifyEnabled : true;
}

loadAutoDeleteConfig();

// Rebuild domain-tab tracker from all open tabs (survives service worker restart)
async function rebuildDomainTabTracker() {
    for (const key of Object.keys(domainTabTracker)) delete domainTabTracker[key];
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url) {
                const domain = getDomainFromUrl(tab.url);
                if (domain) {
                    if (!domainTabTracker[domain]) domainTabTracker[domain] = new Set();
                    domainTabTracker[domain].add(tab.id);
                }
            }
        }
    } catch (e) { console.error('[Auto-Delete] Error rebuilding tab tracker:', e); }
}
rebuildDomainTabTracker();

// Reload config when popup saves changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    if (changes.autoDeleteEnabled) autoDeleteEnabled = changes.autoDeleteEnabled.newValue;
    if (changes.autoDeleteRules) autoDeleteRules = changes.autoDeleteRules.newValue || {};
    if (changes.autoDeleteDelay) autoDeleteDelay = changes.autoDeleteDelay.newValue ?? 0;
    if (changes.lockedCookies) lockedCookies = new Set(changes.lockedCookies.newValue || []);
    if (changes.autoReloadEnabled !== undefined) autoReloadEnabled = changes.autoReloadEnabled.newValue;
    if (changes.adNotifyEnabled !== undefined) adNotifyEnabled = changes.adNotifyEnabled.newValue;
});

// --- Domain tracking from tabs ---
function getDomainFromUrl(url) {
    if (!url || !url.startsWith('http')) return null;
    try {
        const hostname = new URL(url).hostname;
        if (!hostname) return null;
        return getRootDomain(hostname);
    } catch { return null; }
}

function trackTab(tabId, url) {
    const domain = getDomainFromUrl(url);
    if (!domain) return null;
    // Remove tab from all previous domains, return old domain
    let oldDomain = null;
    for (const d of Object.keys(domainTabTracker)) {
        if (domainTabTracker[d].has(tabId)) {
            oldDomain = d;
            domainTabTracker[d].delete(tabId);
            if (domainTabTracker[d].size === 0) delete domainTabTracker[d];
        }
    }
    // Add to new domain
    if (!domainTabTracker[domain]) domainTabTracker[domain] = new Set();
    domainTabTracker[domain].add(tabId);
    return oldDomain;
}

function findDomainByTab(tabId) {
    for (const [domain, tabs] of Object.entries(domainTabTracker)) {
        if (tabs.has(tabId)) return domain;
    }
    return null;
}

// Track tab URL changes → domain change trigger
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const oldDomain = trackTab(tabId, changeInfo.url);
        const newDomain = getDomainFromUrl(changeInfo.url);
        if (autoDeleteEnabled && oldDomain && oldDomain !== newDomain) {
            scheduleCleanup(oldDomain, 'domainChange');
        }
    }
});

// Tab closed → cleanup for domain (any tab, not just last)
chrome.tabs.onRemoved.addListener((tabId) => {
    const domain = findDomainByTab(tabId);
    if (!domain) return;

    domainTabTracker[domain].delete(tabId);
    if (domainTabTracker[domain].size === 0) {
        delete domainTabTracker[domain];
    }
    if (autoDeleteEnabled) {
        scheduleCleanup(domain, 'tabClose');
    }
});

// Tab switched → loseFocus trigger (only for the domain that JUST lost focus)
let lastActiveDomain = null;
let lastActiveTabId = null;

// Initialize on Service Worker wake-up to prevent missing the first tab switch
(async () => {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.url && !activeTab.url.startsWith('chrome://') && !activeTab.url.startsWith('about:')) {
            lastActiveDomain = getRootDomain(new URL(activeTab.url).hostname);
            lastActiveTabId = activeTab.id;
        }
    } catch (e) { /* ignore */ }
})();
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    if (!autoDeleteEnabled) {
        lastActiveDomain = findDomainByTab(activeInfo.tabId);
        lastActiveTabId = activeInfo.tabId;
        return;
    }
    try {
        // Determine the domain of the newly active tab
        const newActiveDomain = findDomainByTab(activeInfo.tabId);

        // Only trigger loseFocus for the domain that was previously active
        if (lastActiveDomain && lastActiveDomain !== newActiveDomain) {
            const rule = autoDeleteRules[lastActiveDomain];
            if (rule && rule.level === 'normal' && rule.triggers?.loseFocus) {
                const tabToReload = lastActiveTabId;
                scheduleCleanup(lastActiveDomain, 'loseFocus');

                // Auto-reload ONLY the specific tab that just lost focus (not all tabs)
                if (autoReloadEnabled && tabToReload) {
                    try {
                        await chrome.tabs.reload(tabToReload);
                        adLog('INFO', `Auto-reloaded tab ${tabToReload} for ${lastActiveDomain} (loseFocus)`);
                    } catch (e) {
                        adLog('WARN', `Failed to auto-reload tab ${tabToReload}: ${e.message}`);
                    }
                }
            }
        }

        lastActiveDomain = newActiveDomain;
        lastActiveTabId = activeInfo.tabId;
    } catch (e) { /* ignore */ }
});

// Domain navigation change via webNavigation (if available)
if (chrome.webNavigation) {
    chrome.webNavigation.onCommitted.addListener((details) => {
        if (details.frameId !== 0) return; // Only main frame
        const oldDomain = trackTab(details.tabId, details.url);
        const newDomain = getDomainFromUrl(details.url);
        if (autoDeleteEnabled && oldDomain && oldDomain !== newDomain) {
            scheduleCleanup(oldDomain, 'domainChange');
        }
    });
}

// Browser startup → clean greylist (session-only) + restart-trigger domains
chrome.runtime.onStartup.addListener(async () => {
    await loadAutoDeleteConfig();
    if (!autoDeleteEnabled) return;
    for (const [domain, rule] of Object.entries(autoDeleteRules)) {
        if (rule.level === 'greylist' || (rule.level === 'normal' && rule.triggers?.browserRestart)) {
            await cleanDomainCookies(domain, rule);
        }
    }
});

// --- Hybrid Cleanup Scheduling ---
async function scheduleCleanup(domain, trigger) {
    const rule = autoDeleteRules[domain];

    adLog('INFO', `Trigger '${trigger}' fired for domain: ${domain}`);

    if (!rule) {
        adLog('INFO', `Aborted: Rule is undefined for ${domain}`);
        return;
    }
    if (rule.level === 'greylist') {
        adLog('INFO', `Aborted: Rule is greylist for ${domain} (Session only)`);
        return;
    }

    // Check trigger is enabled
    if (trigger === 'tabClose' && !rule.triggers?.tabClose) {
        adLog('INFO', `Aborted: 'tabClose' trigger is disabled for ${domain}`);
        return;
    }
    if (trigger === 'domainChange' && !rule.triggers?.domainChange) {
        adLog('INFO', `Aborted: 'domainChange' trigger is disabled for ${domain}`);
        return;
    }
    if (trigger === 'loseFocus' && !rule.triggers?.loseFocus) {
        adLog('INFO', `Aborted: 'loseFocus' trigger is disabled for ${domain}`);
        return;
    }

    const delaySec = (rule.delay ?? autoDeleteDelay);
    const alarmName = ALARM_PREFIX + domain;

    adLog('INFO', `Scheduling cleanup for ${domain} in ${delaySec} seconds`);

    // 1. Cancel existing
    if (pendingCleanups[domain]) clearTimeout(pendingCleanups[domain]);
    chrome.alarms.clear(alarmName);

    // 2. If delay is 0, execute immediately
    if (delaySec <= 0) {
        await executeCleanupNow(domain);
        return;
    }

    // 3. Schedule precise setTimeout (for when service worker is awake)
    pendingCleanups[domain] = setTimeout(async () => {
        delete pendingCleanups[domain];
        chrome.alarms.clear(alarmName); // Clear the fallback alarm
        await executeCleanupNow(domain);
    }, delaySec * 1000);

    // 3. Schedule fallback alarm — Chrome enforces 1 min minimum for delayInMinutes.
    //    For delays < 60s, the setTimeout handles it. The alarm is a safety net for SW sleep.
    const delayMin = Math.max(delaySec / 60, 1);
    chrome.alarms.create(alarmName, { delayInMinutes: delayMin });
}

// Handle fallback alarm firing (if setTimeout didn't run because SW slept)
// NOTE: After SW restart, pendingCleanups is empty, so we must always reload config.
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const domain = alarm.name.slice(ALARM_PREFIX.length);
    if (pendingCleanups[domain]) {
        // setTimeout is still alive and will handle this — skip the alarm
        adLog('INFO', `Alarm fired for ${domain} but setTimeout is still pending, skipping.`);
        return;
    }
    // SW likely restarted and lost the setTimeout — alarm is our safety net
    adLog('WARN', `Alarm fallback executing for ${domain} (setTimeout was lost, likely SW restart)`);
    await loadAutoDeleteConfig();
    await rebuildDomainTabTracker();
    await executeCleanupNow(domain);
});

// The core execution logic
async function executeCleanupNow(domain) {
    adLog('INFO', `Executing cleanup now for ${domain}`);
    if (!autoDeleteEnabled) {
        adLog('WARN', `Execution aborted: Auto-Delete is globally disabled`);
        return;
    }

    const rule = autoDeleteRules[domain];
    if (!rule || rule.level === 'greylist') {
        adLog('INFO', `Execution aborted: Rule changed or invalid for ${domain}`);
        return;
    }

    // Only block cleanup if the user is actively viewing this domain (loseFocus trigger)
    if (rule.triggers?.loseFocus && domainTabTracker[domain] && domainTabTracker[domain].size > 0) {
        const activeTabs = await chrome.tabs.query({ active: true });
        for (const activeTab of activeTabs) {
            if (domainTabTracker[domain].has(activeTab.id)) {
                adLog('INFO', `Execution aborted: A tab for ${domain} is currently ACTIVE (loseFocus trigger)`);
                return;
            }
        }
        adLog('INFO', `Tabs open for ${domain} but none active, proceeding with cleanup.`);
    }

    await cleanDomainCookies(domain, rule);
}

// --- Core Cleanup ---
async function cleanDomainCookies(domain, rule) {
    try {
        const cookies = await chrome.cookies.getAll({ domain });
        let removedCount = 0;
        let lockedSkipped = 0;
        let expiredSkipped = 0;

        adLog('INFO', `Starting cleanup for ${domain} with rule settings:`, rule);

        for (const cookie of cookies) {
            const key = `${cookie.domain}|${cookie.name}`;
            if (lockedCookies.has(key)) { lockedSkipped++; continue; }

            // If expiredOnly mode, skip non-expired cookies
            if (rule.triggers?.expiredOnly) {
                if (cookie.expirationDate && cookie.expirationDate > Date.now() / 1000) { expiredSkipped++; continue; }
                if (!cookie.expirationDate) { expiredSkipped++; continue; } // Session cookies don't expire naturally
            }

            const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
            const url = `http${cookie.secure ? 's' : ''}://${cleanDomain}${cookie.path}`;
            const removeDetails = { url, name: cookie.name };
            if (cookie.storeId) removeDetails.storeId = cookie.storeId;

            // On Firefox, if the cookie object has firstPartyDomain, pass it explicitly.
            if ('firstPartyDomain' in cookie) {
                removeDetails.firstPartyDomain = cookie.firstPartyDomain;
            }
            if ('partitionKey' in cookie) {
                removeDetails.partitionKey = cookie.partitionKey;
            }

            try {
                const result = await chrome.cookies.remove(removeDetails);
                if (result) {
                    removedCount++;
                } else {
                    adLog('ERROR', `Failed to remove cookie: ${cookie.name}`, {
                        url: removeDetails.url,
                        storeId: removeDetails.storeId,
                        firstPartyDomain: removeDetails.firstPartyDomain,
                        cookieDomain: cookie.domain
                    });
                }
            } catch (err) {
                adLog('ERROR', `Exception removing ${cookie.name}: ${err.message}`, removeDetails);
            }
        }

        // Clean site data if configured
        let cleanedSiteData = [];
        if (rule.siteData) cleanedSiteData = await cleanSiteData(domain, rule.siteData);

        if (removedCount > 0 || cleanedSiteData.length > 0) {
            const siteDataStr = cleanedSiteData.length > 0 ? ` + ${cleanedSiteData.join(', ')}` : '';
            adLog('SUCCESS', `Cleaned ${removedCount} cookies${siteDataStr} for ${domain}${lockedSkipped > 0 ? ` (${lockedSkipped} locked, kept)` : ''}${expiredSkipped > 0 ? ` (${expiredSkipped} skipped via expired filter)` : ''}`);

            // Send in-page toast notification if enabled
            if (adNotifyEnabled) {
                let msg = '';
                if (removedCount > 0) {
                    msg += `${removedCount} cookie${removedCount > 1 ? 's' : ''} deleted`;
                    if (lockedSkipped > 0) msg += ` (${lockedSkipped} locked kept)`;
                }
                if (cleanedSiteData.length > 0) {
                    msg += (msg ? ' + ' : '') + `Cleared: ${cleanedSiteData.join(', ')}`;
                }
                const sendToast = async (retries = 3) => {
                    for (let i = 0; i < retries; i++) {
                        try {
                            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                            if (activeTab && activeTab.id) {
                                await chrome.tabs.sendMessage(activeTab.id, {
                                    type: 'ad-toast',
                                    title: `Auto-Delete: ${domain}`,
                                    message: msg
                                });
                                return; // Success — stop retrying
                            }
                        } catch (e) {
                            // Content script not ready yet — wait and retry
                            if (i < retries - 1) await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                    adLog('WARN', `Toast notification failed after ${retries} attempts for ${domain}`);
                };
                sendToast();
            }
        } else {
            adLog('INFO', `No cookies removed for ${domain} (${cookies.length} found, ${lockedSkipped} locked, ${expiredSkipped} skipped via expired filter)`);
        }
    } catch (e) {
        adLog('ERROR', `Error cleaning ${domain}: ${e.message}`);
    }
}

async function cleanSiteData(domain, siteDataOptions) {
    const dataToRemove = {};
    const cleanedNames = [];
    if (siteDataOptions.localStorage) { dataToRemove.localStorage = true; cleanedNames.push('localStorage'); }
    // sessionStorage is tied to localStorage in the Web Storage API for extension clearing
    if (siteDataOptions.sessionStorage && !dataToRemove.localStorage) {
        dataToRemove.localStorage = true;
        if (!cleanedNames.includes('localStorage')) cleanedNames.push('localStorage');
    }
    if (siteDataOptions.indexedDB) { dataToRemove.indexedDB = true; cleanedNames.push('IndexedDB'); }
    if (siteDataOptions.cache) { dataToRemove.cache = true; cleanedNames.push('Cache'); }
    if (siteDataOptions.serviceWorkers) { dataToRemove.serviceWorkers = true; cleanedNames.push('Service Workers'); }
    if (siteDataOptions.formData) { dataToRemove.formData = true; cleanedNames.push('Form Data'); }

    if (Object.keys(dataToRemove).length === 0) return [];

    try {
        await chrome.browsingData.remove(
            { origins: [`https://${domain}`, `http://${domain}`] },
            dataToRemove
        );
        adLog('SUCCESS', `Site data cleared for ${domain}: ${cleanedNames.join(', ')}`);
        return cleanedNames;
    } catch (e) {
        // Fallback to hostnames (Firefox compat)
        try {
            await chrome.browsingData.remove({ hostnames: [domain] }, dataToRemove);
            adLog('SUCCESS', `Site data cleared for ${domain} (fallback): ${cleanedNames.join(', ')}`);
            return cleanedNames;
        } catch (e2) {
            adLog('ERROR', `Error cleaning site data for ${domain}: ${e2.message}`);
            return [];
        }
    }
}