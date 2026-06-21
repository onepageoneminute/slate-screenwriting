import './BarraHerramientas.css'
import { useIdioma } from '../i18n.js'

export const TIPOS = [
  { id: 'encabezado',  atajo: '⌃1' },
  { id: 'accion',      atajo: '⌃2' },
  { id: 'personaje',   atajo: '⌃3' },
  { id: 'dialogo',     atajo: '⌃4' },
  { id: 'parentetico', atajo: '⌃5' },
  { id: 'transicion',  atajo: '⌃6' },
]

export default function BarraHerramientas({ tipoActivo, onCambiarTipo }) {
  const { t } = useIdioma()
  return (
    <div className="barra-herramientas">
      {TIPOS.map((tipo, i) => (
        <div key={tipo.id} style={{ display: 'contents' }}>
          {i === 2 && <div className="barra-separador" />}
          {i === 4 && <div className="barra-separador" />}
          <button
            className={`barra-btn ${tipo.id === tipoActivo ? 'activo' : ''}`}
            onMouseDown={e => {
              e.preventDefault()
              onCambiarTipo(tipo.id)
            }}
            title={`${t(tipo.id)} (Ctrl+${i + 1})`}
          >
            <span className="barra-atajo">{tipo.atajo}</span>
            <span className="barra-etiqueta">{t(tipo.id)}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
