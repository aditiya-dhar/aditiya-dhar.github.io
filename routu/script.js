// --- Map Setup ---

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [-75.1550, 39.9811],
  zoom: 16,
  pitch: 60,
  bearing: -20,
});

map.addControl(new maplibregl.NavigationControl());

// Approx polygon of Temple U Main Campus (lng, lat)
const campusPolygon = [
  [-75.1650, 39.9750],
  [-75.1650, 39.9845],
  [-75.1470, 39.9845],
  [-75.1470, 39.9750],
  [-75.1650, 39.9750],
];

// Map bounds (minLng, minLat) - (maxLng, maxLat)
const campusBounds = [
  [-75.1650, 39.9750],
  [-75.1470, 39.9845],
];

// Prevent map panning outside bounds
map.setMaxBounds(campusBounds);

// Point-in-polygon test (ray casting)
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-10) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Show error popup message for 10 seconds
function showErrorPopup() {
  const popup = document.getElementById('error-popup');
  popup.style.display = 'block';
  setTimeout(() => {
    popup.style.display = 'none';
  }, 10000);
}

// Markers and buildings list
const markers = [];
const classLocations = [
  {
    name: "CS101 - Engineering Hall",
    description: "Computer Science 101, Engineering Building",
    coords: [-75.1535, 39.9822],
    time: "09:00",
  },
  {
    name: "MATH202 - Science Center",
    description: "Mathematics 202, Science Center",
    coords: [-75.1570, 39.9805],
    time: "12:00",
  },
  {
    name: "HIST150 - Humanities Bldg",
    description: "History 150, Humanities Building",
    coords: [-75.1545, 39.9790],
    time: "14:00",
  },
  {
    name: "BIO111 - Life Sciences",
    description: "Biology 111, Life Sciences Building",
    coords: [-75.1510, 39.9808],
    time: "16:00",
  }
];

// Add markers to map & fill select
function addMarker(cls) {
  const marker = new maplibregl.Marker({ color: '#9E1B34' })
    .setLngLat(cls.coords)
    .setPopup(new maplibregl.Popup().setHTML(
      `<strong>${cls.name}</strong><br>${cls.description}<br>Time: ${cls.time || 'N/A'}`
    ))
    .addTo(map);
  markers.push(marker);
}

// Fill select box
function populateSelect() {
  const selector = document.getElementById('class-selector');
  selector.innerHTML = '';
  classLocations.forEach((cls, i) => {
    const option = document.createElement('option');
    option.text = `${cls.name} - ${cls.time || 'N/A'}`;
    option.value = i;
    selector.appendChild(option);
  });
}

// Initial map load
map.on('load', () => {
  classLocations.forEach(addMarker);
  populateSelect();
});

// Collapsible Add Building Manually
const addBuildingToggle = document.getElementById('add-building-toggle');
const addBuildingContent = document.getElementById('add-building-content');
addBuildingToggle.addEventListener('click', () => {
  if (addBuildingContent.style.display === 'none' || addBuildingContent.style.display === '') {
    addBuildingContent.style.display = 'block';
    addBuildingToggle.innerHTML = 'Add Building Manually &#x25B2;';
  } else {
    addBuildingContent.style.display = 'none';
    addBuildingToggle.innerHTML = 'Add Building Manually &#x25BC;';
  }
});

// Add building button event
document.getElementById('add-building-btn').addEventListener('click', () => {
  const name = document.getElementById('building-name').value.trim();
  const lat = parseFloat(document.getElementById('building-lat').value);
  const lng = parseFloat(document.getElementById('building-lng').value);

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert("Please enter valid name, latitude, and longitude.");
    return;
  }

  if (!pointInPolygon([lng, lat], campusPolygon)) {
    showErrorPopup();
    return;
  }

  const newBuilding = {
    name,
    description: "Custom building",
    coords: [lng, lat],
    time: null,
  };

  classLocations.push(newBuilding);
  addMarker(newBuilding);
  populateSelect();

  // Clear inputs
  document.getElementById('building-name').value = '';
  document.getElementById('building-lat').value = '';
  document.getElementById('building-lng').value = '';
});

// Google AI Studio API integration frontend-only

// 1. Prompt user for API key or read from localStorage
async function getApiKey() {
  let key = localStorage.getItem('google_ai_api_key');
  if (!key) {
    key = prompt("Please enter your Google AI Studio API Key:");
    if (key) {
      localStorage.setItem('google_ai_api_key', key.trim());
    }
  }
  return key;
}

// 2. Call Google AI Studio text generation endpoint
async function callGoogleAI(promptText, apiKey) {
  const url = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText';

  const body = {
    prompt: {
      text: promptText,
    },
    temperature: 0.2,
    maxOutputTokens: 512,
  };

  const response = await fetch(url + '?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].output;
}

// 3. Compose prompt to parse schedule text into JSON array
function buildAiPrompt(userInput) {
  return `
You are an assistant helping to parse a college student's class schedule at Temple University. 

Given the following schedule text, extract a JSON array of objects with these fields: 
- name: Building name or class name
- lat: latitude (decimal degrees)
- lng: longitude (decimal degrees)
- time: class time in 24-hour format (e.g. "09:00")

Use Temple University campus coordinates only (latitude between 39.9750 and 39.9845, longitude between -75.1650 and -75.1470).

Schedule text:
"""${userInput}"""

Output ONLY a JSON array with no extra text.
`;
}

// 4. Process schedule & add buildings
document.getElementById('process-route-btn').addEventListener('click', async () => {
  const userInput = document.getElementById('route-input').value.trim();
  if (!userInput) {
    alert('Please enter your class schedule.');
    return;
  }

  const btn = document.getElementById('process-route-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      alert('API key is required.');
      btn.disabled = false;
      btn.textContent = 'Process Schedule & Plan Route';
      return;
    }

    const prompt = buildAiPrompt(userInput);

    const aiResponse = await callGoogleAI(prompt, apiKey);

    let buildings;
    try {
      buildings = JSON.parse(aiResponse);
    } catch (err) {
      alert('Failed to parse AI response. Please try again.');
      console.error('AI response parsing error:', err, aiResponse);
      btn.disabled = false;
      btn.textContent = 'Process Schedule & Plan Route';
      return;
    }

    const validBuildings = buildings.filter(b => {
      if (
        typeof b.name === 'string' &&
        typeof b.lat === 'number' &&
        typeof b.lng === 'number' &&
        typeof b.time === 'string' &&
        pointInPolygon([b.lng, b.lat], campusPolygon)
      ) {
        return true;
      }
      return false;
    });

    if (validBuildings.length === 0) {
      alert('No valid buildings found inside campus bounds.');
      btn.disabled = false;
      btn.textContent = 'Process Schedule & Plan Route';
      return;
    }

    // Remove markers added after initial 4 (keep 4 base markers)
    while (markers.length > 4) {
      markers.pop().remove();
    }
    classLocations.splice(4);

    // Add new buildings & markers
    validBuildings.forEach(b => {
      const newBldg = {
        name: b.name,
        description: `Class at ${b.time}`,
        coords: [b.lng, b.lat],
        time: b.time,
      };
      classLocations.push(newBldg);
      addMarker(newBldg);
    });

    populateSelect();

    alert('Buildings added from schedule. Route planning coming soon!');

  } catch (err) {
    alert('Error processing schedule: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Process Schedule & Plan Route';
  }
});
