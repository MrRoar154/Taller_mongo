import { useCallback, useEffect, useState } from 'react';
import { api, USE_MOCK } from './api/client.js';
import FichaCasa from './components/FichaCasa.jsx';
import FormCasa from './components/FormCasa.jsx';
import Modal from './components/Modal.jsx';

function useDebounce(valor, ms = 300) {
  const [d, setD] = useState(valor);
  useEffect(() => { const t = setTimeout(() => setD(valor), ms); return () => clearTimeout(t); }, [valor, ms]);
  return d;
}

function useTema() {
  const [tema, setTema] = useState(() => (document.documentElement.getAttribute('data-tema') === 'oscuro' ? 'oscuro' : 'claro'));
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const seguirSistema = () => {
      if (localStorage.getItem('tema')) return;
      const siguiente = media.matches ? 'oscuro' : 'claro';
      document.documentElement.setAttribute('data-tema', siguiente);
      setTema(siguiente);
    };
    media.addEventListener('change', seguirSistema);
    return () => media.removeEventListener('change', seguirSistema);
  }, []);
  const alternar = () => {
    const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro';
    localStorage.setItem('tema', siguiente);
    document.documentElement.setAttribute('data-tema', siguiente);
    setTema(siguiente);
  };
  return { tema, alternar };
}

function IconoTema({ oscuro }) {
  if (oscuro) {
    return (
      <svg className="icono-tema" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2.5v2.2M12 19.3V21.5M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="icono-tema" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 3.2A7.2 7.2 0 1 0 20.8 14 5.6 5.6 0 0 1 15 3.2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [q, setQ] = useState('');
  const qd = useDebounce(q, 300);
  const [casas, setCasas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [form, setForm] = useState(null); // {modo:'crear'|'editar', casa}
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState('');
  const { tema, alternar } = useTema();
  const oscuro = tema === 'oscuro';

  const cargar = useCallback(async (texto) => {
    setCargando(true); setError('');
    try { setCasas(await api.listar(texto)); } catch (e) { setError(e.message); setCasas([]); } finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(qd); }, [qd, cargar]);
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 3500); return () => clearTimeout(t); }, [aviso]);

  const guardar = async (datos) => {
    if (form.modo === 'crear') { const c = await api.crear(datos); setAviso(`«${c.nombre}» se creó correctamente.`); }
    else { const c = await api.actualizar(form.casa.id, datos); setAviso(`«${c.nombre}» se actualizó correctamente.`); }
    setForm(null); cargar(qd);
  };
  const confirmarBorrar = async () => {
    setBorrando(true); setErrorBorrar('');
    try { await api.eliminar(borrar.id); setAviso(`«${borrar.nombre}» se eliminó.`); setBorrar(null); cargar(qd); }
    catch (e) { setErrorBorrar(e.message); } finally { setBorrando(false); }
  };
  const cerrarForm = useCallback(() => setForm(null), []);
  const cerrarBorrar = useCallback(() => { setBorrar(null); setErrorBorrar(''); }, []);

  return (
    <>
      <header className="app-cabecera">
        <div className="contenedor cabecera-fila">
          <div>
            <h1>Directorio de casas desarrolladoras de software</h1>
            <p className="subtitulo">Villavicencio, Meta {USE_MOCK && <span className="chip-mock">Modo demostración (datos en memoria)</span>}</p>
          </div>
          <button type="button" className="btn btn-tema" aria-pressed={oscuro} onClick={alternar}>
            <IconoTema oscuro={oscuro} />
            {oscuro ? 'Tema claro' : 'Tema oscuro'}
          </button>
        </div>
      </header>
      <main className="contenedor">
        <div className="barra">
          <div className="buscador">
            <label htmlFor="buscar" className="sr-only">Buscar casa por nombre</label>
            <input id="buscar" type="search" placeholder="Buscar por nombre o parte del nombre…" value={q}
              onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
          <button type="button" className="btn btn-prim" onClick={() => setForm({ modo: 'crear', casa: null })}>+ Nueva casa</button>
        </div>
        <div aria-live="polite" className="estado">
          {aviso && <div className="alerta alerta-ok">{aviso}</div>}
          {!cargando && !error && <p className="conteo">{casas.length} {casas.length === 1 ? 'resultado' : 'resultados'}{qd.trim() && <> para «{qd.trim()}»</>}</p>}
        </div>
        {error && <div className="alerta alerta-error" role="alert">{error} <button className="btn btn-sec btn-mini" onClick={() => cargar(qd)}>Reintentar</button></div>}
        {cargando && <div className="cargando" role="status"><span className="spinner" aria-hidden="true" /> Cargando casas…</div>}
        {!cargando && !error && casas.length === 0 && (
          <div className="vacio"><p>No se encontraron casas desarrolladoras{qd.trim() ? <> que coincidan con «{qd.trim()}»</> : ''}.</p></div>
        )}
        {!cargando && !error && (
          <div className="lista">
            {casas.map((c, i) => <FichaCasa key={c.id} casa={c} numero={/^\d+$/.test(c.id) ? c.id : i + 1}
              onEditar={(casa) => setForm({ modo: 'editar', casa })} onEliminar={setBorrar} />)}
          </div>
        )}
      </main>
      <footer className="app-pie contenedor">Taller 1 C3 · Desarrollo de directorio con Mongo</footer>

      {form && (
        <Modal titulo={form.modo === 'crear' ? 'Nueva casa desarrolladora' : `Editar «${form.casa.nombre}»`} onCerrar={cerrarForm}>
          <FormCasa inicial={form.casa} onGuardar={guardar} onCancelar={cerrarForm} />
        </Modal>
      )}
      {borrar && (
        <Modal titulo="Confirmar eliminación" onCerrar={cerrarBorrar}>
          <p>¿Seguro que desea eliminar «<strong>{borrar.nombre}</strong>»? Esta acción no se puede deshacer.</p>
          {errorBorrar && <div className="alerta alerta-error" role="alert">{errorBorrar}</div>}
          <div className="modal-acciones">
            <button className="btn btn-sec" onClick={cerrarBorrar} disabled={borrando}>Cancelar</button>
            <button className="btn btn-peligro" onClick={confirmarBorrar} disabled={borrando}>{borrando ? 'Eliminando…' : 'Eliminar'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
