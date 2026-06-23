import { useState, useEffect, useRef } from 'react'
import { useIdioma } from '../i18n.js'
import './Bloque.css'

const PREFIJOS = ['INT.', 'EXT.', 'EXT/INT.', 'INT/EXT.', 'I/E.']

const MOMENTOS = [
  'DÍA', 'NOCHE', 'AMANECER', 'ATARDECER', 'HORA MÁGICA',
  'TARDE', 'MADRUGADA', 'CREPÚSCULO', 'CONTINÚA',
  'MÁS TARDE', 'SIMULTÁNEO', 'FLASHBACK', 'FLASH FORWARD',
]

const TRANSICIONES = [
  'CORTE A:', 'FUNDIDO A:', 'DISOLVENCIA A:', 'FUNDIDO EN NEGRO.',
  'IRIS A:', 'BARRIDO A:', 'CONGELADO.', 'CONTINÚA:',
  'MÁS TARDE:', 'FLASHBACK:', 'FIN.',
]

function calcularSugerenciasEncabezado(texto) {
  const up = texto.toUpperCase()
  const dashIdx = texto.indexOf(' - ')

  if (dashIdx !== -1) {
    // Fase 2: momento del día
    const despuesDash = up.slice(dashIdx + 3)
    if (despuesDash.length === 0) return { lista: MOMENTOS, tipo: 'momento' }
    const filtrados = MOMENTOS.filter(m => m.startsWith(despuesDash))
    return { lista: filtrados, tipo: 'momento' }
  } else {
    // Fase 1: prefijo solo si el texto es corto y no tiene espacio todavía
    // (hasta que el usuario empiece a escribir la locación)
    const tienePrefijo = PREFIJOS.some(p => up.startsWith(p))
    if (tienePrefijo) return { lista: [], tipo: null } // ya eligió prefijo
    const filtrados = PREFIJOS.filter(p => p.startsWith(up))
    if (filtrados.length === PREFIJOS.length && texto === '') return { lista: PREFIJOS, tipo: 'prefijo' }
    if (filtrados.length > 0 && texto.length > 0) return { lista: filtrados, tipo: 'prefijo' }
    return { lista: [], tipo: null }
  }
}

