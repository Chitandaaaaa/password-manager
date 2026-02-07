@echo off
chcp 65001 >nul
echo ==========================================
echo 密码管家 - 数据清空工具
echo ==========================================
echo.

set "DATA_DIR=%APPDATA%\password-manager"

echo 正在清空数据库...
echo 数据目录: %DATA_DIR%
echo.

if exist "%DATA_DIR%" (
    echo [1/2] 删除应用数据目录...
    rmdir /s /q "%DATA_DIR%"
    echo ✓ 数据目录已删除
) else (
    echo [1/2] 数据目录不存在，跳过
)

echo.
echo [2/2] 创建新的空数据目录...
mkdir "%DATA_DIR%" 2>nul
echo ✓ 新数据目录已创建

echo.
echo ==========================================
echo ✓ 数据库清空完成！
echo ==========================================
echo.
echo 现在您可以重新启动应用，
echo 它将恢复到第一次使用的状态。
echo.
pause
