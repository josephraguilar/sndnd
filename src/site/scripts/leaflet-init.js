(function () {
  // --- helpers ---
  function parseKV(text) {
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
      if (!m) continue;
      const key = m[1];
      const raw = m[2].trim();
      if (raw === '') continue;

      // JSON first (e.g., markers: [{"lat":..,"lng":..}])
      try {
        if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
          out[key] = JSON.parse(raw);
          continue;
        }
      } catch (_) {}

      // number fallback
      out[key] = (!isNaN(raw) ? Number(raw) : raw);
    }
    return out;
  }

  function parseMaybeJSON(raw) {
    try {
      if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
        return JSON.parse(raw);
      }
    } catch (_) {}
    return raw;
  }

  function findLeafletBlocks() {
    return [
      ...document.querySelectorAll('pre code.language-leaflet'),
      ...document.querySelectorAll('pre[class*="language-leaflet"] code')
    ];
  }

  // --- one block ---
  function initOneBlock(code) {
    const cfg = parseKV(code.textContent || '');

    // Common options
    const zoom    = Number.isFinite(cfg.zoom) ? cfg.zoom : 10;
    const height  = String(cfg.height || '350px');
    const width   = String(cfg.width  || '100%');
    const tiles   = String(cfg.tiles  || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    const attrib  = String(cfg.attribution || '© OpenStreetMap contributors');
    const marker  = String(cfg.marker ?? 'true').toLowerCase() !== 'false';

    // Image overlay options
    const image      = cfg.image ? String(cfg.image) : null;
    const imageW     = cfg.imageWidth  ? Number(cfg.imageWidth)  : null; // px
    const imageH     = cfg.imageHeight ? Number(cfg.imageHeight) : null; // px
    const simpleB    = cfg.simpleBounds ? parseMaybeJSON(String(cfg.simpleBounds)) : null; // [[y1,x1],[y2,x2]] in px
    const geoBounds  = cfg.bounds ? parseMaybeJSON(String(cfg.bounds)) : null;            // [[latSW,lngSW],[latNE,lngNE]]
    const imgOpacity = cfg.imageOpacity != null ? Number(cfg.imageOpacity) : 1;

    // Replace the code block with a map container
    const pre = code.closest('pre') || code;
    const mapDiv = document.createElement('div');
    mapDiv.className = 'dg-leaflet';
    mapDiv.style.height = height;
    mapDiv.style.width  = width;
    pre.replaceWith(mapDiv);

    if (typeof L === 'undefined') return; // Leaflet not loaded yet

    // MODE A: Static image (pixels) using CRS.Simple
    if (image && (!Array.isArray(geoBounds))) {
      const boundsPx = Array.isArray(simpleB)
        ? simpleB
        : [[0,0],[imageH || 1000, imageW || 1000]];

      const map = L.map(mapDiv, { crs: L.CRS.Simple, zoomControl: true });
      const bounds = L.latLngBounds(
        [ [boundsPx[0][0], boundsPx[0][1]], [boundsPx[1][0], boundsPx[1][1]] ]
      );
      L.imageOverlay(image, bounds, { opacity: imgOpacity }).addTo(map);
      map.fitBounds(bounds);
      return; // (Markers would need pixel→latlng conversion.)
    }

    // MODE B: Normal geo map (tiles) + optional geo-referenced overlay
    const lat = Number(cfg.lat ?? cfg.latitude);
    const lng = Number(cfg.long ?? cfg.lng ?? cfg.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const map = L.map(mapDiv, { zoomControl: true }).setView([lat, lng], zoom);
    L.tileLayer(tiles, { attribution: attrib, maxZoom: 19 }).addTo(map);

    if (image && Array.isArray(geoBounds)) {
      const b = L.latLngBounds(geoBounds);
      L.imageOverlay(image, b, { opacity: imgOpacity }).addTo(map);
      // If you want the overlay to control the view:
      // map.fitBounds(b);
    }

    if (marker) L.marker([lat, lng]).addTo(map);

    if (Array.isArray(cfg.markers)) {
      cfg.markers.forEach(m => {
        if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return;
        const mk = L.marker([Number(m.lat), Number(m.lng)]).addTo(map);
        if (m.popup) mk.bindPopup(String(m.popup));
      });
    }
  }

  // --- bootstrap ---
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
