@echo off
REM Description: Build the frontend project for production

echo ^>^>^>^>^>^>^>^>^>^> Removing dist folder
set WORKING_DIR=.\dist
if exist "%WORKING_DIR%" (
    echo Removing existing dist folder...
    rmdir /s /q "%WORKING_DIR%"
)

echo ^>^>^>^>^>^>^>^>^>^> Updating version in ngsw-config.json
REM Get current date in YYYY.MM.DD format
for /f %%i in ('powershell -command "Get-Date -Format yyyy.MM.dd"') do set CURRENT_DATE=%%i

echo Setting version to: %CURRENT_DATE%

REM Update version in ngsw-config.json (line 5)
if exist "ngsw-config.json" (
    echo Creating backup...
    copy ngsw-config.json ngsw-config.json.bak >nul

    REM Create temporary PowerShell script to update version
    echo $content = Get-Content "ngsw-config.json" > temp-update.ps1
    echo $content[4] = '    "version": "%CURRENT_DATE%",' >> temp-update.ps1
    echo $content ^| Set-Content "ngsw-config.json" >> temp-update.ps1

    REM Execute PowerShell script
    powershell -ExecutionPolicy Bypass -File temp-update.ps1

    REM Clean up temp script
    del temp-update.ps1

    echo Version updated in ngsw-config.json
) else (
    echo Warning: ngsw-config.json not found
)

echo ^>^>^>^>^>^>^>^>^>^> Checking code style
call npm run lint
if %errorlevel% neq 0 (
    echo Linting failed. Exiting...
    exit /b 1
)

echo ^>^>^>^>^>^>^>^>^>^> Testing the project
call npm run test -- --no-watch --browsers=ChromeHeadless
if %errorlevel% neq 0 (
    echo Tests failed. Exiting...
    exit /b 1
)

echo ^>^>^>^>^>^>^>^>^>^> Building the project
call npm run build
if %errorlevel% neq 0 (
    echo Build failed. Exiting...
    exit /b 1
)

echo ^>^>^>^>^>^>^>^>^>^> Build completed successfully
echo ^>^>^>^>^>^>^>^>^>^> Copy files from %WORKING_DIR% to the server

REM Restore original ngsw-config.json if backup exists
if exist "ngsw-config.json.bak" (
    echo ^>^>^>^>^>^>^>^>^>^> Restoring original ngsw-config.json
    move ngsw-config.json.bak ngsw-config.json >nul
)

echo ^>^>^>^>^>^>^>^>^>^> Finished
