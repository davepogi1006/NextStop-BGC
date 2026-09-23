const map = L.map("map").setView([14.568, 121.042], 13);
const isAdmin = document.body.dataset.role === "admin";

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap contributors" }
).addTo(map);

// Stop coordinates are based on public OpenStreetMap place data.
const stops = [
    { name: "SM North EDSA", lat: 14.657093, lng: 121.031318, area: "Quezon City" },
    { name: "North Avenue / EDSA", lat: 14.653200, lng: 121.032100, area: "Quezon City" },
    { name: "Ayala MRT / EDSA", lat: 14.549198, lng: 121.027902, area: "Makati" },
    { name: "Guadalupe", lat: 14.566600, lng: 121.046200, area: "Makati" },
    { name: "Market! Market!", lat: 14.548873, lng: 121.056361, area: "BGC" },
    { name: "High Street", lat: 14.550800, lng: 121.054200, area: "BGC" },
    { name: "The Fort", lat: 14.552000, lng: 121.050500, area: "BGC" },
    { name: "Globe Tower", lat: 14.554500, lng: 121.051500, area: "BGC" },
    { name: "32nd Street", lat: 14.553500, lng: 121.056000, area: "BGC" },
    { name: "Venice Grand Canal", lat: 14.533742, lng: 121.051685, area: "McKinley Hill" }
];

const stopByName = name => stops.find(stop => stop.name === name);
const point = name => {
    const stop = stopByName(name);
    return [stop.lat, stop.lng];
};

const routeDefinitions = [
    {
        id: "sm-north-bgc",
        name: "SM North EDSA - BGC",
        code: "SMN-BGC",
        color: "#2f8cff",
        stops: ["SM North EDSA", "North Avenue / EDSA", "Ayala MRT / EDSA", "Market! Market!"],
        path: [
            point("SM North EDSA"),
            [14.6410, 121.0330],
            [14.6200, 121.0340],
            [14.5960, 121.0330],
            [14.5700, 121.0310],
            point("Ayala MRT / EDSA"),
            [14.5480, 121.0340],
            [14.5465, 121.0430],
            point("Market! Market!")
        ],
        signals: [[14.6200, 121.0340], [14.5700, 121.0310], [14.5480, 121.0340]]
    },
    {
        id: "ayala-bgc",
        name: "Ayala - BGC",
        code: "AYL-BGC",
        color: "#19bf73",
        stops: ["Ayala MRT / EDSA", "Market! Market!", "High Street", "Globe Tower"],
        path: [
            point("Ayala MRT / EDSA"),
            [14.5485, 121.0315],
            [14.5480, 121.0380],
            [14.5475, 121.0460],
            point("Market! Market!"),
            point("High Street"),
            point("Globe Tower")
        ],
        signals: [[14.5485, 121.0315], [14.5475, 121.0460]]
    },
    {
        id: "guadalupe-bgc",
        name: "Guadalupe - BGC",
        code: "GDL-BGC",
        color: "#ff812d",
        stops: ["Guadalupe", "The Fort", "32nd Street", "Market! Market!"],
        path: [
            point("Guadalupe"),
            [14.5620, 121.0470],
            [14.5570, 121.0475],
            point("The Fort"),
            point("32nd Street"),
            point("Market! Market!")
        ],
        signals: [[14.5620, 121.0470], [14.5570, 121.0475]]
    },
    {
        id: "bgc-loop",
        name: "BGC Loop",
        code: "BGC-LOOP",
        color: "#8b35b7",
        stops: ["Market! Market!", "High Street", "The Fort", "Globe Tower", "32nd Street"],
        path: [
            point("Market! Market!"),
            point("High Street"),
            point("The Fort"),
            point("Globe Tower"),
            point("32nd Street"),
            point("Market! Market!")
        ],
        signals: [[14.5508, 121.0542], [14.5535, 121.0560]]
    },
    {
        id: "venice-bgc",
        name: "Venice - BGC",
        code: "VEN-BGC",
        color: "#ef5964",
        stops: ["Venice Grand Canal", "The Fort", "Market! Market!"],
        path: [
            point("Venice Grand Canal"),
            [14.5360, 121.0505],
            [14.5420, 121.0490],
            point("The Fort"),
            point("Market! Market!")
        ],
        signals: [[14.5360, 121.0505], [14.5420, 121.0490]]
    }
];

const allRoutePoints = routeDefinitions.flatMap(route => route.path);
const networkBounds = L.latLngBounds(allRoutePoints);
map.fitBounds(networkBounds, { padding: [25, 25] });

