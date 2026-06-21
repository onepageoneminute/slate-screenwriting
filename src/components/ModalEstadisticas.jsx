import { useIdioma } from '../i18n.js'
import './ModalEstadisticas.css'

function calcularEstadisticas(bloques = []) {
  const escenas      = bloques.filter(b => b.tipo === 'encabezado')
  const acciones     = bloques.filter(b => b.tipo === 'accion')
  const dialogos     = bloques.filter(b => b.tipo === 'dialogo')
  const transiciones = bloques.filter(b => b.tipo === 'transicion')

  // INT / EXT
  let int = 0, ext = 0, mixto = 0
  escenas.forEach(e => {
    const t = (e.texto || '').toUpperCase().trim()
    const esInt = t.startsWith('INT')
    const esExt = t.startsWith('EXT')
    if ((t.startsWith('INT/EXT') || t.startsWith('EXT/INT') || t.startsWith('I/E'))) mixto++
    else if (esInt) int++
    else if (esExt) ext++
  })

  // DÍA / NOCHE
  let dia = 0, noche = 0, otros = 0
  escenas.forEach(e => {
    const t = (e.texto || '').toUpperCase()
    if (t.includes('NOCHE') || t.includes('MADRUGADA')) noche++
    else if (t.includes('DÍA') || t.includes('DIA') || t.includes('AMANECER') || t.includes('TARDE')) dia++
    else otros++
  })

  // Diálogo por personaje: recorrer y asociar cada dialogo al ultimo personaje
  const porPersonaje = {}
  let personajeActual = null
  bloques.forEach(b => {
    if (b.tipo === 'personaje' && b.texto.trim()) {
      personajeActual = b.texto.trim().toUpperCase()
      if (!porPersonaje[personajeActual]) porPersonaje[personajeActual] = { lineas: 0, palabras: 0 }
    } else if (b.tipo === 'dialogo' && personajeActual) {
      porPersonaje[personajeActual].lineas++
      porPersonaje[personajeActual].palabras += (b.texto.trim().split(/\s+/).filter(Boolean).length)
    } else if (b.tipo === 'encabezado') {
      personajeActual = null
    }
  })

  const ranking = Object.entries(porPersonaje)
    .map(([nombre, d]) => ({ nombre, ...d }))
    .sort((a, b) => b.palabras - a.palabras)

  const maxPalabras = ranking.length ? Math.max(...ranking.map(r => r.palabras), 1) : 1

  // Palabras totales
  const totalPalabras = bloques.reduce((acc, b) =>
    acc + (b.texto || '').trim().split(/\s+/).filter(Boolean).length, 0)

  // Páginas estimadas (aprox 55 líneas por página, asumimos 1 bloque ~ varias líneas)
  // Mejor estimación simple: ~190 palabras por página de guion
  const paginas = Math.max(1, Math.round(totalPalabras / 190))

  return {
    nEscenas: escenas.length,
    nAcciones: acciones.length,
    nDialogos: dialogos.length,
    nTransiciones: transiciones.length,
    int, ext, mixto,
    dia, noche, otros,
    ranking, maxPalabras,
    totalPalabras,
    paginas,
    nPersonajes: ranking.length,
  }
}

export default function ModalEstadisticas({ proyecto, onCerrar }) {
  const { t } = useIdioma()
  const s = calcularEstadisticas(proyecto?.bloques)

  return (
    <div className="est-overlay" onClick={onCerrar}>
      <div className="est-modal" onClick={e => e.stopPropagation()}>
        <div className="est-header">
          <h2>{t('est_titulo')} · {proyecto?.nombre}</h2>
          <button className="est-cerrar" onClick={onCerrar}>✕</button>
        </div>

        <div className="est-cuerpo">
          {/* Resumen general */}
          <div className="est-cards">
            <div className="est-card">
              <div className="est-num">{s.nEscenas}</div>
              <div className="est-label">{t('est_escenas')}</div>
            </div>
            <div className="est-card">
              <div className="est-num">~{s.paginas}</div>
              <div className="est-label">{t('est_paginas')}</div>
            </div>
            <div className="est-card">
              <div className="est-num">~{s.paginas}<span className="est-sub">{t('min')}</span></div>
              <div className="est-label">{t('est_duracion')}</div>
            </div>
            <div className="est-card">
              <div className="est-num">{s.nPersonajes}</div>
              <div className="est-label">{t('est_personajes')}</div>
            </div>
            <div className="est-card">
              <div className="est-num">{s.totalPalabras}</div>
              <div className="est-label">{t('est_palabras')}</div>
            </div>
          </div>

          {/* INT/EXT y DÍA/NOCHE */}
          <div className="est-fila-doble">
            <div className="est-bloque">
              <h3>{t('est_tipo_escena')}</h3>
              <div className="est-barras">
                <BarraProporcion etiqueta={t('est_interior')} valor={s.int} total={s.nEscenas} color="#7ab8e8" />
                <BarraProporcion etiqueta={t('est_exterior')} valor={s.ext} total={s.nEscenas} color="#a8e87a" />
                {s.mixto > 0 && <BarraProporcion etiqueta={t('est_mixto')} valor={s.mixto} total={s.nEscenas} color="#e8c87a" />}
              </div>
            </div>
            <div className="est-bloque">
              <h3>{t('est_momento')}</h3>
              <div className="est-barras">
                <BarraProporcion etiqueta={t('est_dia')} valor={s.dia} total={s.nEscenas} color="#e8c87a" />
                <BarraProporcion etiqueta={t('est_noche')} valor={s.noche} total={s.nEscenas} color="#8a8ad8" />
                {s.otros > 0 && <BarraProporcion etiqueta={t('est_sin_especificar')} valor={s.otros} total={s.nEscenas} color="#999" />}
              </div>
            </div>
          </div>

          {/* Ranking de personajes */}
          <div className="est-bloque">
            <h3>{t('est_ranking')}</h3>
            {s.ranking.length === 0 ? (
              <div className="est-vacio">{t('est_sin_dialogos')}</div>
            ) : (
              <div className="est-ranking">
                {s.ranking.map(r => (
                  <div key={r.nombre} className="est-rank-item">
                    <div className="est-rank-nombre">{r.nombre}</div>
                    <div className="est-rank-barra-wrap">
                      <div
                        className="est-rank-barra"
                        style={{ width: `${(r.palabras / s.maxPalabras) * 100}%` }}
                      />
                    </div>
                    <div className="est-rank-valor">{r.palabras} {t('est_pal')} · {r.lineas} {t('est_lineas')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BarraProporcion({ etiqueta, valor, total, color }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0
  return (
    <div className="est-prop">
      <div className="est-prop-top">
        <span>{etiqueta}</span>
        <span className="est-prop-val">{valor} ({pct}%)</span>
      </div>
      <div className="est-prop-barra-wrap">
        <div className="est-prop-barra" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
