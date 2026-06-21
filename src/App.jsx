import { useState, useEffect, useRef, useCallback } from 'react'
import Topbar from './components/Topbar.jsx'
import SidePanel from './components/SidePanel.jsx'
import Editor from './components/Editor.jsx'
import ModalPortada from './components/ModalPortada.jsx'
import PanelEstilo from './components/PanelEstilo.jsx'
import PantallaInicio from './components/PantallaInicio.jsx'
import BuscadorGuion from './components/BuscadorGuion.jsx'
import ModalEstadisticas from './components/ModalEstadisticas.jsx'
import TarjetasEscena from './components/TarjetasEscena.jsx'
import BienvenidaCarpeta from './components/BienvenidaCarpeta.jsx'
import { useEstilo } from './hooks/useEstilo.js'
import { useIdioma } from './i18n.js'
import * as almacen from './almacen.js'
import { parseFountain } from './utils/importar.js'
import './App.css'

function proyectoVacio(nombre = 'Sin título', carpetaId = null) {
  return {
    id: Date.now(),
    nombre,
    carpetaId,
    creado: new Date().toISOString(),
    modificado: new Date().toISOString(),
    bloques: [{ id: 1, tipo: 'encabezado', texto: 'INT. LUGAR - DÍA' }]
  }
}

function carpetaVacia(nombre) {
  return { id: Date.now(), nombre }
}

