<?php

header("Content-Type: application/json");

$allowedOrigins = [
    "http://localhost:5173",
    "https://batangai.fwh.is",
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

require_once __DIR__ . "/gemini_config.php";

$apiKey = GEMINI_API_KEY;

if (!$apiKey) {
    http_response_code(503);

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
    ]);

    exit;
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
1. Summarizing the reported incident.
2. Providing a cautious possible interpretation of the issue based only on the information provided.
3. Providing basic and safe self-help steps that a normal employee may try before IT intervention.
4. Providing technical troubleshooting suggestions intended for IT Support review.

Important rules:

- Do not claim that you have definitively identified the root cause.
- Do not invent technical information that was not provided.
- Clearly distinguish possible interpretations from confirmed facts.
- Basic self-help must be safe and appropriate for a normal employee.
- Do not instruct employees to change router, switch, server, firewall, DNS, DHCP, or other network infrastructure settings.
- Technical troubleshooting may include network diagnostic procedures appropriate for IT personnel.
- Technical troubleshooting suggestions are advisory only and must be reviewed by IT Support.
- Do not claim that the incident has been resolved.
- Do not assign the incident to an IT employee.
- Do not determine the final resolution or ticket status.
- If the information is insufficient, state what additional information IT Support may need.
- Keep the response practical and concise.

Return ONLY a valid JSON object.

The JSON object must contain exactly these four keys:

{
  "summary": "Concise summary of the reported incident.",
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

$requestBody = [
    "model" => "gemini-3.5-flash",
    "input" => $prompt,
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

$ch = curl_init(
    "https://generativelanguage.googleapis.com/v1/interactions"
);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "x-goog-api-key: " . $apiKey,
    ],
    CURLOPT_POSTFIELDS => $jsonRequestBody,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 60,
]);

$response = curl_exec($ch);

$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

/*
|--------------------------------------------------------------------------
| Handle cURL Error
|--------------------------------------------------------------------------
*/

if ($response === false) {
    http_response_code(503);

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Decode Gemini Response
|--------------------------------------------------------------------------
*/

$responseData = json_decode($response, true);

if (!is_array($responseData)) {
    http_response_code(503);

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
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

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
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

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
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

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
    ]);

    exit;
}

/*
|--------------------------------------------------------------------------
| Validate Required AI Fields
|--------------------------------------------------------------------------
*/

$summary = trim($analysis["summary"] ?? "");

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
    $summary === "" ||
    $possibleInterpretation === "" ||
    $basicSelfHelp === "" ||
    $itTroubleshooting === ""
) {
    http_response_code(503);

    echo json_encode([
        "success" => false,
        "aiAvailable" => false,
        "message" => "AI assistance is currently unavailable. You may still submit your incident. IT Support can review the report manually.",
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
        "summary" => $summary,
        "possibleInterpretation" => $possibleInterpretation,
        "basicSelfHelp" => $basicSelfHelp,
        "itTroubleshooting" => $itTroubleshooting,
    ],
]);