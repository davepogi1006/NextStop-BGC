<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$isAdmin = $_SESSION['role'] === 'admin';
?>
<!DOCTYPE html> <html lang="en"> <head>
<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>NextStop - BGC</title>
<link rel="icon" href="assets/2logo.png" type="image/png">

<link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
>

<link
    rel="stylesheet"
    href="assets/css/style.css"
>

</head>
<body data-role="<?php echo $isAdmin ? 'admin' : 'user'; ?>">
<header class="topbar">
    <div class="topbar-brand">
        <img src="assets/1logo.png" alt="NextStop - BGC">
    </div>

    <div class="topbar-user">
        <span><?php echo htmlspecialchars($_SESSION['username']); ?></span>
        <a href="logout.php">Log out</a>
    </div>
</header>

<div class="dashboard">
    <aside class="sidebar">
        <nav class="main-nav" aria-label="Main navigation">
            <a class="nav-item active" href="dashboard.php">⌁ <span>Routes &amp; Map</span></a>
            <a class="nav-item" href="bus-stops.php">⌖ <span>Bus Stops</span></a>
            <a class="nav-item" href="feedback.php">◌ <span>Feedback</span></a>
            <a class="nav-item" href="history.php">↶ <span>History</span></a>
        </nav>

        <section class="live-status" aria-label="Live bus status">
            <p>LIVE BUS STATUS</p>
            <div><i class="status-dot green"></i>BGC Express <strong>4 min</strong></div>
            <div><i class="status-dot blue"></i>Uptown Shutter <strong>7 min</strong></div>
            <div><i class="status-dot orange"></i>Venice Loop <strong>11 min</strong></div>
            <div><i class="status-dot purple"></i>Bonifacio Link <strong>3 min</strong></div>
        </section>

        <div class="sidebar-user">
            <span class="user-avatar">●</span>
            <div><?php echo htmlspecialchars($_SESSION['username']); ?><small><?php echo htmlspecialchars(ucfirst($_SESSION['role'])); ?></small></div>
        </div>
    </aside>

    <main class="content">
        <div class="page-heading">
            <div>
                <h1>Route &amp; Map</h1>
                <p>Find a route and track buses in real time.</p>
            </div>

            <?php if ($isAdmin): ?>
            <div class="admin-controls">
                <button type="button" onclick="startSimulation()">Start</button>
                <button type="button" onclick="pauseSimulation()">Pause</button>
                <button type="button" onclick="resetSimulation()">Reset</button>
                <select id="speed" onchange="changeSpeed()" aria-label="Simulation speed">
                    <option value="2000">0.5x</option>
                    <option value="1000" selected>1x</option>
                    <option value="500">2x</option>
                    <option value="200">5x</option>
                </select>
            </div>
            <?php endif; ?>
        </div>

        <div class="route-map-layout">
            <section class="route-panel" aria-label="Find a bus route">
                <div class="route-search">
                    <label class="location-field from-field">
                        <span>●</span>
                        <input id="from-location" type="text" placeholder="Your location" list="stop-suggestions" aria-label="Starting location">
                    </label>
                    <button class="location-button" type="button" onclick="useMyLocation()">Use my location</button>
                    <label class="location-field to-field">
                        <span>●</span>
                        <input id="to-location" type="text" placeholder="Where do you want to go?" list="stop-suggestions" aria-label="Destination">
                    </label>
                    <datalist id="stop-suggestions"></datalist>
                    <button class="find-button" type="button" onclick="findRoutes()">Find Routes</button>
                </div>

                <p id="trip-status" class="trip-status" role="status">Choose a starting point and destination.</p>

                <div id="trip-details" class="trip-details" hidden>
                    <div class="trip-detail-item"><span>BUS ETA</span><strong id="bus-eta">--</strong></div>
                    <div class="trip-detail-item"><span>NEAREST STOP</span><strong id="nearest-stop">--</strong></div>
                    <div class="passing-stops"><span>STOPS ALONG THE WAY</span><ol id="passing-stop-list"></ol></div>
                    <button id="ride-action-button" class="ride-button" type="button" onclick="handleRideAction()">Bus is here!</button>
                </div>

                <div class="route-list-heading">
                    <span>ALL ROUTES</span>
                    <span id="route-count"></span>
                </div>
                <div id="route-list" class="route-list"></div>
            </section>

            <section class="map-panel" aria-label="Bus route map">
                <div id="map"></div>
            </section>
        </div>
    </main>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="assets/js/bus-simulator.js"></script>
</body>
</html>