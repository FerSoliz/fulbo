@echo off
echo Configurando el entorno para SUDONESITE2...

:: Establece la ruta a la carpeta de npm donde se instalan los comandos globales (como firebase)
set "NPM_PATH=%APPDATA%\npm"

:: Agrega la ruta de npm al PATH de esta sesion de terminal
set "PATH=%PATH%;%NPM_PATH%"

:: Cambia al directorio del proyecto
cd /d "C:\Users\sudon\OneDrive\Desktop\SUDONESITE2"

echo.
echo Directorio actual: %cd%
echo Entorno listo. Ya puedes usar los comandos de npm y firebase.
echo.

:: Inicia el Command Prompt
cmd.exe
