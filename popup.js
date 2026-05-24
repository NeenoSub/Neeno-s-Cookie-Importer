document.addEventListener('DOMContentLoaded', async () => {
    // --- UI Elements ---
    const importButton = document.getElementById('importCookies');
    const clearButton = document.getElementById('clearCookies');
    const cookiesInput = document.getElementById('cookiesInput');
    const resultMessage = document.getElementById('resultMessage');
    const autoReloadCheckbox = document.getElementById('autoReload');
    const wordWrapToggle = document.getElementById('wordWrapToggle');

    // Word wrap toggle
    if (wordWrapToggle && cookiesInput) {
        wordWrapToggle.addEventListener('click', () => {
            const isWrapped = cookiesInput.style.whiteSpace === 'pre-wrap';
            if (isWrapped) {
                cookiesInput.style.whiteSpace = 'pre';
                cookiesInput.style.overflowX = 'auto';
                wordWrapToggle.classList.remove('active');
            } else {
                cookiesInput.style.whiteSpace = 'pre-wrap';
                cookiesInput.style.overflowX = 'hidden';
                wordWrapToggle.classList.add('active');
            }
        });
    }

    // Move cursor to start after pasting into cookiesInput
    if (cookiesInput) {
        cookiesInput.addEventListener('paste', () => {
            setTimeout(() => {
                cookiesInput.scrollTop = 0;
                cookiesInput.setSelectionRange(0, 0);
            }, 0);
        });
    }

    // Persist auto-reload toggle state for background.js
    chrome.storage.local.get(['autoReloadEnabled'], (result) => {
        if (result.autoReloadEnabled !== undefined) autoReloadCheckbox.checked = result.autoReloadEnabled;
    });
    autoReloadCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ autoReloadEnabled: autoReloadCheckbox.checked });
    });
    const websiteDisplay = document.getElementById('websiteName');
    const allDomainsCheckbox = document.getElementById('allDomainsCheckbox');
    const inputCard = document.querySelector('.input-card');
    const themeToggle = document.getElementById('themeToggle');

    // Preview Section Elements
    const previewSection = document.getElementById('previewSection');
    const detectedFormat = document.getElementById('detectedFormat');
    const cookieCount = document.getElementById('cookieCount');
    const duplicateCountEl = document.getElementById('duplicateCount');
    const expiredCountEl = document.getElementById('expiredCount');
    const expiredSection = document.getElementById('expiredSection');
    const expiredDivider = document.getElementById('expiredDivider');
    const conflictOptions = document.getElementById('conflictOptions');
    const renewButton = document.getElementById('renewExpiredOption');

    // Storage / Manage Elements
    const statBtnCookies = document.getElementById('stat-btn-cookies');
    const totalCookiesCountDisplay = document.getElementById('totalCookiesCount');

    // Export Elements
    const exportMenuBtn = document.getElementById('exportMenuBtn');
    const exportModal = document.getElementById('exportModal');
    const closeExportModalBtn = document.getElementById('closeExportModalBtn');
    const exportOptions = document.querySelectorAll('.export-option-card');

    // Shortcuts & Advanced Elements
    const openAdvancedBtn = document.getElementById('openAdvancedBtn');
    const advancedModal = document.getElementById('advancedModal');
    const closeAdvancedBtn = document.getElementById('closeAdvancedBtn');

    // Advanced Settings Elements
    const showBadgeToggle = document.getElementById('showBadgeToggle');
    const renewDurationSelect = document.getElementById('renewDurationSelect');
    const customRenewContainer = document.getElementById('customRenewContainer');
    const customRenewDays = document.getElementById('customRenewDays');
    const advancedClearBtn = document.getElementById('advancedClearBtn');
    const maxLogEntriesInput = document.getElementById('maxLogEntriesInput');

    const openShortcutsBtn = document.getElementById('openShortcutsBtn');
    const shortcutsModal = document.getElementById('shortcutsModal');
    const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');

    // Modal Elements (Manage Modal)
    const modal = document.getElementById('manageModal');
    const manageModalTitle = document.getElementById('manageModalTitle');
    const manageViewDomainsBtn = document.getElementById('manageViewDomainsBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cookieListContainer = document.getElementById('cookieListContainer');
    const applyChangesBtn = document.getElementById('applyChangesBtn');
    const editorSearch = document.getElementById('editorSearch');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const modalFooter = document.querySelector('.modal-footer-dynamic');
    const showAdvancedToggle = document.getElementById('showAdvancedToggle');
    const manageAdvancedFilters = document.getElementById('manageAdvancedFilters');

    // Manage Layout Interactions
    const selectAllManage = document.getElementById('selectAllManage');
    const deleteSelectedManageBtn = document.getElementById('deleteSelectedManageBtn');

    // Review Import Modal Elements
    const importModal = document.getElementById('importReviewModal');
    const importViewDomainsBtn = document.getElementById('importViewDomainsBtn');
    const closeImportModalBtn = document.getElementById('closeImportModalBtn');
    const importListContainer = document.getElementById('importListContainer');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const importSearch = document.getElementById('importSearch');
    const importAdvancedToggle = document.getElementById('importAdvancedToggle');
    const importAdvancedFilters = document.getElementById('importAdvancedFilters');
    const selectAllImport = document.getElementById('selectAllImport');
    const deleteSelectedImportBtn = document.getElementById('deleteSelectedImportBtn');

    // Snapshots Elements
    const btnOpenSnapshots = document.getElementById('btnOpenSnapshots');
    const snapshotsModal = document.getElementById('snapshotsModal');
    const closeSnapshotsModalBtn = document.getElementById('closeSnapshotsModalBtn');
    const createSnapshotBtn = document.getElementById('createSnapshotBtn');
    const snapshotsContainer = document.getElementById('snapshotsContainer');
    const exportSnapshotsBtn = document.getElementById('exportSnapshotsBtn');
    const importSnapshotsBtn = document.getElementById('importSnapshotsBtn');

    const openSnapshotOptionsBtn = document.getElementById('openSnapshotOptionsBtn');
    const snapshotOptionsModal = document.getElementById('snapshotOptionsModal');
    const closeSnapshotOptionsBtn = document.getElementById('closeSnapshotOptionsBtn');

    const snapshotHostsModal = document.getElementById('snapshotHostsModal');
    const closeSnapshotHostsBtn = document.getElementById('closeSnapshotHostsBtn');
    const snapshotHostsList = document.getElementById('snapshotHostsList');
    const snapshotHostsTitle = document.getElementById('snapshotHostsTitle');
    const snapshotHostsSearch = document.getElementById('snapshotHostsSearch');

    // Custom Input Modal
    const customInputModal = document.getElementById('customInputModal');
    const customInputTitle = document.getElementById('customInputTitle');
    const customInputMessage = document.getElementById('customInputMessage');
    const customInputValue = document.getElementById('customInputValue');
    const customInputCancelBtn = document.getElementById('customInputCancelBtn');
    const customInputConfirmBtn = document.getElementById('customInputConfirmBtn');
    const closeInputModalBtn = document.getElementById('closeInputModalBtn');
    let customInputResolve = null;

    // Custom Confirm Modal
    const customConfirmModal = document.getElementById('customConfirmModal');
    const customConfirmTitle = document.getElementById('customConfirmTitle');
    const customConfirmMessage = document.getElementById('customConfirmMessage');
    const customConfirmCancelBtn = document.getElementById('customConfirmCancelBtn');
    const customConfirmOkBtn = document.getElementById('customConfirmOkBtn');
    const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
    let customConfirmResolve = null;

    // Log Elements
    const logToggle = document.getElementById('logToggle');
    const logContainer = document.getElementById('activityLogContainer');
    const logContent = document.getElementById('activityLogContent');
    const copyLogBtn = document.getElementById('copyLogBtn');
    const clearLogBtn = document.getElementById('clearLogBtn');

    // --- Dynamic UI Improvements ---

    // Allow closing modals by clicking outside of them (backdrop)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('mousedown', (e) => {
            if (e.target === modal) {
                const closeBtn = modal.querySelector('.close-btn');
                if (closeBtn) closeBtn.click();
            }
        });
    });

    // 1. Android Link Color
    const androidLink = document.querySelector('.android-link');
    if (androidLink) androidLink.style.color = '#10b981';

    // 2. Add Cookies to Deep Clean
    const dcGrid = document.querySelector('.dc-grid');
    if (dcGrid && !document.getElementById('dc-cookies')) {
        const cookieLabel = document.createElement('label');
        cookieLabel.className = 'dc-item';
        cookieLabel.innerHTML = `<input type="checkbox" id="dc-cookies" checked> Cookies`;
        dcGrid.appendChild(cookieLabel);
    }

    // 3. Dynamic Deep Clean UI updates
    function updateDeepCleanScopeUI() {
        const targetDisplay = document.getElementById('dc-target-display');
        if (targetDisplay) {
            let scopeText = 'Unknown Website';
            if (allowAllDomains) {
                scopeText = 'ALL DOMAINS';
            } else if (currentUrl) {
                if (!currentUrl.protocol.startsWith('http')) {
                    scopeText = `Restricted Browser Page`;
                } else {
                    scopeText = currentUrl.hostname;
                }
            }
            targetDisplay.textContent = scopeText;
        }
    }

    // Setup Select Event Listeners for SameSite
    const filterManageSameSite = document.getElementById('filter-manage-samesite');
    if (filterManageSameSite) {
        filterManageSameSite.addEventListener('change', () => {
            if (filterManageSameSite.value) filterManageSameSite.classList.add('active');
            else filterManageSameSite.classList.remove('active');
            handleEditorSearch({ target: editorSearch });
        });
    }

    const filterImportSameSite = document.getElementById('filter-import-samesite');
    if (filterImportSameSite) {
        filterImportSameSite.addEventListener('change', () => {
            if (filterImportSameSite.value) filterImportSameSite.classList.add('active');
            else filterImportSameSite.classList.remove('active');
            renderImportList();
        });
    }

    // --- Utility: Debounce ---
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function escapeHtml(text) {
        if (text == null) return '';
        return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    const versionBadge = document.getElementById('versionBadge');
    if (versionBadge) {
        const manifest = chrome.runtime.getManifest();
        versionBadge.textContent = manifest.version;
    }

    // --- State ---
    let conflictResolution = 'overwrite';
    let currentUrl;
    let currentStoreId = null;
    let allowAllDomains = false;
    let renewDurationValue = 2592000;
    let maxLogEntries = 100;

    // Manage Modal State
    const cachedData = { cookies: [], rootDomain: null, currentUrl: null };
    let originalState = [];
    let editorState = [];
    const editorStateMap = new Map();
    let isBulkImporting = false;
    let filteredState = [];
    let deletedIds = new Set();
    let isDirty = false;
    let currentRenderLimit = 50;
    const RENDER_BATCH_SIZE = 50;
    let showAdvanced = false;

    let isEditingSnapshot = false;
    let editingSnapshotId = null;
    let activeSnapshotGroupedData = [];

    let stagedImportData = [];
    let importedFormat = 'Unknown';
    let importedDuplicates = 0;
    let showImportAdvanced = false;
    let currentImportRenderLimit = 50;

    let lockedCookies = new Set();
    let dbAvailable = true;

    // Search scope state
    let manageSearchScope = 'all';
    let importSearchScope = 'all';

    // --- Dynamic Shortcut System ---
    const DEFAULT_SHORTCUTS = [
        { id: 'toggleReload', desc: 'Toggle Auto-Reload', mod: 'alt', key: 'a' },
        { id: 'clearCookies', desc: 'Clear Cookies', mod: 'alt', key: 'q' },
        { id: 'importData', desc: 'Import Data', mod: 'ctrl', key: 'f' },
        { id: 'exportJson', desc: 'Export JSON', mod: 'ctrl', key: 'e' },
        { id: 'quickSnap', desc: 'Quick Snapshot', mod: 'ctrl', key: 's' },
        { id: 'restoreSnap', desc: 'Restore Last Snapshot', mod: 'ctrl', key: 'r' }
    ];
    let userShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
    let recordingShortcutId = null; // Currently editing shortcut

    // --- Theme ---
    chrome.storage.local.get(['theme'], (result) => {
        if (result.theme === 'dark') document.body.classList.add('dark-mode');
    });

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        chrome.storage.local.set({ theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light' });
    });

    // --- Deep Clean State ---
    const dcCheckboxes = ['dc-localstorage', 'dc-indexeddb', 'dc-cache', 'dc-sw', 'dc-formdata', 'dc-cookies'];
    chrome.storage.local.get(dcCheckboxes, (result) => {
        dcCheckboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el && result[id] !== undefined) {
                el.checked = result[id];
            }
            if (el) {
                el.addEventListener('change', (e) => {
                    chrome.storage.local.set({ [id]: e.target.checked });
                });
            }
        });
    });

    // --- FILTER PILL LOGIC (for existing pills) ---
    document.querySelectorAll('.filter-pill:not([id*="samesite"])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.classList.toggle('active');
            if (e.target.id.includes('manage')) handleEditorSearch({ target: editorSearch });
            if (e.target.id.includes('import')) renderImportList();
        });
    });

    // --- LOGGER SYSTEM ---
    let persistentLogs = [];
    const Logger = {
        async init() {
            try {
                const data = await chrome.storage.local.get(['activityLogs', 'autoDeleteLogs']);
                persistentLogs = data.activityLogs || [];
                persistentLogs.forEach(entry => this.renderEntry(entry.type, entry.timeStr, entry.message, entry.detailsStr));
                // Also render auto-delete logs from background service worker
                const adLogs = data.autoDeleteLogs || [];
                adLogs.forEach(entry => this.renderEntry(entry.type, entry.timeStr, entry.message, entry.detailsStr));
            } catch (e) { }
            // Listen for new auto-delete logs arriving while popup is open
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes.autoDeleteLogs) {
                    const newLogs = changes.autoDeleteLogs.newValue || [];
                    const oldLogs = changes.autoDeleteLogs.oldValue || [];
                    // Only render newly added entries
                    const newEntries = newLogs.slice(oldLogs.length);
                    newEntries.forEach(entry => this.renderEntry(entry.type, entry.timeStr, entry.message, entry.detailsStr));
                }
            });
        },
        renderEntry(type, timeStr, message, detailsStr) {
            const entryDiv = document.createElement('div');
            entryDiv.className = `log-entry log-${type.toLowerCase()}`;
            entryDiv.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-type">${type}</span> ${escapeHtml(message)} <span class="log-details">${escapeHtml(detailsStr)}</span>`;
            logContent.appendChild(entryDiv);
            logContent.scrollTop = logContent.scrollHeight;

            while (logContent.children.length > maxLogEntries) {
                logContent.removeChild(logContent.firstChild);
            }
        },
        log(type, message, details = null) {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            let detailsStr = '';
            if (details) {
                if (typeof details === 'object') detailsStr = `\n  ${escapeHtml(JSON.stringify(details, null, 2))}`;
                else detailsStr = ` - ${escapeHtml(details)}`;
            }

            this.renderEntry(type, timeStr, message, detailsStr);

            persistentLogs.push({ type, timeStr, message, detailsStr });
            if (persistentLogs.length > maxLogEntries) persistentLogs = persistentLogs.slice(-maxLogEntries);
            chrome.storage.local.set({ activityLogs: persistentLogs }).catch(() => { });
        },
        info(msg, details) { this.log('INFO', msg, details); },
        success(msg, details) { this.log('SUCCESS', msg, details); },
        error(msg, details) { this.log('ERROR', msg, details); },
        warn(msg, details) { this.log('WARN', msg, details); }
    };
    Logger.init();

    logToggle.addEventListener('click', () => {
        const isVisible = logContainer.style.display === 'block';
        logContainer.style.display = isVisible ? 'none' : 'block';
        logToggle.classList.toggle('open', !isVisible);
    });
    clearLogBtn.addEventListener('click', () => {
        logContent.innerHTML = '';
        persistentLogs = [];
        chrome.storage.local.set({ activityLogs: [] }).catch(() => { });
    });
    copyLogBtn.addEventListener('click', () => {
        const text = logContent.innerText;
        copyToClipboard(text, 'Log copied!');
    });

    // --- UTILS ---
    function get24hTime(date) {
        return date.toLocaleTimeString(undefined, { hour12: false });
    }
    function getDateTime24h(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString(undefined, { hour12: false });
    }

    // --- HELPER FUNCTIONS FOR MODALS ---
    function openInputModal(title, message, placeholder = '') {
        return new Promise((resolve) => {
            customInputTitle.textContent = title;
            customInputMessage.textContent = message;
            customInputValue.value = '';
            customInputValue.placeholder = placeholder;
            customInputResolve = resolve;
            customInputModal.classList.add('show');
            customInputValue.focus();
        });
    }

    function closeInputModal(value) {
        customInputModal.classList.remove('show');
        if (customInputResolve) customInputResolve(value);
        customInputResolve = null;
    }

    customInputConfirmBtn.onclick = () => closeInputModal(customInputValue.value);
    customInputCancelBtn.onclick = () => closeInputModal(null);
    closeInputModalBtn.onclick = () => closeInputModal(null);
    customInputValue.onkeydown = (e) => { if (e.key === 'Enter') closeInputModal(customInputValue.value); };

    function openConfirmModal(title, message, okText = 'Yes', isDanger = false) {
        return new Promise((resolve) => {
            customConfirmTitle.textContent = title;
            customConfirmMessage.textContent = message;
            customConfirmOkBtn.textContent = okText;
            if (isDanger) customConfirmOkBtn.classList.add('danger-btn');
            else customConfirmOkBtn.classList.remove('danger-btn');

            customConfirmResolve = resolve;
            customConfirmModal.classList.add('show');
        });
    }

    function closeConfirmModal(result) {
        customConfirmModal.classList.remove('show');
        if (customConfirmResolve) customConfirmResolve(result);
        customConfirmResolve = null;
    }

    customConfirmOkBtn.onclick = () => closeConfirmModal(true);
    customConfirmCancelBtn.onclick = () => closeConfirmModal(false);
    closeConfirmModalBtn.onclick = () => closeConfirmModal(false);

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 150);
    }

    function openExportChoiceModal(title, message, btn1Text, btn2Text) {
        return new Promise((resolve) => {
            customConfirmTitle.textContent = title;
            customConfirmMessage.textContent = message;

            customConfirmOkBtn.textContent = btn1Text;
            customConfirmOkBtn.classList.remove('danger-btn');
            customConfirmCancelBtn.textContent = btn2Text;

            const cleanup = () => {
                customConfirmCancelBtn.textContent = 'Cancel';
                customConfirmOkBtn.onclick = () => closeConfirmModal(true);
                customConfirmCancelBtn.onclick = () => closeConfirmModal(false);
                closeConfirmModalBtn.onclick = () => closeConfirmModal(false);
            };

            const handleChoice1 = () => {
                customConfirmModal.classList.remove('show');
                cleanup();
                resolve('choice1');
            };

            const handleChoice2 = () => {
                customConfirmModal.classList.remove('show');
                cleanup();
                resolve('choice2');
            };

            const handleDismiss = () => {
                customConfirmModal.classList.remove('show');
                cleanup();
                resolve('dismiss');
            };

            customConfirmOkBtn.onclick = handleChoice1;
            customConfirmCancelBtn.onclick = handleChoice2;
            closeConfirmModalBtn.onclick = handleDismiss;

            customConfirmModal.classList.add('show');
        });
    }

    async function getStoreId(tab) {
        if (tab.cookieStoreId) return tab.cookieStoreId;
        if (chrome.cookies.getAllCookieStores) {
            try {
                const stores = await chrome.cookies.getAllCookieStores();
                const store = stores.find(s => s.tabIds.includes(tab.id));
                if (store) return store.id;
                if (tab.incognito) {
                    const incognitoStore = stores.find(s => s.id !== '0' && s.id !== 'default');
                    if (incognitoStore) return incognitoStore.id;
                }
            } catch (e) { }
        }
        return tab.incognito ? '1' : '0';
    }

    // --- Init ---
    async function initializeData() {
        try {
            const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (currentTab) {
                currentUrl = currentTab.url ? new URL(currentTab.url) : null;
                currentStoreId = await getStoreId(currentTab);
                cachedData.currentUrl = currentUrl;
                websiteDisplay.textContent = currentUrl?.hostname || "No active website";
                Logger.info('Init', `Tab: ${currentUrl?.hostname}, Store: ${currentStoreId}`);
            } else {
                websiteDisplay.textContent = "Unavailable";
            }

            const lockedData = await chrome.storage.local.get(['lockedCookies', 'renewDurationValue', 'renewDurationType', 'customRenewDays', 'showBadgeCount', 'maxLogEntries']);
            if (lockedData.lockedCookies) {
                lockedCookies = new Set(lockedData.lockedCookies);
            }

            if (lockedData.renewDurationValue) renewDurationValue = lockedData.renewDurationValue;
            if (lockedData.renewDurationType) renewDurationSelect.value = lockedData.renewDurationType;
            if (lockedData.customRenewDays) customRenewDays.value = lockedData.customRenewDays;

            if (lockedData.maxLogEntries !== undefined) {
                maxLogEntries = parseInt(lockedData.maxLogEntries);
                maxLogEntriesInput.value = maxLogEntries;
            }

            if (lockedData.showBadgeCount !== undefined) {
                showBadgeToggle.checked = lockedData.showBadgeCount;
            } else {
                showBadgeToggle.checked = true;
            }

            updateRenewSettingsUI();
            updateDeepCleanScopeUI();

            try {
                await cookieDB.getDb();
                dbAvailable = true;
            } catch (err) {
                console.warn("[Cookie Importer] IndexedDB init failed (normal in Firefox private window):", err);
                dbAvailable = false;
                if (btnOpenSnapshots) {
                    btnOpenSnapshots.classList.add('disabled-btn');
                    btnOpenSnapshots.title = "Snapshots unavailable in this context";
                    btnOpenSnapshots.style.opacity = '0.5';
                }
            }

            await refreshCookieStats();

        } catch (error) {
            console.error('Init error:', error);
            websiteDisplay.textContent = "Unavailable";
            await refreshCookieStats();
        }

        chrome.cookies.onChanged.addListener(debounce(async () => {
            if (isBulkImporting) return;
            if (!isEditingSnapshot && !modal.classList.contains('show') && !importModal.classList.contains('show')) {
                await refreshCookieStats();
            }
        }, 150));
    }

    async function refreshCookieStats() {
        const query = currentStoreId ? { storeId: currentStoreId } : {};
        if (!allowAllDomains && cachedData.currentUrl) {
            query.domain = getRootDomain(cachedData.currentUrl.hostname);
        }

        const allCookies = await chrome.cookies.getAll(query);

        if (allowAllDomains) {
            cachedData.cookies = allCookies;
        } else if (cachedData.currentUrl) {
            cachedData.cookies = allCookies;
        } else {
            cachedData.cookies = [];
        }

        if (totalCookiesCountDisplay) {
            totalCookiesCountDisplay.textContent = cachedData.cookies.length;
        }
    }

    allDomainsCheckbox.addEventListener('change', async (e) => {
        allowAllDomains = e.target.checked;
        if (allowAllDomains) inputCard.classList.add('global-mode');
        else inputCard.classList.remove('global-mode');

        websiteDisplay.textContent = allowAllDomains
            ? "All Domains"
            : currentUrl?.hostname || "Unavailable";
        Logger.info('Scope Change', `Allow All Domains: ${allowAllDomains}`);

        updateDeepCleanScopeUI();
        await refreshCookieStats();
    });

    const setResultMessage = (message, type = 'info', duration = 4000) => {
        if (resultMessage._timer) clearTimeout(resultMessage._timer);
        resultMessage.style.animation = 'none';
        void resultMessage.offsetWidth;
        resultMessage.style.animation = 'slideUp 0.3s ease-out';

        resultMessage.className = `message-box-fixed ${type}`;
        resultMessage.textContent = message;
        resultMessage.style.display = 'block';

        if (duration > 0) {
            resultMessage._timer = setTimeout(() => {
                resultMessage.style.display = 'none';
                resultMessage.style.animation = '';
            }, duration);
        }
    };

    const getCookieDomainScope = (hostname) => {
        if (/^[\d.]+$/.test(hostname) || hostname === 'localhost') return hostname;
        return '.' + getRootDomain(hostname);
    };

    function updatePreview() {
        const input = cookiesInput.value.trim();
        if (!input) {
            previewSection.style.display = 'none';
            return;
        }

        const { cookies, format, duplicateCount: dups } = parseInputCookies(input);
        const uniqueCount = cookies.length;
        let expiredCount = 0;
        const now = Math.floor(Date.now() / 1000);

        cookies.forEach(c => {
            if (c.expiration && c.expiration > 0 && c.expiration < now) expiredCount++;
        });

        detectedFormat.textContent = format;
        cookieCount.textContent = uniqueCount;
        duplicateCountEl.textContent = dups;

        const formatsWithoutExpiry = ['Header String', 'Python Dict'];

        if (formatsWithoutExpiry.includes(format)) {
            expiredSection.style.display = 'none';
            expiredDivider.style.display = 'none';
            renewButton.style.display = 'none';
        } else {
            expiredSection.style.display = 'inline';
            expiredDivider.style.display = 'inline';
            expiredCountEl.textContent = expiredCount;
            renewButton.style.display = expiredCount > 0 ? 'inline-block' : 'none';
        }

        previewSection.style.display = 'block';
    }

    function renewExpiredCookies() {
        Logger.info('Renew Expired', 'Starting renewal process');
        const input = cookiesInput.value.trim();
        if (!input) return;
        const now = Math.floor(Date.now() / 1000);
        const newExpiration = now + renewDurationValue;
        const { format } = parseInputCookies(input);
        let updatedInput = input;
        let count = 0;

        if (format === 'JSON' || format === 'Puppeteer') {
            try {
                let cookies = JSON.parse(input);
                const isArray = Array.isArray(cookies);
                if (!isArray) cookies = [cookies];

                cookies = cookies.map(cookie => {
                    const cookieExpires = cookie.expiration || cookie.expires || cookie.expirationDate;
                    if (cookieExpires && cookieExpires < now) {
                        count++;
                        if (cookie.expiration) cookie.expiration = newExpiration;
                        else if (cookie.expires) cookie.expires = newExpiration;
                        else if (cookie.expirationDate) cookie.expirationDate = newExpiration;
                    }
                    return cookie;
                });
                updatedInput = JSON.stringify(isArray ? cookies : cookies[0], null, 2);
            } catch (e) { }
        } else if (format === 'Netscape') {
            const lines = input.split('\n').map(line => {
                let trimmed = line.trim();
                if (!trimmed) return line;
                let prefix = '';
                if (trimmed.startsWith('#HttpOnly_')) {
                    trimmed = trimmed.substring(10);
                    prefix = '#HttpOnly_';
                } else if (trimmed.startsWith('#')) return line;
                const fields = trimmed.split('\t');
                if (fields.length < 6) return line;
                const expiration = parseInt(fields[4], 10);
                if (!isNaN(expiration) && expiration > 0 && expiration < now) {
                    count++;
                    fields[4] = newExpiration.toString();
                    return prefix + fields.join('\t');
                }
                return line;
            });
            updatedInput = lines.join('\n');
        }

        if (count > 0) {
            cookiesInput.value = updatedInput;
            updatePreview();
            setResultMessage("Expired cookies renewed.", "success");
            Logger.success('Renewed', `${count} cookies updated`);
        } else {
            setResultMessage("No renewable expired cookies found.", "info");
        }
    }

    conflictOptions.addEventListener('change', (e) => {
        if (e.target.name === 'conflict') conflictResolution = e.target.value;
    });

    renewButton.addEventListener('click', renewExpiredCookies);

    async function performCookieClear(skipConfirm = false) {
        Logger.info('Clear Request', `Scope: ${allowAllDomains ? 'ALL' : 'Current Site'}`);

        if (allowAllDomains && !skipConfirm) {
            const confirmed = await openConfirmModal("Clear All Cookies?", "Clear ALL cookies for ALL websites? Protected cookies will be kept.", "Clear All", true);
            if (!confirmed) {
                Logger.info('Clear', 'Cancelled by user');
                return { success: false, cancelled: true };
            }
        }

        try {
            let cookies;
            const queryParams = currentStoreId ? { storeId: currentStoreId } : {};

            if (allowAllDomains) {
                cookies = await chrome.cookies.getAll(queryParams);
            } else {
                if (!currentUrl) {
                    setResultMessage('No active tab URL', 'error');
                    return false;
                }
                const domainScope = getCookieDomainScope(currentUrl.hostname);
                queryParams.domain = domainScope;
                cookies = await chrome.cookies.getAll(queryParams);
            }

            let skippedLockedCount = 0;
            const promises = [];

            for (const cookie of cookies) {
                const key = `${cookie.domain}|${cookie.name}`;
                if (lockedCookies.has(key)) {
                    skippedLockedCount++;
                    continue;
                }

                const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
                const url = `http${cookie.secure ? 's' : ''}://${cleanDomain}${cookie.path}`;
                const removeDetails = { url: url, name: cookie.name };
                if (currentStoreId) removeDetails.storeId = currentStoreId;
                if (cookie.firstPartyDomain !== undefined) removeDetails.firstPartyDomain = cookie.firstPartyDomain;
                if (cookie.partitionKey !== undefined) removeDetails.partitionKey = cookie.partitionKey;

                promises.push(chrome.cookies.remove(removeDetails));
            }

            const removalResults = await Promise.allSettled(promises);
            const removedCount = removalResults.filter(r => r.status === 'fulfilled' && r.value !== null).length;

            return { removedCount, skippedLockedCount, success: true };

        } catch (e) {
            console.error(e);
            Logger.error('Clear Failed', e.message);
            return { success: false, error: e };
        }
    }

    clearButton.addEventListener('click', async () => {
        clearButton.classList.add('is-loading');
        clearButton.disabled = true;

        const result = await performCookieClear();

        clearButton.classList.remove('is-loading');
        clearButton.disabled = false;

        if (result && result.success) {
            setResultMessage(`Cleared ${result.removedCount} cookies. ${result.skippedLockedCount > 0 ? result.skippedLockedCount + ' kept (locked).' : ''}`, 'success');
            Logger.success('Clear Completed', `Removed: ${result.removedCount}, Locked/Kept: ${result.skippedLockedCount}`);
            await refreshCookieStats();
            if (autoReloadCheckbox.checked) chrome.tabs.reload();
        } else if (result && !result.success) {
            setResultMessage('Failed to clear cookies', 'error');
        }
    });

    // --- IMPORT LOGIC ---
    importButton.addEventListener('click', async () => {
        let inputData = cookiesInput.value.trim();
        if (!inputData) {
            try {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {
                    inputData = clipboardText.trim();
                    cookiesInput.value = inputData;
                    cookiesInput.scrollTop = 0;
                    cookiesInput.setSelectionRange(0, 0);
                    updatePreview();
                    setResultMessage("Imported from clipboard.", "info");
                    Logger.info('Import', 'Loaded from clipboard');
                } else {
                    return setResultMessage('No cookies found.', 'warning');
                }
            } catch (err) {
                return setResultMessage('Click on extension screen first!', 'error');
            }
        }

        try {
            const { cookies, format, duplicateCount } = parseInputCookies(inputData);
            if (cookies.length === 0) return setResultMessage('No valid cookies found.', 'error');

            stagedImportData = cookies.map(c => ({ data: c, selected: true }));
            importedFormat = format;
            importedDuplicates = duplicateCount;
            openImportReviewModal();
            Logger.info('Import Parsed', `${cookies.length} valid cookies (${format})`);

        } catch (e) {
            setResultMessage('Parse error.', 'error');
            Logger.error('Parse Failed', e.message);
        }
    });

    function openImportReviewModal() {
        importSearch.value = '';
        currentImportRenderLimit = 50;
        renderImportList();
        importModal.classList.add('show');
    }

    closeImportModalBtn.addEventListener('click', () => { importModal.classList.remove('show'); stagedImportData = []; });
    cancelImportBtn.addEventListener('click', () => { importModal.classList.remove('show'); stagedImportData = []; });

    importAdvancedToggle.addEventListener('change', (e) => {
        showImportAdvanced = e.target.checked;
        importAdvancedFilters.style.display = showImportAdvanced ? 'flex' : 'none';
        renderImportList();
    });

    const loadMoreImportBtn = document.getElementById('loadMoreImportBtn');
    if (loadMoreImportBtn) {
        loadMoreImportBtn.addEventListener('click', () => {
            currentImportRenderLimit += 50;
            renderImportList(true);
        });
    }

    // Centralized import filter cache — avoids re-filtering the same data in multiple functions
    let cachedFilteredImport = [];
    function getFilteredImportItems() {
        const searchTerm = importSearch.value.toLowerCase();
        const reqSecure = document.getElementById('filter-import-secure')?.classList.contains('active');
        const reqHttpOnly = document.getElementById('filter-import-httponly')?.classList.contains('active');
        const reqSameSite = document.getElementById('filter-import-samesite')?.value || '';

        cachedFilteredImport = stagedImportData.map((item, index) => ({ item, index })).filter(({ item }) => {
            if (!item) return false;
            if (reqSecure && !item.data.secure) return false;
            if (reqHttpOnly && !item.data.httpOnly) return false;
            if (reqSameSite) {
                let sSite = item.data.sameSite;
                if (sSite === 'none') sSite = 'no_restriction';
                if ((sSite || 'unspecified') !== reqSameSite) return false;
            }
            if (searchTerm) {
                const nameMatch = item.data.name.toLowerCase().includes(searchTerm);
                const valueMatch = item.data.value.toLowerCase().includes(searchTerm);
                const domainMatch = (item.data.domain || '').toLowerCase().includes(searchTerm);
                if (importSearchScope === 'name') return nameMatch;
                if (importSearchScope === 'domain') return domainMatch;
                if (importSearchScope === 'value') return valueMatch;
                return nameMatch || valueMatch || domainMatch;
            }
            return true;
        });
        return cachedFilteredImport;
    }

    function updateImportDeleteBtnState() {
        if (!deleteSelectedImportBtn) return;
        const listToRender = cachedFilteredImport.slice(0, currentImportRenderLimit);
        const hasSelected = listToRender.some(({ item }) => item.selected);
        deleteSelectedImportBtn.disabled = !hasSelected;
    }

    if (deleteSelectedImportBtn) {
        deleteSelectedImportBtn.addEventListener('click', () => {
            const listToRender = cachedFilteredImport.slice(0, currentImportRenderLimit);
            let markedAny = false;

            listToRender.forEach(({ item, index }) => {
                if (item && item.selected) {
                    stagedImportData[index] = null;
                    markedAny = true;
                }
            });

            if (markedAny) {
                renderImportList();
            }
        });
    }

    selectAllImport.addEventListener('change', (e) => {
        const listToRender = cachedFilteredImport.slice(0, currentImportRenderLimit);
        listToRender.forEach(({ item }) => {
            item.selected = e.target.checked;
        });
        renderImportList();
    });

    function renderImportList(appendOnly = false) {
        if (!appendOnly) importListContainer.innerHTML = '';

        const filteredItems = getFilteredImportItems();

        // --- Dynamic Title Counter ---
        const importTitle = document.querySelector('#importReviewModal .header-top h2');
        if (importTitle) {
            importTitle.innerHTML = `Review Import <span style="font-size:11px; color:var(--text-secondary); background:var(--input-bg); padding:2px 6px; border-radius:10px; vertical-align:middle; margin-left:6px;">${filteredItems.length} / ${stagedImportData.length}</span>`;
        }


        const startIdx = appendOnly ? importListContainer.children.length : 0;
        const listToRender = filteredItems.slice(startIdx, currentImportRenderLimit);

        let allRenderedSelected = true;
        if (listToRender.length === 0 && startIdx === 0) allRenderedSelected = false;

        const fragment = document.createDocumentFragment();
        listToRender.forEach(({ item, index }) => {
            if (!item.selected) allRenderedSelected = false;
            const cookie = item.data;

            const row = document.createElement('div');
            row.className = 'cookie-row-wrapper';

            const isSecure = cookie.secure ? 'checked' : '';
            const isHttpOnly = cookie.httpOnly ? 'checked' : '';
            const sameSite = cookie.sameSite || 'unspecified';

            let html = `
        <div class="cookie-row-main import-row">
            <input type="checkbox" class="import-row-checkbox" ${item.selected ? 'checked' : ''} title="Include in import">
            <span class="domain-display" title="${escapeHtml(cookie.domain || '')}">${escapeHtml(cookie.domain || '—')}</span>
            <input type="text" class="cookie-input name-input" value="${escapeHtml(cookie.name)}" placeholder="Name">
            <input type="text" class="cookie-input value-input" value="${escapeHtml(cookie.value)}" placeholder="Value">
            <button class="delete-row-btn" title="Delete cookie">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </div>
      `;

            if (showImportAdvanced) {
                html += `
        <div class="cookie-row-advanced">
            <label class="adv-label"><input type="checkbox" class="attr-secure" ${isSecure}> Secure</label>
            <label class="adv-label"><input type="checkbox" class="attr-httponly" ${isHttpOnly}> HttpOnly</label>
            <div class="adv-label">
                SameSite: 
                <select class="adv-select attr-samesite">
                    <option value="no_restriction" ${sameSite === 'no_restriction' ? 'selected' : ''}>None</option>
                    <option value="lax" ${sameSite === 'lax' ? 'selected' : ''}>Lax</option>
                    <option value="strict" ${sameSite === 'strict' ? 'selected' : ''}>Strict</option>
                    <option value="unspecified" ${sameSite === 'unspecified' ? 'selected' : ''}>Unspec</option>
                </select>
            </div>
        </div>`;
            }

            row.innerHTML = html;

            const rowCheckbox = row.querySelector('.import-row-checkbox');
            const nameInput = row.querySelector('.name-input');
            const valueInput = row.querySelector('.value-input');
            const deleteBtn = row.querySelector('.delete-row-btn');

            rowCheckbox.addEventListener('change', (e) => {
                if (stagedImportData[index]) stagedImportData[index].selected = e.target.checked;
                const currentList = filteredItems.slice(0, currentImportRenderLimit);
                selectAllImport.checked = currentList.length > 0 && currentList.every(i => i.item && i.item.selected);
                updateImportDeleteBtnState();
            });
            nameInput.addEventListener('input', (e) => { if (stagedImportData[index]) stagedImportData[index].data.name = e.target.value; });
            valueInput.addEventListener('input', (e) => { if (stagedImportData[index]) stagedImportData[index].data.value = e.target.value; });
            deleteBtn.addEventListener('click', () => { stagedImportData[index] = null; row.remove(); updateImportDeleteBtnState(); });

            if (showImportAdvanced) {
                row.querySelector('.attr-secure').addEventListener('change', (e) => { if (stagedImportData[index]) stagedImportData[index].data.secure = e.target.checked; });
                row.querySelector('.attr-httponly').addEventListener('change', (e) => { if (stagedImportData[index]) stagedImportData[index].data.httpOnly = e.target.checked; });
                row.querySelector('.attr-samesite').addEventListener('change', (e) => { if (stagedImportData[index]) stagedImportData[index].data.sameSite = e.target.value; });
            }

            fragment.appendChild(row);
        });
        importListContainer.appendChild(fragment);

        selectAllImport.checked = allRenderedSelected;
        updateImportDeleteBtnState();

        const searchTerm = importSearch.value.toLowerCase();
        // Apply search-match highlighting for import modal
        if (searchTerm) {
            const rows = importListContainer.querySelectorAll('.cookie-row-wrapper');
            rows.forEach(row => {
                const nameInput = row.querySelector('.name-input');
                const valueInput = row.querySelector('.value-input');
                const domainEl = row.querySelector('.domain-display');
                if (nameInput && nameInput.value.toLowerCase().includes(searchTerm) && (importSearchScope === 'all' || importSearchScope === 'name')) nameInput.classList.add('search-match');
                if (valueInput && valueInput.value.toLowerCase().includes(searchTerm) && (importSearchScope === 'all' || importSearchScope === 'value')) valueInput.classList.add('search-match');
                if (domainEl && domainEl.textContent.toLowerCase().includes(searchTerm) && (importSearchScope === 'all' || importSearchScope === 'domain')) domainEl.classList.add('search-match');
            });
        }

        const remaining = filteredItems.length - currentImportRenderLimit;
        const loadMoreImportContainer = document.getElementById('loadMoreImportContainer');

        if (loadMoreImportContainer) {
            loadMoreImportContainer.style.display = remaining > 0 ? 'block' : 'none';
            if (loadMoreImportBtn) loadMoreImportBtn.textContent = `Load More (${remaining} remaining)`;
        }
    }

    importSearch.addEventListener('input', debounce(() => {
        currentImportRenderLimit = 50;
        renderImportList();
    }, 100));

    confirmImportBtn.addEventListener('click', async () => {
        confirmImportBtn.textContent = 'Importing...';
        confirmImportBtn.disabled = true;

        const finalCookies = stagedImportData.filter(item => item && item.selected).map(item => item.data);

        if (finalCookies.length === 0) {
            importModal.classList.remove('show');
            confirmImportBtn.textContent = 'Confirm Import';
            confirmImportBtn.disabled = false;
            return;
        }
        const currentDomain = allowAllDomains ? '' : (currentUrl?.hostname || '');

        try {
            isBulkImporting = true;
            const { importedCount, skippedCount, results } = await importParsedCookies(finalCookies, currentDomain, conflictResolution, currentStoreId);

            let errorCount = 0;
            results.forEach(res => {
                if (!res.success && res.status !== 'skipped') {
                    Logger.error(`Failed: ${res.cookie.name}`, res.details);
                    errorCount++;
                }
            });

            if (importedCount > 0) Logger.success(`Import Complete`, `Imported ${importedCount} cookies successfully.`);
            if (skippedCount > 0) Logger.warn(`Import Skipped`, `Skipped ${skippedCount} cookies (Conflicts/Rules).`);

            setResultMessage(`${importedCount} imported. ${skippedCount} skipped.`, skippedCount > 0 ? 'warning' : 'success');
            await refreshCookieStats();
            importModal.classList.remove('show');
            stagedImportData = [];

            if (importedCount > 0 && autoReloadCheckbox.checked) chrome.tabs.reload();
        } finally {
            setTimeout(() => { isBulkImporting = false; refreshCookieStats(); }, 500);
            confirmImportBtn.textContent = 'Confirm Import';
            confirmImportBtn.disabled = false;
        }
    });

    cookiesInput.addEventListener('input', debounce(updatePreview, 10));

    // --- CLIPBOARD HELPER ---
    async function copyToClipboard(text, successMsg) {
        try {
            await navigator.clipboard.writeText(text);
            setResultMessage(successMsg, 'success');
        } catch (err) {
            console.error('Clipboard write failed', err);
            setResultMessage('Click on extension screen first!', 'error');
        }
    }

    // --- EXPORT MODAL LOGIC ---
    exportMenuBtn.addEventListener('click', () => {
        exportModal.classList.add('show');
    });

    closeExportModalBtn.addEventListener('click', () => {
        exportModal.classList.remove('show');
    });

    exportOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const format = opt.dataset.format;
            exportModal.classList.remove('show');
            handleExport(format);
        });
    });

    async function handleExport(format) {
        if (!cachedData.cookies.length) return setResultMessage('No cookies to export', 'warning');

        let content = '';
        let msg = '';
        let isCsv = false;
        const count = cachedData.cookies.length;

        switch (format) {
            case 'json':
                content = generateJSON(cachedData.cookies);
                msg = `Copied ${count} JSON cookies!`;
                break;
            case 'netscape':
                content = generateNetscape(cachedData.cookies);
                msg = `Copied ${count} Netscape cookies!`;
                break;
            case 'header':
                content = generateHeaderString(cachedData.cookies);
                msg = `Copied ${count} cookies (Header String)!`;
                break;
            case 'puppeteer':
                content = generatePuppeteer(cachedData.cookies);
                msg = `Copied ${count} Puppeteer cookies!`;
                break;
            case 'python':
                content = generatePython(cachedData.cookies);
                msg = `Copied ${count} Python Dict cookies!`;
                break;
            case 'csv':
                content = generateCSV(cachedData.cookies);
                isCsv = true;
                break;
        }

        if (isCsv) {
            const choice = await openExportChoiceModal(
                "Export CSV",
                "How would you like to export the CSV data?",
                "Download File",
                "Copy to Clipboard"
            );

            if (choice === 'choice1') {
                const domainStr = cachedData.currentUrl ? cachedData.currentUrl.hostname.replace(/[^a-z0-9]/gi, '_') : 'all_cookies';
                downloadFile(content, `${domainStr}.csv`, 'text/csv');
                setResultMessage(`Downloaded CSV with ${count} cookies.`, 'success');
                Logger.success('Export', `Downloaded CSV with ${count} cookies`);
            } else if (choice === 'choice2') {
                await copyToClipboard(content, `Copied ${count} cookies to CSV!`);
                Logger.success('Export', `Copied ${count} cookies as CSV`);
            }
            return;
        }

        if (content) await copyToClipboard(content, msg);
        Logger.success('Export', `Exported ${count} cookies as ${format.toUpperCase()}`);
    }

    // --- FORMAT GENERATORS (loaded from cookieFormats.js) ---

    // --- MANAGE MODAL ---
    statBtnCookies.addEventListener('click', () => openDetailsModal(cachedData.cookies, false));

    closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('modal-elevated');
        modal.classList.remove('show');
        isEditingSnapshot = false;
    });

    showAdvancedToggle.addEventListener('change', (e) => {
        showAdvanced = e.target.checked;
        manageAdvancedFilters.style.display = showAdvanced ? 'flex' : 'none';
        renderEditorList();
    });

    function updateManageDeleteBtnState() {
        if (!deleteSelectedManageBtn) return;
        const listToRender = filteredState.slice(0, currentRenderLimit);
        const hasSelected = listToRender.some(item => item._selected);
        deleteSelectedManageBtn.disabled = !hasSelected;
    }

    if (selectAllManage) {
        selectAllManage.addEventListener('change', (e) => {
            const listToRender = filteredState.slice(0, currentRenderLimit);
            listToRender.forEach(item => { item._selected = e.target.checked; });
            renderEditorList();
        });
    }

    if (deleteSelectedManageBtn) {
        deleteSelectedManageBtn.addEventListener('click', () => {
            const listToRender = filteredState.slice(0, currentRenderLimit);
            let markedAny = false;
            listToRender.forEach(item => {
                if (item._selected && !deletedIds.has(item._id)) {
                    deletedIds.add(item._id);
                    markedAny = true;
                }
            });
            if (markedAny) {
                markDirty();
                renderEditorList();
            }
        });
    }

    // Global lock/unlock toggle for visible cookies
    const globalLockToggle = document.getElementById('globalLockToggle');
    if (globalLockToggle) {
        globalLockToggle.addEventListener('click', () => {
            if (isEditingSnapshot) return;
            const visibleItems = filteredState.slice(0, currentRenderLimit);
            if (visibleItems.length === 0) return;

            // Check if ALL visible are already locked
            const allLocked = visibleItems.every(item => lockedCookies.has(`${item.domain}|${item.name}`));
            const shouldLock = !allLocked;

            visibleItems.forEach(item => {
                const key = `${item.domain}|${item.name}`;
                if (shouldLock) {
                    lockedCookies.add(key);
                } else {
                    lockedCookies.delete(key);
                }
            });

            // Update DOM lock buttons
            const rows = cookieListContainer.querySelectorAll('.cookie-row-wrapper');
            rows.forEach(row => {
                const lockBtn = row.querySelector('.lock-btn');
                if (!lockBtn) return;
                const key = `${row.dataset.domain}|${row.querySelector('.name-input').value}`;
                if (lockedCookies.has(key)) {
                    lockBtn.classList.add('locked');
                    lockBtn.textContent = '\uD83D\uDD12';
                } else {
                    lockBtn.classList.remove('locked');
                    lockBtn.textContent = '\uD83D\uDD13';
                }
            });

            // Update header icon
            globalLockToggle.textContent = shouldLock ? '\uD83D\uDD12' : '\uD83D\uDD13';

            debouncedSaveLockedCookies();
            Logger.info('Global Lock', `${shouldLock ? 'Locked' : 'Unlocked'} ${visibleItems.length} visible cookies`);
        });
    }

    function openDetailsModal(cookiesSource, isSnapshot, snapshotId = null) {
        isEditingSnapshot = isSnapshot;
        editingSnapshotId = snapshotId;

        try {
            originalState = structuredClone(cookiesSource);
        } catch {
            originalState = JSON.parse(JSON.stringify(cookiesSource));
        }
        editorStateMap.clear();
        editorState = originalState.map((cookie, index) => {
            const item = { ...cookie, _id: `c_${index}_${Date.now()}`, _selected: false };
            editorStateMap.set(item._id, item);
            return item;
        });
        filteredState = [...editorState];
        deletedIds.clear();
        isDirty = false;
        currentRenderLimit = RENDER_BATCH_SIZE;

        // Switch header layout: hide lock column for snapshots
        const headerRow = modal.querySelector('.cookie-list-header');
        if (headerRow) {
            headerRow.classList.toggle('manage-layout', !isSnapshot);
            headerRow.classList.toggle('snapshot-layout', isSnapshot);
        }
        if (globalLockToggle) globalLockToggle.style.display = isSnapshot ? 'none' : '';

        applyChangesBtn.style.display = 'none';
        if (modalFooter) modalFooter.classList.remove('is-visible');
        editorSearch.value = '';
        cookieListContainer.innerHTML = '';
        renderEditorList();
        modal.classList.add('show');
    }

    function renderEditorList(appendOnly = false) {
        // --- Dynamic Title Counter ---
        manageModalTitle.innerHTML = `${isEditingSnapshot ? "Edit Snapshot" : "Manage Cookies"} <span style="font-size:11px; color:var(--text-secondary); background:var(--input-bg); padding:2px 6px; border-radius:10px; vertical-align:middle; margin-left:6px;">${filteredState.length} / ${editorState.length}</span>`;


        if (!appendOnly) {
            const listToRender = filteredState.slice(0, currentRenderLimit);
            cookieListContainer.innerHTML = '';

            if (listToRender.length === 0) {
                cookieListContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">No cookies found.</div>`;
                loadMoreContainer.style.display = 'none';
                if (selectAllManage) selectAllManage.checked = false;
                updateManageDeleteBtnState();
                return;
            }

            const fragment = document.createDocumentFragment();
            listToRender.forEach(item => {
                const temp = document.createElement('div');
                temp.innerHTML = getRowHTML(item);
                fragment.appendChild(temp.firstElementChild);
            });
            cookieListContainer.appendChild(fragment);
        } else {
            const startIdx = cookieListContainer.children.length;
            const newItems = filteredState.slice(startIdx, currentRenderLimit);
            if (newItems.length > 0) {
                const fragment = document.createDocumentFragment();
                newItems.forEach(item => {
                    const temp = document.createElement('div');
                    temp.innerHTML = getRowHTML(item);
                    fragment.appendChild(temp.firstElementChild);
                });
                cookieListContainer.appendChild(fragment);
            }
        }

        const remaining = filteredState.length - currentRenderLimit;
        loadMoreContainer.style.display = remaining > 0 ? 'block' : 'none';
        loadMoreBtn.textContent = `Load More (${remaining} remaining)`;

        const visibleItems = filteredState.slice(0, currentRenderLimit);
        if (selectAllManage) selectAllManage.checked = visibleItems.length > 0 && visibleItems.every(item => item._selected);
        updateManageDeleteBtnState();
    }

    function getRowHTML(item) {
        const isDeleted = deletedIds.has(item._id) ? 'deleted' : '';
        const key = `${item.domain}|${item.name}`;
        const isLocked = lockedCookies.has(key);

        const isSecure = item.secure ? 'checked' : '';
        const isHttpOnly = item.httpOnly ? 'checked' : '';
        const sameSite = item.sameSite || 'unspecified';

        const rowClass = isEditingSnapshot ? 'snapshot-row' : 'manage-row';
        let html = `
      <div class="cookie-row-wrapper ${isDeleted}" data-id="${item._id}" data-domain="${item.domain}" data-name="${item.name}">
        <div class="cookie-row-main ${rowClass}">
            <input type="checkbox" class="manage-row-checkbox" ${item._selected ? 'checked' : ''} title="Select">
            <span class="domain-display" title="${escapeHtml(item.domain || '')}">${escapeHtml(item.domain || '—')}</span>
            ${isEditingSnapshot ? '' : `<button class="lock-btn ${isLocked ? 'locked' : ''}" title="${isLocked ? 'Unlock' : 'Lock (Prevent Clear)'}">
                ${isLocked ? '🔒' : '🔓'}
            </button>`}
            <input type="text" class="cookie-input name-input" value="${escapeHtml(item.name)}" placeholder="Name">
            <input type="text" class="cookie-input value-input" value="${escapeHtml(item.value)}" placeholder="Value">
            <button class="delete-row-btn" title="Delete cookie">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
        </div>`;

        if (showAdvanced) {
            html += `
        <div class="cookie-row-advanced">
            <label class="adv-label"><input type="checkbox" class="attr-secure" ${isSecure}> Secure</label>
            <label class="adv-label"><input type="checkbox" class="attr-httponly" ${isHttpOnly}> HttpOnly</label>
            <div class="adv-label">
                SameSite: 
                <select class="adv-select attr-samesite">
                    <option value="no_restriction" ${sameSite === 'no_restriction' ? 'selected' : ''}>None</option>
                    <option value="lax" ${sameSite === 'lax' ? 'selected' : ''}>Lax</option>
                    <option value="strict" ${sameSite === 'strict' ? 'selected' : ''}>Strict</option>
                    <option value="unspecified" ${sameSite === 'unspecified' ? 'selected' : ''}>Unspec</option>
                </select>
            </div>
        </div>`;
        }
        html += `</div>`;
        return html;
    }

    // Event delegation for editor rows — bound ONCE, handles all current and future rows
    (function setupEditorDelegation() {
        cookieListContainer.addEventListener('click', async (e) => {
            const row = e.target.closest('.cookie-row-wrapper');
            if (!row) return;
            const id = row.dataset.id;

            // Delete button
            if (e.target.closest('.delete-row-btn')) {
                if (deletedIds.has(id)) { deletedIds.delete(id); row.classList.remove('deleted'); }
                else { deletedIds.add(id); row.classList.add('deleted'); }
                markDirty();
                updateManageDeleteBtnState();
                return;
            }

            // Lock button
            if (!isEditingSnapshot && e.target.closest('.lock-btn')) {
                const lockBtn = e.target.closest('.lock-btn');
                const key = `${row.dataset.domain}|${row.querySelector('.name-input').value}`;
                if (lockedCookies.has(key)) {
                    lockedCookies.delete(key);
                    lockBtn.classList.remove('locked');
                    lockBtn.textContent = '\uD83D\uDD13';
                    Logger.info('Cookie Unlocked', key);
                } else {
                    lockedCookies.add(key);
                    lockBtn.classList.add('locked');
                    lockBtn.textContent = '\uD83D\uDD12';
                    Logger.info('Cookie Locked', key);
                }
                debouncedSaveLockedCookies();
                return;
            }
        });

        cookieListContainer.addEventListener('change', (e) => {
            const row = e.target.closest('.cookie-row-wrapper');
            if (!row) return;
            const id = row.dataset.id;

            // Select checkbox
            if (e.target.classList.contains('manage-row-checkbox')) {
                const item = editorStateMap.get(id);
                if (item) item._selected = e.target.checked;
                const visibleItems = filteredState.slice(0, currentRenderLimit);
                if (selectAllManage) selectAllManage.checked = visibleItems.every(i => i._selected);
                updateManageDeleteBtnState();
                return;
            }

            // Attribute changes (secure, httponly, samesite)
            if (e.target.matches('.attr-secure, .attr-httponly, .attr-samesite')) {
                const item = editorStateMap.get(id);
                if (item) {
                    if (e.target.classList.contains('attr-secure')) item.secure = e.target.checked;
                    if (e.target.classList.contains('attr-httponly')) item.httpOnly = e.target.checked;
                    if (e.target.classList.contains('attr-samesite')) item.sameSite = e.target.value;
                }
                markDirty();
            }
        });

        cookieListContainer.addEventListener('input', (e) => {
            const row = e.target.closest('.cookie-row-wrapper');
            if (!row) return;
            if (e.target.matches('.cookie-input')) {
                const id = row.dataset.id;
                const item = editorStateMap.get(id);
                if (item) {
                    item.name = row.querySelector('.name-input').value;
                    item.value = row.querySelector('.value-input').value;
                }
                markDirty();
            }
        });
    })();

    // Debounced locked cookies save — prevents storage spam on rapid clicks
    let lockedCookiesSaveTimer = null;
    function debouncedSaveLockedCookies() {
        if (lockedCookiesSaveTimer) clearTimeout(lockedCookiesSaveTimer);
        lockedCookiesSaveTimer = setTimeout(() => {
            chrome.storage.local.set({ lockedCookies: Array.from(lockedCookies) });
        }, 500);
    }

    function markDirty() {
        if (!isDirty) {
            isDirty = true;
            applyChangesBtn.style.display = 'block';
            if (modalFooter) modalFooter.classList.add('is-visible');
        }
    }

    loadMoreBtn.addEventListener('click', () => {
        currentRenderLimit += RENDER_BATCH_SIZE;
        renderEditorList(true);
    });

    const handleEditorSearch = (e) => {
        const term = editorSearch.value.toLowerCase().trim();
        const reqSecure = document.getElementById('filter-manage-secure')?.classList.contains('active');
        const reqHttpOnly = document.getElementById('filter-manage-httponly')?.classList.contains('active');
        const reqSameSite = document.getElementById('filter-manage-samesite')?.value || '';

        currentRenderLimit = RENDER_BATCH_SIZE;

        filteredState = editorState.filter(item => {
            if (reqSecure && !item.secure) return false;
            if (reqHttpOnly && !item.httpOnly) return false;
            if (reqSameSite) {
                let sSite = item.sameSite;
                if (sSite === 'none') sSite = 'no_restriction';
                if ((sSite || 'unspecified') !== reqSameSite) return false;
            }
            if (term) {
                const nameMatch = (item.name && item.name.toLowerCase().includes(term));
                const valueMatch = (item.value && item.value.toLowerCase().includes(term));
                const domainMatch = (item.domain && item.domain.toLowerCase().includes(term));
                if (manageSearchScope === 'name') return nameMatch;
                if (manageSearchScope === 'domain') return domainMatch;
                if (manageSearchScope === 'value') return valueMatch;
                return nameMatch || valueMatch || domainMatch;
            }
            return true;
        });

        renderEditorList();

        // Apply search-match highlighting for all search scopes
        if (term) {
            const rows = cookieListContainer.querySelectorAll('.cookie-row-wrapper');
            rows.forEach(row => {
                const nameInput = row.querySelector('.name-input');
                const valueInput = row.querySelector('.value-input');
                const domainEl = row.querySelector('.domain-display');
                if (nameInput && nameInput.value.toLowerCase().includes(term) && (manageSearchScope === 'all' || manageSearchScope === 'name')) nameInput.classList.add('search-match');
                if (valueInput && valueInput.value.toLowerCase().includes(term) && (manageSearchScope === 'all' || manageSearchScope === 'value')) valueInput.classList.add('search-match');
                if (domainEl && domainEl.textContent.toLowerCase().includes(term) && (manageSearchScope === 'all' || manageSearchScope === 'domain')) domainEl.classList.add('search-match');
            });
        }
    };
    editorSearch.addEventListener('input', debounce(handleEditorSearch, 100));

    applyChangesBtn.addEventListener('click', async () => {
        applyChangesBtn.textContent = 'Applying...';
        applyChangesBtn.disabled = true;

        if (isEditingSnapshot) {
            try {
                const finalCookies = editorState.filter(c => !deletedIds.has(c._id));
                await updateSnapshot(editingSnapshotId, finalCookies);
                setResultMessage('Snapshot updated successfully', 'success');
                Logger.success('Snapshot Edited', `Saved ${finalCookies.length} cookies to snapshot`);
                modal.classList.remove('show');
                modal.classList.remove('modal-elevated');
                renderSnapshots();
            } catch (e) {
                setResultMessage('Failed to update snapshot', 'error');
            }
        }
        else {
            const promises = [];
            let modifiedCount = 0;
            let deletedCount = 0;

            for (let i = 0; i < editorState.length; i++) {
                const newItem = editorState[i];
                const oldItem = originalState[i];

                if (deletedIds.has(newItem._id)) {
                    const url = getCookieUrl(oldItem);
                    const removeDetails = { url: url, name: oldItem.name };
                    if (currentStoreId) removeDetails.storeId = currentStoreId;
                    if (oldItem.firstPartyDomain !== undefined) removeDetails.firstPartyDomain = oldItem.firstPartyDomain;
                    if (oldItem.partitionKey !== undefined) removeDetails.partitionKey = oldItem.partitionKey;
                    promises.push(chrome.cookies.remove(removeDetails));
                    deletedCount++;
                    continue;
                }

                const isModified =
                    newItem.name !== oldItem.name ||
                    newItem.value !== oldItem.value ||
                    newItem.secure !== oldItem.secure ||
                    newItem.httpOnly !== oldItem.httpOnly ||
                    newItem.sameSite !== oldItem.sameSite;

                if (isModified) {
                    const url = getCookieUrl(oldItem);
                    const removeDetails = { url, name: oldItem.name };
                    if (currentStoreId) removeDetails.storeId = currentStoreId;
                    if (oldItem.firstPartyDomain !== undefined) removeDetails.firstPartyDomain = oldItem.firstPartyDomain;
                    if (oldItem.partitionKey !== undefined) removeDetails.partitionKey = oldItem.partitionKey;
                    await chrome.cookies.remove(removeDetails);

                    const details = {
                        url: getCookieUrl(newItem), name: newItem.name, value: newItem.value,
                        path: oldItem.path, secure: newItem.secure, httpOnly: newItem.httpOnly,
                        expirationDate: oldItem.expirationDate, storeId: oldItem.storeId
                    };
                    if (['no_restriction', 'lax', 'strict', 'unspecified'].includes(newItem.sameSite)) {
                        details.sameSite = newItem.sameSite;
                    }
                    if (currentStoreId) details.storeId = currentStoreId;
                    if (!oldItem.hostOnly && oldItem.domain) details.domain = oldItem.domain;

                    if (details.sameSite === 'no_restriction') details.secure = true;
                    promises.push(chrome.cookies.set(details));
                    modifiedCount++;
                }
            }

            const results = await Promise.allSettled(promises);
            const failed = results.filter(r => r.status === 'rejected');

            if (failed.length > 0) {
                setResultMessage(`Changes applied with ${failed.length} errors.`, 'warning');
                Logger.warn('Manage Changes', `Applied with ${failed.length} errors. Modified: ${modifiedCount}, Deleted: ${deletedCount}`);
            } else {
                setResultMessage('Changes applied successfully.', 'success');
                Logger.success('Manage Changes', `Modified: ${modifiedCount}, Deleted: ${deletedCount}`);
            }

            modal.classList.remove('show');
            await refreshCookieStats();

            if (autoReloadCheckbox.checked) chrome.tabs.reload();
        }

        applyChangesBtn.textContent = 'Apply Changes';
        applyChangesBtn.disabled = false;
    });

    function getCookieUrl(cookie) {
        return `http${cookie.secure ? 's' : ''}://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
    }

    // --- SHORTCUTS & ADVANCED MODAL ---
    openAdvancedBtn.addEventListener('click', () => advancedModal.classList.add('show'));
    closeAdvancedBtn.addEventListener('click', () => advancedModal.classList.remove('show'));

    function updateRenewSettingsUI() {
        customRenewContainer.style.display = renewDurationSelect.value === 'custom' ? 'flex' : 'none';
    }

    renewDurationSelect.addEventListener('change', async (e) => {
        updateRenewSettingsUI();
        await saveRenewSettings();
    });
    customRenewDays.addEventListener('input', debounce(async () => await saveRenewSettings(), 500));
    maxLogEntriesInput.addEventListener('input', debounce(async (e) => {
        maxLogEntries = parseInt(e.target.value) || 100;
        await chrome.storage.local.set({ maxLogEntries: maxLogEntries });
    }, 500));

    async function saveRenewSettings() {
        const type = renewDurationSelect.value;
        let customDays = parseInt(customRenewDays.value) || 365;
        renewDurationValue = type === 'custom' ? customDays * 86400 : parseInt(type);
        await chrome.storage.local.set({ renewDurationValue: renewDurationValue, renewDurationType: type, customRenewDays: customDays });
    }

    showBadgeToggle.addEventListener('change', async (e) => {
        await chrome.storage.local.set({ showBadgeCount: e.target.checked });
        await refreshCookieStats();
    });

    // DANGER ZONE: Granular Advanced Clear
    if (advancedClearBtn) {
        advancedClearBtn.addEventListener('click', async () => {
            advancedModal.classList.remove('show');

            const scopeText = allowAllDomains ? 'ALL DOMAINS' : `Current Domain (${currentUrl ? currentUrl.hostname : 'unknown'})`;

            if (!allowAllDomains && currentUrl && !currentUrl.protocol.startsWith('http')) {
                setResultMessage("Cannot Deep Clean restricted pages (must be http/https).", "error");
                advancedModal.classList.add('show');
                return;
            }

            const confirmed = await openConfirmModal("Deep Clean?", `WARNING: This will wipe selected data for ${scopeText}. Locked cookies are safe. Are you sure?`, "Yes, Execute", true);
            if (!confirmed) {
                advancedModal.classList.add('show');
                return;
            }

            advancedClearBtn.textContent = "Clearing...";
            advancedClearBtn.disabled = true;
            setResultMessage("Deep cleaning in progress... Please wait.", "info", 0);

            try {
                const doLocalStorage = document.getElementById('dc-localstorage').checked;

                const dataToRemove = {
                    "localStorage": doLocalStorage,
                    "webSQL": doLocalStorage,
                    "pluginData": doLocalStorage,
                    "indexedDB": document.getElementById('dc-indexeddb').checked,
                    "cache": document.getElementById('dc-cache').checked,
                    "serviceWorkers": document.getElementById('dc-sw').checked,
                    "formData": document.getElementById('dc-formdata').checked,
                    "cookies": false
                };

                let removalOptions = {};
                if (!allowAllDomains && currentUrl) removalOptions.origins = [currentUrl.origin];
                else removalOptions.since = 0;

                const removeData = (opts, types) => new Promise((resolve, reject) => {
                    try {
                        chrome.browsingData.remove(opts, types, () => {
                            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                            else resolve();
                        });
                    } catch (err) {
                        reject(err);
                    }
                });

                const executeRemoval = async (opts, types) => {
                    try {
                        await removeData(opts, types);
                    } catch (err) {
                        const errorMsg = err.message || "";
                        // Handles Chrome's removal of webSQL and pluginData
                        if (errorMsg.includes("webSQL") || errorMsg.includes("pluginData")) {
                            delete types.webSQL;
                            delete types.pluginData;
                            await removeData(opts, types);
                        } else {
                            throw err;
                        }
                    }
                };

                try {
                    await executeRemoval(removalOptions, dataToRemove);
                } catch (err) {
                    const errorMsg = err.message || "";
                    // Fallback to hostnames if origins is not supported
                    if (!allowAllDomains && currentUrl && (errorMsg.includes("origins") || errorMsg.includes("Type error"))) {
                        removalOptions = { hostnames: [currentUrl.hostname] };
                        await executeRemoval(removalOptions, dataToRemove);
                    } else {
                        throw err;
                    }
                }

                const doCookies = document.getElementById('dc-cookies') ? document.getElementById('dc-cookies').checked : true;
                let clearedList = [];

                if (doCookies) {
                    const cookieResult = await performCookieClear(true);
                    clearedList.push(`${cookieResult.removedCount} Cookies`);
                }

                // Add the names of browsingData types that were selected
                if (doLocalStorage) clearedList.push("LocalStorage");
                if (dataToRemove.indexedDB) clearedList.push("IndexedDB");
                if (dataToRemove.cache) clearedList.push("Cache");
                if (dataToRemove.serviceWorkers) clearedList.push("ServiceWorkers");
                if (dataToRemove.formData) clearedList.push("FormData");

                const clearedString = clearedList.length > 0 ? clearedList.join(", ") : "No data selected";
                setResultMessage(`Deep Cleaned: ${clearedString}`, 'success');
                Logger.success('Deep Clean', `Cleared: ${clearedString} | Scope: ${scopeText}`);

                await refreshCookieStats();
                if (autoReloadCheckbox.checked) chrome.tabs.reload();

            } catch (e) {
                setResultMessage('Deep Clean Failed: ' + e.message, 'error');
                Logger.error('Deep Clean Failed', e.message);
            } finally {
                advancedClearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Execute Deep Clean`;
                advancedClearBtn.disabled = false;
            }
        });
    }

    openShortcutsBtn.addEventListener('click', () => {
        renderShortcutsModal();
        shortcutsModal.classList.add('show');
    });
    closeShortcutsBtn.addEventListener('click', () => {
        recordingShortcutId = null;
        shortcutsModal.classList.remove('show');
    });

    // --- Shortcut Rendering ---
    function formatShortcutKey(sc) {
        const modLabel = sc.mod === 'ctrl' ? 'Ctrl' : sc.mod === 'alt' ? 'Alt' : sc.mod.charAt(0).toUpperCase() + sc.mod.slice(1);
        return `${modLabel}+${sc.key.toUpperCase()}`;
    }

    function renderShortcutFooter() {
        const helpEl = document.getElementById('shortcutHelpText');
        if (!helpEl) return;
        const footerMap = {
            clearCookies: 'Clear',
            importData: 'Import',
            exportJson: 'Export',
            quickSnap: 'Quick snap',
            restoreSnap: 'Restore last snap'
        };
        const parts = userShortcuts
            .filter(sc => footerMap[sc.id])
            .map(sc => `${formatShortcutKey(sc)}: ${footerMap[sc.id]}`);
        helpEl.textContent = `\u2328\uFE0F ${parts.join(' | ')}`;
    }

    function renderShortcutsModal() {
        const list = document.getElementById('shortcutsList');
        if (!list) return;
        list.innerHTML = '';
        userShortcuts.forEach(sc => {
            const item = document.createElement('div');
            item.className = 'shortcut-item' + (recordingShortcutId === sc.id ? ' shortcut-listening' : '');
            item.dataset.shortcutId = sc.id;

            const desc = document.createElement('span');
            desc.className = 'shortcut-desc';
            desc.textContent = sc.desc;

            const right = document.createElement('div');
            right.style.cssText = 'display:flex;align-items:center;gap:4px;';

            const keys = document.createElement('div');
            keys.className = 'shortcut-keys';
            if (recordingShortcutId === sc.id) {
                const hint = document.createElement('span');
                hint.className = 'shortcut-listening-hint';
                hint.textContent = 'Press new shortcut...';
                keys.appendChild(hint);
            } else {
                const modBadge = document.createElement('span');
                modBadge.className = 'key-badge';
                modBadge.textContent = sc.mod === 'ctrl' ? 'Ctrl' : 'Alt';
                const keyBadge = document.createElement('span');
                keyBadge.className = 'key-badge';
                keyBadge.textContent = sc.key.toUpperCase();
                keys.appendChild(modBadge);
                keys.appendChild(keyBadge);
            }

            const editBtn = document.createElement('button');
            editBtn.className = 'shortcut-edit-btn';
            editBtn.textContent = recordingShortcutId === sc.id ? 'Cancel' : 'Edit';
            editBtn.addEventListener('click', () => {
                if (recordingShortcutId === sc.id) {
                    recordingShortcutId = null;
                } else {
                    recordingShortcutId = sc.id;
                }
                renderShortcutsModal();
            });

            right.appendChild(keys);
            right.appendChild(editBtn);
            item.appendChild(desc);
            item.appendChild(right);
            list.appendChild(item);
        });

        // Reset to defaults button
        let resetBtn = list.querySelector('.shortcut-reset-btn');
        if (!resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'shortcut-edit-btn shortcut-reset-btn';
            resetBtn.style.cssText = 'margin-top:8px; width:100%; padding:6px; font-size:11px;';
            resetBtn.textContent = '\u21BA Reset to Defaults';
            resetBtn.addEventListener('click', () => {
                userShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
                recordingShortcutId = null;
                chrome.storage.local.set({ userShortcuts });
                renderShortcutsModal();
                renderShortcutFooter();
            });
            list.appendChild(resetBtn);
        }
    }

    // Load shortcuts from storage
    chrome.storage.local.get(['userShortcuts'], (result) => {
        if (result.userShortcuts && Array.isArray(result.userShortcuts)) {
            userShortcuts = result.userShortcuts;
        }
        renderShortcutFooter();
    });

    btnOpenSnapshots.addEventListener('click', () => {
        if (!dbAvailable) return setResultMessage("Snapshots are unavailable in this context.", "warning");
        renderSnapshots();
        snapshotsModal.classList.add('show');
    });
    closeSnapshotsModalBtn.addEventListener('click', () => snapshotsModal.classList.remove('show'));
    openSnapshotOptionsBtn.addEventListener('click', () => snapshotOptionsModal.classList.add('show'));
    closeSnapshotOptionsBtn.addEventListener('click', () => snapshotOptionsModal.classList.remove('show'));
    closeSnapshotHostsBtn.addEventListener('click', () => snapshotHostsModal.classList.remove('show'));

    function openDomainsViewModal(cookies) {
        if (!cookies || cookies.length === 0) return setResultMessage("No cookies available to view details.", "warning");
        snapshotHostsTitle.textContent = 'Available Domains';
        snapshotHostsSearch.value = '';

        const groups = {};
        cookies.forEach(c => {
            let domain = c.domain.startsWith('.') ? c.domain.substring(1) : c.domain;
            const root = getRootDomain(domain);
            if (!groups[root]) groups[root] = { root, count: 0, subdomains: {} };
            groups[root].count++;
            groups[root].subdomains[domain] = (groups[root].subdomains[domain] || 0) + 1;
        });
        activeSnapshotGroupedData = Object.values(groups).sort((a, b) => b.count - a.count);
        renderSnapshotHosts();
        snapshotHostsModal.classList.add('show');
    }

    if (manageViewDomainsBtn) {
        manageViewDomainsBtn.addEventListener('click', () => {
            openDomainsViewModal(editorState);
        });
    }

    if (importViewDomainsBtn) {
        importViewDomainsBtn.addEventListener('click', () => {
            const cookies = stagedImportData.map(i => i?.data).filter(Boolean);
            openDomainsViewModal(cookies);
        });
    }

    snapshotHostsSearch.addEventListener('input', debounce((e) => renderSnapshotHosts(e.target.value.toLowerCase().trim()), 100));

    function renderSnapshotHosts(filterTerm = '') {
        snapshotHostsList.innerHTML = '';
        const filteredGroups = activeSnapshotGroupedData.filter(g => {
            if (g.root.includes(filterTerm)) return true;
            return Object.keys(g.subdomains).some(d => d.includes(filterTerm));
        });

        if (filteredGroups.length === 0) {
            snapshotHostsList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">No domains found.</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        filteredGroups.forEach(group => {
            const subdomainsToShow = Object.entries(group.subdomains)
                .sort((a, b) => b[1] - a[1])
                .filter(([d]) =>
                    group.root.includes(filterTerm) || d.includes(filterTerm)
                );
            if (subdomainsToShow.length === 0) return;

            const header = document.createElement('div');
            header.className = 'domain-group-header';
            header.innerHTML = `<span>${escapeHtml(group.root)}</span><span>${group.count}</span>`;
            fragment.appendChild(header);

            subdomainsToShow.forEach(([domain, count]) => {
                const row = document.createElement('div');
                row.className = 'domain-row';
                row.innerHTML = `<span class="domain-name">${escapeHtml(domain)}</span><span class="domain-count">${count}</span>`;
                fragment.appendChild(row);
            });
        });
        snapshotHostsList.appendChild(fragment);
    }

    createSnapshotBtn.addEventListener('click', async () => {
        if (cachedData.cookies.length === 0) return setResultMessage("No cookies to save.", "warning");
        const name = await openInputModal("New Snapshot", "Enter a name for this snapshot:", "e.g. Admin Login");
        if (!name) return;
        await saveSnapshot(name, cachedData.cookies);
        Logger.success('Snapshot Created', `"${name}" — ${cachedData.cookies.length} cookies`);
        renderSnapshots();
    });

    exportSnapshotsBtn.addEventListener('click', async () => {
        snapshotOptionsModal.classList.remove('show');
        try {
            const jsonString = await exportSnapshots();
            if (!jsonString || jsonString === '[]') return setResultMessage('No snapshots to export', 'warning');
            downloadFile(jsonString, 'snapshots_export.json', 'application/json');
            setResultMessage('Snapshots exported to file.', 'success');
            Logger.success('Snapshots Exported', 'All snapshots downloaded as JSON file');
        } catch (e) {
            setResultMessage('Export Failed.', 'error');
            Logger.error('Snapshots Export Failed', e.message);
        }
    });

    importSnapshotsBtn.addEventListener('click', async () => {
        snapshotOptionsModal.classList.remove('show');
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return setResultMessage('Clipboard is empty', 'warning');
            const count = await importSnapshotsData(text);
            renderSnapshots();
            setResultMessage(`Imported ${count} snapshots.`, 'success');
            Logger.success('Snapshots Imported', `${count} snapshots loaded from clipboard`);
        } catch (e) {
            setResultMessage('Invalid snapshot data', 'error');
            Logger.error('Snapshots Import Failed', e.message);
        }
    });

    async function renderSnapshots() {
        const snapshots = await getSnapshots();
        snapshotsContainer.innerHTML = '';

        if (snapshots.length === 0) {
            snapshotsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary)">No snapshots saved.</div>`;
            return;
        }

        snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).forEach(s => {
            const el = document.createElement('div');
            el.className = 'snapshot-item';
            const date = getDateTime24h(s.timestamp);

            let sizeStr = s.size ? `${(s.size / 1024).toFixed(1)} KB` : `~${((s.count * 150) / 1024).toFixed(1)} KB`;

            el.innerHTML = `
           <div class="snapshot-info">
              <div class="snapshot-name-row">
                  <span class="snapshot-name">${escapeHtml(s.name)}</span>
                  <button class="rename-btn" title="Rename">✎</button>
                  <span class="snapshot-size-badge">${sizeStr}</span>
              </div>
              <span class="snapshot-meta">${s.count} cookies • ${date}</span>
           </div>
           <div class="snapshot-actions">
              <button class="snapshot-btn-icon restore-btn has-tooltip-top" data-tooltip="Restore snapshot">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              </button>
              <button class="snapshot-btn-icon copy-btn has-tooltip-top" data-tooltip="Copy to clipboard">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button class="snapshot-btn-icon edit-btn has-tooltip-top" data-tooltip="Edit cookies">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="snapshot-btn-icon danger delete-btn has-tooltip-left" data-tooltip="Delete snapshot">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
           </div>
        `;

            el.querySelector('.rename-btn').addEventListener('click', async () => {
                const newName = await openInputModal("Rename Snapshot", "Enter a new name:", s.name);
                if (newName && newName !== s.name) {
                    await renameSnapshot(s.id, newName);
                    Logger.info('Snapshot Renamed', `"${s.name}" → "${newName}"`);
                    renderSnapshots();
                }
            });

            el.querySelector('.copy-btn').addEventListener('click', async () => {
                try {
                    const fullSnapshot = await getSnapshotDetails(s.id);
                    const jsonString = generateJSON(fullSnapshot.cookies);
                    await copyToClipboard(jsonString, `Copied '${s.name}' cookies!`);
                    Logger.success('Snapshot Copied', `"${s.name}" — ${fullSnapshot.cookies.length} cookies copied as JSON`);
                } catch (e) { setResultMessage("Failed to load details", "error"); }
            });

            el.querySelector('.delete-btn').addEventListener('click', async () => {
                const confirmed = await openConfirmModal("Delete Snapshot?", `Are you sure you want to delete '${s.name}'?`, "Delete", true);
                if (confirmed) {
                    await deleteSnapshot(s.id);
                    Logger.warn('Snapshot Deleted', `"${s.name}"`);
                    renderSnapshots();
                }
            });

            el.querySelector('.edit-btn').addEventListener('click', async () => {
                try {
                    const fullSnapshot = await getSnapshotDetails(s.id);
                    openDetailsModal(fullSnapshot.cookies, true, s.id);
                    modal.classList.add('modal-elevated');
                } catch (e) { setResultMessage("Failed to load for editing", "error"); }
            });

            el.querySelector('.restore-btn').addEventListener('click', () => performRestoreSnapshot(s.id, s.name));
            snapshotsContainer.appendChild(el);
        });
    }

    async function performRestoreSnapshot(snapshotId, snapshotName) {
        let fullSnapshot;
        try { fullSnapshot = await getSnapshotDetails(snapshotId); }
        catch (e) { return setResultMessage("Failed to load snapshot data", "error"); }

        stagedImportData = fullSnapshot.cookies.map(c => ({ data: c, selected: true }));
        importedFormat = 'snapshot';

        snapshotsModal.classList.remove('show');
        shortcutsModal.classList.remove('show');

        openImportReviewModal();
    }

    // --- COOKIE UTILITIES BUTTON ---
    const openUtilitiesBtn = document.getElementById('openUtilitiesBtn');
    if (openUtilitiesBtn) {
        openUtilitiesBtn.addEventListener('click', async () => {
            let urlParam = '';
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0] && tabs[0].url) {
                    if (!tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('about:')) {
                        const parsedUrl = new URL(tabs[0].url);
                        urlParam = `?domain=${encodeURIComponent(parsedUrl.hostname)}`;
                    }
                }
            } catch (e) { }
            chrome.tabs.create({ url: chrome.runtime.getURL('utilities.html') + urlParam });
        });
    }

    // --- AUTO-DELETE MODAL ---
    const autoDeleteModal = document.getElementById('autoDeleteModal');
    const closeAutoDeleteBtn = document.getElementById('closeAutoDeleteBtn');
    const openAutoDeleteBtn = document.getElementById('openAutoDeleteBtn');
    const autoDeleteDomainDisplay = document.getElementById('autoDeleteDomainDisplay');
    const autoDeleteGlobalToggle = document.getElementById('autoDeleteGlobalToggle');
    const autoDeleteRuleEditor = document.getElementById('autoDeleteRuleEditor');
    const adTriggersSection = document.getElementById('adTriggersSection');
    const adSiteDataSection = document.getElementById('adSiteDataSection');
    const adSaveRuleBtn = document.getElementById('adSaveRuleBtn');
    const adManagedDomainsList = document.getElementById('adManagedDomainsList');
    const adDelayInput = document.getElementById('adDelayInput');
    const adNotifyToggle = document.getElementById('adNotifyToggle');
    const adEditIndicator = document.getElementById('adEditIndicator');
    const adEditDomain = document.getElementById('adEditDomain');
    const adCancelEdit = document.getElementById('adCancelEdit');

    // Persist notification toggle
    chrome.storage.local.get(['adNotifyEnabled'], (result) => {
        const enabled = result.adNotifyEnabled !== undefined ? result.adNotifyEnabled : true;
        if (adNotifyToggle) adNotifyToggle.checked = enabled;
    });
    if (adNotifyToggle) {
        adNotifyToggle.addEventListener('change', () => {
            chrome.storage.local.set({ adNotifyEnabled: adNotifyToggle.checked });
        });
    }

    let autoDeleteRules = {};
    let autoDeleteEnabled = false;
    let currentAutoDeleteDomain = '';
    let isEditingRule = false;

    async function loadAutoDeleteSettings() {
        const result = await chrome.storage.local.get(['autoDeleteEnabled', 'autoDeleteRules', 'autoDeleteDelay']);
        autoDeleteEnabled = result.autoDeleteEnabled || false;
        autoDeleteRules = result.autoDeleteRules || {};
        autoDeleteGlobalToggle.checked = autoDeleteEnabled;
        if (result.autoDeleteDelay != null) adDelayInput.value = result.autoDeleteDelay;
    }

    function populateAutoDeleteModal(domain) {
        currentAutoDeleteDomain = domain;
        autoDeleteDomainDisplay.textContent = domain || '—';

        const rule = autoDeleteRules[domain];
        const level = rule?.level || 'normal';

        document.querySelectorAll('input[name="adLevel"]').forEach(r => {
            r.checked = (r.value === level);
        });

        const showTriggers = level === 'normal';
        adTriggersSection.style.display = showTriggers ? '' : 'none';
        adSiteDataSection.style.display = showTriggers ? '' : 'none';

        if (rule?.triggers) {
            document.getElementById('adTriggerTabClose').checked = rule.triggers.tabClose ?? true;
            document.getElementById('adTriggerDomainChange').checked = rule.triggers.domainChange ?? true;
            document.getElementById('adTriggerRestart').checked = rule.triggers.browserRestart ?? true;
            document.getElementById('adTriggerLoseFocus').checked = rule.triggers.loseFocus ?? false;
            // Set cookie scope radio
            const scopeVal = rule.triggers.expiredOnly ? 'expired' : 'all';
            document.querySelectorAll('input[name="adCookieScope"]').forEach(r => r.checked = (r.value === scopeVal));
        } else {
            document.getElementById('adTriggerTabClose').checked = true;
            document.getElementById('adTriggerDomainChange').checked = false;
            document.getElementById('adTriggerRestart').checked = false;
            document.getElementById('adTriggerLoseFocus').checked = false;
            document.querySelectorAll('input[name="adCookieScope"]').forEach(r => r.checked = (r.value === 'all'));
        }

        if (rule?.siteData) {
            document.getElementById('adSiteWebStorage').checked = rule.siteData.localStorage ?? rule.siteData.sessionStorage ?? false;
            document.getElementById('adSiteIndexedDB').checked = rule.siteData.indexedDB ?? false;
            document.getElementById('adSiteCache').checked = rule.siteData.cache ?? false;
            document.getElementById('adSiteSW').checked = rule.siteData.serviceWorkers ?? false;
            document.getElementById('adSiteFormData').checked = rule.siteData.formData ?? false;
        } else {
            document.getElementById('adSiteWebStorage').checked = false;
            document.getElementById('adSiteIndexedDB').checked = false;
            document.getElementById('adSiteCache').checked = false;
            document.getElementById('adSiteSW').checked = false;
            document.getElementById('adSiteFormData').checked = false;
        }

        adDelayInput.value = rule?.delay ?? 0;

        // Also show/hide cookie scope section
        const adCookieScopeSection = document.getElementById('adCookieScopeSection');
        if (adCookieScopeSection) adCookieScopeSection.style.display = showTriggers ? '' : 'none';

        renderManagedDomains();
    }

    // Edit mode helpers — extracted to outer scope
    function setEditMode(editing, domain) {
        isEditingRule = editing;
        if (adEditIndicator) {
            adEditIndicator.style.display = editing ? 'flex' : 'none';
            if (adEditDomain) adEditDomain.textContent = domain || '';
        }
        if (adSaveRuleBtn) {
            adSaveRuleBtn.textContent = editing ? 'Update Rule' : 'Add Rule';
            adSaveRuleBtn.style.background = editing ? '#059669' : '';
        }
    }

    function exitEditMode() {
        setEditMode(false, '');
        const domain = currentUrl ? getRootDomain(currentUrl.hostname) : '';
        populateAutoDeleteModal(domain);
    }

    function renderManagedDomains() {
        const domains = Object.keys(autoDeleteRules);
        if (domains.length === 0) {
            adManagedDomainsList.innerHTML = '<div style="text-align:center; padding:10px; color:var(--text-secondary); font-size:11px;">No managed domains yet.</div>';
            return;
        }
        adManagedDomainsList.innerHTML = domains.sort().map(d => {
            const rule = autoDeleteRules[d];
            const level = rule?.level || 'normal';
            const levelLabels = { normal: 'auto-delete', greylist: 'session-only' };

            // Build compact meta tags
            let metaTags = '';
            if (level === 'normal' && rule?.triggers) {
                const triggerNames = [];
                if (rule.triggers.tabClose) triggerNames.push('Tab Close');
                if (rule.triggers.domainChange) triggerNames.push('Nav');
                if (rule.triggers.browserRestart) triggerNames.push('Restart');
                if (rule.triggers.loseFocus) triggerNames.push('Tab Switch');
                if (rule.triggers.expiredOnly) triggerNames.push('Expired');
                if (triggerNames.length > 0) metaTags += `<span class="ad-meta-tag">🔔 ${triggerNames.join(', ')}</span>`;
                if (rule.delay > 0) metaTags += `<span class="ad-meta-tag">⏱ ${rule.delay}s</span>`;

                const siteDataItems = [];
                if (rule.siteData?.localStorage) siteDataItems.push('LS');
                if (rule.siteData?.sessionStorage) siteDataItems.push('SS');
                if (rule.siteData?.indexedDB) siteDataItems.push('IDB');
                if (rule.siteData?.cache) siteDataItems.push('Cache');
                if (rule.siteData?.serviceWorkers) siteDataItems.push('SW');
                if (rule.siteData?.formData) siteDataItems.push('Form');
                if (siteDataItems.length > 0) metaTags += `<span class="ad-meta-tag">🗑 ${siteDataItems.join(', ')}</span>`;
            }

            return `<div class="ad-domain-row">
                <div class="ad-domain-info">
                    <span class="ad-domain-name">${escapeHtml(d)}</span>
                    <div class="ad-domain-meta">
                        <span class="ad-domain-badge ${level}">${levelLabels[level] || level}</span>
                        ${metaTags}
                    </div>
                </div>
                <div class="ad-domain-actions">
                    <button class="ad-domain-edit" data-domain="${escapeHtml(d)}" title="Edit rule">✎</button>
                    <button class="ad-domain-remove" data-domain="${escapeHtml(d)}" title="Remove rule">✕</button>
                </div>
            </div>`;
        }).join('');
    }

    // Event delegation for edit and remove — set up ONCE, outside the render function
    adManagedDomainsList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.ad-domain-edit');
        const removeBtn = e.target.closest('.ad-domain-remove');
        if (editBtn) {
            const domain = editBtn.dataset.domain;
            populateAutoDeleteModal(domain);
            setEditMode(true, domain);
            // Scroll to triggers section
            const modalBody = autoDeleteModal.querySelector('.modal-body');
            if (adTriggersSection && modalBody) {
                adTriggersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        if (removeBtn) {
            const domain = removeBtn.dataset.domain;
            // If we're editing this domain, exit edit mode
            if (isEditingRule && currentAutoDeleteDomain === domain) {
                exitEditMode();
            }
            delete autoDeleteRules[domain];
            await chrome.storage.local.set({ autoDeleteRules });
            renderManagedDomains();
            Logger.info('Auto-Delete', `Removed rule for "${domain}"`);
        }
    });

    // Level radio change toggles triggers/sitedata/scope visibility
    document.querySelectorAll('input[name="adLevel"]').forEach(r => {
        r.addEventListener('change', () => {
            const showTriggers = r.value === 'normal';
            adTriggersSection.style.display = showTriggers ? '' : 'none';
            adSiteDataSection.style.display = showTriggers ? '' : 'none';
            const adCookieScopeSection = document.getElementById('adCookieScopeSection');
            if (adCookieScopeSection) adCookieScopeSection.style.display = showTriggers ? '' : 'none';
        });
    });

    function updateAutoDeleteIconStatus() {
        if (openAutoDeleteBtn) {
            if (autoDeleteEnabled) {
                openAutoDeleteBtn.classList.add('ad-active');
                openAutoDeleteBtn.dataset.tooltip = 'Auto-Delete Rules ( ON )';
            } else {
                openAutoDeleteBtn.classList.remove('ad-active');
                openAutoDeleteBtn.dataset.tooltip = 'Auto-Delete Rules ( OFF )';
            }
        }
    }

    function updateAutoDeleteToggleRowVisual() {
        const toggleRow = document.querySelector('.ad-global-toggle-row');
        if (toggleRow) {
            if (autoDeleteEnabled) {
                toggleRow.classList.add('ad-on');
            } else {
                toggleRow.classList.remove('ad-on');
            }
        }
    }

    autoDeleteGlobalToggle.addEventListener('change', async () => {
        autoDeleteEnabled = autoDeleteGlobalToggle.checked;
        await chrome.storage.local.set({ autoDeleteEnabled });
        updateAutoDeleteIconStatus();
        updateAutoDeleteToggleRowVisual();
        Logger.info('Auto-Delete', `Auto-Delete ${autoDeleteEnabled ? 'ENABLED' : 'DISABLED'}`);
    });

    if (openAutoDeleteBtn) {
        openAutoDeleteBtn.addEventListener('click', async () => {
            await loadAutoDeleteSettings();
            updateAutoDeleteIconStatus();
            updateAutoDeleteToggleRowVisual();
            // Reset edit mode when opening modal
            setEditMode(false, '');
            const domain = currentUrl ? getRootDomain(currentUrl.hostname) : '';
            populateAutoDeleteModal(domain);
            autoDeleteModal.classList.add('show');
        });
    }

    if (closeAutoDeleteBtn) {
        closeAutoDeleteBtn.addEventListener('click', () => {
            setEditMode(false, '');
            autoDeleteModal.classList.remove('show');
        });
    }

    // Set initial icon state on page load
    chrome.storage.local.get(['autoDeleteEnabled'], (result) => {
        autoDeleteEnabled = result.autoDeleteEnabled || false;
        updateAutoDeleteIconStatus();
    });

    if (adSaveRuleBtn) {
        adSaveRuleBtn.addEventListener('click', async () => {
            if (!currentAutoDeleteDomain) {
                setResultMessage('No domain to save rule for.', 'warning');
                return;
            }
            const level = document.querySelector('input[name="adLevel"]:checked')?.value || 'normal';
            const rule = { level };

            if (level === 'normal') {
                const tabClose = document.getElementById('adTriggerTabClose').checked;
                const domainChange = document.getElementById('adTriggerDomainChange').checked;
                const browserRestart = document.getElementById('adTriggerRestart').checked;
                const loseFocus = document.getElementById('adTriggerLoseFocus').checked;
                const expiredOnly = document.querySelector('input[name="adCookieScope"]:checked')?.value === 'expired';

                // Validate: at least one real trigger must be selected
                if (!tabClose && !domainChange && !browserRestart && !loseFocus) {
                    setResultMessage('Select at least one trigger.', 'warning');
                    return;
                }

                rule.triggers = { tabClose, domainChange, browserRestart, loseFocus, expiredOnly };
                rule.siteData = {
                    localStorage: document.getElementById('adSiteWebStorage').checked,
                    sessionStorage: document.getElementById('adSiteWebStorage').checked,
                    indexedDB: document.getElementById('adSiteIndexedDB').checked,
                    cache: document.getElementById('adSiteCache').checked,
                    serviceWorkers: document.getElementById('adSiteSW').checked,
                    formData: document.getElementById('adSiteFormData').checked
                };
                const parsedDelay = parseInt(adDelayInput.value);
                rule.delay = isNaN(parsedDelay) ? 0 : parsedDelay;
            }

            autoDeleteRules[currentAutoDeleteDomain] = rule;
            const parsedGlobalDelay = parseInt(adDelayInput.value);
            await chrome.storage.local.set({
                autoDeleteRules,
                autoDeleteDelay: isNaN(parsedGlobalDelay) ? 0 : parsedGlobalDelay
            });
            renderManagedDomains();
            const action = isEditingRule ? 'Updated' : 'Saved';
            setResultMessage(`${action} ${level} rule for ${currentAutoDeleteDomain}`, 'success');
            Logger.success('Auto-Delete', `Rule ${action.toLowerCase()}: "${currentAutoDeleteDomain}" → ${level}`);

            // Reset edit state and restore current tab domain
            exitEditMode();
        });
    }

    // Cancel edit button
    if (adCancelEdit) {
        adCancelEdit.addEventListener('click', () => {
            exitEditMode();
        });
    }

    initializeData();

    // --- SEARCH SCOPE PILLS ---
    document.querySelectorAll('#manageSearchScope .search-scope-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#manageSearchScope .search-scope-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            manageSearchScope = pill.dataset.scope;
            handleEditorSearch({ target: editorSearch });
        });
    });

    document.querySelectorAll('#importSearchScope .search-scope-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#importSearchScope .search-scope-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            importSearchScope = pill.dataset.scope;
            currentImportRenderLimit = 50;
            renderImportList();
        });
    });

    // --- Unified Keydown Handler (Dynamic Shortcuts) ---
    document.addEventListener('keydown', async (e) => {
        // 1. Recording mode — save new shortcut
        if (recordingShortcutId) {
            const key = e.key.toLowerCase();
            if (['control', 'alt', 'shift', 'meta'].includes(key)) return; // Wait for actual key
            e.preventDefault();
            const mod = e.altKey ? 'alt' : 'ctrl';
            const sc = userShortcuts.find(s => s.id === recordingShortcutId);
            if (sc) {
                sc.mod = mod;
                sc.key = key;
                chrome.storage.local.set({ userShortcuts });
            }
            recordingShortcutId = null;
            renderShortcutsModal();
            renderShortcutFooter();
            return;
        }

        // 2. Execution mode — match against stored shortcuts
        const key = e.key.toLowerCase();
        const isCtrl = e.ctrlKey || e.metaKey;
        const isAlt = e.altKey;

        for (const sc of userShortcuts) {
            const modMatch = (sc.mod === 'ctrl' && isCtrl && !isAlt) || (sc.mod === 'alt' && isAlt && !isCtrl);
            if (modMatch && key === sc.key) {
                e.preventDefault();
                switch (sc.id) {
                    case 'toggleReload':
                        autoReloadCheckbox.checked = !autoReloadCheckbox.checked;
                        setResultMessage(`Auto-Reload ${autoReloadCheckbox.checked ? 'ON' : 'OFF'}`, 'info');
                        break;
                    case 'clearCookies':
                        clearButton.click();
                        break;
                    case 'importData':
                        importButton.click();
                        break;
                    case 'exportJson':
                        handleExport('json');
                        break;
                    case 'quickSnap': {
                        if (cachedData.cookies.length === 0) { setResultMessage("No cookies to save.", "warning"); break; }
                        const name = `Quick Snap - ${get24hTime(new Date())}`;
                        await saveSnapshot(name, cachedData.cookies);
                        setResultMessage(`Saved: ${name}`, 'success');
                        if (snapshotsModal.classList.contains('show')) renderSnapshots();
                        break;
                    }
                    case 'restoreSnap': {
                        const snapshots = await getSnapshots();
                        if (!snapshots || snapshots.length === 0) { setResultMessage("No snapshots found.", "warning"); break; }
                        snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                        const latest = snapshots[0];
                        performRestoreSnapshot(latest.id, latest.name);
                        break;
                    }
                }
                return;
            }
        }
    });
});