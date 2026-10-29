// Pruebas de la API con node:test + supertest + mongodb-memory-server.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { crearApp, conectar } = require('../src/app');
const { normalizar } = require('../src/normalizar');

let mongod, client, app;
const nombres = ['Ingesoft Orinoquía', 'SASOFTCO', 'SoftLlanos', 'AgroSoft Meta', 'Llanotec'];

before(async () => {
  mongod = await MongoMemoryServer.create();
  ({ client, coleccion: col } = await conectar(mongod.getUri()));
  app = crearApp(col);
  for (const nombre of nombres) {
    await request(app).post('/api/casas')
      .send({ nombre, direccion: 'Villavicencio', especialidad: 'Software' }).expect(201);
  }
});
let col;
after(async () => { await client?.close(); await mongod?.stop(); });

test('normalizar igual que Python', () => {
  assert.equal(normalizar('  Ingesoft   ORINOQUÍA\t'), 'ingesoft orinoquia');
  assert.equal(normalizar('Ñandú Café'), 'nandu cafe');
});

test('health', async () => {
  const r = await request(app).get('/api/health').expect(200);
  assert.equal(r.body.status, 'ok');
});

test('lista todo ordenado por nombre, con id y sin _id', async () => {
  const r = await request(app).get('/api/casas').expect(200);
  assert.equal(r.body.length, nombres.length);
  assert.deepEqual(r.body.map((c) => c.nombre), [...nombres].sort());
  assert.equal(typeof r.body[0].id, 'string');
  assert.equal(r.body[0]._id, undefined);
});

test('búsqueda parcial sin tildes ni mayúsculas', async () => {
  let r = await request(app).get('/api/casas?q=orinoquia').expect(200);
  assert.deepEqual(r.body.map((c) => c.nombre), ['Ingesoft Orinoquía']);
  r = await request(app).get('/api/casas?q=ORINOQUÍA').expect(200);
  assert.equal(r.body.length, 1);
  r = await request(app).get('/api/casas?q=SOFT').expect(200);
  assert.deepEqual(r.body.map((c) => c.nombre).sort(),
    ['AgroSoft Meta', 'Ingesoft Orinoquía', 'SASOFTCO', 'SoftLlanos']);
  r = await request(app).get('/api/casas?q=.*').expect(200); // regex escapado
  assert.equal(r.body.length, 0);
});

test('CRUD completo y errores', async () => {
  const c = await request(app).post('/api/casas')
    .send({ nombre: '  Global   Code ', direccion: 'Cra 1', especialidad: 'Web',
      sitioWeb: 'https://globalcode.example', nombreBusqueda: 'hack' }).expect(201);
  assert.equal(c.body.nombre, 'Global Code');
  assert.equal(c.body.nombreBusqueda, 'global code');
  assert.equal(c.body.imagenUrl, null);
  const id = c.body.id;

  await request(app).get(`/api/casas/${id}`).expect(200);
  await request(app).get('/api/casas/123').expect(400);
  await request(app).get('/api/casas/000000000000000000000000').expect(404);

  // 400 por validación
  await request(app).post('/api/casas').send({ nombre: ' ', direccion: 'x', especialidad: 'y' }).expect(400);
  await request(app).post('/api/casas').send({ nombre: 'A', direccion: 'x' }).expect(400);
  const e = await request(app).post('/api/casas')
    .send({ nombre: 'B', direccion: 'x', especialidad: 'y', sitioWeb: 'ftp://x' }).expect(400);
  assert.ok(e.body.error);
  await request(app).post('/api/casas').set('Content-Type', 'application/json').send('{mal').expect(400);

  // 409 por duplicado (tildes/mayúsculas distintas)
  await request(app).post('/api/casas')
    .send({ nombre: 'INGESOFT ORINOQUIA', direccion: 'x', especialidad: 'y' }).expect(409);

  // PUT
  const u = await request(app).put(`/api/casas/${id}`)
    .send({ nombre: 'Global Códe', direccion: 'Cra 2', especialidad: 'Móvil', imagenUrl: 'http://img.example/a.png' }).expect(200);
  assert.equal(u.body.nombreBusqueda, 'global code');
  assert.equal(u.body.direccion, 'Cra 2');
  assert.equal(u.body.sitioWeb, null);
  await request(app).put(`/api/casas/${id}`)
    .send({ nombre: 'SoftLlanos', direccion: 'x', especialidad: 'y' }).expect(409);
  await request(app).put('/api/casas/000000000000000000000000')
    .send({ nombre: 'Z', direccion: 'x', especialidad: 'y' }).expect(404);
  await request(app).put('/api/casas/abc').send({}).expect(400);

  // DELETE
  await request(app).delete(`/api/casas/${id}`).expect(204);
  await request(app).delete(`/api/casas/${id}`).expect(404);
  await request(app).delete('/api/casas/abc').expect(400);
});

test('índice único creado', async () => {
  const idx = await col.indexes();
  assert.ok(idx.some((i) => i.key.nombreBusqueda === 1 && i.unique));
});

test('q no textual -> 400', async () => {
  for (const url of ['/api/casas?q=a&q=b', '/api/casas?q[$ne]=x']) {
    const r = await request(app).get(url).expect(400);
    assert.deepEqual(r.body, { error: 'El parametro q debe ser texto' });
  }
});

test('colapsa espacios internos en nombre, direccion y especialidad', async () => {
  const r = await request(app).post('/api/casas')
    .send({ nombre: '  Casa \t  Espacios ', direccion: ' Calle  1 ', especialidad: 'Web   y  Móvil' }).expect(201);
  assert.equal(r.body.nombre, 'Casa Espacios');
  assert.equal(r.body.direccion, 'Calle 1');
  assert.equal(r.body.especialidad, 'Web y Móvil');
  await request(app).delete(`/api/casas/${r.body.id}`).expect(204);
});

test('PUT reemplaza el documento y elimina campos sobrantes', async () => {
  const { ObjectId } = require('mongodb');
  const ins = await col.insertOne({ nombre: 'Vieja', direccion: 'x', especialidad: 'y',
    nombreBusqueda: 'vieja', sobrante: 'borrar' });
  const id = ins.insertedId.toString();
  const r = await request(app).put(`/api/casas/${id}`)
    .send({ nombre: 'Renovada', direccion: 'd', especialidad: 'e' }).expect(200);
  assert.equal(r.body.id, id);
  const doc = await col.findOne({ _id: new ObjectId(id) });
  assert.equal(doc.sobrante, undefined);
  assert.equal(doc.nombreBusqueda, 'renovada');
  await col.deleteOne({ _id: doc._id });
});
