import { useState, useRef } from 'react'
import { useIdioma } from '../i18n.js'
import './SidePanel.css'

function getPersonajesEscena(bloques, escenaId) {
  const idx = bloques.findIndex(b => b.id === escenaId)
  if (idx === -1) return []
  const nombres = new Set()
  for (let i = idx + 1; i < bloques.length; i++) {
    if (bloques[i].tipo === 'encabezado') break
    if (bloques[i].tipo === 'personaje' && bloques[i].texto.trim()) {
      nombres.add(bloques[i].texto.trim())
    }
  }
  return [...nombres]
}

export default function SidePanel({ bloques, onIrA, onReordenar }) {
  const { t } = useIdioma()
  const escenas = bloques.filter(b => b.tipo === 'encabezado')

  const [dragIdx, setDragIdx]     = useState(null)
  const [overIdx, setOverIdx]     = useState(null)
  const dragNode = useRef(null)

  function onDragStart(e, idx) {
    setDragIdx(idx)
    dragNode.current = e.currentTarget
    e.dataTransfer.effectAllowed = 'move'
    // pequeño retraso para que se vea el elemento antes de oscurecerlo
    setTimeout(() => { if (dragNode.current) dragNode.current.classList.add('arrastrando') }, 0)
  }

  function onDragEnter(e, idx) {
    e.preventDefault()
    if (idx !== dragIdx) setOverIdx(idx)
  }

  function onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e, idx) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return

    // Reordenamos los bloques completos (no solo encabezados)
    // Calculamos los índices reales en el array bloques
    const idOrigen  = escenas[dragIdx].id
    const idDestino = escenas[idx].id

    const idxOrigen  = bloques.findIndex(b => b.id === idOrigen)
    const idxDestino = bloques.findIndex(b => b.id === idDestino)

    // Extraemos el bloque de encabezado y todos los bloques de su escena
    function limitesEscena(desde) {
      let fin = desde + 1
      while (fin < bloques.length && bloques[fin].tipo !== 'encabezado') fin++
      return fin
    }

    const finOrigen  = limitesEscena(idxOrigen)
    const bloquesMover = bloques.slice(idxOrigen, finOrigen)

    // Quitamos esos bloques
    const resto = [...bloques.slice(0, idxOrigen), ...bloques.slice(finOrigen)]

    // Encontramos el nuevo índice de destino en el array reducido
    const nuevoIdxDestino = resto.findIndex(b => b.id === idDestino)

    // Insertamos delante o detrás según dirección
    const insertEn = dragIdx < idx ? limitesEscena2(resto, nuevoIdxDestino) : nuevoIdxDestino
    function limitesEscena2(arr, desde) {
      let fin = desde + 1
      while (fin < arr.length && arr[fin].tipo !== 'encabezado') fin++
      return fin
    }

    const nuevo = [...resto.slice(0, insertEn), ...bloquesMover, ...resto.slice(insertEn)]
    onReordenar(nuevo)
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
    <aside className="side-panel">
      <div className="panel-header">
        <span>{t('estructura')}</span>
        <span className="panel-count">{escenas.length}</span>
      </div>

      <div className="panel-lista">
        {escenas.length === 0 && (
          <div className="panel-vacio">{t('sin_escenas')}</div>
        )}
        {escenas.map((bloque, i) => {
          const personajes = getPersonajesEscena(bloques, bloque.id)
          const esOver = overIdx === i
          const esDrag = dragIdx === i
          return (
            <div
              key={bloque.id}
              className={`panel-item ${esDrag ? 'es-drag' : ''} ${esOver ? 'es-over' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, i)}
              onDragEnter={e => onDragEnter(e, i)}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, i)}
              onDragEnd={onDragEnd}
              onClick={() => onIrA(bloque.id)}
              title={bloque.texto}
            >
              <span className="panel-drag-handle">⠿</span>
              <div className="panel-item-body">
                <div className="panel-item-top">
                  <span className="panel-num">{i + 1}</span>
                  <span className="panel-texto">{bloque.texto || t('escena_sin_titulo')}</span>
                </div>
                {personajes.length > 0 && (
                  <div className="panel-personajes">
                    {personajes.map(p => (
                      <span key={p} className="panel-personaje-tag">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
