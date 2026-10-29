const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const { normalizar, escaparRegex } = require('./normalizar');

// Convierte un documento de Mongo al formato público (id en vez de _id).
function aPublico(doc) {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    direccion: doc.direccion,
    especialidad: doc.especialidad,
    imagenUrl: doc.imagenUrl ?? null,
    sitioWeb: doc.sitioWeb ?? null,
    nombreBusqueda: doc.nombreBusqueda,
  };
}

// Valida que sea null o una URL http(s).
function urlValida(valor) {
  if (valor === null) return true;
  if (typeof valor !== 'string') return false;
  try {
    const u = new URL(valor);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Valida el cuerpo de POST/PUT. Devuelve { error } o { doc }.
function validarCuerpo(body) {
  body = body || {};
  const doc = {};
  for (const campo of ['nombre', 'direccion', 'especialidad']) {
    const v = body[campo];
    if (typeof v !== 'string' || v.trim() === '') {
      return { error: `El campo '${campo}' es obligatorio` };
    }
    // Recorta extremos y colapsa espacios internos
    doc[campo] = v.trim().split(/\s+/).join(' ');
  }
  for (const campo of ['imagenUrl', 'sitioWeb']) {
    let v = body[campo];
    if (v === undefined || v === '') v = null;
    if (typeof v === 'string') v = v.trim();
    if (!urlValida(v)) return { error: `El campo '${campo}' debe ser una URL http(s) o null` };
    doc[campo] = v;
  }
  // La API calcula nombreBusqueda; se ignora si el cliente lo envía.
  doc.nombreBusqueda = normalizar(doc.nombre);
  return { doc };
}

// Convierte el :id a ObjectId o devuelve null si no es válido.
function parsearId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}

function crearApp(coleccion) {
  const app = express();
  // Parser 'extended' para detectar y rechazar q como objeto (?q[$ne]=x)
  app.set('query parser', 'extended');
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Listar / buscar (parcial, sin tildes ni mayúsculas)
  app.get('/api/casas', async (req, res, next) => {
    try {
      // q debe ser texto plano (no arreglo ni objeto, evita inyección de operadores)
      if (req.query.q !== undefined && typeof req.query.q !== 'string') {
        return res.status(400).json({ error: 'El parametro q debe ser texto' });
      }
      const filtro = {};
      const q = req.query.q ? normalizar(req.query.q) : '';
      if (q) filtro.nombreBusqueda = { $regex: escaparRegex(q) };
      const docs = await coleccion.find(filtro).sort({ nombre: 1 }).toArray();
      res.json(docs.map(aPublico));
    } catch (e) { next(e); }
  });

  app.get('/api/casas/:id', async (req, res, next) => {
    try {
      const _id = parsearId(req.params.id);
      if (!_id) return res.status(400).json({ error: 'Id inválido' });
      const doc = await coleccion.findOne({ _id });
      if (!doc) return res.status(404).json({ error: 'Casa no encontrada' });
      res.json(aPublico(doc));
    } catch (e) { next(e); }
  });

  app.post('/api/casas', async (req, res, next) => {
    try {
      const { error, doc } = validarCuerpo(req.body);
      if (error) return res.status(400).json({ error });
      const r = await coleccion.insertOne(doc);
      res.status(201).json(aPublico({ _id: r.insertedId, ...doc }));
    } catch (e) { next(e); }
  });

  app.put('/api/casas/:id', async (req, res, next) => {
    try {
      const _id = parsearId(req.params.id);
      if (!_id) return res.status(400).json({ error: 'Id inválido' });
      const { error, doc } = validarCuerpo(req.body);
      if (error) return res.status(400).json({ error });
      // Reemplaza el documento completo (conserva _id, elimina campos sobrantes)
      const r = await coleccion.replaceOne({ _id }, doc);
      if (r.matchedCount === 0) return res.status(404).json({ error: 'Casa no encontrada' });
      res.json(aPublico({ _id, ...doc }));
    } catch (e) { next(e); }
  });

  app.delete('/api/casas/:id', async (req, res, next) => {
    try {
      const _id = parsearId(req.params.id);
      if (!_id) return res.status(400).json({ error: 'Id inválido' });
      const r = await coleccion.deleteOne({ _id });
      if (r.deletedCount === 0) return res.status(404).json({ error: 'Casa no encontrada' });
      res.status(204).end();
    } catch (e) { next(e); }
  });

  // Rutas inexistentes
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // Manejo central de errores: JSON mal formado, duplicados y errores internos.
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    if (err.code === 11000) return res.status(409).json({ error: 'Ya existe una casa con ese nombre' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

// Conecta a Mongo, crea el índice único y devuelve { client, coleccion }.
async function conectar(uri) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const coleccion = client.db('directorio').collection('casas');
  await coleccion.createIndex({ nombreBusqueda: 1 }, { unique: true });
  return { client, coleccion };
}

module.exports = { crearApp, conectar };
