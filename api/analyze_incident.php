<?php

header("Content-Type: application/json");

$allowedOrigins = [
    "http://localhost:5173",
    "https://batangai.fwh.is",
    "https://batangai.infinityfree.io",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Method not allowed.",
    ]);

    exit;
}

$geminiConfig = __DIR__ . "/gemini_config.php";
if (is_file($geminiConfig)) {
    ob_start();
    require_once $geminiConfig;
    $configOutput = ob_get_clean();
    if ($configOutput === false) {
        http_response_code(500);
        error_log("Gemini analysis failed: unable to buffer configuration output.");
        echo json_encode([
            "success" => false,
            "message" => "The AI server could not load its configuration.",
        ]);
        exit;
    }

    $configOutput = preg_replace('/^\xEF\xBB\xBF/', '', $configOutput, 1);
    if (trim($configOutput) !== "") {
        http_response_code(500);
        error_log("Gemini analysis failed: unexpected output from Gemini configuration.");
        echo json_encode([
            "success" => false,
            "message" => "The AI server configuration returned unexpected output.",
        ]);
        exit;
    }
}

$apiKey = defined("GEMINI_API_KEY")
    ? trim((string) constant("GEMINI_API_KEY"))
    : "";
if ($apiKey === "") {
    $apiKey = trim((string) (getenv("GEMINI_API_KEY") ?: ""));
}

if (!$apiKey) {
    http_response_code(503);
    error_log("Gemini analysis unavailable: GEMINI_API_KEY is not configured.");

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Gemini AI is not configured on the API server. Set GEMINI_API_KEY to enable analysis.",
    ]);

    exit;
}

/**
 * Send a JSON request to Gemini. PHP's cURL extension is optional on some
 * XAMPP/PHP installations, so use the HTTP stream wrapper when it is absent.
 */
function geminiPostJson(string $url, string $jsonBody, string $apiKey): array
{
    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "x-goog-api-key: " . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $jsonBody,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 60,
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [$response, $error, $httpCode];
    }

    $context = stream_context_create([
        "http" => [
            "method" => "POST",
            "header" => "Content-Type: application/json\r\n"
                . "x-goog-api-key: " . $apiKey . "\r\n",
            "content" => $jsonBody,
            "timeout" => 60,
            "ignore_errors" => true,
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    $error = $response === false ? "PHP HTTP stream request failed." : "";
    $httpCode = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
            $httpCode = (int)$matches[1];
            break;
        }
    }

    return [$response, $error, $httpCode];
}

/*
|--------------------------------------------------------------------------
| Read Request
|--------------------------------------------------------------------------
*/

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Get Incident Information
|--------------------------------------------------------------------------
*/

$department = trim($input["department"] ?? "");
$location = trim($input["location"] ?? "");
$issueCategory = trim($input["issueCategory"] ?? "");
$deviceType = trim($input["deviceType"] ?? "");
$connectionType = trim($input["connectionType"] ?? "");
$affectedService = trim($input["affectedService"] ?? "");
$description = trim($input["description"] ?? "");

/*
|--------------------------------------------------------------------------
| Validate Required Fields
|--------------------------------------------------------------------------
*/

if (
    $department === "" ||
    $location === "" ||
    $issueCategory === "" ||
    $deviceType === "" ||
    $connectionType === "" ||
    $affectedService === "" ||
    $description === ""
) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Please provide all required incident information.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Gemini Prompt
|--------------------------------------------------------------------------
|
| Gemini is used only as an AI assistance feature.
| It does not resolve, assign, or close incidents.
|
*/

$prompt = <<<PROMPT
You are an AI support assistant for BatangAI, an AI-integrated network incident reporting and troubleshooting support system for the IT Department of Batangas City Government.

Analyze the network incident information provided below.

Your purpose is limited to:
1. Classifying the incident based on the reported details.
2. Extracting concise keywords from the report.
3. Summarizing the reported incident.
4. Providing a cautious possible interpretation of the issue based only on the information provided.
5. Providing safe, practical troubleshooting steps that a normal employee may try before IT intervention.
6. Providing technical troubleshooting suggestions intended for IT Support review.

Important rules:

