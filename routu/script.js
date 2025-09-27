// ... existing map and boundary setup

let plannedRoute = [];

document.getElementById('ai-process-btn').addEventListener('click', async () => {
  const input = document.getElementById('class-input').value.trim();
  if (!input) return;

  const apiKey = "YOUR_GOOGLE_API_KEY"; // Replace with secure value if server-side

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

      const marker = new maplibregl.Marker({ color: '#9E1B34' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>${name}</strong><br>Generated`))
        .addTo(map);
      markers.push(marker);
    });
  } catch (err) {
    showErrorPopup("Failed to generate buildings.");
    console.error(err);
  }
});

// === Plan Route from all locations ===
document.getElementById('route-btn').addEventListener('click', () => {
  if (plannedRoute.length < 2) {
    showErrorPopup("Need at least two locations to plan a route.");
    return;
  }

  if (routeLayerId) {
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeLayerId)) map.removeSource(routeLayerId);
  }

  routeLayerId = `route-${Date.now()}`;
  const routeCoords = plannedRoute.map(loc => loc.coords);

  map.addSource(routeLayerId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routeCoords,
      },
    },
  });

  map.addLayer({
    id: routeLayerId,
    type: 'line',
    source: routeLayerId,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': '#9E1B34',
      'line-width': 0.25,
    },
  });
});
