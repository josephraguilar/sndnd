(function () {
  function parseKV(text) {
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
      if (!m) continue;
      const key = m[1];
      const raw = m[2].trim();
      if (raw === '') continue;

      // Try JSON first (lets you do markers: [{"lat":..,"lng":..}] )
      try {
        if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
          out[key] = JSON.parse(raw);
          continue;
        }
      } catch (_) {}

      // Then coerce numbers
      out[key] = (!isNaN(raw) ? Number(raw) : raw);
    }
    return out;
  }

  function findLeafletBlocks() {
    return [
      ...document.querySelectorAll('pre code.language-leaflet'),
      ...document.querySelectorAll('pre[class*="language-leaflet"] code')
    ];
  }

  function initOneBlock(code) {
    const cfg = parseKV(code.textContent || '');

    const lat = Number(cfg.lat ?? cfg.latitude);
    const lng = Number(cfg.long ?? cfg.lng ?? cfg.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const zoom    = Number.isFinite(cfg.zoom) ? cfg.zoom : 10;
    const height  = String(cfg.height || '350px');
    const width   = String(cfg.width  || '100%');
    const marker  = String(cfg.marker ?? 'true').toLowerCase() !== 'false';
    const tiles   = String(cfg.tiles  || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const attrib  = String(cfg.attribution || '© OpenStreetMap contributors');

    // Replace the code block with a map container
    const pre = code.closest('pre') || code;
    const mapDiv = document.createElement('div');
    mapDiv.className = 'dg-leaflet';
    mapDiv.style.height = height;
    mapDiv.style.width  = width;
    pre.replaceWith(mapDiv);

    // Initialize Leaflet
    if (typeof L === 'undefined') return; // Leaflet not loaded
    const map = L.map(mapDiv, { zoomControl: true }).setView([lat, lng], zoom);
    L.tileLayer(tiles, { attribution: attrib, maxZoom: 19 }).addTo(map);

    // Optional single marker toggle
    if (marker) L.marker([lat, lng]).addTo(map);

    // Optional markers list: markers: [{"lat":..,"lng":..,"popup":"..."}]
    if (Array.isArray(cfg.markers)) {
      cfg.markers.forEach(m => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;
        const mk = L.marker([Number(m.lat), Number(m.lng)]).addTo(map);
        if (m.popup) mk.bindPopup(String(m.popup));
      });
    }
  }

  function initMaps() {
    const blocks = findLeafletBlocks();
    if (!blocks.length) return;
    blocks.forEach(initOneBlock);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMaps);
  } else {
    initMaps();
  }
})();
