const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [-75.1550, 39.9811],
  zoom: 16,
  pitch: 60,
  bearing: -20,
});

map.addControl(new maplibregl.NavigationControl());

const classLocations = [
  {
    name: "CS101 - Engineering Hall",
    description: "Computer Science 101, Engineering Building",
    coords: [-75.1535, 39.9822],
  },
  {
    name: "MATH202 - Science Center",
    description: "Mathematics 202, Science Center",
    coords: [-75.1570, 39.9805],
  },
  {
    name: "HIST150 - Humanities Bldg",
    description: "History 150, Humanities Building",
    coords: [-75.1545, 39.9790],
  },
  {
    name: "BIO111 - Life Sciences",
    description: "Biology 111, Life Sciences Building",
    coords: [-75.1510, 39.9808],
  }
];

const markers = [];
let routeLayerId = null;

map.on('load', () => {
  // Add markers
  classLocations.forEach(cls => {
    const marker = new maplibregl.Marker({ color: '#9E1B34' })
      .setLngLat(cls.coords)
      .setPopup(new maplibregl.Popup().setHTML(`<strong>${cls.name}</strong><br>${cls.description}`))
      .addTo(map);
    markers.push(marker);
  });
});

document.getElementById('route-btn').addEventListener('click', () => {
  const selector = document.getElementById('class-selector');
  const index = selector.value;
  if (index === "") return;

  const cls = classLocations[index];
  const start = [-75.1550, 39.9811];
  const end = cls.coords;

  // Remove old route if exists
  if (routeLayerId) {
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeLayerId)) map.removeSource(routeLayerId);
  }

  const url = `https://router.project-osrm.org/route/v1/walking/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data.routes || data.routes.length === 0) {
        alert("No route found.");
        return;
      }
      const route = data.routes[0].geometry;

      routeLayerId = `route-${Date.now()}`;
      map.addSource(routeLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route,
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
          'line-width': 5,
        },
      });

      // Optionally zoom to route bounds
      const coordinates = route.coordinates;
      const bounds = coordinates.reduce(function(bounds, coord) {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      map.fitBounds(bounds, { padding: 50 });
    })
    .catch(err => {
      console.error("Routing error:", err);
      alert("Unable to calculate route.");
    });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('visible');
});

document.getElementById('add-building-btn').addEventListener('click', () => {
  const name = document.getElementById('building-name').value.trim();
  const lat = parseFloat(document.getElementById('building-lat').value);
  const lng = parseFloat(document.getElementById('building-lng').value);

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert("Please enter valid name, latitude, and longitude.");
    return;
  }

  const coords = [lng, lat];
  const cls = { name, description: "Custom building", coords };
  classLocations.push(cls);

  const option = document.createElement('option');
  option.text = name;
  option.value = classLocations.length - 1;
  document.getElementById('class-selector').appendChild(option);

  const marker = new maplibregl.Marker({ color: '#9E1B34' })
    .setLngLat(coords)
    .setPopup(new maplibregl.Popup().setHTML(`<strong>${name}</strong><br>Custom Location`))
    .addTo(map);
  markers.push(marker);
});

// ====== AUTH0 INTEGRATION ======
let auth0 = null;
const config = {
  domain: "YOUR_AUTH0_DOMAIN",
  clientId: "YOUR_AUTH0_CLIENT_ID",
  redirect_uri: window.location.origin
};

async function initAuth0() {
  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    cacheLocation: "localstorage",
    useRefreshTokens: true,
  });

  // Handle redirect back from Auth0
  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0.isAuthenticated();

  const authBtn = document.getElementById("auth-btn");

  if (isAuthenticated) {
    const user = await auth0.getUser();
    authBtn.textContent = "Log Out";
    authBtn.onclick = async (e) => {
      e.preventDefault();
      await auth0.logout({ returnTo: window.location.origin });
    };
  } else {
    authBtn.textContent = "Sign In / Sign Up";
    authBtn.onclick = (e) => {
      e.preventDefault();
      auth0.loginWithRedirect();
    };
  }
}

window.onload = initAuth0;
