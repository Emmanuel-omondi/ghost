let map = null;
let markers = [];
let polyline = null;

function initMap() {
    if (!map) {
        map = L.map('map').setView([-1.2921, 36.8219], 13); // Nairobi default
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    loadLocations();
}

async function loadLocations() {
    if (!map) return;
    try {
        const start = document.getElementById('location-start')?.value;
        const end   = document.getElementById('location-end')?.value;
        const params = new URLSearchParams({ type: 'location' });
        if (start) params.set('start', start);
        if (end)   params.set('end', end);

        const res  = await fetch(`api/data.php?${params}`);
        const data = await res.json();
        const locations = data.locations ?? [];

        clearMap();

        if (!locations.length) {
            document.getElementById('location-timeline').innerHTML =
                '<div class="loading-card">No location data for this period.</div>';
            return;
        }

        const latLngs = [];

        locations.forEach((loc, i) => {
            const ll = [parseFloat(loc.lat), parseFloat(loc.lng)];
            latLngs.push(ll);

            const isLatest = i === locations.length - 1;
            const icon = L.divIcon({
                className: '',
                html: `<div style="
                    width:${isLatest ? 16 : 10}px;
                    height:${isLatest ? 16 : 10}px;
                    background:${isLatest ? '#7c5cfc' : '#CC0000'};
                    border:2px solid #fff;
                    border-radius:50%;
                    box-shadow:0 0 ${isLatest ? 8 : 4}px ${isLatest ? 'rgba(124,92,252,0.8)' : 'rgba(204,0,0,0.5)'}
                "></div>`,
                iconSize: [isLatest ? 16 : 10, isLatest ? 16 : 10],
                iconAnchor: [isLatest ? 8 : 5, isLatest ? 8 : 5]
            });

            const marker = L.marker(ll, { icon })
                .addTo(map)
                .bindPopup(`
                    <b>${loc.datetime ?? new Date(parseInt(loc.timestamp)).toLocaleString()}</b><br>
                    ${parseFloat(loc.lat).toFixed(6)}, ${parseFloat(loc.lng).toFixed(6)}<br>
                    ${loc.accuracy ? `Accuracy: ±${parseFloat(loc.accuracy).toFixed(0)}m` : ''}
                `);
            markers.push(marker);
        });

        // Draw path line
        polyline = L.polyline(latLngs, { color: '#7c5cfc', weight: 2, opacity: 0.6 }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

        // Timeline list
        const timeline = document.getElementById('location-timeline');
        timeline.innerHTML = `
            <div style="margin-top:1rem;display:grid;gap:0.5rem;max-height:200px;overflow-y:auto">
                ${[...locations].reverse().map(loc => `
                    <div class="contact-item" style="cursor:pointer;padding:0.75rem 1rem"
                         onclick="map.setView([${loc.lat},${loc.lng}],16)">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:0.85rem">${loc.datetime ?? ''}</span>
                            <span style="font-size:0.75rem;color:var(--muted)">
                                ${parseFloat(loc.lat).toFixed(5)}, ${parseFloat(loc.lng).toFixed(5)}
                            </span>
                        </div>
                    </div>`).join('')}
            </div>`;

    } catch (e) {
        console.error('Map load failed:', e);
        document.getElementById('location-timeline').innerHTML =
            '<div class="loading-card">Failed to load location data.</div>';
    }
}

function clearMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (polyline) { map.removeLayer(polyline); polyline = null; }
    const tl = document.getElementById('location-timeline');
    if (tl) tl.innerHTML = '';
}

function filterLocations() { loadLocations(); }
