document.addEventListener('DOMContentLoaded', async () => {
    // --- Theme ---
    chrome.storage.local.get(['theme', 'darkMode'], (result) => {
        if (result.theme === 'dark' || result.darkMode === true) document.body.classList.add('dark-mode');
    });
    // Listen for theme changes from the main popup window
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.theme) {
            document.body.classList.toggle('dark-mode', changes.theme.newValue === 'dark');
        }
    });
    document.getElementById('utilThemeToggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        chrome.storage.local.set({ theme: isDark ? 'dark' : 'light', darkMode: isDark });
    });

    // --- Tab Navigation ---
    const tabs = document.querySelectorAll('.util-tab');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // --- Settings ---
    let renewDurationValue = 2592000;
    const settings = await chrome.storage.local.get(['renewDurationValue']);
    if (settings.renewDurationValue) renewDurationValue = settings.renewDurationValue;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ========================================================
    // UNIFIED CONVERTER + DECODER + ANALYZER
    // ========================================================
    const converterInput = document.getElementById('converterInput');
    const converterOutput = document.getElementById('converterOutput');
    const targetFormat = document.getElementById('targetFormat');
    const convertBtn = document.getElementById('convertBtn');
    const copyOutputBtn = document.getElementById('copyOutputBtn');
    const downloadOutputBtn = document.getElementById('downloadOutputBtn');
    const formatBadge = document.getElementById('formatBadge');

    // New Input Info Grid Elements
    const inputInfoGrid = document.getElementById('inputInfoGrid');
    const infoFormat = document.getElementById('infoFormat');
    const infoCount = document.getElementById('infoCount');
    const infoDomain = document.getElementById('infoDomain');

    const conversionOptions = document.getElementById('conversionOptions');
    const conversionWarning = document.getElementById('conversionWarning');
    const convDomain = document.getElementById('convDomain');
    const convExpiry = document.getElementById('convExpiry');
    const outputSection = document.getElementById('outputSection');
    const analysisPanel = document.getElementById('analysisPanel');
    const analysisContent = document.getElementById('analysisContent');
    const analysisCookieCount = document.getElementById('analysisCookieCount');
    const decodedPanel = document.getElementById('decodedPanel');
    const decodedContent = document.getElementById('decodedContent');
    const decodedCount = document.getElementById('decodedCount');

    const lossyFormats = ['header', 'python'];
    const richFormats = ['json', 'netscape', 'puppeteer', 'csv'];
    let lastParsedCookies = [];
    let lastDetectedFormat = '';

    // --- Auto-detect on input ---
    let detectDebounce = null;
    converterInput.addEventListener('input', () => {
        clearTimeout(detectDebounce);
        detectDebounce = setTimeout(() => {
            const input = converterInput.value.trim();
            if (!input) {
                formatBadge.textContent = 'Waiting for input...';
                formatBadge.classList.remove('detected');
                if (inputInfoGrid) inputInfoGrid.style.display = 'none';
                analysisPanel.style.display = 'none';
                decodedPanel.style.display = 'none';
                return;
            }
            const detected = detectFormat(input);
            lastDetectedFormat = normalizeFormatName(detected);
            if (detected !== 'Unknown') {
                formatBadge.textContent = `Detected: ${detected}`;
                formatBadge.classList.add('detected');
            } else {
                formatBadge.textContent = 'Format not recognized';
                formatBadge.classList.remove('detected');
            }
            updateConversionUI();
            autoSelectSmartFormat();
            autoAnalyze();
        }, 300);
    });

    function normalizeFormatName(name) {
        const map = { 'JSON': 'json', 'Netscape': 'netscape', 'Header String': 'header', 'Python Dict': 'python', 'Puppeteer': 'puppeteer', 'CSV': 'csv' };
        return map[name] || 'json';
    }

    function updateConversionUI() {
        const src = lastDetectedFormat || 'json';
        const tgt = targetFormat.value;
        const needsOptions = lossyFormats.includes(src) && richFormats.includes(tgt);
        conversionOptions.style.display = needsOptions ? '' : 'none';

        if (richFormats.includes(src) && lossyFormats.includes(tgt)) {
            conversionWarning.style.display = '';
            conversionWarning.textContent = `⚠️ Converting to ${tgt} will lose data: domain, path, secure, httpOnly, expiration will be discarded.`;
        } else {
            conversionWarning.style.display = 'none';
        }
    }

    let targetFormatManuallySelected = false;
    targetFormat.addEventListener('change', () => {
        targetFormatManuallySelected = true;
        updateConversionUI();
    });

    // Auto-select a format different from the detected one
    function autoSelectSmartFormat() {
        if (targetFormatManuallySelected) return; // Do not override user selection
        const detected = lastDetectedFormat;
        if (!detected) return;
        const preferred = { json: 'netscape', netscape: 'json', header: 'json', python: 'json', puppeteer: 'json', csv: 'json' };
        const smartTarget = preferred[detected] || 'json';
        if (targetFormat.value === detected || targetFormat.value === 'json') {
            targetFormat.value = smartTarget;
            updateConversionUI();
        }
    }

    // --- Parsing ---
    function parseForConversion(input, format) {
        switch (format) {
            case 'json': {
                let data = JSON.parse(input);
                if (!Array.isArray(data)) data = [data];
                return data;
            }
            case 'netscape': {
                const result = parseNetscapeCookies(input);
                return result.cookies || [];
            }
            case 'header': {
                const pairs = input.split(';').map(s => s.trim()).filter(Boolean);
                return pairs.map(pair => {
                    const idx = pair.indexOf('=');
                    return {
                        name: idx > -1 ? pair.slice(0, idx).trim() : pair.trim(),
                        value: idx > -1 ? pair.slice(idx + 1).trim() : '',
                        domain: '', path: '/', secure: false, httpOnly: false, sameSite: 'unspecified'
                    };
                });
            }
            case 'python': {
                const cleaned = input.replace(/'/g, '"');
                const obj = JSON.parse(cleaned);
                return Object.entries(obj).map(([name, value]) => ({
                    name, value: String(value),
                    domain: '', path: '/', secure: false, httpOnly: false, sameSite: 'unspecified'
                }));
            }
            case 'puppeteer': {
                const data = JSON.parse(input);
                return (Array.isArray(data) ? data : [data]).map(c => ({
                    name: c.name, value: c.value, domain: c.domain || '', path: c.path || '/',
                    secure: c.secure || false, httpOnly: c.httpOnly || false,
                    expirationDate: c.expires || c.expirationDate || 0,
                    sameSite: c.sameSite === 'None' ? 'no_restriction' : (c.sameSite || 'unspecified').toLowerCase()
                }));
            }
            case 'csv': {
                const lines = input.trim().split('\n');
                const hasHeader = lines[0].toLowerCase().includes('name');
                const start = hasHeader ? 1 : 0;
                return lines.slice(start).filter(l => l.trim()).map(line => {
                    const cols = line.split(',');
                    return {
                        name: cols[0] || '', value: cols[1] || '', domain: cols[2] || '', path: cols[3] || '/',
                        secure: cols[4] === 'true', httpOnly: cols[5] === 'true',
                        sameSite: cols[6] || 'unspecified', expirationDate: parseInt(cols[7]) || 0
                    };
                });
            }
            default: return [];
        }
    }

    function getExpirationTimestamp() {
        const sel = convExpiry.value;
        if (sel === 'session') return undefined;
        if (sel === 'renew') return Math.floor(Date.now() / 1000) + renewDurationValue;
        const map = { '1d': 86400, '7d': 604800, '30d': 2592000, '1y': 31536000 };
        return Math.floor(Date.now() / 1000) + (map[sel] || 2592000);
    }

    function fillDefaults(cookies) {
        const domain = convDomain.value.trim();
        const exp = getExpirationTimestamp();
        return cookies.map(c => ({
            ...c,
            domain: c.domain || domain || '.example.com',
            path: c.path || '/',
            secure: c.secure ?? false,
            httpOnly: c.httpOnly ?? false,
            sameSite: c.sameSite || 'unspecified',
            expirationDate: c.expirationDate || exp
        }));
    }

    function convertCookies(cookies, format) {
        switch (format) {
            case 'json': return generateJSON(cookies);
            case 'netscape': return generateNetscape(cookies);
            case 'header': return generateHeaderString(cookies);
            case 'python': return generatePython(cookies);
            case 'puppeteer': return generatePuppeteer(cookies);
            case 'csv': return generateCSV(cookies);
            default: return '';
        }
    }

    // --- Auto-analyze on paste ---
    function autoAnalyze() {
        const input = converterInput.value.trim();
        if (!input || lastDetectedFormat === '') return;
        try {
            let cookies = parseForConversion(input, lastDetectedFormat);
            cookies = fillDefaults(cookies);
            lastParsedCookies = cookies;
            if (cookies.length > 0) {
                // Update Info Grid
                if (infoFormat) infoFormat.textContent = lastDetectedFormat.toUpperCase();
                if (infoCount) infoCount.textContent = cookies.length;

                const domainCounts = {};
                cookies.forEach(c => {
                    const d = c.domain || 'Unknown';
                    const root = getRootDomain(d.startsWith('.') ? d.slice(1) : d);
                    domainCounts[root] = (domainCounts[root] || 0) + 1;
                });
                const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
                if (infoDomain) infoDomain.textContent = sortedDomains.length > 0 ? sortedDomains[0][0] : 'Unknown';

                if (inputInfoGrid) inputInfoGrid.style.display = '';

                renderAnalysis(cookies);
                renderDecodedValues(cookies);
            }
        } catch (e) {
            if (inputInfoGrid) inputInfoGrid.style.display = 'none';
            analysisPanel.style.display = 'none';
            decodedPanel.style.display = 'none';
        }
    }

    // --- Convert button ---
    convertBtn.addEventListener('click', () => {
        try {
            const src = lastDetectedFormat || 'json';
            let cookies = parseForConversion(converterInput.value, src);
            if (cookies.length === 0) { converterOutput.value = 'No cookies parsed.'; outputSection.style.display = ''; return; }
            cookies = fillDefaults(cookies);
            lastParsedCookies = cookies;
            converterOutput.value = convertCookies(cookies, targetFormat.value);
            outputSection.style.display = '';
            renderAnalysis(cookies);
            renderDecodedValues(cookies);
        } catch (e) {
            converterOutput.value = `Error: ${e.message}`;
            outputSection.style.display = '';
        }
    });

    copyOutputBtn.addEventListener('click', async () => {
        if (!converterOutput.value) {
            copyOutputBtn.textContent = '⚠️ Convert first!';
            copyOutputBtn.style.color = '#f59e0b';
            setTimeout(() => { copyOutputBtn.textContent = '📋 Copy'; copyOutputBtn.style.color = ''; }, 1500);
            return;
        }
        await navigator.clipboard.writeText(converterOutput.value);
        copyOutputBtn.textContent = '✅ Copied!';
        setTimeout(() => copyOutputBtn.textContent = '📋 Copy', 1500);
    });

    downloadOutputBtn.addEventListener('click', () => {
        if (!converterOutput.value) {
            downloadOutputBtn.textContent = '⚠️ Convert first!';
            downloadOutputBtn.style.color = '#f59e0b';
            setTimeout(() => { downloadOutputBtn.textContent = '💾 Save'; downloadOutputBtn.style.color = ''; }, 1500);
            return;
        }
        const ext = { json: 'json', netscape: 'txt', header: 'txt', python: 'py', puppeteer: 'json', csv: 'csv' };
        const blob = new Blob([converterOutput.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `cookies.${ext[targetFormat.value] || 'txt'}`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 150);
    });

    // --- Auto Load from Tab ---
    const params = new URLSearchParams(window.location.search);
    const initialDomain = params.get('domain');
    if (initialDomain) {
        (async () => {
            try {
                const cookies = await chrome.cookies.getAll({ domain: getRootDomain(initialDomain) });
                if (cookies.length === 0) {
                    formatBadge.textContent = `No cookies found for ${initialDomain}`;
                    return;
                }
                converterInput.value = JSON.stringify(cookies, null, 2);
                lastDetectedFormat = 'json';
                formatBadge.textContent = 'Detected: JSON';
                formatBadge.classList.add('detected');
                autoSelectSmartFormat();

                // Populate three badges
                if (infoFormat) infoFormat.textContent = 'JSON';
                if (infoDomain) infoDomain.textContent = getRootDomain(initialDomain);
                if (infoCount) infoCount.textContent = cookies.length;
                if (inputInfoGrid) inputInfoGrid.style.display = '';

                lastParsedCookies = cookies;
                renderAnalysis(cookies);
                renderDecodedValues(cookies);
            } catch (e) {
                formatBadge.textContent = `Error: ${e.message}`;
                formatBadge.classList.remove('detected');
            }
        })();
    }

    // ========================================================
    // INLINE ANALYSIS — Clickable + Hierarchical Domains
    // ========================================================

    // Analysis detail modal elements
    const analysisDetailModal = document.getElementById('analysisDetailModal');
    const analysisDetailTitle = document.getElementById('analysisDetailTitle');
    const analysisDetailBody = document.getElementById('analysisDetailBody');
    const closeAnalysisDetailBtn = document.getElementById('closeAnalysisDetailBtn');

    if (closeAnalysisDetailBtn) {
        closeAnalysisDetailBtn.addEventListener('click', () => {
            analysisDetailModal.style.display = 'none';
        });
    }
    if (analysisDetailModal) {
        analysisDetailModal.addEventListener('click', (e) => {
            if (e.target === analysisDetailModal) analysisDetailModal.style.display = 'none';
        });
    }

    function openAnalysisDetail(title, filteredCookies) {
        analysisDetailTitle.textContent = `${title} (${filteredCookies.length})`;

        // Group by domain
        const groups = {};
        filteredCookies.forEach(c => {
            const d = c.domain || 'Unknown';
            const clean = d.startsWith('.') ? d.slice(1) : d;
            const root = getRootDomain(clean);
            if (!groups[root]) groups[root] = [];
            groups[root].push(c);
        });

        let html = '';
        const sortedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
        for (const [root, cookies] of sortedGroups) {
            html += `<div class="detail-domain-group">`;
            html += `<div class="detail-domain-header"><span>${escapeHtml(root)}</span><span class="detail-domain-count">${cookies.length}</span></div>`;
            cookies.forEach(c => {
                const expStr = c.expirationDate ? new Date(c.expirationDate * 1000).toLocaleDateString() : 'Session';
                const flags = [];
                if (c.secure) flags.push('🔒');
                if (c.httpOnly) flags.push('🛡️');
                html += `<div class="detail-cookie-row">
                    <div class="detail-cookie-name">${escapeHtml(c.name)}</div>
                    <div class="detail-cookie-meta">
                        <span class="detail-cookie-domain">${escapeHtml(c.domain || '')}</span>
                        <span class="detail-cookie-exp">${expStr}</span>
                        ${flags.length > 0 ? `<span class="detail-cookie-flags">${flags.join(' ')}</span>` : ''}
                    </div>
                    <div class="detail-cookie-value">${escapeHtml((c.value || '').substring(0, 80))}${(c.value || '').length > 80 ? '…' : ''}</div>
                </div>`;
            });
            html += `</div>`;
        }

        analysisDetailBody.innerHTML = html;
        analysisDetailModal.style.display = 'flex';
    }

    function renderAnalysis(cookies) {
        if (cookies.length === 0) { analysisPanel.style.display = 'none'; return; }

        const now = Date.now() / 1000;
        const stats = {
            total: cookies.length,
            secure: cookies.filter(c => c.secure).length,
            httpOnly: cookies.filter(c => c.httpOnly).length,
            expired: cookies.filter(c => c.expirationDate && c.expirationDate < now).length,
            session: cookies.filter(c => !c.expirationDate).length
        };

        const sameSiteMap = {};
        cookies.forEach(c => {
            const ss = c.sameSite || 'unspecified';
            sameSiteMap[ss] = (sameSiteMap[ss] || 0) + 1;
        });

        // Hierarchical domain grouping
        const domainGroups = {};
        cookies.forEach(c => {
            const d = c.domain || 'unknown';
            const clean = d.startsWith('.') ? d.slice(1) : d;
            const root = getRootDomain(clean);
            if (!domainGroups[root]) domainGroups[root] = { count: 0, subdomains: {} };
            domainGroups[root].count++;
            domainGroups[root].subdomains[clean] = (domainGroups[root].subdomains[clean] || 0) + 1;
        });
        const sortedDomainGroups = Object.entries(domainGroups).sort((a, b) => b[1].count - a[1].count);

        analysisCookieCount.textContent = `${stats.total} cookies`;

        // Build stat cards with click support
        const statCards = [
            { label: 'Total', value: stats.total, icon: '📦', color: '#6366f1', filter: 'total' },
            { label: 'Session', value: stats.session, icon: '⏳', color: '#f59e0b', filter: 'session' },
            { label: 'Persistent', value: stats.total - stats.session, icon: '💾', color: '#10b981', filter: 'persistent' },
            { label: 'Expired', value: stats.expired, icon: '⛔', color: '#ef4444', filter: 'expired' }
        ];

        const securityCards = [
            { label: 'Secure', value: stats.secure, icon: '✅', color: '#10b981', filter: 'secure' },
            { label: 'HttpOnly', value: stats.httpOnly, icon: '🛡️', color: '#6366f1', filter: 'httpOnly' },
            { label: 'Insecure', value: stats.total - stats.secure, icon: '⚠️', color: '#ef4444', filter: 'insecure' }
        ];

        let html = `
        <div class="analysis-category">
            <div class="analysis-category-title">Cookie Types</div>
            <div class="stat-grid">${statCards.map(s =>
            `<div class="stat-card stat-clickable" data-filter="${s.filter}" style="border-left: 3px solid ${s.color};">
                    <div class="stat-card-top"><span class="stat-icon">${s.icon}</span><div class="stat-value">${s.value}</div></div>
                    <div class="stat-label">${s.label}</div>
                </div>`
        ).join('')}</div>
        </div>
        <div class="analysis-category">
            <div class="analysis-category-title">Security Settings</div>
            <div class="stat-grid">${securityCards.map(s =>
            `<div class="stat-card stat-clickable" data-filter="${s.filter}" style="border-left: 3px solid ${s.color};">
                    <div class="stat-card-top"><span class="stat-icon">${s.icon}</span><div class="stat-value">${s.value}</div></div>
                    <div class="stat-label">${s.label}</div>
                </div>`
        ).join('')}</div>
        </div>
        `;

        if (Object.keys(sameSiteMap).length > 0) {
            html += `
            <div class="analysis-category">
                <div class="analysis-category-title">SameSite Policies</div>
                <div class="stat-grid">${Object.entries(sameSiteMap).map(([k, v]) =>
                `<div class="stat-card stat-clickable" data-filter="samesite-${k}" style="border-left: 3px solid #8b5cf6;">
                    <div class="stat-card-top"><span class="stat-icon">🔗</span><div class="stat-value">${v}</div></div>
                    <div class="stat-label">${escapeHtml(k)}</div>
                </div>`
            ).join('')}</div>
            </div>`;
        }

        // Hierarchical Top Domains (like Available Domains in popup)
        if (sortedDomainGroups.length > 0) {
            html += `
            <div class="analysis-category">
                <div class="analysis-category-title">Top Domains</div>
                <div class="domain-hierarchy">`;
            sortedDomainGroups.slice(0, 20).forEach(([root, data]) => {
                html += `<div class="domain-group">`;
                html += `<div class="domain-group-head"><span class="domain-root-name">${escapeHtml(root)}</span><span class="domain-root-count">${data.count}</span></div>`;
                const sortedSubs = Object.entries(data.subdomains).sort((a, b) => b[1] - a[1]);
                sortedSubs.forEach(([sub, count]) => {
                    html += `<div class="domain-sub-row"><span class="domain-sub-name">${escapeHtml(sub)}</span><span class="domain-sub-count">${count}</span></div>`;
                });
                html += `</div>`;
            });
            html += `</div>
            </div>`;
        }

        analysisContent.innerHTML = html;
        analysisPanel.style.display = '';

        // Attach click handlers for stat cards
        analysisContent.querySelectorAll('.stat-clickable').forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.dataset.filter;
                let filtered = [];
                let title = '';
                const now2 = Date.now() / 1000;
                switch (filter) {
                    case 'total': filtered = cookies; title = 'All Cookies'; break;
                    case 'session': filtered = cookies.filter(c => !c.expirationDate); title = 'Session Cookies'; break;
                    case 'persistent': filtered = cookies.filter(c => !!c.expirationDate); title = 'Persistent Cookies'; break;
                    case 'expired': filtered = cookies.filter(c => c.expirationDate && c.expirationDate < now2); title = 'Expired Cookies'; break;
                    case 'secure': filtered = cookies.filter(c => c.secure); title = 'Secure Cookies'; break;
                    case 'httpOnly': filtered = cookies.filter(c => c.httpOnly); title = 'HttpOnly Cookies'; break;
                    case 'insecure': filtered = cookies.filter(c => !c.secure); title = 'Insecure Cookies'; break;
                    default:
                        if (filter.startsWith('samesite-')) {
                            const ssVal = filter.slice(9);
                            filtered = cookies.filter(c => (c.sameSite || 'unspecified') === ssVal);
                            title = `SameSite: ${ssVal}`;
                        }
                        break;
                }
                if (filtered.length > 0) openAnalysisDetail(title, filtered);
            });
        });
    }

    // ========================================================
    // INLINE DECODED VALUES
    // ========================================================
    function tryURLDecode(str) {
        try {
            // Reject numbers and pure hex strings passing as URLs
            if (/^[0-9A-F-]+$/i.test(str)) return null;

            const decoded = decodeURIComponent(str);
            // Ignore if decode changed nothing
            return decoded !== str ? decoded : null;
        } catch { return null; }
    }

    function tryBase64(str) {
        try {
            if (!/^[A-Za-z0-9+/=_-]+$/.test(str) || str.length < 8) return null;

            // Rejection rules to avoid false positives on normally encoded strings like UUIDs or hex segments
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            if (isUUID) return null;
            if (/^[0-9A-F-]+$/i.test(str)) return null; // Reject pure hex strings (often hashes or IDs)

            const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = atob(normalized);

            // Reject if control characters dominantly exist
            if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) return null;

            // Confirm at least 95% is readable ascii text
            let printable = 0;
            for (let i = 0; i < decoded.length; i++) {
                const code = decoded.charCodeAt(i);
                if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) printable++;
            }
            if ((printable / decoded.length) < 0.95) return null;

            // Reject if decoding changed nothing
            if (decoded === str) return null;

            return decoded;
        } catch { return null; }
    }

    function tryJWT(str) {
        const parts = str.split('.');
        if (parts.length !== 3) return null;
        try {
            const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return { header, payload };
        } catch { return null; }
    }

    decodedContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('raw-toggle-btn')) {
            const section = e.target.closest('.decode-section');
            const rawContent = section.querySelector('.decode-raw-content');
            if (rawContent) {
                const isShowing = rawContent.classList.contains('show');
                if (isShowing) {
                    rawContent.classList.remove('show');
                    e.target.textContent = 'View Raw';
                } else {
                    rawContent.classList.add('show');
                    e.target.textContent = 'Hide Raw';
                }
            }
        }
    });

    function renderDecodedValues(cookies) {
        decodedContent.innerHTML = '';
        const BATCH_SIZE = 40;
        let index = 0;
        const allResults = [];

        function processBatch() {
            const fragment = document.createDocumentFragment();
            const end = Math.min(index + BATCH_SIZE, cookies.length);
            let batchHasResults = false;

            for (; index < end; index++) {
                const cookie = cookies[index];
                const decodings = [];
                const val = cookie.value || '';
                if (!val || val.length < 3) continue;

                const jwt = tryJWT(val);
                if (jwt) {
                    decodings.push(`
                    <div class="decode-section">
                        <div class="decode-section-header">
                            <div class="decode-section-title">JWT Payload</div>
                            <button class="raw-toggle-btn">View Raw</button>
                        </div>
                        <div class="decode-section-content">${escapeHtml(JSON.stringify(jwt.payload, null, 2))}</div>
                        <div class="decode-raw-content">RAW: ${escapeHtml(val)}</div>
                    </div>`);
                }

                const urlDecoded = tryURLDecode(val);
                if (urlDecoded && urlDecoded.length < val.length * 1.5) {
                    decodings.push(`
                    <div class="decode-section">
                        <div class="decode-section-header">
                            <div class="decode-section-title">URL Decoded</div>
                            <button class="raw-toggle-btn">View Raw</button>
                        </div>
                        <div class="decode-section-content">${escapeHtml(urlDecoded)}</div>
                        <div class="decode-raw-content">RAW: ${escapeHtml(val)}</div>
                    </div>`);
                }

                const b64 = tryBase64(val);
                if (b64 && !jwt && b64.length > 2) {
                    decodings.push(`
                    <div class="decode-section">
                        <div class="decode-section-header">
                            <div class="decode-section-title">Base64 Decoded</div>
                            <button class="raw-toggle-btn">View Raw</button>
                        </div>
                        <div class="decode-section-content">${escapeHtml(b64)}</div>
                        <div class="decode-raw-content">RAW: ${escapeHtml(val)}</div>
                    </div>`);
                }

                if (decodings.length > 0) {
                    batchHasResults = true;
                    allResults.push(true);
                    const item = document.createElement('div');
                    item.className = 'decode-item';
                    item.innerHTML = `
                        <div class="decode-cookie-name">🍪 ${escapeHtml(cookie.name)}</div>
                        ${decodings.join('')}`;
                    fragment.appendChild(item);
                }
            }

            if (batchHasResults) decodedContent.appendChild(fragment);

            if (index < cookies.length) {
                requestAnimationFrame(processBatch);
            } else {
                // Final — show or hide panel
                if (allResults.length > 0) {
                    decodedCount.textContent = `${allResults.length} found`;
                    decodedPanel.style.display = '';
                } else {
                    decodedPanel.style.display = 'none';
                }
            }
        }

        requestAnimationFrame(processBatch);
    }

    // ========================================================
    // TOOLS
    // ========================================================
    const unixInput = document.getElementById('unixInput');
    const humanInput = document.getElementById('humanInput');
    const timestampResult = document.getElementById('timestampResult');

    document.getElementById('unixToHumanBtn').addEventListener('click', () => {
        const ts = parseInt(unixInput.value);
        if (isNaN(ts)) { timestampResult.textContent = 'Invalid timestamp'; return; }
        const d = new Date(ts * 1000);
        humanInput.value = d.toISOString().replace('T', ' ').replace('Z', ' UTC');
        timestampResult.textContent = `${d.toLocaleString()} (local time)`;
    });

    document.getElementById('humanToUnixBtn').addEventListener('click', () => {
        const d = new Date(humanInput.value);
        if (isNaN(d.getTime())) { timestampResult.textContent = 'Invalid date'; return; }
        unixInput.value = Math.floor(d.getTime() / 1000);
        timestampResult.textContent = `Unix: ${unixInput.value}`;
    });

    document.getElementById('nowBtn').addEventListener('click', () => {
        const now = Math.floor(Date.now() / 1000);
        unixInput.value = now;
        humanInput.value = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
        timestampResult.textContent = `Current time: ${new Date().toLocaleString()}`;
    });

    // Cookie String Builder
    const builderFields = ['buildName', 'buildValue', 'buildDomain', 'buildPath', 'buildSecure', 'buildHttpOnly', 'buildSameSite', 'buildExpires'];
    const builderPreview = document.getElementById('builderPreview');

    function updateBuilderPreview() {
        const name = document.getElementById('buildName').value || 'name';
        const value = document.getElementById('buildValue').value || 'value';
        const domain = document.getElementById('buildDomain').value;
        const path = document.getElementById('buildPath').value || '/';
        const secure = document.getElementById('buildSecure').value === 'true';
        const httpOnly = document.getElementById('buildHttpOnly').value === 'true';
        const sameSite = document.getElementById('buildSameSite').value;
        const expires = document.getElementById('buildExpires').value;

        let str = `Set-Cookie: ${name}=${value}`;
        if (domain) str += `; Domain=${domain}`;
        str += `; Path=${path}`;
        if (secure) str += '; Secure';
        if (httpOnly) str += '; HttpOnly';
        str += `; SameSite=${sameSite}`;
        if (expires) {
            const d = new Date(parseInt(expires) * 1000);
            if (!isNaN(d.getTime())) str += `; Expires=${d.toUTCString()}`;
        }
        builderPreview.textContent = str;
    }

    builderFields.forEach(id => {
        document.getElementById(id).addEventListener('input', updateBuilderPreview);
        document.getElementById(id).addEventListener('change', updateBuilderPreview);
    });
    updateBuilderPreview();
});
