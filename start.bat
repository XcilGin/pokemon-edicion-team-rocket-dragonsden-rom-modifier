@echo off
setlocal

pushd "%~dp0"
if errorlevel 1 (
  echo Cannot enter the modifier folder.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\start_modifier.ps1"
set "START_RESULT=%ERRORLEVEL%"
popd

if not "%START_RESULT%"=="0" (
  echo.
  echo Startup failed. Please send a screenshot of this window.
  pause
)

exit /b %START_RESULT%
