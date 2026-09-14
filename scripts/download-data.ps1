param(
    [string]$BaseUrl = "https://solve.ivy.homes",
    [string]$ApiKey = $env:IVY_API_KEY,
    [string]$Email = "demo1@ivy.homes",
    [string]$Password = $env:IVY_DEMO_PASSWORD,
    [int]$RequestedLimit = 1000
)

if ([string]::IsNullOrWhiteSpace($ApiKey) -or [string]::IsNullOrWhiteSpace($Password)) {
    throw "Set IVY_API_KEY and IVY_DEMO_PASSWORD in the process environment before running this script."
}

$headers = @{ "X-API-Key" = $ApiKey; "Content-Type" = "application/json" }
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Headers $headers -Body $loginBody
$authHeaders = @{ "X-API-Key" = $ApiKey; Authorization = "Bearer $($login.access_token)" }

New-Item -ItemType Directory -Path "data/raw" -Force | Out-Null

foreach ($endpoint in @("listings", "rentals", "projects")) {
    $offset = 0
    $allResults = [System.Collections.Generic.List[object]]::new()

    do {
        $uri = "$BaseUrl/v1/${endpoint}?limit=$RequestedLimit&offset=$offset"
        $page = Invoke-RestMethod -Uri $uri -Method Get -Headers $authHeaders
        foreach ($result in $page.results) {
            $allResults.Add($result)
        }
        $offset += [int]$page.count
    } while ($page.has_more)

    $output = [ordered]@{
        endpoint = "/v1/$endpoint"
        retrieved_at = (Get-Date).ToUniversalTime().ToString("o")
        count = $allResults.Count
        results = $allResults
    }
    $output | ConvertTo-Json -Depth 20 | Set-Content -Path "data/raw/$endpoint.json" -Encoding utf8
    Write-Output "${endpoint}: retrieved $($allResults.Count) records"
}