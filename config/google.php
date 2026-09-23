<?php

function googleConfig(): array
{
    $clientId = getenv('GOOGLE_CLIENT_ID');
    $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
    $redirectUri = getenv('GOOGLE_REDIRECT_URI');

    if (!$clientId || !$clientSecret || !$redirectUri) {
        throw new RuntimeException('Google login is not configured.');
    }

    return [
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
    ];
}
