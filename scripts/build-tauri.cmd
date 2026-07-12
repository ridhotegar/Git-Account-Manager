@echo off
cd /d "%~dp0..\src-tauri"

REM Set up MSVC environment
call "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" > nul

REM Print which link.exe we're using
where link

REM Run cargo build
cargo build %*
if %ERRORLEVEL% NEQ 0 (
    echo cargo build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo Build successful!
