import { useState } from 'react'
import MenuExportar from './MenuExportar.jsx'
import { useIdioma } from '../i18n.js'
import './Topbar.css'

export default function Topbar({ proyecto, estilos, guardando, onVolver, onNuevo, panelAbierto, onTogglePanel, proyectos, onCambiarProyecto, onEliminar, onRenombrar, onEditarPortada, onEstadisticas, vista, onCambiarVista, onAjustes, estilosAbierto, modoOscuro, onToggleTema }) {
  const { t } = useIdioma()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nombreTemp, setNombreTemp] = useState('')

  function iniciarEdicion() {
    setNombreTemp(proyecto.nombre)
    setEditandoNombre(true)
  }

  function confirmarEdicion() {
    if (nombreTemp.trim()) onRenombrar(proyecto.id, nombreTemp.trim())
    setEditandoNombre(false)
  }

  return (
    <header className="topbar">
      <div className="topbar-izq">
        <button className="btn-icono btn-volver" onClick={onVolver} title={t('volver')}>←</button>
        <button className="btn-icono" onClick={onTogglePanel} title={t('panel_escenas')}>
          {panelAbierto ? '◀' : '▶'}
        </button>
      </div>

      <div className="topbar-centro">
        {editandoNombre ? (
          <input
            className="nombre-input"
            value={nombreTemp}
            onChange={e => setNombreTemp(e.target.value)}
            onBlur={confirmarEdicion}
            onKeyDown={e => e.key === 'Enter' && confirmarEdicion()}
            autoFocus
          />
        ) : (
          <span className="nombre-proyecto" onDoubleClick={iniciarEdicion} title="Doble clic para renombrar">
            {proyecto?.nombre}
          </span>
        )}

        <span className={`guardado-ind ${guardando ? 'guardando' : ''}`}>
          {guardando ? t('guardando') : t('guardado')}
        </span>

        <div className="menu-proyectos">
          <button className="btn-menu" onClick={() => setMenuAbierto(v => !v)}>▾</button>
          {menuAbierto && (
            <div className="dropdown">
              <div className="dropdown-header">{t('proyectos')}</div>
              {proyectos.map(p => (
                <div
                  key={p.id}
                  className={`dropdown-item ${p.id === proyecto.id ? 'activo' : ''}`}
                  onClick={() => { onCambiarProyecto(p.id); setMenuAbierto(false) }}
                >
                  <span>{p.nombre}</span>
                  {proyectos.length > 1 && (
                    <button
                      className="btn-borrar"
                      onClick={e => { e.stopPropagation(); onEliminar(p.id) }}
                      title={t('eliminar')}
                    >✕</button>
                  )}
                </div>
              ))}
              <div className="dropdown-separador" />
              <div className="dropdown-item nuevo" onClick={() => { onNuevo(); setMenuAbierto(false) }}>
                {t('nuevo_proyecto')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-der">
        <div className="vista-toggle">
          <button
            className={vista === 'guion' ? 'activo' : ''}
            onClick={() => onCambiarVista('guion')}
          >{t('vista_guion')}</button>
          <button
            className={vista === 'tarjetas' ? 'activo' : ''}
            onClick={() => onCambiarVista('tarjetas')}
          >{t('vista_tarjetas')}</button>
        </div>
        <button className="btn-portada" onClick={onEditarPortada} title={t('portada')}>{t('portada')}</button>
        <button className="btn-portada" onClick={onEstadisticas} title={t('estadisticas')}>{t('estadisticas')}</button>
        <MenuExportar proyecto={proyecto} estilos={estilos} />
        <button
          className="btn-ajustes"
          onClick={onToggleTema}
          title={modoOscuro ? t('modo_claro') : t('modo_oscuro')}
        >{modoOscuro ? '☀' : '☾'}</button>
        <button
          className={`btn-ajustes ${estilosAbierto ? 'activo' : ''}`}
          onClick={onAjustes}
          title={t('ajustes_estilo')}
        >⚙</button>
        <button className="btn-nuevo" onClick={onNuevo}>{t('nuevo')}</button>
      </div>
    </header>
  )
}
