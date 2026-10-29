import { useState } from 'react';
import placeholder from '../assets/placeholder.svg';

const IconoUbicacion = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>);
const IconoPantalla = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v12H3zM5 6v8h14V6zM2 18h20v2H2z"/></svg>);
const IconoWeb = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15 15 0 0 0-1.3-3.8A8 8 0 0 1 18.9 8zM12 4c.8 1.1 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.9 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15 15 0 0 0 1.3 3.8A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-3.8A15 15 0 0 0 8.1 8zM12 20c-.8-1.1-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.9-1.9 4zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4zm.3 5.8a15 15 0 0 0 1.3-3.8h3a8 8 0 0 1-4.3 3.8zm1.7-5.8a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4z"/></svg>);

const dominio = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };

export default function FichaCasa({ casa, numero, onEditar, onEliminar }) {
  const [imgFallo, setImgFallo] = useState(false);
  const src = !casa.imagenUrl || imgFallo ? placeholder : casa.imagenUrl;
  const categoria = casa.especialidad.split(/[,&/]/)[0].trim();
  const img = (
    <img src={src} alt={casa.sitioWeb ? `Logo de ${casa.nombre}. Abrir sitio oficial` : `Imagen de ${casa.nombre}`}
      onError={() => setImgFallo(true)} loading="lazy" />
  );
  const tituloId = `casa-${casa.id}`;
  return (
    <article className="ficha" aria-labelledby={tituloId}>
      <header className="ficha-cabecera">
        <div>
          <p className="ficha-sobretitulo">EMPRESA {String(numero).padStart(2, '0')} · {casa.especialidad.toUpperCase()}</p>
          <h2 id={tituloId} className="ficha-nombre">{casa.nombre}</h2>
        </div>
        <span className="ficha-etiqueta">{categoria}</span>
      </header>
      <div className="ficha-cuerpo">
        <div className="ficha-datos">
          <section className="dato"><h3><IconoUbicacion /> Dirección sede principal</h3><p className="dato-valor">{casa.direccion}</p></section>
          <section className="dato"><h3><IconoPantalla /> Tipo de productos y software</h3><p>{casa.especialidad}</p></section>
          <section className="dato"><h3><IconoWeb /> Sitio oficial</h3>
            {casa.sitioWeb
              ? <p className="dato-valor"><a href={casa.sitioWeb} target="_blank" rel="noopener noreferrer">{dominio(casa.sitioWeb)}</a></p>
              : <p className="dato-muted">Sitio oficial no disponible</p>}
          </section>
        </div>
        <div className="ficha-imagen">
          {casa.sitioWeb
            ? <a href={casa.sitioWeb} target="_blank" rel="noopener noreferrer" title={`Ir al sitio oficial de ${casa.nombre} (nueva pestaña)`}>{img}</a>
            : img}
        </div>
      </div>
      <footer className="ficha-acciones">
        <button type="button" className="btn btn-sec" onClick={() => onEditar(casa)}>Editar</button>
        <button type="button" className="btn btn-peligro" onClick={() => onEliminar(casa)}>Eliminar</button>
      </footer>
    </article>
  );
}
