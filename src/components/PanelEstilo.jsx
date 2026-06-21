import { useIdioma } from '../i18n.js'
import './PanelEstilo.css'

const GRUPOS = [
  {
    titulo: 'pe_apariencia',
    items: [
      { clave: 'modoOscuro', tipo: 'toggle', label: 'pe_modo_oscuro', desc: 'pe_modo_oscuro_desc' },
    ]
  },
  {
    titulo: 'pe_editor',
    items: [
      { clave: 'numerosEscena',     tipo: 'toggle', label: 'pe_num_escena',  desc: 'pe_num_escena_desc' },
      { clave: 'numeroPagina',      tipo: 'toggle', label: 'pe_num_pagina',  desc: 'pe_num_pagina_desc' },
      { clave: 'tamanoFuente',      tipo: 'radio',  label: 'pe_tamano',      opciones: [11, 12, 13] },
      { clave: 'subrayarEscena',    tipo: 'toggle', label: 'pe_subrayar',    desc: 'pe_subrayar_desc' },
      { clave: 'negritaPersonaje',  tipo: 'toggle', label: 'pe_negrita',     desc: 'pe_negrita_desc' },
      { clave: 'parenteticoCursiva',tipo: 'toggle', label: 'pe_cursiva',     desc: 'pe_cursiva_desc' },
    ]
  },
  {
    titulo: 'pe_export_pdf',
    items: [
      { clave: 'portadaEnPDF',      tipo: 'toggle', label: 'pe_portada',  desc: 'pe_portada_desc' },
      { clave: 'numerarEscenasPDF', tipo: 'toggle', label: 'pe_numerar',  desc: 'pe_numerar_desc' },
    ]
  }
]

export default function PanelEstilo({ estilos, toggle, setValor, onCerrar }) {
  const { t } = useIdioma()
  return (
    <>
      <div className="estilo-overlay" onClick={onCerrar} />
      <aside className="panel-estilo">
        <div className="estilo-header">
          <span>{t('ajustes_estilo')}</span>
          <button className="estilo-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="estilo-cuerpo">
          {GRUPOS.map(grupo => (
            <div key={grupo.titulo} className="estilo-grupo">
              <div className="estilo-grupo-titulo">{t(grupo.titulo)}</div>
              {grupo.items.map(item => (
                <div key={item.clave} className="estilo-item">
                  <div className="estilo-item-texto">
                    <span className="estilo-label">{t(item.label)}</span>
                    {item.desc && <span className="estilo-desc">{t(item.desc)}</span>}
                  </div>

                  {item.tipo === 'toggle' && (
                    <button
                      className={`toggle ${estilos[item.clave] ? 'on' : 'off'}`}
                      onClick={() => toggle(item.clave)}
                      title={estilos[item.clave] ? t('pe_activado') : t('pe_desactivado')}
                    >
                      <span className="toggle-bola" />
                    </button>
                  )}

                  {item.tipo === 'radio' && (
                    <div className="radio-grupo">
                      {item.opciones.map(op => (
                        <button
                          key={op}
                          className={`radio-btn ${estilos[item.clave] === op ? 'sel' : ''}`}
                          onClick={() => setValor(item.clave, op)}
                        >
                          {op}pt
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
