# run.ps1 - Start RakshaPath backend on Windows
$ErrorActionPreference = "Stop"

$venvPath = Join-Path $PSScriptRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"

# If virtual environment exists, use it; otherwise fall back to system python
if (-not (Test-Path $venvPython)) {
    $venvPython = "python"
}

Push-Location $PSScriptRoot

try {
    Write-Host "`n=== Starting RakshaPath Backend ===" -ForegroundColor Cyan

    # 1. Run database migrations
    Write-Host "Checking and applying database migrations..." -ForegroundColor Yellow
    & $venvPython -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Migration check failed. Please verify DATABASE_URL in backend\.env." -ForegroundColor Red
        exit $LASTEXITCODE
    }

    # 2. Launch FastAPI server with Uvicorn
    Write-Host "Starting API server on http://127.0.0.1:8000 ..." -ForegroundColor Green
    Write-Host "API Documentation: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
    Write-Host "Health Check:     http://127.0.0.1:8000/health`n" -ForegroundColor Cyan
    & $venvPython -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}
finally {
    Pop-Location
}

