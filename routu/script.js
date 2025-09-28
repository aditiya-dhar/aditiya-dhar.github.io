// === Initialize Leaflet Map ===
const map = L.map('map').setView([39.9811, -75.1550], 16); // Center on Temple University Main Campus

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Add the custom .osm file (we'll need to load the file as GeoJSON here)
function loadOSMData() {
  fetch('map.osm') // Assuming your `map.osm` file is in the same directory
    .then(response => response.text())
    .then(xml => {
      const geojson = osm2geojson(new DOMParser().parseFromString(xml, 'application/xml'));
      L.geoJSON(geojson).addTo(map); // Display the converted GeoJSON on the map
    })
    .catch(err => {
      console.error('Error loading OSM data: ', err);
      showErrorPopup('Error loading OSM data.');
    });
}

// === Load OSM Data ===
loadOSMData();

// === Plan Route Functionality ===
let plannedRoute = [];
let routeLayerId = null;

// Process AI-generated classes (from the user input)
document.getElementById('ai-process-btn').addEventListener('click', async () => {
  const input = document.getElementById('class-input').value.trim();
  if (!input) return;

  const apiKey = "YOUR_GOOGLE_API_KEY"; // Replace with your secure API key

  try {
    const output = await callGoogleAI(input, apiKey);
    const lines = output.split('\n').filter(Boolean);

    lines.forEach(line => {
      const [name, latStr, lngStr] = line.split(',').map(s => s.trim());
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (!name || isNaN(lat) || isNaN(lng)) return;

      const cls = { name, description: "Generated via AI", coords: [lng, lat] };
      classLocations.push(cls);
      plannedRoute.push(cls); // Push into planned route

      const option = document.createElement('option');
      option.text = name;
      option.value = classLocations.length - 1;
      document.getElementById('class-selector').appendChild(option);

      const marker = new L.Marker([lat, lng]).bindPopup(`<strong>${name}</strong><br>Generated`)
        .addTo(map);
      markers.push(marker);
    });
  } catch (err) {
    showErrorPopup("Failed to generate buildings.");
    console.error(err);
  }
});

// Plan the route (generate route between the buildings)
document.getElementById('route-btn').addEventListener('click', () => {
  if (plannedRoute.length < 2) {
    showErrorPopup("Need at least two locations to plan a route.");
    return;
  }

  if (routeLayerId) {
    map.removeLayer(routeLayerId); // Remove previous route if it exists
  }

  routeLayerId = `route-${Date.now()}`;
  const routeCoords = plannedRoute.map(loc => loc.coords);

  const routeGeoJson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: routeCoords,
    },
  };

  // Display the route as a GeoJSON layer
  L.geoJSON(routeGeoJson, {
    style: {
      color: '#9E1B34',
      weight: 4,
      opacity: 0.7,
    },
  }).addTo(map);
});

// === Error Popup ===
function showErrorPopup(message) {
  const popup = document.getElementById('error-popup');
  popup.textContent = message;
  popup.classList.remove('hidden');
  setTimeout(() => popup.classList.add('hidden'), 10000);
}
