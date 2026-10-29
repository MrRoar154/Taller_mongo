import { useState } from 'react';

const vacio = { nombre: '', direccion: '', especialidad: '', imagenUrl: '', sitioWeb: '' };
const urlValida = (v) => { try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

export default function FormCasa({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState({ ...vacio, ...Object.fromEntries(Object.entries(inicial || {}).map(([k, x]) => [k, x ?? ''])) });
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [enviando, setEnviando] = useState(false);

  const validar = () => {
    const e = {};
    if (!v.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
    if (!v.direccion.trim()) e.direccion = 'La dirección es obligatoria.';
    if (!v.especialidad.trim()) e.especialidad = 'La especialidad es obligatoria.';
    if (v.imagenUrl.trim() && !urlValida(v.imagenUrl.trim())) e.imagenUrl = 'Ingrese una URL válida (http/https).';
    if (v.sitioWeb.trim() && !urlValida(v.sitioWeb.trim())) e.sitioWeb = 'Ingrese una URL válida (http/https).';
    return e;
  };
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validar(); setErrores(e); setErrorApi('');
    if (Object.keys(e).length) return;
    setEnviando(true);
    try { await onGuardar(v); } catch (err) { setErrorApi(err.message); setEnviando(false); }
  };
  const campo = (k, label, req, type = 'text', ph = '') => (
    <div className="campo">
      <label htmlFor={`f-${k}`}>{label}{req && <span aria-hidden="true" className="req"> *</span>}</label>
      <input id={`f-${k}`} type={type} value={v[k]} placeholder={ph} required={req}
        aria-invalid={!!errores[k]} aria-describedby={errores[k] ? `e-${k}` : undefined}
        onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      {errores[k] && <p id={`e-${k}`} className="campo-error">{errores[k]}</p>}
    </div>
  );
  return (
    <form onSubmit={submit} noValidate>
      {errorApi && <div className="alerta alerta-error" role="alert">{errorApi}</div>}
      {campo('nombre', 'Nombre', true, 'text', 'Ej.: CODALTEC')}
      {campo('direccion', 'Dirección', true, 'text', 'Ej.: Av. 40 # 24A - 71')}
      {campo('especialidad', 'Especialidad', true, 'text', 'Ej.: Desarrollo Web & E-commerce')}
      {campo('imagenUrl', 'URL de la imagen (opcional)', false, 'url', 'https://…')}
      {campo('sitioWeb', 'Sitio web oficial (opcional)', false, 'url', 'https://…')}
      <p className="nota">* Campos obligatorios</p>
      <div className="modal-acciones">
        <button type="button" className="btn btn-sec" onClick={onCancelar} disabled={enviando}>Cancelar</button>
        <button type="submit" className="btn btn-prim" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  );
}
