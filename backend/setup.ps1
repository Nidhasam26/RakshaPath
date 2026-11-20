# setup.ps1 - Automated local setup for RakshaPath backend on Windows
$ErrorActionPreference = "Stop"

Write-Host "`n=== RakshaPath Backend Setup ===" -ForegroundColor Cyan

# 1. Verify Python availability
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Error "Python was not found on your system PATH. Please install Python 3.11+ from python.org."
    exit 1
}

# 2. Create virtual environment in backend/.venv if missing
$venvPath = Join-Path $PSScriptRoot ".venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    python -m venv $venvPath
    Write-Host "Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists in backend\.venv." -ForegroundColor Gray
}

# 3. Locate virtual environment python & pip executables
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$venvPip = Join-Path $venvPath "Scripts\pip.exe"

# 4. Install / upgrade backend dependencies
Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip
& $venvPip install -r (Join-Path $PSScriptRoot "requirements.txt")
Write-Host "Dependencies installed successfully." -ForegroundColor Green

# 5. Copy .env.example to .env if .env does not exist
$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"
if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item $envExamplePath $envPath
        Write-Host "Created backend\.env from .env.example." -ForegroundColor Green
        Write-Host "ACTION REQUIRED: Open backend\.env and paste your cloud PostgreSQL DATABASE_URL." -ForegroundColor Magenta
    }
} else {
    Write-Host "backend\.env already exists." -ForegroundColor Gray
}

Write-Host "`nSetup complete! Next steps:" -ForegroundColor Cyan
Write-Host "1. Put your cloud PostgreSQL connection string in backend\.env (DATABASE_URL=...)"
Write-Host "2. Start the backend: .\run.ps1`n"

