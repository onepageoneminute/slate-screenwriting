import { useState, useEffect } from 'react'
import { useIdioma } from '../i18n.js'
import * as almacen from '../almacen.js'
import './PantallaInicio.css'

// Idiomas de corrector más comunes (se filtran por los disponibles en el sistema)
const IDIOMAS_CORRECTOR = [
  { cands: ['es-ES', 'es'], name: 'Español' },
  { cands: ['en-US', 'en-GB', 'en'], name: 'English' },
  { cands: ['fr-FR', 'fr'], name: 'Français' },
  { cands: ['de-DE', 'de'], name: 'Deutsch' },
  { cands: ['it-IT', 'it'], name: 'Italiano' },
  { cands: ['pt-PT', 'pt'], name: 'Português' },
  { cands: ['pt-BR'], name: 'Português (Brasil)' },
  { cands: ['ca'], name: 'Català' },
  { cands: ['nl'], name: 'Nederlands' },
  { cands: ['sv'], name: 'Svenska' },
  { cands: ['da'], name: 'Dansk' },
  { cands: ['nb'], name: 'Norsk' },
  { cands: ['pl'], name: 'Polski' },
  { cands: ['ru'], name: 'Русский' },
  { cands: ['ro'], name: 'Română' },
  { cands: ['el'], name: 'Ελληνικά' },
  { cands: ['tr'], name: 'Türkçe' },
  { cands: ['cs'], name: 'Čeština' },
  { cands: ['hu'], name: 'Magyar' },
  { cands: ['uk'], name: 'Українська' },
]

function tiempoRelativo(iso, t, idioma) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  const h   = Math.floor(diff / 3600000)
  const d   = Math.floor(diff / 86400000)
  if (min < 2)  return t('ahora_mismo')
  if (min < 60) return t('hace_min', { n: min })
  if (h < 24)   return t('hace_horas', { n: h })
  if (d === 1)  return t('ayer')
  if (d < 7)    return t('hace_dias', { n: d })
  return new Date(iso).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })
}

