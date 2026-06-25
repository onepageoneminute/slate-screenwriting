import { useState, useRef, useEffect } from 'react'
import './ShotList.css'

const GRUPOS = [
  { nombre: 'Identificación', cols: 4, cls: 'sl-g-id' },
  { nombre: 'Cámara',         cols: 4, cls: 'sl-g-camara' },
  { nombre: 'Contenido',      cols: 3, cls: 'sl-g-contenido' },
  { nombre: 'Producción',     cols: 5, cls: 'sl-g-produccion' },
]

const COLUMNAS = [
  { id: 'escena',       label: 'Esc',          tipo: 'texto',    ancho: 42 },
  { id: 'plano',        label: 'Plano',         tipo: 'texto',    ancho: 52 },
  { id: 'localizacion', label: 'Localización',  tipo: 'texto',    ancho: 130 },
  { id: 'diaNoche',     label: 'D/N',           tipo: 'dropdown', ancho: 46,
    opciones: ['Día', 'Noche', 'Amanecer', 'Atardecer'] },
  { id: 'tipo',         label: 'Tipo',          tipo: 'dropdown', ancho: 46,
    opciones: ['GPG', 'PG', 'PE', 'PA', 'PM', 'PMC', 'PP', 'PPP', 'PD'] },
  { id: 'movimiento',   label: 'Movimiento',    tipo: 'dropdown', ancho: 95,
    opciones: ['Fijo', 'Panorámica', 'Travelling', 'Plano secuencia', 'Gimbal', 'Dolly', 'Zoom'] },
  { id: 'angulo',       label: 'Ángulo',        tipo: 'dropdown', ancho: 85,
    opciones: ['Normal', 'Picado', 'Contrapicado', 'Cenital', 'Nadir', 'A ras de suelo', 'Holandés', 'Aéreo', 'POV', 'OTS'] },
  { id: 'lente',        label: 'Lente',         tipo: 'texto',    ancho: 80 },
  { id: 'descripcion',  label: 'Descripción',   tipo: 'texto',    ancho: 160 },
  { id: 'personajes',   label: 'Personajes',    tipo: 'texto',    ancho: 95 },
  { id: 'dialogo',      label: 'Diálogo clave', tipo: 'texto',    ancho: 105 },
  { id: 'duracion',     label: 'Dur.',          tipo: 'texto',    ancho: 42 },
  { id: 'sonido',       label: 'Sonido',        tipo: 'dropdown', ancho: 75,
    opciones: ['Diálogo', 'Off screen', 'Ambiente', 'Silencio', 'Música'] },
  { id: 'equipo',       label: 'Equipo',        tipo: 'texto',    ancho: 82 },
  { id: 'estado',       label: 'Estado',        tipo: 'dropdown', ancho: 85,
    opciones: ['Pendiente', 'Rodado', 'Descartado'] },
  { id: 'notas',        label: 'Notas',         tipo: 'texto',    ancho: 110 },
]

const SEP_IDX = new Set([3, 7, 10])

const ESTADO_CLS = {
  'Pendiente':   'sl-estado-pendiente',
  'Rodado':      'sl-estado-rodado',
  'Descartado':  'sl-estado-descartado',
}

let _nextId = Date.now()
export function nuevoPlano() {
  return {
    id: ++_nextId,
    escena: '', plano: '', localizacion: '', diaNoche: '',
    tipo: '', movimiento: '', angulo: '', lente: '',
    descripcion: '', personajes: '', dialogo: '',
    duracion: '', sonido: '', equipo: '', estado: 'Pendiente', notas: '',
  }
}

export default function ShotList({ planos, onChange }) {
  const [dropdown, setDropdown] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    function cerrar(e) { if (!e.target.closest('.sl-dropdown')) setDropdown(null) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  function set(id, campo, valor) {
    onChange(planos.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  function abrirDropdown(e, id, campo, opciones) {
    const r = e.currentTarget.getBoundingClientRect()
    const wr = wrapRef.current.getBoundingClientRect()
    setDropdown({ id, campo, opciones, top: r.bottom - wr.top + wrapRef.current.scrollTop, left: r.left - wr.left, w: Math.max(r.width, 130) })
  }

  return (
    <div className="sl-wrap" ref={wrapRef}>
      <div className="sl-toolbar">
        <span className="sl-titulo">Guión Técnico</span>
        <div className="sl-toolbar-der">
          <span className="sl-count">{planos.length} plano{planos.length !== 1 ? 's' : ''}</span>
          <button className="sl-btn-add" onClick={() => onChange([...planos, nuevoPlano()])}>+ Añadir plano</button>
        </div>
      </div>

      <div className="sl-scroll">
        <table className="sl-tabla">
          <colgroup>
            <col style={{ width: 32 }} />
            {COLUMNAS.map(c => <col key={c.id} style={{ width: c.ancho, minWidth: c.ancho }} />)}
            <col style={{ width: 28 }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sl-th-num" />
              {GRUPOS.map(g => (
                <th key={g.nombre} colSpan={g.cols} className={`sl-grupo ${g.cls}`}>{g.nombre}</th>
              ))}
              <th className="sl-th-num" />
            </tr>
            <tr>
              <th className="sl-col-head sl-th-num">#</th>
              {COLUMNAS.map((col, i) => (
                <th key={col.id} className={`sl-col-head${SEP_IDX.has(i) ? ' sl-sep' : ''}`}>{col.label}</th>
              ))}
              <th className="sl-col-head sl-th-num" />
            </tr>
          </thead>
          <tbody>
            {planos.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 1 ? 'sl-stripe' : ''}>
                <td className="sl-row-num">{idx + 1}</td>
                {COLUMNAS.map((col, i) => {
                  const val = p[col.id] || ''
                  const sep = SEP_IDX.has(i) ? ' sl-sep' : ''
                  if (col.tipo === 'dropdown') {
                    return (
                      <td key={col.id}
                        className={`sl-cell sl-cell-dd${sep}${col.id === 'estado' ? ` ${ESTADO_CLS[val] || ''}` : ''}`}
                        onClick={e => abrirDropdown(e, p.id, col.id, col.opciones)}
                      >
                        <span className="sl-dd-val">{val}</span>
                        <span className="sl-dd-arrow">▾</span>
                      </td>
                    )
                  }
                  return (
                    <td key={col.id} className={`sl-cell${sep}`}>
                      <input
                        className="sl-input"
                        value={val}
                        onChange={e => set(p.id, col.id, e.target.value)}
                      />
                    </td>
                  )
                })}
                <td className="sl-cell sl-cell-del">
                  <button className="sl-btn-del" onClick={() => onChange(planos.filter(x => x.id !== p.id))}>✕</button>
                </td>
              </tr>
            ))}
            {planos.length === 0 && (
              <tr><td colSpan={18} className="sl-vacio">
                Sin planos. Pulsa "+ Añadir plano" para empezar.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dropdown && (
        <div className="sl-dropdown" style={{ top: dropdown.top, left: dropdown.left, minWidth: dropdown.w }}>
          {dropdown.opciones.map(op => (
            <div key={op}
              className={`sl-dd-item${planos.find(x => x.id === dropdown.id)?.[dropdown.campo] === op ? ' sl-dd-sel' : ''}`}
              onMouseDown={e => { e.preventDefault(); set(dropdown.id, dropdown.campo, op); setDropdown(null) }}
            >{op}</div>
          ))}
        </div>
      )}
    </div>
  )
}