stops.forEach((stop, index) => {
    const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: 5,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2c9d8a",
        fillOpacity: 1
    }).addTo(map);

    marker.bindPopup(`<b>🚏 ${stop.name}</b><br>${stop.area}<br>Stop #${index + 1}`);
});

routeDefinitions.forEach(route => {
    route.line = L.polyline(route.path, {
        color: route.color,
        weight: 4,
        opacity: 0.7
    }).addTo(map);

    route.signals.forEach(signal => {
        L.circleMarker(signal, {
            radius: 4,
            color: "#ffffff",
            weight: 2,
            fillColor: "#e24c58",
            fillOpacity: 1
        }).addTo(map).bindPopup("Traffic signal - bus may pause here");
    });
});

async function loadRoadGeometry(route) {
    const coordinates = route.path.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        const roadPath = result.routes?.[0]?.geometry?.coordinates;

        if (roadPath?.length) {
            route.path = roadPath.map(([lng, lat]) => [lat, lng]);
            route.line.setLatLngs(route.path);
        }
    } catch (error) {
        // Keep the local route waypoints when the public router is unavailable.
    }
}

const fromLocationInput = document.getElementById("from-location");
const toLocationInput = document.getElementById("to-location");
const stopSuggestions = document.getElementById("stop-suggestions");
const tripStatus = document.getElementById("trip-status");
const routeList = document.getElementById("route-list");
const routeCount = document.getElementById("route-count");
const tripDetails = document.getElementById("trip-details");
const busEta = document.getElementById("bus-eta");
const nearestStop = document.getElementById("nearest-stop");
const passingStopList = document.getElementById("passing-stop-list");
const rideActionButton = document.getElementById("ride-action-button");
const findButton = document.querySelector(".find-button");
let selectedStartIndex = 0;
let selectedDestinationIndex = 1;
let selectedRoute = null;
let rideState = "waiting";
let rideArrivalTimer = null;
let routeSearchRunning = false;

const routeCatalog = routeDefinitions.map(route => ({
    id: route.id,
    name: route.name,
    code: route.code,
    from: route.stops[0],
    to: route.stops[route.stops.length - 1],
    stops: route.stops,
    eta: route.id === "sm-north-bgc" ? "25 min" : "4 min",
    every: "Every 10 min",
    color: route.color,
    status: "ON TIME"
}));

stops.forEach(stop => stopSuggestions.appendChild(new Option(stop.name)));

fromLocationInput.value = stops[selectedStartIndex].name;
toLocationInput.value = stops[selectedDestinationIndex].name;

function renderRoutes(routes) {
    routeList.innerHTML = "";
    routeCount.textContent = `${routes.length} found`;

    routes.forEach((routeItem, index) => {
        const card = document.createElement("article");
        card.className = `route-card${index === 0 ? " selected" : ""}`;
        card.innerHTML = `
            <div class="route-card-top">
                <strong><i class="status-dot" style="background: ${routeItem.color}"></i> ${routeItem.name} <small>${routeItem.code}</small></strong>
                <span class="route-badge">${routeItem.status}</span>
            </div>
            <div class="route-card-meta"><span>${routeItem.from} → ${routeItem.to}</span><strong>${routeItem.eta}</strong></div>
            <div class="route-card-meta"><span>ETA ${routeItem.eta}</span><span class="route-line" style="background: ${routeItem.color}"></span><span>${routeItem.every}</span></div>
        `;
        card.addEventListener("click", () => selectRoute(routeItem, card));
        routeList.appendChild(card);
    });
}

function selectRoute(routeItem, card) {
    fromLocationInput.value = routeItem.from;
    toLocationInput.value = routeItem.to;
    routeList.querySelectorAll(".route-card").forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    selectedRoute = routeDefinitions.find(route => route.id === routeItem.id) || null;
    highlightRoute(selectedRoute);
    updateTrip(routeItem.from, routeItem.to);
    zoomToRoute(selectedRoute);
}

function highlightRoute(route) {
    routeDefinitions.forEach(candidate => {
        candidate.line.setStyle({
            weight: candidate === route ? 7 : 3,
            opacity: candidate === route ? 1 : 0.25
        });
    });

    if (route?.line) {
        route.line.bringToFront();
    }
}

function zoomToRoute(route) {
    if (route?.line) {
        map.fitBounds(route.line.getBounds(), { padding: [35, 35], maxZoom: 15 });
    }
}

function distanceBetween(first, second) {
    const latDistance = (first.lat - second.lat) * 111;
    const lngDistance = (first.lng - second.lng) * 111 * Math.cos(first.lat * Math.PI / 180);
    return Math.sqrt(latDistance ** 2 + lngDistance ** 2);
}

