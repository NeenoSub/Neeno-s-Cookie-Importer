let _uiIdCounter = 0;
// Parses the string into cookie objects but DOES NOT save them.
function parseInputCookies(cookieString) {
    let cookies = [];
    let format = "Unknown";
    const str = cookieString.trim();

    // --- 1. Try JSON / Python Dict ---
    if (str.startsWith('[') || str.startsWith('{')) {
        let jsonSuccess = false;

        // A. Try Standard JSON / Puppeteer Parsing
        try {
            const jsonData = JSON.parse(str);
            jsonSuccess = true;

            // Case A: Array (Standard JSON or Puppeteer)
            if (Array.isArray(jsonData)) {
                const validCookies = jsonData.filter(c => c && typeof c === 'object' && (c.name || c.Name) && (c.value !== undefined || c.Value !== undefined));
                if (validCookies.length > 0) {
                    const isPuppeteer = validCookies.some(c => c.expires !== undefined && c.expirationDate === undefined);
                    format = isPuppeteer ? "Puppeteer" : "JSON";
                    cookies = mapJsonToCookies(validCookies, format === "Puppeteer");
                }
            }
            // Case B: Object (Single Cookie OR Key-Value Map)
            else if (typeof jsonData === 'object' && jsonData !== null) {
                if ((jsonData.name || jsonData.Name) && (jsonData.value !== undefined || jsonData.Value !== undefined)) {
                    format = "JSON";
                    cookies = mapJsonToCookies([jsonData], false);
                } else {
                    format = "JSON Key-Value";
                    cookies = Object.entries(jsonData).map(([k, v]) => ({
                        name: k,
                        value: String(v),
                        domain: "",
                        path: "/",
                        secure: false,
                        httpOnly: false,
                        expiration: 0,
                        sameSite: "unspecified",
                        _uiId: `new_${_uiIdCounter++}`
                    }));
                }
            }
        } catch (e) {
            // JSON parsing failed. This is expected for Python Dicts with single quotes.
        }

        // B. Try Python Dict (If JSON failed, or specifically looks like Python)
        if (!jsonSuccess) {
            // Regex matches 'key': 'value' pattern, handling escaped quotes in value.
            // It does not require strict single quote exclusivity anymore.
            const pythonRegex = /'([^']+)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
            let match;
            const parsedCookies = [];

            // Simple validation: must start with { and contain '
            if (str.startsWith('{') && str.includes("'")) {
                while ((match = pythonRegex.exec(str)) !== null) {
                    parsedCookies.push({
                        name: match[1],
                        value: match[2].replace(/\\'/g, "'"), // Unescape single quotes
                        domain: "",
                        path: "/",
                        secure: false,
                        httpOnly: false,
                        expiration: 0,
                        sameSite: "unspecified",
                        _uiId: `new_${_uiIdCounter++}`
                    });
                }
            }

            if (parsedCookies.length > 0) {
                cookies = parsedCookies;
                format = "Python Dict";
            }
        }
    }

    // --- 2. Try Header String (name=value; name2=value2) ---
    // Heuristic: Contains '=', and if it has newlines, it MUST have semicolons.
    // This prevents CSV (which has newlines but usually no semicolons) from being detected as Header String.
    const hasNewlines = str.includes('\n');
    const hasSemicolons = str.includes(';');

    if (cookies.length === 0 && str.includes('=') && (!hasNewlines || hasSemicolons)) {
        // Split by semicolon
        const parts = str.split(';').map(s => s.trim()).filter(s => s.length > 0);

        // Strict check: Every part must be a key=value pair
        const isHeader = parts.length > 0 && parts.every(p => {
            const eqIdx = p.indexOf('=');
            return eqIdx > 0; // Has = and key is not empty
        });

        if (isHeader) {
            format = "Header String";
            cookies = parts.map(part => {
                const eqIdx = part.indexOf('=');
                const name = part.substring(0, eqIdx).trim();
                const value = part.substring(eqIdx + 1).trim();
                return {
                    name: name,
                    value: value,
                    domain: "",
                    path: "/",
                    secure: false,
                    expiration: 0,
                    httpOnly: false,
                    sameSite: "unspecified",
                    _uiId: `new_${_uiIdCounter++}`
                };
            });
        }
    }

    // --- 3. Try CSV (REMOVED) ---

    // --- 4. Fallback to Netscape ---
    let netscapeDuplicates = 0;
    if (cookies.length === 0 && (str.includes('\t') || str.startsWith('#'))) {
        if (typeof parseNetscapeCookies === 'function') {
            const parsed = parseNetscapeCookies(str);
            if (parsed.cookies.length > 0) {
                format = "Netscape";
                netscapeDuplicates = parsed.duplicateCount;
                cookies = parsed.cookies.map(c => ({
                    ...c,
                    _uiId: `new_${_uiIdCounter++}`
                }));
            }
        }
    }

    // 5. Deduplicate
    const uniqueCookies = [];
    const seenKeys = new Set();
    let duplicateCount = 0;

    for (const cookie of cookies) {
        if (!cookie.name) continue;
        const key = `${cookie.domain || 'nodomain'}|${cookie.path || '/'}|${cookie.name}`;
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueCookies.push(cookie);
        } else {
            duplicateCount++;
        }
    }

    return { cookies: uniqueCookies, format, duplicateCount: duplicateCount + netscapeDuplicates };
}

// Helper: Map JSON objects to Cookie format
function mapJsonToCookies(validJsonCookies, isPuppeteer) {
    return validJsonCookies.map(c => {
        // Bug Fix 6: Safe falsy checking explicitly for undefined (allows value to be "0" or false)
        const name = c.name !== undefined ? c.name : (c.Name !== undefined ? c.Name : "");
        const value = c.value !== undefined ? c.value : (c.Value !== undefined ? c.Value : "");

        // Puppeteer uses 'expires' (seconds), Chrome uses 'expirationDate' (seconds)
        let expiration = c.expirationDate || c.expires || c.expiration || c.Expires || 0;
        // Check for millisecond timestamps (e.g. 13 digits) and convert to seconds if needed
        if (expiration > 100000000000) expiration = expiration / 1000;

        return {
            domain: c.domain || c.Domain || "",
            path: c.path || c.Path || "/",
            secure: c.secure || c.Secure || false,
            expiration: expiration,
            name: name,
            value: value,
            httpOnly: c.httpOnly || c.HttpOnly || false,
            sameSite: c.sameSite || c.SameSite || "unspecified",
            _uiId: `new_${_uiIdCounter++}`
        };
    });
}

// Takes an array of cookie objects and saves them to the browser.
async function importParsedCookies(cookieList, currentDomain, conflictResolution = "overwrite", storeId = null) {
    const results = await Promise.all(
        cookieList.map(cookie => saveCookie(cookie, currentDomain, conflictResolution, storeId))
    );
    return {
        importedCount: results.filter(r => r.success).length,
        skippedCount: results.filter(r => r.status === 'skipped').length,
        results
    };
}

// Wrapper to maintain backward compatibility
async function importCookies(cookieString, currentDomain, conflictResolution = "overwrite", storeId = null) {
    const { cookies, format, duplicateCount } = parseInputCookies(cookieString);
    if (cookies.length === 0) throw new Error("No valid cookies found");
    const { importedCount, skippedCount, results } = await importParsedCookies(cookies, currentDomain, conflictResolution, storeId);
    return { importedCount, skippedCount, format, duplicateCount, results };
}