// Datos de la Tabla 1. sitioWeb null salvo 2 registros con URL de EJEMPLO (solo mock, no son sitios reales).
const filas = [
  ['CODALTEC', 'Av. 40 # 24A - 71', 'Simulación & Ciberseguridad'],
  ['SASOFTCO', 'Cra 44B # 18-43 Mz D Ca 15', 'ERP a Medida, Apps Mobile'],
  ['Ideas Software', 'Villavicencio, Meta', 'Sistemas Administrativos'],
  ['Pegasus Software', 'Cra 19A # 35A - 54', 'Contabilidad & Facturación POS'],
  ['Seobyte', 'Villavicencio, Meta', 'Desarrollo Web & E-commerce'],
  ['Software & Apps Col', 'Cr 19B # 22-03 Macarena', 'Apps Móviles & Web'],
  ['SPS Solutions', 'Calle 4A # 17-88 Vizcaya', 'Infraestructura TI & Web'],
  ['Ingesoft Orinoquía', 'Calle 33A # 38-25 Barzal', 'ERP & Nómina Electrónica'],
  ['Synergia Tech', 'Cra 39 # 26C-12 7 de Agosto', 'E-learning & EdTech'],
  ['SoftLlanos', 'Calle 15 # 40-08 Camoa', 'POS & Inventarios'],
  ['Llanotec', 'Av. Circunvalar # 35-10', 'Software Médico & Salud'],
  ['AgroSoft Meta', 'Calle 26 Sur # 48-12', 'Software Agrícola & Ganadero'],
  ['MetaDevs Lab', 'Cra 38 # 33B-15 Barzal', 'APIs, Cloud & SaaS'],
  ['Global Code', 'Calle 15 # 37E-22 Esperanza', 'E-commerce B2B / B2C'],
  ['InnovaApp Tech', 'Cra 40 # 20-55 Centauros', 'Apps de Logística & Domicilios'],
];
const EJEMPLO = { 1: 'https://example.com', 5: 'https://example.org' }; // MOCK: placeholders de demostración
export const seed = () => filas.map(([nombre, direccion, especialidad], i) => ({
  id: String(i + 1), nombre, direccion, especialidad, imagenUrl: null, sitioWeb: EJEMPLO[i + 1] ?? null,
}));
