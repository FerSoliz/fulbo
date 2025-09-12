@echo off
set "PROJECT_PATH=C:\Users\sudon\OneDrive\Desktop\SUDONESITE2"
echo =================================================================
echo  Terminal de SUDONE v2
echo =================================================================
echo.
echo  Cambiando al directorio del proyecto:
echo  %PROJECT_PATH%
echo.
cd /d "%PROJECT_PATH%"
cmd /k "echo. && echo Directorio actual: %cd% && echo. && echo Listo. Ya puedes ejecutar los comandos de Firebase (ej: firebase deploy)."
