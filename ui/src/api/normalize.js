// Normaliza texto: minúsculas, sin tildes, espacios colapsados (equivalente a nombreBusqueda)
export const normalizar = (s = '') =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