- Do not claim that you have definitively identified the root cause.
- Do not invent technical information that was not provided.
- Clearly distinguish possible interpretations from confirmed facts.
- Basic self-help must be safe and appropriate for a normal employee.
- Write the employee troubleshooting as a numbered sequence, with one clear action per step (1., 2., 3., and so on).
- Start with simple checks, then give safe next actions. Include what the employee should observe after each action and when to stop and contact IT Support.
- Do not return a generic category label in place of actionable steps.
- Do not instruct employees to change router, switch, server, firewall, DNS, DHCP, or other network infrastructure settings.
- Technical troubleshooting may include network diagnostic procedures appropriate for IT personnel.
- Technical troubleshooting suggestions are advisory only and must be reviewed by IT Support.
- Do not claim that the incident has been resolved.
- Do not assign the incident to an IT employee.
- Do not determine the final resolution or ticket status.
- If the information is insufficient, state what additional information IT Support may need.
- Keep the response practical and concise.
- Base the classification and keywords on the submitted incident fields, not on a fixed default list.
- Extract keywords from the actual department, location, issue category, device, connection type, affected service, and description. Choose terms that distinguish this report from other incidents.
- Write the summary as a concise, complete summary of the user's entire submitted incident report, not just the issue category or one detail. Cover every relevant field supplied: department, location, issue category, device type, connection type, affected service, and the user's full problem description. Preserve the key symptoms and circumstances from the description, combine related details into a clear paragraph, and omit only fields that were not provided. Do not add details that are absent.

Return ONLY a valid JSON object.

The JSON object must contain exactly these six keys:

{
  "classification": "Short incident category based only on the report.",
  "keywords": ["keyword one", "keyword two"],
  "summary": "Concise but complete paragraph summarizing the entire user-submitted report and all relevant supplied details.",
  "possibleInterpretation": "Cautious possible interpretation of the issue.",
  "basicSelfHelp": "Safe basic steps the employee may try.",
  "itTroubleshooting": "Technical troubleshooting suggestions intended for IT Support review."
}

Do not use Markdown.
Do not wrap the JSON in code fences.
Do not add explanations before or after the JSON.

Incident details:

Department: {$department}
Location: {$location}
Issue Category: {$issueCategory}
Device Type: {$deviceType}
Connection Type: {$connectionType}
Affected Service: {$affectedService}
Description: {$description}
PROMPT;

/*
|--------------------------------------------------------------------------
| Gemini API Request
|--------------------------------------------------------------------------
*/

$responseSchema = [
    "type" => "object",
    "properties" => [
        "classification" => ["type" => "string"],
        "keywords" => ["type" => "array", "items" => ["type" => "string"]],
        "summary" => ["type" => "string"],
        "possibleInterpretation" => ["type" => "string"],
        "basicSelfHelp" => ["type" => "string"],
        "itTroubleshooting" => ["type" => "string"],
    ],
    "required" => [
        "classification",
        "keywords",
        "summary",
        "possibleInterpretation",
        "basicSelfHelp",
        "itTroubleshooting",
    ],
];

$requestBody = [
    "contents" => [["parts" => [["text" => $prompt]]]],
    "generationConfig" => [
        "responseMimeType" => "application/json",
        "responseSchema" => $responseSchema,
    ],
];
$jsonRequestBody = json_encode($requestBody);
if ($jsonRequestBody === false) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Failed to prepare the AI assistance request.",
    ]);
    exit;
}

$models = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
];
$response = false;
$curlError = "";
$httpCode = 0;
$responseData = null;
foreach ($models as $modelIndex => $model) {
    $maxAttempts = $modelIndex === 0 ? 2 : 1;
    for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
        [$response, $curlError, $httpCode] = geminiPostJson(
            "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent",
            $jsonRequestBody,
            $apiKey
        );

        if (is_string($response) && $httpCode >= 200 && $httpCode < 300) {
            $generateData = json_decode($response, true);
            $generateText = $generateData["candidates"][0]["content"]["parts"][0]["text"] ?? "";
            $responseData = [
                "steps" => [[
                    "type" => "model_output",
                    "content" => [["type" => "text", "text" => $generateText]],
                ]],
            ];
            break 2;
        }

        $isTransientFailure = $response === false
            || in_array($httpCode, [408, 429, 500, 502, 503, 504], true);
        if (!$isTransientFailure || $attempt === $maxAttempts) {
            break;
        }

        error_log(sprintf("Gemini transient failure for %s (HTTP %d); retrying.", $model, $httpCode));
        usleep(750000 + random_int(0, 250000));
    }

    $failedData = is_string($response) ? json_decode($response, true) : null;
    $failedMessage = is_array($failedData)
        ? (string)($failedData["error"]["message"] ?? "")
        : "";
    error_log(sprintf(
        "Gemini model %s failed (HTTP %d): %s",
        $model,
        $httpCode,
        $curlError !== "" ? $curlError : ($failedMessage !== "" ? $failedMessage : "upstream returned an error")
    ));

    if (in_array($httpCode, [400, 401, 403], true)) {
        break;
    }
}

$upstreamData = is_string($response) ? json_decode($response, true) : null;
$upstreamMessage = is_array($upstreamData)
    ? (string)($upstreamData["error"]["message"] ?? "")
    : "";

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    error_log(sprintf(
        "Gemini request failed (HTTP %d): %s",
        $httpCode,
        $curlError !== "" ? $curlError : ($upstreamMessage !== "" ? $upstreamMessage : "upstream returned an error")
    ));
}

