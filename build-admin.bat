@echo off
echo ========================================
echo Electron 应用打包脚本（需要管理员权限）
echo ========================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] 已具有管理员权限
) else (
    echo [错误] 需要管理员权限！
    echo 请右键点击此文件，选择"以管理员身份运行"
    pause
    exit /b 1
)

echo.
echo 开始打包...
echo.

REM 设置环境变量
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

REM 清理旧的构建文件
if exist dist\win-unpacked (
    echo 清理旧的构建文件...
    rmdir /s /q dist\win-unpacked
)

REM 执行打包
echo 执行 electron-builder...
npx electron-builder --win --dir

if %errorLevel% == 0 (
    echo.
    echo ========================================
    echo 打包成功！
    echo ========================================
    echo.
    echo 应用位置: dist\win-unpacked\
    echo 可执行文件: dist\win-unpacked\VibeCoding Project Gallery.exe
    echo.
) else (
    echo.
    echo ========================================
    echo 打包失败！错误代码: %errorLevel%
    echo ========================================
    echo.
)

pause