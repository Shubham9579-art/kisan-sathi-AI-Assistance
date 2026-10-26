$deadline = (Get-Date).AddMinutes(2)
$lastProgress = Get-Date
$lastError = $null

do {
    try {
        $backend = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/health' -TimeoutSec 2

        if ($backend.status -eq 'healthy') {
            $frontend = Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2
            $proxyBackend = Invoke-RestMethod -Uri 'http://localhost:5173/api/v1/health' -TimeoutSec 2

            if ($frontend.StatusCode -eq 200 -and $proxyBackend.status -eq 'healthy') {
                Write-Host 'KisanSathi is ready. Opening the website...'
                Start-Process 'http://localhost:5173/'
                exit 0
            }

            $lastError = 'The frontend or its API proxy returned an unexpected response.'
        }
        else {
            $lastError = "The backend health check returned status '$($backend.status)'."
        }
    }
    catch {
        $lastError = $_.Exception.Message
    }

    if (((Get-Date) - $lastProgress).TotalSeconds -ge 15) {
        Write-Host 'Still waiting for the backend and frontend to become healthy...'
        $lastProgress = Get-Date
    }

    Start-Sleep -Seconds 1
} while ((Get-Date) -lt $deadline)

Write-Host 'KisanSathi did not become ready within 2 minutes.'
if ($lastError) {
    Write-Host "Last readiness check: $lastError"
}
Read-Host 'Check the Backend and Frontend windows for errors, then press Enter to close'
exit 1
