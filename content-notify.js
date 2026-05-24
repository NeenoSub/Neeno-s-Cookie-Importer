// Content script for Auto-Delete toast notifications
// Listens for messages from background.js and shows in-page toast
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'ad-toast') return;

    // Remove any existing toast
    const old = document.getElementById('__neeno_ad_toast');
    if (old) old.remove();

    const iconUrl = chrome.runtime.getURL('icons/icon32.png');

    const toast = document.createElement('div');
    toast.id = '__neeno_ad_toast';

    // Build inner structure safely using DOM APIs (no innerHTML with interpolation)
    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex;align-items:center;gap:12px;';

    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.width = 28;
    icon.height = 28;
    icon.style.cssText = 'border-radius:6px; flex-shrink:0;';

    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex:1; min-width:0;';

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:13px;font-weight:600;margin-bottom:2px;';
    titleEl.textContent = msg.title;

    const messageEl = document.createElement('div');
    messageEl.style.cssText = 'font-size:12px;opacity:0.88;';
    messageEl.textContent = msg.message;

    textContainer.appendChild(titleEl);
    textContainer.appendChild(messageEl);

    const timestamp = document.createElement('div');
    timestamp.style.cssText = 'font-size:10px;opacity:0.5;align-self:flex-start;white-space:nowrap;';
    timestamp.textContent = 'just now';

    inner.appendChild(icon);
    inner.appendChild(textContainer);
    inner.appendChild(timestamp);
    toast.appendChild(inner);

    toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:2147483647;
        background:linear-gradient(135deg, rgba(5,150,105,0.95), rgba(4,120,87,0.95));
        color:#fff;
        padding:14px 20px; border-radius:14px;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        box-shadow:0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.08) inset;
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
        opacity:0; transform:translateY(16px) scale(0.96);
        transition:opacity 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1);
        min-width:280px; max-width:380px;
        pointer-events:none;
        border:1px solid rgba(255,255,255,0.1);
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0) scale(1)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(16px) scale(0.96)';
        setTimeout(() => toast.remove(), 350);
    }, 4000);
});
