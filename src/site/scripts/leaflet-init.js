(function () {
  // Parse simple key: value lines from a code fence
  function parseKV(text) {
    const out = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^([\w-]+)\s*:\s*(.+)$/);
      if (!m) continue;
      const key = m[1];
      const raw = m[2].trim();
      // coerce numbers when possible
      if (!isNaN(raw) && raw !== '') out[key] = Number(raw);
      else out[key] = raw;
    }
    return out;
  }

  function initMaps() {
    // Find ```leaflet fenced blocks rendered by 11ty as <pre><code class="language-leaflet">
    document.querySelectorAll('pre code.language-leaflet').forEach(code => {
      const cfg = parseKV(code.textContent);

      // Accept lat/long/lng/zoom, height/width, marker toggle
      const lat = Number(cfg.lat ?? cfg.latitude);
      const lng = Number(cfg.long ?? cfg.lng ?? cfg.longitude);
      const zoom = Number.isFinite(cfg.zoom) ? cfg.zoom : 10;
      const height = String(cfg.height || '350px');
      const width  = String(cfg.width  || '100%');
      const showMarker = String(cfg.marker || 'true').toLowerCase() !== 'false';

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      // Replace the code block with a map container
      const pre = code.closest('pre');
      const mapDiv = document.createElement('div');
      mapDiv.className = 'dg-leaflet';
      mapDiv.style.height = height;
      mapDiv.style.width  = width;
      pre.replaceWith(mapDiv);

      // Initialize Leaflet
      const map = L.map(mapDiv, { zoomControl: true }).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (showMarker) L.marker([lat, lng]).addTo(map);
      // If you ever need multiple markers, you could accept a CSV string and split it here.
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMaps);
  } else {
    initMaps();
  }
})();
