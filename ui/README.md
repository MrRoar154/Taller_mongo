# Directorio de casas desarrolladoras de software – Villavicencio (Frontend)

Taller 1 C3 · Desarrollo de directorio con Mongo. React + Vite, CSS plano.

## Ejecutar
```bash
npm install
cp .env.example .env      # ajuste las variables
npm run dev               # http://localhost:5173
npm run build             # compila a dist/
```

## Variables de entorno
| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | URL base de la API (`/api/casas`). La API debe permitir CORS desde `http://localhost:5173`. |
| `VITE_USE_MOCK` | `false` | `true` = modo demostración: 15 casas en memoria del navegador, con búsqueda y CRUD (se reinicia al recargar). |

Modo demo rápido: `VITE_USE_MOCK=true npm run dev`

En modo mock, `sitioWeb` es `null` salvo CODALTEC y Seobyte, que usan **https://example.com / https://example.org como datos de ejemplo** (no son sus sitios reales) para demostrar el enlace de la imagen.

## Funcionalidad
- Búsqueda por nombre o parte del nombre (sin distinguir mayúsculas ni tildes), con espera de 300 ms.
- Ficha resumen por casa según la Figura 1 del enunciado (`screenshots/mockup-figura1.png`).
- Crear, editar (envía siempre todos los campos, PUT reemplaza el registro) y eliminar con confirmación.
- Clic en la imagen abre el sitio oficial en una nueva pestaña; sin sitio: «Sitio oficial no disponible».
- Imagen de respaldo `src/assets/placeholder.svg` si `imagenUrl` es nula o falla.
- Mensajes de error de la API (`{"error": "..."}`, 400/404/409) se muestran al usuario.

## Estructura
`src/api/client.js` (API real + mock), `src/api/mockData.js`, `src/components/{FichaCasa,FormCasa,Modal}.jsx`, `src/App.jsx`, `src/styles.css`.
