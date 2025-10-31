# Script to check ports and start Next.js dev server
# Checks ports 3000, 3001, 3002 before starting

$ports = @(3000, 3001, 3002)
$portsInUse = @()

Write-Host "Checking ports..." -ForegroundColor Cyan

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "Port $port is in use by process: $($process.ProcessName) (PID: $($connection.OwningProcess))" -ForegroundColor Yellow
    } else {
        Write-Host "Port $port is available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "`nWarning: The following ports are in use: $($portsInUse -join ', ')" -ForegroundColor Red
    $response = Read-Host "`nDo you want to kill these processes and start the dev server? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        foreach ($port in $portsInUse) {
            $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connection) {
                Write-Host "Killing process on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
                Start-Sleep -Milliseconds 500
            }
        }
        Write-Host "Processes killed. Starting dev server..." -ForegroundColor Green
        npm run dev
    } else {
        Write-Host "Aborted. Please manually kill the processes or use a different port." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nAll ports are available. Starting dev server..." -ForegroundColor Green
    npm run dev
}
