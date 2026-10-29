# Directorio de casas desarrolladoras de software de Villavicencio

Taller 1 C3. Tres partes que corren en local: **MongoDB** (Docker), **API** (Node + Express, puerto 3000) e **interfaz** (React + Vite, puerto 5173).

```
ui/ (5173)  --->  api/ (3000)  --->  MongoDB (27017)
                                        base `directorio`, colección `casas`
carga/  script en Python que carga las 15 casas (se puede repetir sin duplicar)
```

## Arranque rápido
Requisitos: Docker Desktop abierto, Node.js 18+ y Python 3.10+.

- **Windows:** doble clic en `iniciar.bat`.
- **Linux/Mac:** `./iniciar.sh`

Después abra **http://localhost:5173**.

## Arranque paso a paso
```bash
docker compose up -d                                   # 1. Mongo
cd carga && pip install -r requirements.txt && python cargar_casas.py   # 2. datos (15 casas)
cd ../api && npm install && MONGO_URI=mongodb://localhost:27017 PORT=3000 npm start   # 3. API
cd ../ui && npm install && npm run dev                 # 4. interfaz
```
En Windows (CMD) la variable se pone con `set MONGO_URI=mongodb://localhost:27017` y `set PORT=3000` antes de `npm start`.

## Comprobar que funciona
- API: http://localhost:3000/api/health debe responder `{"status":"ok"}`.
- Lista: http://localhost:3000/api/casas devuelve 15 casas.
- Interfaz: la lista muestra 15 fichas; buscar `orinoquia` encuentra «Ingesoft Orinoquía».

## Mongo sin Docker
Instale MongoDB Community Server, déjelo como servicio y use la misma URI (`mongodb://localhost:27017`). El resto de los pasos es igual.

## Variables
| Variable | Dónde | Por defecto |
|---|---|---|
| `MONGO_URI` | api y carga | `mongodb://localhost:27017` |
| `PORT` | api | `3000` |
| `VITE_API_URL` | ui/.env | `http://localhost:3000` |
| `VITE_USE_MOCK` | ui/.env | `false` (`true` = datos de ejemplo sin backend) |

## Problemas comunes
- **Puerto 27017 ocupado:** apague otro Mongo o cambie el puerto en `docker-compose.yml` y en `MONGO_URI`.
- **La interfaz dice que no conecta:** verifique que la API esté en el puerto 3000 y que `ui/.env` tenga `VITE_API_URL` correcto.
- **Quedó sin datos:** vuelva a correr `python cargar_casas.py` (no duplica).
- **Borrar todo y empezar de cero:** `docker compose down -v`.
- Para poco RAM (8 GB): cierre otros programas pesados antes de levantar Docker.
