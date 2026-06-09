@echo off
chcp 65001 >nul
setlocal
title 口袋妖怪西班牙火箭队ROM修改器

set "APP_DIR=%~dp0app"
set "PORT=4173"
set "PYTHON_CMD="

if not exist "%APP_DIR%\index.html" (
  echo 未找到修改器程序文件。
  echo 请确认 app 文件夹和本启动脚本放在同一目录下。
  pause
  exit /b 1
)

where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py -3"

if not defined PYTHON_CMD (
  where python >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
  echo 未找到 Python，无法启动本地修改器。
  echo 请安装 Python 后再双击本文件。
  pause
  exit /b 1
)

start "ROM修改器服务" /min cmd /c "cd /d ""%APP_DIR%"" && %PYTHON_CMD% -m http.server %PORT% --bind 127.0.0.1"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"
exit /b 0
