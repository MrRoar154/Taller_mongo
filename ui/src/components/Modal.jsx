import { useEffect, useRef } from 'react';
export default function Modal({ titulo, onCerrar, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input,button,textarea')?.focus();
    const k = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); prev?.focus?.(); };
  }, [onCerrar]);
  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" ref={ref}>
        <h2 id="modal-titulo">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
