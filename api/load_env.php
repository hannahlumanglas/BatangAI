<?php

// Local XAMPP can load ignored per-machine settings from api/.env.local.
// If that file is missing, fall back to the committed example so local
// development still starts with the documented defaults.
function load_env_file(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (str_starts_with($line, 'export ')) {
            $line = trim(substr($line, 7));
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if ($name === '') {
            continue;
        }

        $value = preg_replace('/\s+#.*$/', '', $value) ?? $value;
        $value = trim(trim($value), "\"'");

        if (getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

$localEnvPath = __DIR__ . '/.env.local';
if (is_file($localEnvPath) && is_readable($localEnvPath)) {
    load_env_file($localEnvPath);
} else {
    load_env_file(__DIR__ . '/.env.local.example');
}
?>
