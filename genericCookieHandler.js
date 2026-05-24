async function saveCookie(cookie, currentDomain, conflictResolution = "overwrite", storeId = null) {
  const isCurrentDomain = (cookieDomain, tabDomain) => {
    if (!tabDomain) return true;
    if (!cookieDomain) return true;

    const normalize = (d) => (d.startsWith('.') ? d.slice(1) : d).toLowerCase();
    const stripWWW = (d) => d.startsWith('www.') ? d.slice(4) : d;

    const normCookie = normalize(cookieDomain);
    const normTab = normalize(tabDomain);

    if (normCookie === normTab) return true;

    const baseTab = stripWWW(normTab);
    const baseCookie = stripWWW(normCookie);

    if (baseTab === baseCookie) return true;

    const isParent = baseTab.endsWith('.' + baseCookie);
    const isSubdomain = baseCookie.endsWith('.' + baseTab);

    return isParent || isSubdomain;
  };

  if (currentDomain && !isCurrentDomain(cookie.domain, currentDomain)) {
    return { success: false, status: 'skipped', reason: 'Domain mismatch', details: `Cookie domain '${cookie.domain}' is not related to current tab '${currentDomain}'.`, cookie: cookie };
  }

  const safeName = String(cookie.name || "");
  const safeDomain = String(cookie.domain || "");
  const safePath = String(cookie.path || "");

  const isHostCookie = safeName.startsWith("__Host-");
  const isSecureCookie = safeName.startsWith("__Secure-") || isHostCookie;

  let domain = safeDomain.startsWith(".") ? safeDomain.slice(1) : safeDomain;
  const protocol = (cookie.secure || isSecureCookie) ? "https" : "http";

  const urlDomain = domain || currentDomain || "localhost";
  const path = isHostCookie || safePath.startsWith("/") ? safePath : `/${safePath}`;

  try {
    const url = new URL(`${protocol}://${urlDomain}${path}`);
    const getDetails = { url: url.href, name: cookie.name };
    if (storeId) getDetails.storeId = storeId;

    const existing = await chrome.cookies.get(getDetails);

    if (existing) {
      if (conflictResolution === "skip") {
        return { success: false, status: 'skipped', reason: 'Conflict (Skip)', details: `Cookie '${cookie.name}' exists.`, cookie: cookie };
      } else if (conflictResolution === "rename") {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        cookie.name = `${cookie.name}_copy_${randomSuffix}`;
      }
    }

    const parsedExp = cookie.expirationDate !== undefined ? cookie.expirationDate : cookie.expiration;
    const cookieDetails = {
      url: url.href,
      name: cookie.name,
      value: cookie.value,
      path: path,
      secure: isSecureCookie ? true : cookie.secure,
      httpOnly: cookie.httpOnly,
      expirationDate: (typeof parsedExp === 'number' && parsedExp > Date.now() / 1000) ? parsedExp : undefined,
    };

    if (cookie.sameSite && ['no_restriction', 'lax', 'strict', 'unspecified'].includes(cookie.sameSite.toLowerCase())) {
      cookieDetails.sameSite = cookie.sameSite.toLowerCase();
    }
    if (cookie.sameSite && cookie.sameSite.toLowerCase() === 'none') cookieDetails.sameSite = 'no_restriction';
    if (cookieDetails.sameSite === 'no_restriction') cookieDetails.secure = true;

    if (storeId) cookieDetails.storeId = storeId;

    if (!isHostCookie && cookie.domain) {
      cookieDetails.domain = cookie.domain.startsWith(".") ? cookie.domain : `.${cookie.domain}`;
    }

    await chrome.cookies.set(cookieDetails);
    return { success: true, status: 'success', reason: 'Imported', details: `Imported to ${url.href}`, cookie: cookie };

  } catch (error) {
    return { success: false, status: 'error', reason: 'API Error', details: error.message, cookie: cookie };
  }
}

// --- SNAPSHOT SYSTEM ---

async function saveSnapshot(name, cookies) {
  const snapshot = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
    name: name,
    timestamp: new Date().toISOString(),
    cookies: cookies,
    count: cookies.length,
    size: estimateCookiesSize(cookies)
  };
  return await cookieDB.addSnapshot(snapshot);
}

async function getSnapshots() {
  return await cookieDB.getSnapshotList();
}

async function getSnapshotDetails(id) {
  return await cookieDB.getSnapshotDetails(id);
}

async function deleteSnapshot(id) {
  await cookieDB.deleteSnapshot(id);
}

async function updateSnapshot(id, newCookies) {
  const existing = await cookieDB.getSnapshotDetails(id);
  existing.cookies = newCookies;
  existing.count = newCookies.length;
  existing.timestamp = new Date().toISOString();
  existing.size = estimateCookiesSize(newCookies);
  return await cookieDB.updateSnapshot(existing);
}

async function renameSnapshot(id, newName) {
  const existing = await cookieDB.getSnapshotDetails(id);
  existing.name = newName;
  return await cookieDB.updateSnapshot(existing);
}

// FIX: Memory safe export. Returns pre-stringified JSON.
async function exportSnapshots() {
  const snapshotsJsonString = await cookieDB.getAllSnapshotsFull();
  return snapshotsJsonString;
}

async function importSnapshotsData(jsonString) {
  let imported = [];
  try {
    const cleanJson = jsonString.trim();
    imported = JSON.parse(cleanJson);
    if (!Array.isArray(imported)) throw new Error("Invalid format");
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  let addedCount = 0;
  for (const s of imported) {
    if (s.name && Array.isArray(s.cookies)) {
      // Basic validation for cookies array
      s.cookies = s.cookies.filter(c => c && typeof c === 'object' && c.name != null && c.value != null);
      if (s.cookies.length === 0) continue; // Skip invalid snapshots completely

      s.id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      if (!s.size) s.size = estimateCookiesSize(s.cookies);
      s.count = s.cookies.length;
      await cookieDB.addSnapshot(s);
      addedCount++;
    }
  }
  return addedCount;
}

// Lightweight size estimator — avoids expensive JSON.stringify + Blob for size calculation
function estimateCookiesSize(cookies) {
  let size = 2; // [ ]
  for (const c of cookies) {
    size += 20; // JSON overhead per object (braces, commas, colons)
    if (c.name) size += c.name.length + 10;
    if (c.value) size += c.value.length + 10;
    if (c.domain) size += c.domain.length + 12;
    if (c.path) size += c.path.length + 10;
    size += 60; // booleans, sameSite, expiration, etc.
  }
  return size;
}