function nearestMappedStop(latitude, longitude) {
    const location = { lat: latitude, lng: longitude };
    return stops.reduce((nearest, stop) => {
        return distanceBetween(location, stop) < distanceBetween(location, nearest) ? stop : nearest;
    });
}

function resolveStop(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
        return null;
    }

    return stops.find(stop => stop.name.toLowerCase() === query) ||
        stops.find(stop => stop.name.toLowerCase().includes(query) || query.includes(stop.name.toLowerCase()));
}

async function geocodeLocation(value) {
    const localStop = resolveStop(value);
    if (localStop) {
        return localStop;
    }

    try {
        const params = new URLSearchParams({ format: "jsonv2", limit: "1", q: `${value}, Metro Manila` });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: controller.signal });
        clearTimeout(timeout);
        const results = await response.json();
        if (results[0]) {
            return nearestMappedStop(Number(results[0].lat), Number(results[0].lon));
        }
    } catch (error) {
        return null;
    }

    return null;
}

async function findRoutes() {
    if (routeSearchRunning) {
        return;
    }

    routeSearchRunning = true;
    findButton.disabled = true;
    findButton.textContent = "Finding...";
    tripStatus.textContent = "Finding the nearest stops...";
    tripStatus.className = "trip-status is-active";

    try {
        const startStop = await geocodeLocation(fromLocationInput.value);
        const destinationStop = await geocodeLocation(toLocationInput.value);

        if (!startStop || !destinationStop) {
            tripStatus.textContent = "Choose a mapped stop or use your location first.";
            tripStatus.className = "trip-status";
            return;
        }

        fromLocationInput.value = startStop.name;
        toLocationInput.value = destinationStop.name;
        const startName = startStop.name;
        const destinationName = destinationStop.name;
        const routes = routeCatalog.filter(route => route.from === startName || route.to === destinationName || route.stops?.includes(startName));

        renderRoutes(routes.length ? routes : routeCatalog);
        selectedRoute = routeDefinitions.find(route => route.stops.includes(startName) && route.stops.includes(destinationName)) || null;
        highlightRoute(selectedRoute);
        updateTrip(startName, destinationName);
        zoomToRoute(selectedRoute);
    } finally {
        routeSearchRunning = false;
        findButton.disabled = false;
        findButton.textContent = "Find Routes";
    }
}

function useMyLocation() {
    if (!navigator.geolocation) {
        tripStatus.textContent = "Location services are not available in this browser.";
        return;
    }

    tripStatus.textContent = "Finding your nearest bus stop...";
    navigator.geolocation.getCurrentPosition(position => {
        const stop = nearestMappedStop(position.coords.latitude, position.coords.longitude);
        fromLocationInput.value = stop.name;
        tripStatus.textContent = `Nearest stop found: ${stop.name}.`;
        tripStatus.className = "trip-status is-active";
    }, () => {
        tripStatus.textContent = "Location access was unavailable. Type your starting place instead.";
        tripStatus.className = "trip-status";
    });
}

renderRoutes(routeCatalog);

