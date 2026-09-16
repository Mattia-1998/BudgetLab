@echo off
setlocal

if exist "%ProgramFiles%\Android\Android Studio\jbr" (
    set "JAVA_HOME=%ProgramFiles%\Android\Android Studio\jbr"
) else (
    echo JBR di Android Studio non trovato. Installa Android Studio o correggi il percorso.
    echo.
    pause
    exit /b 1
)

set "DIR=%~dp0"
pushd "%DIR%..\android"
call gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
set "code=%ERRORLEVEL%"
popd

if %code% EQU 0 goto build_ok
goto build_ko

:build_ok
echo.
echo BUILD OK. APK: android\app\build\outputs\apk\release\app-release.apk
goto end

:build_ko
echo.
echo BUILD FALLITA (codice %code%).
goto end

:end
echo.
pause
exit /b %code%