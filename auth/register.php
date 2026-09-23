<?php
session_start();
require_once "../config/database.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../register.php");
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

if ($username === '' || $password === '' || $confirmPassword === '') {
    $_SESSION['register_error'] = 'All fields are required.';
    header("Location: ../register.php");
    exit;
}

if (!preg_match('/^[A-Za-z0-9_]{3,50}$/', $username)) {
    $_SESSION['register_error'] = 'Username must be 3-50 characters using only letters, numbers, and underscores.';
    header("Location: ../register.php");
    exit;
}

if (strlen($password) < 6) {
    $_SESSION['register_error'] = 'Password must be at least 6 characters.';
    header("Location: ../register.php");
    exit;
}

if ($password !== $confirmPassword) {
    $_SESSION['register_error'] = 'Passwords do not match.';
    header("Location: ../register.php");
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$stmt->execute([$username]);

if ($stmt->fetch()) {
    $_SESSION['register_error'] = 'That username is already in use.';
    header("Location: ../register.php");
    exit;
}

$stmt = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
$stmt->execute([
    $username,
    password_hash($password, PASSWORD_DEFAULT),
    'user'
]);

$_SESSION['register_success'] = 'Account created. You can now log in.';
header("Location: ../index.php");
exit;
