import { useState, useEffect, useRef, useCallback } from 'react'
import { useIdioma } from '../i18n.js'
import './BuscadorGuion.css'

export default function BuscadorGuion({ bloques, onCerrar }) {
  const { t } = useIdioma()
  const [query, setQuery]       = useState('')
  const [resultados, setResultados] = useState([]) // [{ bloqueId, texto, indices }]
  const [actual, setActual]     = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cierra con Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  // Recalcula resultados cuando cambia query
  useEffect(() => {
    if (!query.trim()) { setResultados([]); setActual(0); return }
    const q = query.toLowerCase()
    const res = []
    bloques.forEach(b => {
      const texto = b.texto || ''
      const lower = texto.toLowerCase()
      let pos = 0
      while (true) {
        const idx = lower.indexOf(q, pos)
        if (idx === -1) break
        res.push({ bloqueId: b.id, tipo: b.tipo, texto, inicio: idx, fin: idx + q.length })
        pos = idx + 1
      }
    })
    setResultados(res)
    setActual(0)
  }, [query, bloques])

  // Navegar y hacer scroll al resultado actual
  useEffect(() => {
    if (resultados.length === 0) return
    const r = resultados[actual]
    const el = document.getElementById(`bloque-${r.bloqueId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [actual, resultados])

  function irA(idx) {
    setActual(((idx % resultados.length) + resultados.length) % resultados.length)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (resultados.length === 0) return
      irA(e.shiftKey ? actual - 1 : actual + 1)
    }
  }

  // Resalta el texto con la coincidencia marcada
  function resaltar(texto, inicio, fin, esActual) {
    return (
      <>
        {texto.slice(0, inicio)}
        <mark className={`marca ${esActual ? 'marca-activa' : ''}`}>
          {texto.slice(inicio, fin)}
        </mark>
        {texto.slice(fin)}
      </>
    )
  }

  const resultadoActual = resultados[actual]

  return (
    <div className="buscador-overlay" onClick={onCerrar}>
      <div className="buscador" onClick={e => e.stopPropagation()}>
        <div className="buscador-fila">
          <span className="buscador-icono">🔍</span>
          <input
            ref={inputRef}
            className="buscador-input"
            placeholder={t('buscar_ph')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {resultados.length > 0 && (
            <span className="buscador-count">{actual + 1} / {resultados.length}</span>
          )}
          {query && resultados.length === 0 && (
            <span className="buscador-sin-res">{t('sin_resultados')}</span>
          )}
          <button className="buscador-nav" onClick={() => irA(actual - 1)} disabled={resultados.length === 0} title="Anterior (Shift+Enter)">↑</button>
          <button className="buscador-nav" onClick={() => irA(actual + 1)} disabled={resultados.length === 0} title="Siguiente (Enter)">↓</button>
          <button className="buscador-cerrar" onClick={onCerrar}>✕</button>
        </div>

        {resultados.length > 0 && (
          <div className="buscador-lista">
            {resultados.map((r, i) => (
              <div
                key={i}
                className={`buscador-item ${i === actual ? 'activo' : ''}`}
                onClick={() => irA(i)}
              >
                <span className="buscador-tipo">{r.tipo.slice(0, 3).toUpperCase()}</span>
                <span className="buscador-fragmento">
                  {resaltar(r.texto, r.inicio, r.fin, i === actual)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
