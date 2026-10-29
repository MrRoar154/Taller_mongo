// Misma regla que `normalizar` en cargar_casas.py:
// NFKD -> solo ASCII (quita tildes) -> minúsculas -> espacios colapsados y recortados.
function normalizar(texto) {
  const sinTildes = String(texto).normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
  return sinTildes.toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}

// Escapa caracteres especiales para usar el texto dentro de una RegExp.
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { normalizar, escaparRegex };