export default function Bloque({
  bloque, activo, refCallback, personajes, contd, estilos = {}, numeroEscena,
  onFocus, onCambio, onCambioYEnter, onEnter, onTab, onBorrarVacio,
  onArribaDesdeInicio, onAbajoDesdeEnd, onCambioNota
}) {
  const { t } = useIdioma()
  const [sugerencias, setSugerencias] = useState([])
  const [sugerTipo, setSugerTipo] = useState(null)
  const [sugerIdx, setSugerIdx] = useState(0)
  const [notaAbierta, setNotaAbierta] = useState(false)
  const divRef = useRef(null)

  useEffect(() => {
    if (refCallback) refCallback(divRef.current)
  })

  useEffect(() => {
    if (divRef.current && divRef.current.textContent !== bloque.texto) {
      divRef.current.textContent = bloque.texto
    }
  }, [bloque.id])

  // Al enfocar encabezado o transición, mostrar opciones
  useEffect(() => {
    if (!activo) { setSugerencias([]); setSugerTipo(null); return }
    // personaje vacío: se maneja en render, no aquí
    if (bloque.tipo === 'personaje') return
    if (bloque.tipo === 'encabezado') {
      const texto = bloque.texto || ''
      const dashIdx = texto.indexOf(' - ')
      // Si ya hay un momento completo, no mostrar nada
      if (dashIdx !== -1) {
        const despues = texto.slice(dashIdx + 3).toUpperCase()
        if (MOMENTOS.includes(despues)) { setSugerencias([]); setSugerTipo(null); return }
      }
      const { lista, tipo } = calcularSugerenciasEncabezado(texto)
      setSugerencias(lista); setSugerTipo(tipo); setSugerIdx(0)
    } else if (bloque.tipo === 'transicion') {
      const texto = (bloque.texto || '').toUpperCase()
      // Si ya coincide exactamente con una transición, no mostrar nada
      if (TRANSICIONES.includes(texto)) { setSugerencias([]); setSugerTipo(null); return }
      const filtradas = TRANSICIONES.filter(t => texto === '' || t.startsWith(texto))
      setSugerencias(filtradas); setSugerTipo('transicion'); setSugerIdx(0)
    }
  }, [activo, bloque.id])

  function getCursorPos() {
    const sel = window.getSelection()
    if (!sel.rangeCount) return { inicio: 0, fin: 0, enInicio: true, enFin: true }
    const range = sel.getRangeAt(0)
    const el = divRef.current
    const pre = range.cloneRange()
    pre.selectNodeContents(el)
    pre.setEnd(range.startContainer, range.startOffset)
    const inicio = pre.toString().length
    const texto = el.textContent || ''
    return { inicio, fin: inicio + range.toString().length, enInicio: inicio === 0, enFin: inicio >= texto.length }
  }

  function setCursor(el, pos) {
    try {
      const range = document.createRange()
      const sel = window.getSelection()
      const nodo = el.firstChild || el
      range.setStart(nodo, Math.min(pos, nodo.length ?? 0))
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {}
  }

  function onInput(e) {
    const texto = e.target.textContent || ''
    onCambio(texto)

    if (bloque.tipo === 'personaje') {
      const filtradas = personajes.filter(p =>
        p.toLowerCase().startsWith(texto.toLowerCase()) && p !== texto
      )
      setSugerencias(filtradas)
      setSugerTipo('personaje')
      setSugerIdx(0)
    } else if (bloque.tipo === 'encabezado') {
      const { lista, tipo } = calcularSugerenciasEncabezado(texto)
      setSugerencias(lista); setSugerTipo(tipo); setSugerIdx(0)
    } else if (bloque.tipo === 'transicion') {
      const filtradas = TRANSICIONES.filter(t => t.startsWith(texto.toUpperCase()))
      setSugerencias(filtradas); setSugerTipo('transicion'); setSugerIdx(0)
    } else {
      setSugerencias([]); setSugerTipo(null)
    }
  }

  function aplicarSugerencia(valor, tipo = sugerTipo) {
    if (tipo === 'prefijo') {
      // Insertar prefijo + espacio, dejar cursor al final
      const nuevo = valor + ' '
      onCambio(nuevo)
      if (divRef.current) {
        divRef.current.textContent = nuevo
        setCursor(divRef.current, nuevo.length)
      }
      setSugerencias([])
      setSugerTipo(null)
    } else if (tipo === 'momento') {
      // Reemplazar lo que haya después del ' - '
      const texto = divRef.current?.textContent || ''
      const dashIdx = texto.indexOf(' - ')
      const base = dashIdx !== -1 ? texto.slice(0, dashIdx + 3) : texto + ' - '
      const nuevo = base + valor
      if (divRef.current) divRef.current.textContent = nuevo
      setSugerencias([])
      setSugerTipo(null)
      onCambioYEnter(nuevo)
    } else if (tipo === 'transicion') {
      if (divRef.current) divRef.current.textContent = valor
      setSugerencias([]); setSugerTipo(null)
      onCambioYEnter(valor)
    } else {
      // Personaje
      if (divRef.current) divRef.current.textContent = valor
      setSugerencias([]); setSugerTipo(null)
      onCambioYEnter(valor)
    }
  }

  function onKeyDown(e) {
    if (listaMostrar.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSugerIdx(i => Math.min(i + 1, listaMostrar.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSugerIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter') { e.preventDefault(); aplicarSugerencia(listaMostrar[sugerIdx], tipoMostrar); return }
      // Tab: en la lista pasiva de personaje vacío NO acepta, deja cambiar el tipo de bloque.
      // En sugerencias escritas (encabezado/transición/personaje filtrado) sí acepta.
      if (e.key === 'Tab' && !esListaPasivaPersonaje) { e.preventDefault(); aplicarSugerencia(listaMostrar[sugerIdx], tipoMostrar); return }
      if (e.key === 'Escape')    { setSugerencias([]); setSugerTipo(null); return }
    }

    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnter(); return }
    if (e.key === 'Tab') { e.preventDefault(); onTab(); return }

    const { enInicio, enFin } = getCursorPos()
    if (e.key === 'Backspace' && enInicio && (divRef.current?.textContent || '') === '') {
      e.preventDefault(); onBorrarVacio(); return
    }
    if (e.key === 'ArrowUp' && enInicio)   { e.preventDefault(); onArribaDesdeInicio(); return }
    if (e.key === 'ArrowDown' && enFin)    { e.preventDefault(); onAbajoDesdeEnd(); return }

    // Auto-cierre de paréntesis
    if (e.key === '(') {
      e.preventDefault()
      const el = divRef.current
      const { inicio } = getCursorPos()
      const texto = el.textContent || ''
      const nuevoTexto = texto.slice(0, inicio) + '()' + texto.slice(inicio)
      el.textContent = nuevoTexto
      onCambio(nuevoTexto)
      setCursor(el, inicio + 1)
      return
    }

    // Al escribir ' - ' en un encabezado, preparar sugerencias de momento
    if (bloque.tipo === 'encabezado' && e.key === '-') {
      setTimeout(() => {
        const t = divRef.current?.textContent || ''
        const { lista, tipo } = calcularSugerenciasEncabezado(t)
        setSugerencias(lista)
        setSugerTipo(tipo)
        setSugerIdx(0)
      }, 10)
    }
  }

  // Lista de personajes para bloque vacío (ya viene ordenada desde Editor)
  const listaPersonajeVacio = activo && bloque.tipo === 'personaje' && !bloque.texto && personajes.length > 0
    ? personajes
    : null

  const listaMostrar  = sugerencias.length > 0 ? sugerencias : (listaPersonajeVacio || [])
  const tipoMostrar   = sugerencias.length > 0 ? sugerTipo   : (listaPersonajeVacio ? 'personaje' : null)
  // Lista "pasiva": el desplegable de personaje que aparece solo en un bloque vacío
  // (no el filtrado al escribir). En esta, Tab cambia el tipo en vez de aceptar.
  const esListaPasivaPersonaje = sugerencias.length === 0 && !!listaPersonajeVacio

  const mayus = bloque.tipo === 'encabezado' || bloque.tipo === 'personaje' || bloque.tipo === 'transicion'
  const esParentetico = bloque.tipo === 'parentetico'
  const esPersonajeContd = bloque.tipo === 'personaje' && contd && !!bloque.texto?.trim()

  const claseExtra = [
    estilos.subrayarEscena    && bloque.tipo === 'encabezado' ? 'subrayar' : '',
    estilos.negritaPersonaje  === false && bloque.tipo === 'personaje' ? 'sin-negrita' : '',
    estilos.parenteticoCursiva === false && bloque.tipo === 'parentetico' ? 'sin-cursiva' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      id={`bloque-${bloque.id}`}
      className={`bloque bloque-${bloque.tipo} ${activo ? 'activo' : ''} ${claseExtra} ${bloque.nota ? 'con-nota' : ''}`}
    >
      {bloque.tipo === 'encabezado' && estilos.numerosEscena && numeroEscena && (
        <span className="escena-numero">{numeroEscena}</span>
      )}
      {activo && (
        <span className="bloque-tipo-badge">{t(bloque.tipo)}</span>
      )}

      <button
        className={`bloque-nota-btn ${bloque.nota ? 'tiene-nota' : ''} ${notaAbierta ? 'abierta' : ''}`}
        onClick={() => setNotaAbierta(v => !v)}
        title={bloque.nota ? t('nota_ver') : t('nota_anadir')}
      >🗨</button>

      {notaAbierta && (
        <div className="bloque-nota-editor" onClick={e => e.stopPropagation()}>
          <textarea
            className="bloque-nota-texto"
            value={bloque.nota || ''}
            placeholder={t('nota_ph')}
            autoFocus
            onChange={e => onCambioNota(e.target.value)}
          />
          <div className="bloque-nota-acciones">
            {bloque.nota && (
              <button className="bloque-nota-borrar" onClick={() => { onCambioNota(''); setNotaAbierta(false) }}>{t('borrar')}</button>
            )}
            <button className="bloque-nota-cerrar" onClick={() => setNotaAbierta(false)}>{t('cerrar')}</button>
          </div>
        </div>
      )}

      <div className={esParentetico ? 'parentetico-wrap' : (esPersonajeContd ? 'personaje-wrap' : '')}>
        {esParentetico && <span className="paren paren-izq">(</span>}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          className={`bloque-texto ${mayus ? 'mayusculas' : ''}`}
          onFocus={onFocus}
          onInput={onInput}
          onKeyDown={onKeyDown}
          data-placeholder={t('ph_' + bloque.tipo)}
          spellCheck
        />
        {esParentetico && <span className="paren paren-der">)</span>}
        {esPersonajeContd && <span className="contd-sufijo">(CONT'D)</span>}
      </div>

      {listaMostrar.length > 0 && (
        <div className={`sugerencias sugerencias-${tipoMostrar}`}>
          {tipoMostrar === 'prefijo'    && <div className="suger-header">{t('suger_escena')}</div>}
          {tipoMostrar === 'momento'    && <div className="suger-header">{t('suger_momento')}</div>}
          {tipoMostrar === 'transicion' && <div className="suger-header">{t('suger_transicion')}</div>}
          {tipoMostrar === 'personaje'  && <div className="suger-header">{t('suger_personajes')}</div>}
          {listaMostrar.map((s, i) => (
            <div
              key={s}
              className={`sugerencia ${i === sugerIdx ? 'sel' : ''}`}
              onMouseDown={e => { e.preventDefault(); aplicarSugerencia(s, tipoMostrar) }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
