@echo off
REM Arranca todo el taller en Windows. Requiere Docker Desktop abierto, Node.js y Python.
cd /d %~dp0
echo [1/4] Mongo (Docker)...
docker compose up -d || goto :error
echo [2/4] Cargando las 15 casas...
cd carga
python -m pip install -q -r requirements.txt
python cargar_casas.py || goto :error
cd ..
echo [3/4] API en http://localhost:3000 ...
start "API" cmd /k "cd api && npm install && set MONGO_URI=mongodb://localhost:27017&& set PORT=3000&& npm start"
echo [4/4] Interfaz en http://localhost:5173 ...
start "Interfaz" cmd /k "cd ui && npm install && npm run dev"
echo Listo. Abra http://localhost:5173
exit /b 0
:error
echo Algo fallo. Revise que Docker Desktop este abierto.
exit /b 1
