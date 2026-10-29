#!/usr/bin/env bash
# Arranca todo el taller (Linux/Mac). Requiere Docker, Node.js y Python.
set -e; cd "$(dirname "$0")"
docker compose up -d
(cd carga && python3 -m pip install -q -r requirements.txt && python3 cargar_casas.py)
(cd api && npm install && MONGO_URI=mongodb://localhost:27017 PORT=3000 npm start) &
(cd ui && npm install && npm run dev) &
wait
