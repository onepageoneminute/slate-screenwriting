import { useState, useRef, useCallback, useEffect, useLayoutEffect, Fragment } from 'react'
import Bloque from './Bloque.jsx'
import BarraHerramientas, { TIPOS } from './BarraHerramientas.jsx'
import { useIdioma } from '../i18n.js'
import './Editor.css'

let nextId = Date.now()
function nuevoId() { return ++nextId }

const SIGUIENTE_TIPO = {
  encabezado: 'accion',
  accion: 'personaje',   // tras una acción, Enter ofrece personaje (Tab → acción si quieres otra)
  personaje: 'dialogo',
  dialogo: 'personaje',
  parentetico: 'dialogo',
  transicion: 'encabezado',
}

export default function Editor({ bloques, onChange, estilos = {} }) {
  const { t } = useIdioma()
  const [bloqueActivo, setBloqueActivo] = useState(bloques[0]?.id ?? null)
  const refs = useRef({})

  const enfocar = useCallback((id, al = 'end') => {
    setBloqueActivo(id)
    setTimeout(() => {
      const el = refs.current[id]
      if (!el) return
      el.focus()
      try {
        const range = document.createRange()
        const sel = window.getSelection()
        const nodo = el.firstChild || el
        const pos = al === 'end' ? (nodo.length ?? 0) : 0
        range.setStart(nodo, pos)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } catch {}
    }, 10)
  }, [])

  function actualizarTexto(id, texto) {
    onChange(bloques.map(b => b.id === id ? { ...b, texto } : b))
  }

  function cambiarTipo(id, tipo) {
    onChange(bloques.map(b => b.id === id ? { ...b, tipo } : b))
  }

  // Convertir un diálogo vacío en paréntesis al escribir '('.
  // El bloque paréntesis ya dibuja los ( ) él solo, así que el texto queda vacío
  // y el cursor cae en el centro. Reenfocamos porque el div editable se reubica.
  function convertirAParentetico(id) {
    onChange(bloques.map(b => b.id === id ? { ...b, tipo: 'parentetico' } : b))
    enfocar(id, 'start')
  }

  function actualizarNota(id, nota) {
    onChange(bloques.map(b => b.id === id ? { ...b, nota } : b))
  }

  function insertarBloque(despuesDeId, tipo) {
    const idx = bloques.findIndex(b => b.id === despuesDeId)
    const nuevo = { id: nuevoId(), tipo, texto: '' }
    const nuevos = [...bloques]
    nuevos.splice(idx + 1, 0, nuevo)
    onChange(nuevos)
    enfocar(nuevo.id, 'start')
  }

  function eliminarBloque(id) {
    if (bloques.length === 1) return
    const idx = bloques.findIndex(b => b.id === id)
    const nuevos = bloques.filter(b => b.id !== id)
    onChange(nuevos)
    const anterior = nuevos[Math.max(0, idx - 1)]
    if (anterior) enfocar(anterior.id, 'end')
  }

  function moverAAnterior(id) {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx > 0) enfocar(bloques[idx - 1].id, 'end')
  }

  function moverASiguiente(id) {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx < bloques.length - 1) enfocar(bloques[idx + 1].id, 'start')
  }

  function onEnter(id) {
    const bloque = bloques.find(b => b.id === id)
    const siguiente = SIGUIENTE_TIPO[bloque?.tipo] || 'accion'
    insertarBloque(id, siguiente)
  }

  // Fija el texto de un bloque Y crea el siguiente en UNA sola actualización.
  // Evita que dos onChange seguidos (texto + insertar) se pisen por estado obsoleto.
  function actualizarTextoYEnter(id, texto) {
    const conTexto = bloques.map(b => b.id === id ? { ...b, texto } : b)
    const idx = conTexto.findIndex(b => b.id === id)
    const siguiente = SIGUIENTE_TIPO[conTexto[idx]?.tipo] || 'accion'
    const nuevo = { id: nuevoId(), tipo: siguiente, texto: '' }
    const nuevos = [...conTexto]
    nuevos.splice(idx + 1, 0, nuevo)
    onChange(nuevos)
    enfocar(nuevo.id, 'start')
  }

  // Tab inteligente: cada tipo salta al siguiente más lógico.
  // Así el paréntesis solo aparece tras el personaje (antes del diálogo),
  // no tras el diálogo.
  const TAB_SIGUIENTE = {
    accion:      'personaje',
    personaje:   'parentetico',
    parentetico: 'dialogo',
    dialogo:     'transicion',
    transicion:  'encabezado',
    encabezado:  'accion',
  }

  // En un bloque VACÍO, Tab recorre todos los tipos en bucle (sin atascarse).
  // Empieza Personaje → Acción para que, tras un diálogo, el primer Tab dé Acción.
  const CICLO_VACIO = ['personaje', 'accion', 'encabezado', 'transicion', 'dialogo', 'parentetico']

  function onTab(id) {
    const bloque = bloques.find(b => b.id === id)
    if (!bloque) return
    if (!bloque.texto?.trim()) {
      const i = CICLO_VACIO.indexOf(bloque.tipo)
      const siguiente = CICLO_VACIO[(i + 1) % CICLO_VACIO.length]
      cambiarTipo(id, siguiente)
      return
    }
    // Con texto escrito: salto inteligente (p. ej. personaje → paréntesis)
    cambiarTipo(id, TAB_SIGUIENTE[bloque.tipo] || 'accion')
  }

  const personajes = [...new Set(
    bloques.filter(b => b.tipo === 'personaje').map(b => b.texto.trim()).filter(Boolean)
  )]

  useEffect(() => {
    function onKeyDown(e) {
      if (!e.ctrlKey && !e.metaKey) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= TIPOS.length && bloqueActivo) {
        e.preventDefault()
        cambiarTipo(bloqueActivo, TIPOS[num - 1].id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bloqueActivo, bloques])

  const tipoActivo = bloques.find(b => b.id === bloqueActivo)?.tipo || 'accion'

  // Calcular número de escena para cada bloque encabezado
  let numEscena = 0
  const numEscenas = {}
  bloques.forEach(b => {
    if (b.tipo === 'encabezado') numEscenas[b.id] = ++numEscena
  })

  // Para cada bloque personaje:
  //  - personajesPorBloque: lista priorizando los de SU escena, el último hablante al final
  //  - contdPorBloque: true si el nombre coincide con el último que habló (continuación → CONT'D)
  const personajesPorBloque = {}
  const contdPorBloque = {}
  bloques.forEach((b, i) => {
    if (b.tipo !== 'personaje') return

    // Límites de la escena que contiene este bloque
    let ini = i
    while (ini > 0 && bloques[ini - 1].tipo !== 'encabezado') ini--
    let fin = i
    while (fin < bloques.length - 1 && bloques[fin + 1].tipo !== 'encabezado') fin++

    // Personajes que aparecen en esta escena (orden de aparición), salvo este propio bloque
    const enEscena = []
    for (let j = ini; j <= fin; j++) {
      if (j === i) continue
      if (bloques[j].tipo === 'personaje' && bloques[j].texto.trim()) {
        const n = bloques[j].texto.trim()
        if (!enEscena.some(x => x.toUpperCase() === n.toUpperCase())) enEscena.push(n)
      }
    }

    // Último que habló antes de este bloque (dentro de la escena)
    let ultimo = null
    for (let j = i - 1; j >= ini; j--) {
      if (bloques[j].tipo === 'personaje' && bloques[j].texto.trim()) {
        ultimo = bloques[j].texto.trim()
        break
      }
    }

    // Orden final: los de la escena (salvo el último) primero, luego el último,
    // y al final los globales que no aparezcan en la escena
    let orden
    if (ultimo) {
      const otros = enEscena.filter(p => p.toUpperCase() !== ultimo.toUpperCase())
      const mismo = enEscena.filter(p => p.toUpperCase() === ultimo.toUpperCase())
      orden = [...otros, ...mismo]
    } else {
      orden = [...enEscena]
    }
    personajes.forEach(p => {
      if (!orden.some(x => x.toUpperCase() === p.toUpperCase())) orden.push(p)
    })
    personajesPorBloque[b.id] = orden.length ? orden : personajes

    // CONT'D: el bloque ya tiene nombre y coincide con el último que habló en la escena
    if (b.texto.trim() && ultimo && b.texto.trim().toUpperCase() === ultimo.toUpperCase()) {
      contdPorBloque[b.id] = true
    }
  })

  const fs = estilos.tamanoFuente || 12

  // ── PAGINACIÓN EN HOJAS SEPARADAS ─────────────────────────────────────────
  // US Letter: 1056px de alto. Márgenes 96px arriba/abajo → 864px útiles.
  // Hueco visible entre hojas: 28px.
  // Mantenemos el texto en UN solo flujo (no se pierde el cursor) y, en cada
  // salto, insertamos un espaciador con la altura exacta para que el siguiente
  // bloque caiga al principio de la hoja siguiente. Las hojas blancas se dibujan
  // detrás como fondo.
  // A4 a 96dpi: 794 × 1123px. Útil = 247mm (A4 menos 2×25mm) = 933px,
  // para que la paginación en pantalla coincida con el PDF.
  const PAGE_H = 1123, GAP = 28, USABLE = 933, PAD_TOP = 94
  const contenidoRef = useRef(null)
  const editorRef = useRef(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [espaciadores, setEspaciadores] = useState({}) // idxBloque -> altura px
  const [numPaginas, setNumPaginas] = useState(1)

  // Refs para acceder al estado actual sin reejecutar efectos
  const espRef = useRef(espaciadores); espRef.current = espaciadores
  const numPagRef = useRef(numPaginas); numPagRef.current = numPaginas
  const paginarTimer = useRef(null)

  // Calcula los saltos de página midiendo el documento.
  // Como NO hay colapso de márgenes (contenedor flex + márgenes solo arriba),
  // reconstruir la posición natural restando los espaciadores es EXACTO: no hace
  // falta "limpiar" antes de medir, así que no parpadea y se calcula de una pasada.
  function paginar() {
    if (!contenidoRef.current) return
    const esp = espRef.current
    const nat = []
    let shift = 0
    for (let k = 0; k < bloques.length; k++) {
      if (esp[k]) shift += esp[k]
      const el = document.getElementById(`bloque-${bloques[k].id}`)
      nat.push(el ? { top: el.offsetTop - shift, h: el.offsetHeight } : null)
    }

    const breaks = {}
    let inicioPagina = PAD_TOP
    for (let k = 0; k < nat.length; k++) {
      const n = nat[k]; if (!n) continue
      if ((n.top + n.h) - inicioPagina > USABLE && (n.top - inicioPagina) > 0) {
        breaks[k] = true
        inicioPagina = n.top
      }
    }

    const nuevos = {}
    let j = 0, sh = 0
    for (let k = 0; k < nat.length; k++) {
      if (breaks[k]) {
        j++
        const objetivo = j * (PAGE_H + GAP) + PAD_TOP
        const sp = Math.max(0, Math.round(objetivo - (nat[k].top + sh)))
        nuevos[k] = sp
        sh += sp
      }
    }
    const paginas = j + 1
    const e0 = espRef.current
    const igual = paginas === numPagRef.current &&
      Object.keys(nuevos).length === Object.keys(e0).length &&
      Object.keys(nuevos).every(k => nuevos[k] === e0[k])
    if (!igual) { setEspaciadores(nuevos); setNumPaginas(paginas) }
  }

  // Mantener la última versión de paginar() accesible desde efectos estables
  const paginarRef = useRef(paginar); paginarRef.current = paginar

  // Al escribir: recalcular SOLO ~0.2s después de parar (debounce). El texto se ve
  // al instante; solo se difiere el recálculo de páginas → fluido en guiones largos.
  useLayoutEffect(() => {
    clearTimeout(paginarTimer.current)
    paginarTimer.current = setTimeout(() => paginarRef.current(), 200)
    return () => clearTimeout(paginarTimer.current)
  }, [bloques])

  // Primer cálculo inmediato + recálculo al redimensionar o cargar la fuente
  useLayoutEffect(() => {
    paginarRef.current()
    function r() { clearTimeout(paginarTimer.current); paginarTimer.current = setTimeout(() => paginarRef.current(), 150) }
    window.addEventListener('resize', r)
    let cancel = false
    document.fonts?.ready.then(() => { if (!cancel) paginarRef.current() })
    return () => { cancel = true; window.removeEventListener('resize', r) }
  }, [])

  useEffect(() => {
    const editorEl = editorRef.current
    if (!editorEl) return
    function onScroll() {
      const actual = Math.min(numPaginas, Math.floor(editorEl.scrollTop / (PAGE_H + GAP)) + 1)
      setPaginaActual(Math.max(1, actual))
    }
    editorEl.addEventListener('scroll', onScroll)
    return () => editorEl.removeEventListener('scroll', onScroll)
  }, [numPaginas])

  const docMinHeight = numPaginas * PAGE_H + (numPaginas - 1) * GAP

  // Clic en cualquier parte de la hoja → enfoca el bloque más cercano (como Word)
  function onClickDocumento(e) {
    if (e.target.closest('.bloque-texto')) return // clic sobre texto: comportamiento normal
    if (e.target.closest('.sugerencias') || e.target.closest('.bloque-nota-editor')) return
    const y = e.clientY
    let mejor = null, dist = Infinity
    for (const b of bloques) {
      const el = document.getElementById(`bloque-${b.id}`)
      if (!el) continue
      const r = el.getBoundingClientRect()
      const dentro = y >= r.top && y <= r.bottom
      const d = dentro ? -1 : Math.abs((r.top + r.height / 2) - y)
      if (d < dist) { dist = d; mejor = b }
    }
    if (mejor) enfocar(mejor.id, 'end')
  }

  return (
    <main className="editor" ref={editorRef}>
      <div className="documento" onMouseDown={onClickDocumento} style={{ minHeight: `${docMinHeight}px`, fontSize: `${fs}pt` }}>
        {/* Hojas blancas de fondo */}
        {Array.from({ length: numPaginas }).map((_, i) => (
          <div
            key={`hoja-${i}`}
            className="hoja"
            style={{ top: `${i * (PAGE_H + GAP)}px` }}
          >
            {estilos.numeroPagina && i > 0 && (
              <div className="hoja-numero">{i + 1}.</div>
            )}
          </div>
        ))}

        {/* Contenido en flujo continuo, con espaciadores en cada salto */}
        <div className="contenido" ref={contenidoRef}>
          {bloques.map((bloque, idx) => (
            <Fragment key={bloque.id}>
              {espaciadores[idx] > 0 && (
                <div className="salto-espaciador" style={{ height: `${espaciadores[idx]}px` }} />
              )}
              <Bloque
                bloque={bloque}
                activo={bloqueActivo === bloque.id}
                refCallback={el => { if (el) refs.current[bloque.id] = el }}
                personajes={personajesPorBloque[bloque.id] ?? personajes}
                contd={!!contdPorBloque[bloque.id]}
                estilos={estilos}
                numeroEscena={numEscenas[bloque.id]}
                onFocus={() => setBloqueActivo(bloque.id)}
                onCambio={texto => actualizarTexto(bloque.id, texto)}
                onCambioNota={nota => actualizarNota(bloque.id, nota)}
                onCambioYEnter={texto => actualizarTextoYEnter(bloque.id, texto)}
                onEnter={() => onEnter(bloque.id)}
                onTab={() => onTab(bloque.id)}
                onConvertirParentetico={() => convertirAParentetico(bloque.id)}
                onBorrarVacio={() => eliminarBloque(bloque.id)}
                onArribaDesdeInicio={() => moverAAnterior(bloque.id)}
                onAbajoDesdeEnd={() => moverASiguiente(bloque.id)}
              />
            </Fragment>
          ))}
        </div>
      </div>
      <BarraHerramientas
        tipoActivo={tipoActivo}
        onCambiarTipo={tipo => bloqueActivo && cambiarTipo(bloqueActivo, tipo)}
      />
      <div className="editor-estado">
        <span>{t('pag')} {paginaActual} / {numPaginas}</span>
        <span className="editor-estado-sep">·</span>
        <span>~{numPaginas} {t('min')}</span>
      </div>
    </main>
  )
}
