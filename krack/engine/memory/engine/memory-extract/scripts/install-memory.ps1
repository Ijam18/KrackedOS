param(
    [Parameter(Mandatory = $true)]
    [string]$TargetProjectPath
)

$ErrorActionPreference = "Stop"

$sourceRoot = Split-Path -Parent $PSScriptRoot
$sourceMemory = Join-Path $sourceRoot "memory"
$targetMemory = Join-Path $TargetProjectPath "memory"

if (-not (Test-Path $TargetProjectPath)) {
    throw "Target project path does not exist: $TargetProjectPath"
}

if (-not (Test-Path $sourceMemory)) {
    throw "Source memory folder not found: $sourceMemory"
}

if (Test-Path $targetMemory) {
    Write-Host "Updating existing memory folder at $targetMemory"
} else {
    Write-Host "Creating memory folder at $targetMemory"
}

New-Item -ItemType Directory -Force -Path $targetMemory | Out-Null
Copy-Item -Path (Join-Path $sourceMemory "*.go") -Destination $targetMemory -Force

Write-Host "Memory package copied successfully."
Write-Host "Next: import your module path + /memory, initialize NewProjectMemoryRuntime, and register NewWriteMemoryTool."
