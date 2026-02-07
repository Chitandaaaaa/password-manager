Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "密码管家 - 数据清空工具" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$dataDir = Join-Path $env:APPDATA "password-manager"

Write-Host "数据目录: $dataDir"
Write-Host ""

if (Test-Path $dataDir) {
    Write-Host "[1/2] 正在删除应用数据..." -ForegroundColor Yellow
    
    try {
        Remove-Item -Path $dataDir -Recurse -Force
        Write-Host "✓ 数据目录已删除" -ForegroundColor Green
    } catch {
        Write-Host "✗ 删除失败: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/2] 数据目录不存在，跳过" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/2] 创建新的空数据目录..." -ForegroundColor Yellow

try {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "✓ 新数据目录已创建" -ForegroundColor Green
} catch {
    Write-Host "✗ 创建目录失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✓ 数据库清空完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "现在您可以重新启动应用，"
Write-Host "它将恢复到第一次使用的状态。"
Write-Host ""

pause
