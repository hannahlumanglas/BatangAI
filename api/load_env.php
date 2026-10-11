<?php

// Local XAMPP can load ignored per-machine settings from api/.env.local.
// Production should provide the same names through the process environment.
$localEnvPath = __DIR__ . '/.env.local';
if (is_file($localEnvPath) && is_readable($localEnvPath)) {
    foreach (file($localEnvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim(trim($value), "\"'");
        if ($name !== '' && getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }
}
?>