/*
|--------------------------------------------------------------------------
| Handle cURL Error
|--------------------------------------------------------------------------
*/

if ($response === false) {
    http_response_code(503);
    error_log("Gemini analysis failed: upstream connection error: " . ($curlError !== "" ? $curlError : "unknown cURL error"));

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "The API server could not connect to Gemini. Check the server's internet connection and try again.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Decode Gemini Response
|--------------------------------------------------------------------------
*/

$responseData = isset($responseData) && is_array($responseData)
    ? $responseData
    : json_decode($response, true);

if (!is_array($responseData)) {
    http_response_code(503);
    error_log("Gemini analysis failed: upstream returned invalid JSON.");

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Gemini returned an unreadable response. Please try again.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Handle Gemini HTTP Errors
|--------------------------------------------------------------------------
*/

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(503);
    if ($httpCode === 401 || $httpCode === 403) {
        $failureMessage = "Gemini rejected the API key. Check GEMINI_API_KEY on the API server.";
    } elseif ($httpCode === 429) {
        $failureMessage = "Gemini API rate limit or usage quota reached. Please try again later.";
    } elseif ($httpCode === 404) {
        $failureMessage = "Gemini could not find an available model for this API key. Check model access on the API server.";
    } elseif ($httpCode === 503) {
        if (stripos($upstreamMessage, "high demand") !== false) {
            $failureMessage = "Gemini is experiencing high demand across its available models. Please wait a moment and try the analysis again.";
        } else {
            $failureMessage = "Gemini is temporarily unavailable across its available models. Please try the analysis again shortly.";
        }
    } elseif ($httpCode === 400) {
        $failureMessage = "Gemini rejected the analysis request. Check the API server log for details.";
    } else {
        $failureMessage = "Gemini analysis failed (HTTP " . (int)$httpCode . "). Check the server log for details.";
    }

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => $failureMessage,
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Extract Model Output
|--------------------------------------------------------------------------
*/

$outputText = "";

if (
    isset($responseData["steps"]) &&
    is_array($responseData["steps"])
) {
    foreach (array_reverse($responseData["steps"]) as $step) {
        if (
            ($step["type"] ?? "") === "model_output" &&
            isset($step["content"]) &&
            is_array($step["content"])
        ) {
            foreach (array_reverse($step["content"]) as $content) {
                if (
                    ($content["type"] ?? "") === "text" &&
                    isset($content["text"])
                ) {
                    $outputText = trim($content["text"]);
                    break 2;
                }
            }
        }
    }
}

/*
|--------------------------------------------------------------------------
| Validate Model Output
|--------------------------------------------------------------------------
*/

if ($outputText === "") {
    http_response_code(503);
    error_log("Gemini analysis failed: completed response contained no model text.");

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Gemini returned no analysis text. Please try again.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Decode AI JSON
|--------------------------------------------------------------------------
*/

$analysis = json_decode($outputText, true);

if (!is_array($analysis)) {
    http_response_code(503);
    error_log("Gemini analysis failed: model output was not valid JSON.");

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Gemini returned analysis in an unexpected format. Please try again.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Validate Required AI Fields
|--------------------------------------------------------------------------
*/

$summary = trim($analysis["summary"] ?? "");
$classification = trim($analysis["classification"] ?? "");
$keywords = $analysis["keywords"] ?? [];
if (!is_array($keywords)) {
    $keywords = [];
}
$keywords = array_values(array_filter(
    array_map(static fn($keyword) => is_string($keyword) ? trim($keyword) : "", $keywords),
    static fn($keyword) => $keyword !== ""
));

$possibleInterpretation = trim(
    $analysis["possibleInterpretation"] ?? ""
);

$basicSelfHelp = trim(
    $analysis["basicSelfHelp"] ?? ""
);

$itTroubleshooting = trim(
    $analysis["itTroubleshooting"] ?? ""
);

if (
    $classification === "" ||
    count($keywords) === 0 ||
    $summary === "" ||
    $possibleInterpretation === "" ||
    $basicSelfHelp === "" ||
    $itTroubleshooting === ""
) {
    http_response_code(503);
    error_log("Gemini analysis failed: model output was missing one or more required fields.");

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "Gemini returned incomplete analysis. Please try again.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Successful Response
|--------------------------------------------------------------------------
*/

echo json_encode([
    "success" => true,
    "aiAvailable" => true,
    "analysis" => [
        "classification" => $classification,
        "keywords" => $keywords,
        "summary" => $summary,
        "possibleInterpretation" => $possibleInterpretation,
        "basicSelfHelp" => $basicSelfHelp,
        "itTroubleshooting" => $itTroubleshooting,
    ],
]);
