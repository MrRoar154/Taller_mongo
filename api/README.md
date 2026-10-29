# API de casas desarrolladoras (Express + MongoDB)

Base `directorio`, colección `casas`. Al arrancar se crea un índice único sobre `nombreBusqueda`.
`nombreBusqueda` lo calcula la API (minúsculas, sin tildes NFKD→ASCII, espacios colapsados), igual que `normalizar` en `../cargar_casas.py`.

## Ejecutar
```bash
cd api
npm install
MONGO_URI=mongodb://localhost:27017 PORT=3000 npm start   # ambas variables son opcionales
npm test   # usa mongodb-memory-server (descarga mongod la primera vez)
```

Los documentos se devuelven con `id` (string) en vez de `_id`. Errores: `{"error":"mensaje"}`.
`imagenUrl` y `sitioWeb` son opcionales (null por defecto). En nombre, direccion y especialidad se recortan extremos y se colapsan espacios internos. `imagenUrl` y `sitioWeb` deben ser URL http(s) o null.

## Rutas

### GET /api/health
```bash
curl http://localhost:3000/api/health
# 200 {"status":"ok"}
```

### GET /api/casas  (todas, ordenadas por nombre)  /  ?q=texto (búsqueda parcial sin tildes/mayúsculas)
```bash
curl "http://localhost:3000/api/casas?q=orinoquia"
# 200 [{"id":"6710...","nombre":"Ingesoft Orinoquía","direccion":"...","especialidad":"...",
#       "imagenUrl":null,"sitioWeb":null,"nombreBusqueda":"ingesoft orinoquia"}]
curl "http://localhost:3000/api/casas?q=SOFT"   # con las 15 casas cargadas devuelve 7: AgroSoft Meta, Ideas Software, Ingesoft Orinoquía, Pegasus Software, SASOFTCO, SoftLlanos y Software & Apps Col
```

### GET /api/casas/:id
```bash
curl http://localhost:3000/api/casas/6710aa00bb11cc22dd33ee44
# 200 {"id":"6710aa00bb11cc22dd33ee44","nombre":"Llanotec",...}
# 404 {"error":"Casa no encontrada"}   400 {"error":"Id inválido"}
```

### POST /api/casas
```bash
curl -X POST http://localhost:3000/api/casas -H "Content-Type: application/json" \
  -d '{"nombre":"Nueva Casa Demo","direccion":"Cra 1 #2-3","especialidad":"Web","sitioWeb":"https://demo.example"}'
# 201 {"id":"6710...","nombre":"Nueva Casa Demo","direccion":"Cra 1 #2-3","especialidad":"Web",
#      "imagenUrl":null,"sitioWeb":"https://demo.example","nombreBusqueda":"nueva casa demo"}
# 400 {"error":"El campo 'especialidad' es obligatorio"}
# 409 {"error":"Ya existe una casa con ese nombre"}
```

### PUT /api/casas/:id  (reemplaza el documento completo con replaceOne; misma validación que POST)
```bash
curl -X PUT http://localhost:3000/api/casas/6710... -H "Content-Type: application/json" \
  -d '{"nombre":"Global Code","direccion":"Cra 2","especialidad":"Móvil"}'
# 200 {"id":"6710...","nombre":"Global Code","direccion":"Cra 2","especialidad":"Móvil","imagenUrl":null,"sitioWeb":null,"nombreBusqueda":"global code"}
# 400 / 404 / 409 como arriba
```

### DELETE /api/casas/:id
```bash
curl -X DELETE http://localhost:3000/api/casas/6710...
# 204 (sin cuerpo)   404 {"error":"Casa no encontrada"}
```
