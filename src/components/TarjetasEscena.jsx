import { useState, useRef } from 'react'
import { useIdioma } from '../i18n.js'
import './TarjetasEscena.css'

// Agrupa los bloques en escenas: cada encabezado + sus bloques hasta el siguiente encabezado
function agruparEscenas(bloques) {
  const escenas = []
  let actual = null
  bloques.forEach(b => {
    if (b.tipo === 'encabezado') {
      actual = { encabezado: b, bloques: [] }
      escenas.push(actual)
    } else if (actual) {
      actual.bloques.push(b)
    }
  })
  return escenas
}

function resumenAccion(bloquesEscena) {
  const acciones = bloquesEscena.filter(b => b.tipo === 'accion' && b.texto.trim())
  return acciones.map(a => a.texto.trim()).join(' ')
}

function personajesEscena(bloquesEscena) {
  const set = new Set()
  bloquesEscena.forEach(b => {
    if (b.tipo === 'personaje' && b.texto.trim()) set.add(b.texto.trim().toUpperCase())
  })
  return [...set]
}

export default function TarjetasEscena({ bloques, onChange, onIrAEscena }) {
  const { t } = useIdioma()
  const escenas = agruparEscenas(bloques)

  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const dragNode = useRef(null)

  function onDragStart(e, idx) {
    setDragIdx(idx)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => { if (dragNode.current) dragNode.current.classList.add('arrastrando') }, 0)
  }

  function onDragEnter(e, idx) {
    e.preventDefault()
    if (idx !== dragIdx) setOverIdx(idx)
  }

  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  function onDrop(e, idx) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return

    // Reconstruye el array de bloques moviendo la escena completa
    const nuevasEscenas = [...escenas]
    const [movida] = nuevasEscenas.splice(dragIdx, 1)
    nuevasEscenas.splice(idx, 0, movida)

    const nuevosBloques = []
    nuevasEscenas.forEach(esc => {
      nuevosBloques.push(esc.encabezado, ...esc.bloques)
    })
    onChange(nuevosBloques)
    setDragIdx(null)
    setOverIdx(null)
  }

  function onDragEnd() {
    if (dragNode.current) dragNode.current.classList.remove('arrastrando')
    dragNode.current = null
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className="tarjetas-vista">
      <div className="tarjetas-grid">
        {escenas.length === 0 && (
          <div className="tarjetas-vacio">{t('tarjetas_vacio')}</div>
        )}
        {escenas.map((esc, i) => {
          const personajes = personajesEscena(esc.bloques)
          const accion = resumenAccion(esc.bloques)
          const nDialogos = esc.bloques.filter(b => b.tipo === 'dialogo').length
          return (
            <div
              key={esc.encabezado.id}
              className={`tarjeta ${overIdx === i ? 'es-over' : ''} ${dragIdx === i ? 'es-drag' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, i)}
              onDragEnter={e => onDragEnter(e, i)}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              onClick={() => onIrAEscena(esc.encabezado.id)}
              title={t('tarjeta_hint')}
            >
              <div className="tarjeta-cabecera">
                <span className="tarjeta-num">{i + 1}</span>
                <span className="tarjeta-titulo">{esc.encabezado.texto || t('escena_sin_titulo')}</span>
              </div>

              <div className="tarjeta-cuerpo">
                {accion ? (
                  <p className="tarjeta-accion">{accion}</p>
                ) : (
                  <p className="tarjeta-accion vacia">{t('sin_accion')}</p>
                )}
              </div>

              <div className="tarjeta-pie">
                {personajes.length > 0 && (
                  <div className="tarjeta-personajes">
                    {personajes.slice(0, 5).map(p => (
                      <span key={p} className="tarjeta-personaje-tag">{p}</span>
                    ))}
                    {personajes.length > 5 && <span className="tarjeta-personaje-tag mas">+{personajes.length - 5}</span>}
                  </div>
                )}
                {nDialogos > 0 && (
                  <span className="tarjeta-dialogos">{nDialogos} {nDialogos !== 1 ? t('dialogos') : t('dialogo_sing')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
