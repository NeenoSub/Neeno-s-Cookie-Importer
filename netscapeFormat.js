function parseNetscapeCookies(cookieString) {
  const cookies = [];
  const seenCookies = new Set();
  const lines = cookieString.split("\n");
  let duplicateCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line.length) continue;

    const isHttpOnly = line.startsWith("#HttpOnly_");
    if (isHttpOnly) {
      line = line.substring(10);
    } else if (line.startsWith("#")) {
      continue;
    }

    try {
      const fields = line.split("\t");
      if (fields.length < 6) {
        continue;
      }

      const domain = fields[0];
      const includeSubdomains = fields[1].toLowerCase() === "true";
      const path = fields[2];
      const secure = fields[3].toLowerCase() === "true";
      const expiration = parseInt(fields[4], 10);
      const name = fields[5];
      const value = fields[6] || "";

      const cookieKey = `${domain}|${path}|${name}`;

      if (seenCookies.has(cookieKey)) {
        duplicateCount++;
        continue;
      }
      seenCookies.add(cookieKey);

      cookies.push({
        domain: domain,
        includeSubdomains: includeSubdomains,
        path: path,
        secure: secure,
        expiration: expiration,
        name: name,
        value: value,
        httpOnly: isHttpOnly,
        sameSite: "unspecified"
      });
    } catch (error) {
      // Silently skip malformed lines
    }
  }
  return { cookies, duplicateCount };
}