@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title 잠시 사용자 앱 PC 테스트

set "SDK=D:\D_Codex\android-sdk"
set "ADB=%SDK%\platform-tools\adb.exe"
set "EMULATOR=%SDK%\emulator\emulator.exe"
set "APK=D:\D_Codex\moment\outputs\moment-firebase-debug.apk"
set "ANDROID_AVD_HOME=D:\D_Codex\android-avd"
set "ANDROID_USER_HOME=D:\D_Codex\android-home"
set "ANDROID_SDK_ROOT=%SDK%"

if not exist "%APK%" (
  echo APK 파일을 찾을 수 없습니다: %APK%
  pause
  exit /b 1
)

"%ADB%" devices | findstr /R "emulator-[0-9][0-9]*[ ]*device" >nul
if errorlevel 1 (
  tasklist /FI "IMAGENAME eq qemu-system-x86_64.exe" | find /I "qemu-system-x86_64.exe" >nul
  if errorlevel 1 (
    echo 안드로이드 에뮬레이터를 시작합니다...
    start "" "%EMULATOR%" -avd JAMSI_API_35 -no-snapshot -gpu swiftshader_indirect -no-boot-anim
  ) else (
    echo 실행 중인 에뮬레이터의 연결을 기다립니다...
    "%ADB%" reconnect offline >nul 2>nul
  )
)

echo 안드로이드 부팅을 기다립니다...
for /L %%i in (1,1,60) do (
  for /F "delims=" %%b in ('"%ADB%" -e shell getprop sys.boot_completed 2^>nul') do set "BOOTED=%%b"
  if "!BOOTED!"=="1" goto :install
  ping 127.0.0.1 -n 3 >nul
)

echo 에뮬레이터 부팅 시간이 초과됐습니다.
pause
exit /b 1

:install
echo 잠시 앱을 설치합니다...
"%ADB%" -e install -r "%APK%"
if errorlevel 1 (
  echo 앱 설치에 실패했습니다.
  pause
  exit /b 1
)

"%ADB%" -e shell am force-stop kr.co.jamsi.debug
"%ADB%" -e shell am start -n kr.co.jamsi.debug/kr.co.jamsi.MainActivity
echo 잠시 사용자 앱이 PC 에뮬레이터에서 실행 중입니다.
pause

