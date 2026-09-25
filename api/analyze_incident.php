<?php

header("Content-Type: application/json");

$allowedOrigins = [
    "http://localhost:5173",
    "https://batangai.fwh.is",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

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

require_once __DIR__ . "/gemini_config.php";

$apiKey = GEMINI_API_KEY;

if (!$apiKey) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gemini API key is not configured.",
    ]);

    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid request data.",
    ]);

    exit;
}

$department = trim($input["department"] ?? "");
$location = trim($input["location"] ?? "");
$issueCategory = trim($input["issueCategory"] ?? "");
$deviceType = trim($input["deviceType"] ?? "");
$connectionType = trim($input["connectionType"] ?? "");
$affectedService = trim($input["affectedService"] ?? "");
$description = trim($input["description"] ?? "");

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
        "message" => "Please provide all required incident details.",
    ]);

    exit;
}

$prompt = <<<PROMPT
Analyze the following network incident reported by an employee of a government IT department.

Your task is to:
1. Classify the incident.
2. Create a concise incident summary.
3. Identify the most likely possible cause based only on the information provided.
4. Provide practical troubleshooting steps that an employee can safely perform before IT personnel intervention.

Do not invent technical details that were not provided.
Do not claim certainty when the cause is uncertain.
The troubleshooting steps should be safe, simple, and appropriate for a normal employee.
If the issue requires IT personnel, clearly indicate that escalation is needed.

Incident details:

Department: {$department}
Location: {$location}
Issue Category: {$issueCategory}
Device Type: {$deviceType}
Connection Type: {$connectionType}
Affected Service: {$affectedService}
Description: {$description}
PROMPT;

$requestBody = [
    "model" => "gemini-3.5-flash",
    "input" => $prompt,
    "response_format" => [
        "type" => "text",
        "mime_type" => "application/json",
        "schema" => [
            "type" => "object",
            "properties" => [
                "classification" => [
                    "type" => "string",
                ],
                "summary" => [
                    "type" => "string",
                ],
                "possibleCause" => [
                    "type" => "string",
                ],
                "troubleshooting" => [
                    "type" => "string",
                ],
            ],
            "required" => [
                "classification",
                "summary",
                "possibleCause",
                "troubleshooting",
            ],
        ],
    ],
];

$ch = curl_init(
    "https://generativelanguage.googleapis.com/v1/interactions"
);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "x-goog-api-key: " . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody),
    CURLOPT_TIMEOUT => 60,
]);

$response = curl_exec($ch);

if ($response === false) {
    $curlError = curl_error($ch);

    curl_close($ch);

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to connect to Gemini API.",
        "error" => $curlError,
    ]);

    exit;
}

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

$responseData = json_decode($response, true);

if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gemini API request failed.",
        "geminiStatus" => $httpCode,
        "details" => $responseData,
    ]);

    exit;
}

$outputText = "";

if (isset($responseData["steps"]) && is_array($responseData["steps"])) {
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
                    $outputText = $content["text"];
                    break 2;
                }
            }
        }
    }
}

if ($outputText === "") {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gemini returned an empty response.",
        "details" => $responseData,
    ]);

    exit;
}

$analysis = json_decode($outputText, true);

if (!is_array($analysis)) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gemini returned an invalid analysis response.",
        "raw" => $outputText,
    ]);

    exit;
}

echo json_encode([
    "success" => true,
    "analysis" => [
        "classification" => $analysis["classification"] ?? "",
        "summary" => $analysis["summary"] ?? "",
        "possibleCause" => $analysis["possibleCause"] ?? "",
        "troubleshooting" => $analysis["troubleshooting"] ?? "",
    ],
]);