export default function PantallaInicio({
  proyectos, carpetas, estilos, carpeta, esEscritorio,
  onAbrir, onNuevo, onNuevoShotList, onImportar, onSoltarArchivos, onCambiarCarpeta,
  onEliminar, onRenombrar, onMover, onDuplicar,
  onNuevaCarpeta, onRenombrarCarpeta, onEliminarCarpeta,
  onToggleTema, modoOscuro
}) {
  const { t, idioma, setIdioma } = useIdioma()
  const [corrector, setCorrector] = useState({ opciones: [], actual: null })
  const [carpetaActiva, setCarpetaActiva] = useState('todos')

  useEffect(() => {
    if (!esEscritorio) return
    almacen.idiomasCorrector().then(({ disponibles, actual }) => {
      const opciones = IDIOMAS_CORRECTOR
        .map(i => ({ code: i.cands.find(c => disponibles.includes(c)), name: i.name }))
        .filter(o => o.code)
      setCorrector({ opciones, actual })
    })
  }, [esEscritorio])
  const [menuProyecto, setMenuProyecto]   = useState(null) // id del proyecto con menú abierto
  const [editandoCarpeta, setEditandoCarpeta] = useState(null)
  const [nuevaCarpetaMode, setNuevaCarpetaMode] = useState(false)
  const [nuevaCarpetaNombre, setNuevaCarpetaNombre] = useState('')
  const [renombrando, setRenombrando] = useState(null) // { id, nombre }
  const [arrastrando, setArrastrando] = useState(false)
  const [proyectoArrastrado, setProyectoArrastrado] = useState(null)
  const [carpetaSobre, setCarpetaSobre] = useState(null) // id de carpeta resaltada al soltar encima

  const proyectosFiltrados = proyectos.filter(p =>
    carpetaActiva === 'todos'     ? true :
    carpetaActiva === 'sin-carpeta' ? !p.carpetaId :
    p.carpetaId === carpetaActiva
  ).sort((a, b) => new Date(b.modificado || b.creado) - new Date(a.modificado || a.creado))

  function confirmarNuevaCarpeta() {
    if (nuevaCarpetaNombre.trim()) {
      onNuevaCarpeta(nuevaCarpetaNombre.trim())
    }
    setNuevaCarpetaMode(false)
    setNuevaCarpetaNombre('')
  }

  function confirmarRenombrar() {
    if (renombrando && renombrando.nombre.trim()) {
      onRenombrar(renombrando.id, renombrando.nombre.trim())
    }
    setRenombrando(null)
  }

  return (
    <div
      className={`inicio ${arrastrando ? 'arrastrando-archivo' : ''}`}
      onDragOver={e => { e.preventDefault(); if (proyectoArrastrado == null && !arrastrando) setArrastrando(true) }}
      onDragLeave={e => { if (e.target === e.currentTarget) setArrastrando(false) }}
      onDrop={e => {
        e.preventDefault()
        setArrastrando(false)
        if (e.dataTransfer?.files?.length) onSoltarArchivos(e.dataTransfer.files)
      }}
    >
      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className="inicio-sidebar">
        <div className="inicio-logo">🎬 Slate</div>

        <nav className="inicio-nav">
          <button
            className={`nav-item ${carpetaActiva === 'todos' ? 'activo' : ''}`}
            onClick={() => setCarpetaActiva('todos')}
          >
            <span className="nav-icono">◈</span>
            <span>{t('todos_proyectos')}</span>
            <span className="nav-count">{proyectos.length}</span>
          </button>

          <button
            className={`nav-item ${carpetaActiva === 'sin-carpeta' ? 'activo' : ''} ${carpetaSobre === 'sin-carpeta' ? 'soltar-aqui' : ''}`}
            onClick={() => setCarpetaActiva('sin-carpeta')}
            onDragOver={e => { if (proyectoArrastrado != null) { e.preventDefault(); setCarpetaSobre('sin-carpeta') } }}
            onDragLeave={() => setCarpetaSobre(s => s === 'sin-carpeta' ? null : s)}
            onDrop={e => { e.preventDefault(); e.stopPropagation(); if (proyectoArrastrado != null) onMover(proyectoArrastrado, null); setProyectoArrastrado(null); setCarpetaSobre(null) }}
          >
            <span className="nav-icono">·</span>
            <span>{t('sin_carpeta')}</span>
            <span className="nav-count">{proyectos.filter(p => !p.carpetaId).length}</span>
          </button>

          {carpetas.length > 0 && <div className="nav-separador">{t('carpetas')}</div>}

          {carpetas.map(c => (
            <div key={c.id} className="nav-carpeta-wrap">
              {editandoCarpeta === c.id ? (
                <input
                  className="nav-rename-input"
                  defaultValue={c.nombre}
                  autoFocus
                  onBlur={e => { onRenombrarCarpeta(c.id, e.target.value); setEditandoCarpeta(null) }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onRenombrarCarpeta(c.id, e.target.value); setEditandoCarpeta(null) }
                    if (e.key === 'Escape') setEditandoCarpeta(null)
                  }}
                />
              ) : (
                <button
                  className={`nav-item ${carpetaActiva === c.id ? 'activo' : ''} ${carpetaSobre === c.id ? 'soltar-aqui' : ''}`}
                  onClick={() => setCarpetaActiva(c.id)}
                  onDoubleClick={() => setEditandoCarpeta(c.id)}
                  onDragOver={e => { if (proyectoArrastrado != null) { e.preventDefault(); setCarpetaSobre(c.id) } }}
                  onDragLeave={() => setCarpetaSobre(s => s === c.id ? null : s)}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); if (proyectoArrastrado != null) onMover(proyectoArrastrado, c.id); setProyectoArrastrado(null); setCarpetaSobre(null) }}
                >
                  <span className="nav-icono">📁</span>
                  <span className="nav-nombre">{c.nombre}</span>
                  <span className="nav-count">{proyectos.filter(p => p.carpetaId === c.id).length}</span>
                  <button
                    className="nav-borrar-carpeta"
                    onClick={e => { e.stopPropagation(); onEliminarCarpeta(c.id) }}
                    title={t('eliminar')}
                  >✕</button>
                </button>
              )}
            </div>
          ))}

          {nuevaCarpetaMode ? (
            <input
              className="nav-rename-input"
              placeholder={t('nombre_carpeta_ph')}
              value={nuevaCarpetaNombre}
              autoFocus
              onChange={e => setNuevaCarpetaNombre(e.target.value)}
              onBlur={confirmarNuevaCarpeta}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmarNuevaCarpeta()
                if (e.key === 'Escape') { setNuevaCarpetaMode(false); setNuevaCarpetaNombre('') }
              }}
            />
          ) : (
            <button className="nav-nueva-carpeta" onClick={() => setNuevaCarpetaMode(true)}>
              {t('nueva_carpeta')}
            </button>
          )}
        </nav>

        <div className="inicio-sidebar-footer">
          {esEscritorio && (
            <button className="btn-carpeta-biblio" onClick={onCambiarCarpeta} title={carpeta || ''}>
              📁 <span className="biblio-ruta">{carpeta ? carpeta.split(/[\\/]/).pop() : t('elegir_carpeta_corto')}</span>
            </button>
          )}
          <div className="select-idioma-wrap" title={idioma === 'es' ? 'Idioma' : 'Language'}>
            <span className="select-idioma-icono">🌐</span>
            <select
              className="select-idioma"
              value={idioma}
              onChange={e => setIdioma(e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {esEscritorio && corrector.opciones.length > 0 && (
            <div className="select-idioma-wrap" title={t('corrector_label')}>
              <span className="select-idioma-icono">📖</span>
              <select
                className="select-idioma"
                value={corrector.actual || ''}
                onChange={e => { almacen.setIdiomaCorrector(e.target.value); setCorrector(c => ({ ...c, actual: e.target.value })) }}
              >
                {corrector.opciones.map(o => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn-tema" onClick={onToggleTema}>
            {modoOscuro ? t('modo_claro') : t('modo_oscuro')}
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO ───────────────────────────── */}
      <div className="inicio-contenido">
        <div className="inicio-header">
          <div>
            <h1 className="inicio-titulo">
              {carpetaActiva === 'todos' ? t('todos_proyectos') :
               carpetaActiva === 'sin-carpeta' ? t('sin_carpeta') :
               carpetas.find(c => c.id === carpetaActiva)?.nombre}
            </h1>
            <p className="inicio-subtitulo">{proyectosFiltrados.length} {proyectosFiltrados.length !== 1 ? t('proyecto_plural') : t('proyecto_singular')}</p>
          </div>
          <div className="inicio-acciones">
            <button className="btn-importar-proy" onClick={() => onImportar(carpetaActiva === 'todos' || carpetaActiva === 'sin-carpeta' ? null : carpetaActiva)}>
              {t('importar')}
            </button>
            <button className="btn-nuevo-shotlist" onClick={() => onNuevoShotList(carpetaActiva === 'todos' || carpetaActiva === 'sin-carpeta' ? null : carpetaActiva)}>
              Nuevo Guión Técnico
            </button>
            <button className="btn-nuevo-proyecto" onClick={() => onNuevo(carpetaActiva === 'todos' || carpetaActiva === 'sin-carpeta' ? null : carpetaActiva)}>
              {t('nuevo_proyecto')}
            </button>
          </div>
        </div>

        <div className="proyectos-grid">
          {proyectosFiltrados.map(p => (
            <div
              key={p.id}
              className={`proyecto-card ${menuProyecto === p.id ? 'menu-abierto' : ''} ${proyectoArrastrado === p.id ? 'card-arrastrando' : ''}`}
              draggable={renombrando?.id !== p.id}
              onDragStart={e => { e.stopPropagation(); setProyectoArrastrado(p.id); e.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { setProyectoArrastrado(null); setCarpetaSobre(null) }}
              onClick={() => { if (!menuProyecto) onAbrir(p.id) }}
            >
              <div className="card-preview">
                {p.tipo === 'shotlist' ? (
                  <div className="card-shotlist-preview">
                    <span className="card-shotlist-icono">🎬</span>
                    <span className="card-shotlist-label">Guión Técnico</span>
                    <span className="card-shotlist-count">{p.shotlist?.length || 0} planos</span>
                  </div>
                ) : (
                  <>
                    <div className="card-linea bold">{p.nombre.toUpperCase()}</div>
                    {p.bloques?.slice(0, 3).map((b, i) => (
                      <div key={i} className={`card-linea tipo-${b.tipo}`}>{b.texto}</div>
                    ))}
                  </>
                )}
              </div>

              <div className="card-info">
                <div className="card-nombre">
                  {renombrando?.id === p.id ? (
                    <input
                      className="card-rename"
                      value={renombrando.nombre}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      onChange={e => setRenombrando({ id: p.id, nombre: e.target.value })}
                      onBlur={confirmarRenombrar}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmarRenombrar()
                        if (e.key === 'Escape') setRenombrando(null)
                      }}
                    />
                  ) : (
                    <span>{p.nombre}</span>
                  )}
                </div>
                <div className="card-meta">
                  {p.tipo === 'shotlist'
                    ? <span>{p.shotlist?.length || 0} planos</span>
                    : <span>{p.bloques?.filter(b => b.tipo === 'encabezado').length} {t('escenas')}</span>
                  }
                  <span>·</span>
                  <span>{tiempoRelativo(p.modificado || p.creado, t, idioma)}</span>
                </div>
              </div>

              <button
                className="card-menu-btn"
                onClick={e => { e.stopPropagation(); setMenuProyecto(menuProyecto === p.id ? null : p.id) }}
              >⋯</button>

              {menuProyecto === p.id && (
                <>
                  <div className="card-menu-overlay" onClick={e => { e.stopPropagation(); setMenuProyecto(null) }} />
                  <div className="card-menu" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { onAbrir(p.id); setMenuProyecto(null) }}>{t('abrir')}</button>
                    <button onClick={() => { setRenombrando({ id: p.id, nombre: p.nombre }); setMenuProyecto(null) }}>{t('renombrar')}</button>
                    <button onClick={() => { onDuplicar(p.id); setMenuProyecto(null) }}>{t('duplicar')}</button>
                    <div className="menu-separador">{t('mover_a_carpeta')}</div>
                    <button onClick={() => { onMover(p.id, null); setMenuProyecto(null) }}>
                      {!p.carpetaId ? '✓ ' : ''}{t('sin_carpeta')}
                    </button>
                    {carpetas.map(c => (
                      <button key={c.id} onClick={() => { onMover(p.id, c.id); setMenuProyecto(null) }}>
                        {p.carpetaId === c.id ? '✓ ' : ''}{c.nombre}
                      </button>
                    ))}
                    <div className="menu-separador" />
                    <button className="menu-danger" onClick={() => { onEliminar(p.id); setMenuProyecto(null) }}>{t('eliminar')}</button>
                  </div>
                </>
              )}
            </div>
          ))}

          {proyectosFiltrados.length === 0 && (
            <div className="proyectos-vacio">
              <div className="vacio-icono">📄</div>
              <div className="vacio-texto">{t('sin_proyectos')}</div>
              <button className="btn-nuevo-proyecto" onClick={() => onNuevo(carpetaActiva === 'todos' || carpetaActiva === 'sin-carpeta' ? null : carpetaActiva)}>
                {t('crear_primero')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
