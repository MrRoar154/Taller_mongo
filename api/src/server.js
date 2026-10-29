const { crearApp, conectar } = require('./app');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const PORT = Number(process.env.PORT) || 3000;

// Arranque: conecta a Mongo (creando el índice) y luego escucha.
conectar(MONGO_URI)
  .then(({ coleccion }) => {
    crearApp(coleccion).listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('No se pudo conectar a MongoDB:', e.message);
    process.exit(1);
  });
