<?php
session_start();
require_once "config/database.php";

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rating = (int) ($_POST['rating'] ?? 0);
    $comment = trim($_POST['comment'] ?? '');

    if ($comment === '') {
        $error = 'Please add a comment before sending feedback.';
    } elseif ($rating < 1 || $rating > 5) {
        $error = 'Please choose a rating from 1 to 5.';
    } else {
        try {
            $stmt = $pdo->prepare("INSERT INTO feedbacks (user_id, rating, comment) VALUES (?, ?, ?)");
            $stmt->execute([$_SESSION['user_id'], $rating, $comment]);
            $message = 'Thank you. Your feedback has been saved.';
        } catch (PDOException $exception) {
            $error = 'Feedback is not available until the database tables are imported.';
        }
    }
}

$isAdmin = $_SESSION['role'] === 'admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NextStop - BGC</title>
<link rel="icon" href="assets/2logo.png" type="image/png">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<header class="topbar">
    <div class="topbar-brand"><img src="assets/1logo.png" alt="NextStop - BGC"></div>
    <div class="topbar-user"><span><?php echo htmlspecialchars($_SESSION['username']); ?></span><a href="logout.php">Log out</a></div>
</header>
<div class="dashboard">
    <aside class="sidebar">
        <nav class="main-nav" aria-label="Main navigation">
            <a class="nav-item" href="dashboard.php">⌁ <span>Routes &amp; Map</span></a>
            <a class="nav-item" href="bus-stops.php">⌖ <span>Bus Stops</span></a>
            <a class="nav-item active" href="feedback.php">◌ <span>Feedback</span></a>
            <a class="nav-item" href="history.php">↶ <span>History</span></a>
        </nav>
    </aside>
    <main class="content simple-page">
        <div class="page-heading">
            <div><h1>Feedback</h1><p>Help us improve your bus experience.</p></div>
        </div>
        <section class="simple-card feedback-card">
            <?php if ($message !== ''): ?><p class="form-success"><?php echo htmlspecialchars($message); ?></p><?php endif; ?>
            <?php if ($error !== ''): ?><p class="form-error"><?php echo htmlspecialchars($error); ?></p><?php endif; ?>
            <form method="POST">
                <label for="rating">How was your trip?</label>
                <select id="rating" name="rating" required>
                    <option value="">Choose a rating</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Okay</option>
                    <option value="2">2 - Needs improvement</option>
                    <option value="1">1 - Poor</option>
                </select>
                <label for="comment">Comments</label>
                <textarea id="comment" name="comment" rows="6" placeholder="Tell us about your experience..." required></textarea>
                <button class="find-button" type="submit">Send feedback</button>
            </form>
        </section>
    </main>
</div>
</body>
</html>
