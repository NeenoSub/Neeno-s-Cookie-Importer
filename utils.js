function getRootDomain(hostname) {
    if (!hostname) return '';
    if (/^[\d.]+$/.test(hostname) || hostname === 'localhost') return hostname;

    const parts = hostname.split('.');
    if (parts.length < 2) return hostname;

    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];

    const commonSLDs = [
        'co', 'com', 'org', 'net', 'edu', 'gov', 'mil',
        'ac', 'go', 'ne', 'or', 'gen', 'in', 'sch',
        'id', 'io', 'us', 'uk', 'au', 'eu', 'ca', 'nz', // Expanded list
        'jp', 'kr', 'cn', 'br', 'ru', 'fr', 'de', 'nl', 'it', 'es', 'se', 'no'
    ];

    if (last.length === 2 && commonSLDs.includes(secondLast)) {
        return parts.length >= 3 ? parts.slice(-3).join('.') : hostname;
    }

    return parts.slice(-2).join('.');
}
