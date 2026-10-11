<?php

/** Return a bounded positive integer from server configuration. */
function security_policy_integer(string $name, int $default, int $minimum, int $maximum): int
{
    $configured = getenv($name);
    if ($configured === false || !preg_match('/^\d+$/', trim($configured))) {
        return $default;
    }

    return max($minimum, min($maximum, (int)$configured));
}

function password_minimum_length(): int
{
    return security_policy_integer('PASSWORD_MIN_LENGTH', 8, 8, 128);
}

function session_lifetime_seconds(): int
{
    return security_policy_integer('SESSION_LIFETIME_SECONDS', 28800, 300, 604800);
}

function password_policy_error(string $password): ?string
{
    $minimum = password_minimum_length();
    if (strlen($password) < $minimum) {
        return "Password must be at least {$minimum} characters long.";
    }
    if (getenv('PASSWORD_REQUIRE_UPPERCASE') !== 'false' && !preg_match('/[A-Z]/', $password)) {
        return 'Password must contain at least one uppercase letter.';
    }
    if (getenv('PASSWORD_REQUIRE_LOWERCASE') !== 'false' && !preg_match('/[a-z]/', $password)) {
        return 'Password must contain at least one lowercase letter.';
    }
    if (getenv('PASSWORD_REQUIRE_NUMBER') !== 'false' && !preg_match('/[0-9]/', $password)) {
        return 'Password must contain at least one number.';
    }
    if (getenv('PASSWORD_REQUIRE_SPECIAL') !== 'false' && !preg_match('/[^A-Za-z0-9]/', $password)) {
        return 'Password must contain at least one special character.';
    }

    return null;
}