export default function App() {
  const [proyectos, setProyectos] = useState([])
  const [carpetas, setCarpetas]   = useState([])
  const [carpeta, setCarpeta]     = useState(null)   // ruta de la biblioteca (o 'navegador')
  const [cargando, setCargando]   = useState(true)

  const [proyectoActualId, setProyectoActualId] = useState(null)
  const [panelAbierto, setPanelAbierto]   = useState(true)
  const [modalPortada, setModalPortada]   = useState(false)
  const [panelEstilo, setPanelEstilo]     = useState(false)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)
  const [statsAbierto, setStatsAbierto]   = useState(false)
  const [vista, setVista]                 = useState('guion')
  const [guardando, setGuardando]         = useState(false)
  const [epoca, setEpoca]                 = useState(0) // se incrementa al deshacer/rehacer para remontar el editor

  const { estilos, toggle, setValor } = useEstilo()
  const { idioma, setIdioma } = useIdioma()

  // ── Historial de deshacer/rehacer (sobre los bloques del proyecto activo) ──
  const pasado      = useRef([])   // estados anteriores
  const futuro      = useRef([])   // estados rehacer
  const base        = useRef(null) // último estado "consolidado"
  const commitTimer = useRef(null)
  const bloquesRef  = useRef(null) // bloques actuales del proyecto abierto

  // ── Carga inicial desde disco (o localStorage en navegador) ───────────────
  useEffect(() => {
    (async () => {
      const r = await almacen.cargar()
      setCarpeta(r.carpeta)
      setProyectos(r.proyectos)
      setCarpetas(r.carpetas)
      setCargando(false)
      // ¿Se abrió la app con un guion (doble clic en un .slate)?
      const inicial = await almacen.archivoInicial()
      if (inicial) {
        setProyectos(prev => prev.some(p => p.id === inicial.id) ? prev : [...prev, inicial])
        setProyectoActualId(inicial.id)
      }
    })()
  }, [])

  // Abrir un guion cuando la app ya está abierta (doble clic en otro .slate)
  useEffect(() => {
    almacen.onAbrirArchivo((proy) => {
      if (!proy) return
      setProyectos(prev => prev.some(p => p.id === proy.id) ? prev : [...prev, proy])
      setProyectoActualId(proy.id)
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', estilos.modoOscuro ? 'oscuro' : 'claro')
  }, [estilos.modoOscuro])

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && proyectoActualId) {
        e.preventDefault()
        setBuscadorAbierto(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [proyectoActualId])

  // ── Guardado ───────────────────────────────────────────────────────────────
  const guardar = useCallback(async (proyecto) => {
    setGuardando(true)
    const guardado = await almacen.guardarProyecto(proyecto)
    if (guardado._archivo && guardado._archivo !== proyecto._archivo) {
      setProyectos(prev => prev.map(p => p.id === guardado.id ? { ...p, _archivo: guardado._archivo } : p))
    }
    setGuardando(false)
  }, [])

  // Autoguardado con retardo (para no escribir el archivo en cada tecla)
  const timerRef = useRef(null)
  const programarGuardado = useCallback((proyecto) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => guardar(proyecto), 700)
  }, [guardar])

  const proyectoActual = proyectos.find(p => p.id === proyectoActualId)
  bloquesRef.current = proyectoActual?.bloques ?? null

  // Reinicia el historial al abrir otro proyecto
  useEffect(() => {
    pasado.current = []
    futuro.current = []
    base.current = bloquesRef.current
    clearTimeout(commitTimer.current)
  }, [proyectoActualId])

  function abrirProyecto(id) { setProyectoActualId(id); setPanelEstilo(false) }
  function volverInicio() { setProyectoActualId(null); setPanelEstilo(false); setModalPortada(false) }

  // Consolida un punto de historial (agrupa ráfagas de escritura)
  function consolidarHistorial() {
    clearTimeout(commitTimer.current)
    const actual = bloquesRef.current
    if (base.current && actual && base.current !== actual) {
      pasado.current.push(base.current)
      if (pasado.current.length > 100) pasado.current.shift()
      futuro.current = []
      base.current = actual
    }
  }

  function aplicarRestaurado(bloques) {
    setProyectos(prev => prev.map(p => {
      if (p.id !== proyectoActualId) return p
      const act = { ...p, bloques, modificado: new Date().toISOString() }
      programarGuardado(act)
      return act
    }))
    setEpoca(e => e + 1) // remonta el editor para reflejar el contenido restaurado
  }

  function deshacer() {
    if (!proyectoActual) return
    consolidarHistorial()
    if (pasado.current.length === 0) return
    futuro.current.push(bloquesRef.current)
    const restore = pasado.current.pop()
    base.current = restore
    aplicarRestaurado(restore)
  }

  function rehacer() {
    if (!proyectoActual) return
    if (futuro.current.length === 0) return
    pasado.current.push(bloquesRef.current)
    const restore = futuro.current.pop()
    base.current = restore
    aplicarRestaurado(restore)
  }

  // Mantener referencia a las acciones para el atajo de teclado (sin closures obsoletos)
  const accionesRef = useRef({})
  accionesRef.current = { deshacer, rehacer }

  useEffect(() => {
    function onKeyDown(e) {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      // No interceptar si el foco está en un campo de texto normal (notas, renombrar…)
      const tag = (e.target?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); accionesRef.current.deshacer() }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); accionesRef.current.rehacer() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Edición de bloques: estado inmediato + guardado diferido + historial diferido
  function actualizarBloques(bloques) {
    setProyectos(prev => prev.map(p => {
      if (p.id !== proyectoActualId) return p
      const actualizado = { ...p, bloques, modificado: new Date().toISOString() }
      programarGuardado(actualizado)
      return actualizado
    }))
    clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(consolidarHistorial, 450)
  }

  function nuevoProyecto(carpetaId = null) {
    const p = proyectoVacio('Sin título', carpetaId)
    setProyectos(prev => [...prev, p])
    guardar(p)
    setProyectoActualId(p.id)
  }

  function renombrarProyecto(id, nombre) {
    setProyectos(prev => prev.map(p => {
      if (p.id !== id) return p
      const act = { ...p, nombre, modificado: new Date().toISOString() }
      guardar(act)
      return act
    }))
  }

  function eliminarProyecto(id) {
    const p = proyectos.find(x => x.id === id)
    if (p) almacen.borrarProyecto(p)
    setProyectos(prev => prev.filter(x => x.id !== id))
    if (proyectoActualId === id) volverInicio()
  }

  function moverProyecto(id, carpetaId) {
    setProyectos(prev => prev.map(p => {
      if (p.id !== id) return p
      const act = { ...p, carpetaId, modificado: new Date().toISOString() }
      guardar(act)
      return act
    }))
  }

  function duplicarProyecto(id) {
    const original = proyectos.find(p => p.id === id)
    if (!original) return
    const copia = {
      ...JSON.parse(JSON.stringify(original)),
      id: Date.now(),
      nombre: original.nombre + ' (copia)',
      creado: new Date().toISOString(),
      modificado: new Date().toISOString(),
    }
    delete copia._archivo
    setProyectos(prev => [...prev, copia])
    guardar(copia)
  }

  function guardarPortada(datos) {
    setProyectos(prev => prev.map(p => {
      if (p.id !== proyectoActualId) return p
      const act = { ...p, portada: datos, modificado: new Date().toISOString() }
      guardar(act)
      return act
    }))
    setModalPortada(false)
  }

  // ── Carpetas (Largos, Cortos…) ─────────────────────────────────────────────
  function persistirCarpetas(nuevas) {
    setCarpetas(nuevas)
    almacen.guardarCarpetas(nuevas)
  }
  function nuevaCarpeta(nombre) { persistirCarpetas([...carpetas, carpetaVacia(nombre)]) }
  function renombrarCarpeta(id, nombre) { persistirCarpetas(carpetas.map(c => c.id === id ? { ...c, nombre } : c)) }
  function eliminarCarpeta(id) {
    persistirCarpetas(carpetas.filter(c => c.id !== id))
    setProyectos(prev => prev.map(p => {
      if (p.carpetaId !== id) return p
      const act = { ...p, carpetaId: null }
      guardar(act)
      return act
    }))
  }

  // ── Elegir / cambiar carpeta de biblioteca ─────────────────────────────────
  async function elegirCarpeta() {
    const r = await almacen.elegirCarpeta()
    if (!r) return
    setCarpeta(r.carpeta)
    setProyectos(r.proyectos)
    setCarpetas(r.carpetas)
    setProyectoActualId(null)
  }

  // ── Importar Fountain ───────────────────────────────────────────────────────
  async function importar(carpetaId = null) {
    const r = await almacen.importarFountain()
    if (!r) return
    const p = {
      id: Date.now(),
      nombre: r.nombre || 'Importado',
      carpetaId,
      creado: new Date().toISOString(),
      modificado: new Date().toISOString(),
      bloques: parseFountain(r.texto),
    }
    setProyectos(prev => [...prev, p])
    guardar(p)
    setProyectoActualId(p.id)
  }

  // Arrastrar archivos .slate a la app para añadirlos
  async function soltarArchivos(fileList) {
    const files = [...fileList].filter(f => /\.(slate|json)$/i.test(f.name))
    for (const f of files) {
      try {
        const proy = JSON.parse(await f.text())
        if (!proy || !Array.isArray(proy.bloques)) continue
        delete proy._archivo
        let abrir = proy.id
        setProyectos(prev => {
          if (prev.some(p => p.id === proy.id)) { abrir = proy.id; return prev }
          return [...prev, proy]
        })
        guardar(proy)
        setProyectoActualId(abrir)
      } catch {}
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (cargando) {
    return <div className="app-cargando">…</div>
  }

  // En escritorio, si aún no hay carpeta elegida → pantalla de bienvenida
  if (almacen.esEscritorio && !carpeta) {
    return <BienvenidaCarpeta onElegir={elegirCarpeta} modoOscuro={estilos.modoOscuro} />
  }

  if (!proyectoActualId) {
    return (
      <PantallaInicio
        proyectos={proyectos}
        carpetas={carpetas}
        estilos={estilos}
        carpeta={carpeta}
        esEscritorio={almacen.esEscritorio}
        onAbrir={abrirProyecto}
        onNuevo={nuevoProyecto}
        onImportar={importar}
        onSoltarArchivos={soltarArchivos}
        onCambiarCarpeta={elegirCarpeta}
        onEliminar={eliminarProyecto}
        onRenombrar={renombrarProyecto}
        onMover={moverProyecto}
        onDuplicar={duplicarProyecto}
        onNuevaCarpeta={nuevaCarpeta}
        onRenombrarCarpeta={renombrarCarpeta}
        onEliminarCarpeta={eliminarCarpeta}
        onToggleTema={() => toggle('modoOscuro')}
        modoOscuro={estilos.modoOscuro}
      />
    )
  }

  return (
    <div className="app">
      <Topbar
        proyecto={proyectoActual}
        estilos={estilos}
        guardando={guardando}
        onVolver={volverInicio}
        onNuevo={() => nuevoProyecto()}
        panelAbierto={panelAbierto}
        onTogglePanel={() => setPanelAbierto(v => !v)}
        proyectos={proyectos}
        onCambiarProyecto={abrirProyecto}
        onEliminar={eliminarProyecto}
        onRenombrar={renombrarProyecto}
        onEditarPortada={() => setModalPortada(true)}
        onEstadisticas={() => setStatsAbierto(true)}
        vista={vista}
        onCambiarVista={setVista}
        onAjustes={() => setPanelEstilo(v => !v)}
        estilosAbierto={panelEstilo}
        modoOscuro={estilos.modoOscuro}
        onToggleTema={() => toggle('modoOscuro')}
      />
      {modalPortada && (
        <ModalPortada
          proyecto={proyectoActual}
          onGuardar={guardarPortada}
          onCerrar={() => setModalPortada(false)}
        />
      )}
      {buscadorAbierto && (
        <BuscadorGuion
          bloques={proyectoActual?.bloques || []}
          onCerrar={() => setBuscadorAbierto(false)}
        />
      )}
      {statsAbierto && (
        <ModalEstadisticas
          proyecto={proyectoActual}
          onCerrar={() => setStatsAbierto(false)}
        />
      )}
      {panelEstilo && (
        <PanelEstilo
          estilos={estilos}
          toggle={toggle}
          setValor={setValor}
          onCerrar={() => setPanelEstilo(false)}
        />
      )}
      <div className="app-cuerpo">
        {panelAbierto && (
          <SidePanel
            bloques={proyectoActual?.bloques || []}
            estilos={estilos}
            onIrA={(id) => {
              if (vista !== 'guion') setVista('guion')
              setTimeout(() => {
                document.getElementById(`bloque-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 50)
            }}
            onReordenar={actualizarBloques}
          />
        )}
        {vista === 'tarjetas' ? (
          <TarjetasEscena
            bloques={proyectoActual?.bloques || []}
            onChange={actualizarBloques}
            onIrAEscena={(id) => {
              setVista('guion')
              setTimeout(() => {
                document.getElementById(`bloque-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 50)
            }}
          />
        ) : (
          <Editor
            key={`${proyectoActualId}-${epoca}`}
            bloques={proyectoActual?.bloques || []}
            onChange={actualizarBloques}
            estilos={estilos}
          />
        )}
      </div>
    </div>
  )
}
