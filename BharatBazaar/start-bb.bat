@echo off
:: ============================================================
::  start-bb.bat  —  BharatBazaar Windows launcher
::  Starts MongoDB + all 3 BB nodes in one click.
::
::  Prerequisites:
::    1. Node.js  (https://nodejs.org)
::    2. MongoDB  (https://www.mongodb.com/try/download/community)
::       OR installed via:  winget install MongoDB.Server
::    3. npm install   (run once in this directory)
::
::  Usage:
::    Double-click start-bb.bat
::    OR from a terminal:  start-bb.bat
:: ============================================================

title BharatBazaar Launcher
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
:: Strip trailing backslash
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "LOG_DIR=%ROOT%\.bb"
set "LOG_FILE=%LOG_DIR%\bharatbazaar.log"
set "MONGO_DATA=%ROOT%\.mongo-data"
set "MONGO_LOG=%ROOT%\.mongo.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%MONGO_DATA%" mkdir "%MONGO_DATA%"

echo.
echo  ================================================
echo   BharatBazaar ^| Multi-Node Launcher ^| Windows
echo  ================================================
echo.

:: ── Check Node.js ────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found.
    echo          Download it from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ── Check npm install ────────────────────────────────────────────────────────
if not exist "%ROOT%\node_modules" (
    echo  [INFO] node_modules not found. Running npm install...
    cd /d "%ROOT%"
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed.
)

:: ── Check .env ───────────────────────────────────────────────────────────────
if not exist "%ROOT%\.env" (
    echo  [INFO] .env not found. Copying from .env.example...
    copy "%ROOT%\.env.example" "%ROOT%\.env" >nul
    echo  [OK] .env created from example. Edit it to set your secrets.
)

:: ── Start MongoDB (if not already running) ───────────────────────────────────
echo.
echo  Starting MongoDB...
netstat -an 2>nul | findstr ":27017" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo  [OK] MongoDB already running on port 27017.
) else (
    :: Find mongod.exe
    set "MONGOD="
    for %%p in (
        "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
        "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
        "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
        "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
    ) do (
        if exist %%p (
            if "!MONGOD!"=="" set "MONGOD=%%~p"
        )
    )

    if "!MONGOD!"=="" (
        echo  [WARN] mongod.exe not found in standard paths.
        echo         Install MongoDB: winget install MongoDB.Server
        echo         Or start MongoDB manually, then re-run this script.
        echo.
    ) else (
        echo  [INFO] Starting mongod from: !MONGOD!
        start /B "MongoDB" "!MONGOD!" --dbpath "%MONGO_DATA%" --logpath "%MONGO_LOG%" --logappend --port 27017
        :: Wait up to 8 s for MongoDB to bind the port
        set MONGO_UP=0
        for /L %%i in (1,1,8) do (
            timeout /t 1 /nobreak >nul
            netstat -an 2>nul | findstr ":27017" | findstr "LISTENING" >nul 2>&1
            if not errorlevel 1 (
                set MONGO_UP=1
                goto :mongo_ready
            )
        )
        :mongo_ready
        if !MONGO_UP!==1 (
            echo  [OK] MongoDB started.
        ) else (
            echo  [WARN] MongoDB did not respond in 8s. Check %MONGO_LOG%
        )
    )
)

:: ── Start BharatBazaar nodes ─────────────────────────────────────────────────
echo.
echo  Starting BharatBazaar nodes...
cd /d "%ROOT%"
start "BharatBazaar Nodes" /B node scripts\startInstances.js >> "%LOG_FILE%" 2>&1

:: Wait up to 12 s for all 3 nodes
echo  Waiting for nodes to become ready...
set READY=0
for /L %%i in (1,1,12) do (
    timeout /t 1 /nobreak >nul
    set UP=0
    for %%p in (5001 5002 5003) do (
        netstat -an 2>nul | findstr ":%%p " | findstr "LISTENING" >nul 2>&1
        if not errorlevel 1 set /a UP+=1
    )
    echo  [%%i/12] !UP!/3 nodes up...
    if !UP! geq 3 (
        set READY=1
        goto :nodes_ready
    )
)
:nodes_ready

echo.
if !READY!==1 (
    echo  ================================================
    echo   All 3 BharatBazaar nodes are READY
    echo  ================================================
    echo.
    echo   BB-NODE-1 (Mumbai)    http://localhost:5001
    echo   BB-NODE-2 (Delhi)     http://localhost:5002
    echo   BB-NODE-3 (Bangalore) http://localhost:5003
    echo.
    echo   Logs: %LOG_FILE%
    echo.
    echo  Opening BB-NODE-1 in browser...
    start "" "http://localhost:5001"
) else (
    echo  [WARN] Not all nodes came up in 12 s.
    echo         Check the log: %LOG_FILE%
)

echo.
echo  Press any key to close this window (nodes keep running in background).
pause >nul
endlocal