const busIcon = L.divIcon({
    html: `<div style="font-size: 25px; text-align: center;">🚌</div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const fleet = routeDefinitions.map((route, index) => {
    const marker = L.marker(route.path[0], { icon: busIcon }).addTo(map);
    marker.bindPopup(`<b>🚌 ${route.code}-${index + 1}</b><br>${route.name}<br>Stops at mapped stops and signals`);
    return { route, marker, position: 0, waitTicks: index % 2 };
});

routeDefinitions.forEach(loadRoadGeometry);

let simulationRunning = false;
let simulationTimer = null;
let speed = 1000;

function startSimulation() {
    if (simulationRunning) {
        return;
    }

    simulationRunning = true;
    tripStatus.textContent = "Buses are moving along their routes.";
    tripStatus.className = "trip-status is-active";
    simulationTimer = setInterval(moveFleet, speed);
}

function pauseSimulation() {
    simulationRunning = false;
    clearInterval(simulationTimer);

    if (!tripStatus.classList.contains("is-complete")) {
        tripStatus.textContent = "Fleet simulation paused.";
        tripStatus.className = "trip-status";
    }
}

function resetSimulation() {
    pauseSimulation();
    fleet.forEach(bus => {
        bus.position = 0;
        bus.waitTicks = 0;
        bus.marker.setLatLng(bus.route.path[0]);
    });
    tripStatus.textContent = "Fleet reset to route terminals.";
    tripStatus.className = "trip-status";
}

function isNear(first, second) {
    return Math.abs(first[0] - second[0]) < 0.0008 && Math.abs(first[1] - second[1]) < 0.0008;
}

function moveFleet() {
    fleet.forEach(bus => {
        if (bus.waitTicks > 0) {
            bus.waitTicks -= 1;
            return;
        }

        bus.position = (bus.position + 1) % bus.route.path.length;
        const nextPoint = bus.route.path[bus.position];
        bus.marker.setLatLng(nextPoint);

        const atStop = bus.route.stops.some(stopName => isNear(nextPoint, point(stopName)));
        const atSignal = bus.route.signals.some(signal => isNear(nextPoint, signal));
        if (atStop) {
            bus.waitTicks = 2;
        } else if (atSignal) {
            bus.waitTicks = 1;
        }
    });
}

function updateTrip(startName = resolveStop(fromLocationInput.value)?.name, destinationName = resolveStop(toLocationInput.value)?.name) {
    clearTimeout(rideArrivalTimer);
    rideState = "waiting";

    if (!startName || !destinationName) {
        tripStatus.textContent = "Choose a starting point and destination.";
        tripDetails.hidden = true;
        return;
    }

    selectedStartIndex = stops.findIndex(stop => stop.name === startName);
    selectedDestinationIndex = stops.findIndex(stop => stop.name === destinationName);

    if (startName === destinationName) {
        tripStatus.textContent = "Choose a different destination stop.";
        tripStatus.className = "trip-status";
        tripDetails.hidden = true;
        return;
    }

    const matchingRoute = routeDefinitions.find(route => {
        const startPosition = route.stops.indexOf(startName);
        const destinationPosition = route.stops.indexOf(destinationName);
        return startPosition >= 0 && destinationPosition > startPosition;
    }) || routeDefinitions.find(route => route.stops.includes(startName));
    selectedRoute = selectedRoute || matchingRoute;
    const routeStops = matchingRoute?.stops || [startName, destinationName];
    const startPosition = Math.max(routeStops.indexOf(startName), 0);
    const destinationPosition = Math.max(routeStops.indexOf(destinationName), startPosition + 1);
    const passingStops = routeStops.slice(startPosition, destinationPosition + 1);
    const estimatedMinutes = 4 + Math.abs(selectedDestinationIndex - selectedStartIndex) * 3 + (matchingRoute?.id === "sm-north-bgc" ? 12 : 0);

    busEta.textContent = `${estimatedMinutes} min`;
    nearestStop.textContent = startName;
    passingStopList.innerHTML = passingStops.map(stop => `<li>${stop}</li>`).join("");
    tripDetails.hidden = false;
    rideActionButton.disabled = false;
    rideActionButton.textContent = "Bus is here!";
    tripStatus.textContent = `Ready to travel from ${startName} to ${destinationName}.`;
    tripStatus.className = "trip-status";
}

function handleRideAction() {
    if (rideState === "waiting") {
        rideState = "riding";
        rideActionButton.disabled = true;
        rideActionButton.textContent = "You are riding the bus";
        tripStatus.textContent = "You are on the bus. We will notify you near your destination.";
        tripStatus.className = "trip-status is-active";

        // Short demo timer represents the bus approaching the destination.
        rideArrivalTimer = setTimeout(() => {
            rideState = "arrived";
            rideActionButton.disabled = false;
            rideActionButton.textContent = "I'm at my destination";
            tripStatus.textContent = "You are near your destination.";
            tripStatus.className = "trip-status is-active";
        }, 8000);
        return;
    }

    if (rideState === "arrived") {
        completeRide();
    }
}

async function completeRide() {
    const startName = resolveStop(fromLocationInput.value)?.name;
    const destinationName = resolveStop(toLocationInput.value)?.name;

    if (!startName || !destinationName || startName === destinationName) {
        return;
    }

    rideActionButton.disabled = true;
    rideActionButton.textContent = "Saving ride...";

    try {
        const response = await fetch("api/ride-history.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                start_stop: startName,
                destination_stop: destinationName
            })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to save ride");
        }

        rideState = "completed";
        rideActionButton.textContent = "Ride saved to history";
        tripStatus.textContent = `Ride completed: ${startName} to ${destinationName}.`;
        tripStatus.className = "trip-status is-complete";
    } catch (error) {
        rideActionButton.disabled = false;
        rideActionButton.textContent = "I'm at my destination";
        tripStatus.textContent = "Could not save this ride. Please try again.";
        tripStatus.className = "trip-status";
    }
}

function startTrip() {
    findRoutes();
    if (!isAdmin) {
        startSimulation();
    }
}

function changeSpeed() {
    speed = Number(document.getElementById("speed").value);
    if (simulationRunning) {
        pauseSimulation();
        startSimulation();
    }
}

if (!isAdmin) {
    startSimulation();
}
