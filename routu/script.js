const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-75.1550, 39.9811],
    zoom: 16,
    pitch: 60,
    bearing: -20,
});

map.addControl(new maplibregl.NavigationControl());

// Define Class Locations
const classLocations = [
    { name: "CS101 - Engineering Hall", coords: [-75.1535, 39.9822] },
    { name: "MATH202 - Science Center", coords: [-75.1570, 39.9805] },
    { name: "HIST150 - Humanities Bldg", coords: [-75.1545, 39.9790] },
    { name: "BIO111 - Life Sciences", coords: [-75.1510, 39.9808] },
];

const markers = [];
let routeLayerId = null;

map.on('load', () => {
    classLocations.forEach(cls => {
        const marker = new maplibregl.Marker({ color: '#9E1B34' })
            .setLngLat(cls.coords)
            .setPopup(new maplibregl.Popup().setHTML(`<strong>${cls.name}</strong><br>${cls.description}`))
            .addTo(map);
        markers.push(marker);
    });
});

// Plan Route Button
document.getElementById('route-btn').addEventListener('click', () => {
    const selector = document.getElementById('class-selector');
    const index = selector.value;
    if (index === "") return;

    const cls = classLocations[index];
    const start = [-75.1550, 39.9811];
    const end = cls.coords;

    // Create a new route if it doesn't exist
    if (routeLayerId) {
        map.removeLayer(routeLayerId);
        map.removeSource(routeLayerId);
    }

    const route = new maplibregl.GeoJSONSource({
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [start, end]
            }
        }
    });

    map.addSource(routeLayerId = 'route', route);
    map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: {
            'line-color': '#9E1B34',
            'line-width': 4
        }
    });

    map.fitBounds([start, end], { padding: 50 });
});

// Add Custom Building Button
document.getElementById('add-building-btn').addEventListener('click', () => {
    const name = document.getElementById('building-name').value.trim();
    const lat = parseFloat(document.getElementById('building-lat').value);
    const lng = parseFloat(document.getElementById('building-lng').value);

    if (!name || isNaN(lat) || isNaN(lng)) {
        alert("Please enter valid name, latitude, and longitude.");
        return;
    }

    const newBuilding = { name, coords: [lng, lat] };

    // Check if the building is on campus (or valid)
    if (!isBuildingOnCampus(lat, lng)) {
        document.getElementById('error-popup').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('error-popup').classList.add('hidden');
        }, 3000);
        return;
    }

    const marker = new maplibregl.Marker({ color: '#007BFF' })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>${name}</strong>`))
        .addTo(map);

    classLocations.push(newBuilding);

    // Update Class Selector Dropdown
    const option = document.createElement('option');
    option.value = classLocations.length - 1;
    option.textContent = name;
    document.getElementById('class-selector').appendChild(option);
});

// Function to check if the building is on campus
function isBuildingOnCampus(lat, lng) {
    // Define campus boundary
    const campusBounds = [[-75.162, 39.978], [-75.150, 39.985]]; // Example
    return lat >= campusBounds[0][1] && lat <= campusBounds[1][1] && 
           lng >= campusBounds[0][0] && lng <= campusBounds[1][0];
}
