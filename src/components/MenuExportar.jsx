import { useState } from 'react'
import { exportarFountain, exportarPDF, exportarWord } from '../utils/exportar.js'
import { useIdioma } from '../i18n.js'
import './MenuExportar.css'

export default function MenuExportar({ proyecto, estilos = {} }) {
  const { t } = useIdioma()
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(null)

  async function exportar(formato) {
    setCargando(formato)
    try {
      if (formato === 'fountain') exportarFountain(proyecto)
      if (formato === 'pdf') await exportarPDF(proyecto, estilos)
      if (formato === 'word') await exportarWord(proyecto)
    } catch (e) {
      console.error(e)
    }
    setCargando(null)
    setAbierto(false)
  }

  return (
    <div className="menu-exportar">
      <button className="btn-exportar" onClick={() => setAbierto(v => !v)}>
        {t('exportar')} ▾
      </button>
      {abierto && (
        <>
          <div className="exportar-overlay" onClick={() => setAbierto(false)} />
          <div className="exportar-panel">
            <div className="exportar-titulo">{t('exportar_titulo')}</div>

            <button className="exportar-opcion" onClick={() => exportar('pdf')} disabled={!!cargando}>
              <span className="exportar-icono">📄</span>
              <div>
                <div className="exportar-nombre">PDF</div>
                <div className="exportar-desc">{t('exp_pdf_desc')}</div>
              </div>
              {cargando === 'pdf' && <span className="exportar-spin">⟳</span>}
            </button>

            <button className="exportar-opcion" onClick={() => exportar('word')} disabled={!!cargando}>
              <span className="exportar-icono">📝</span>
              <div>
                <div className="exportar-nombre">{t('exp_word')}</div>
                <div className="exportar-desc">{t('exp_word_desc')}</div>
              </div>
              {cargando === 'word' && <span className="exportar-spin">⟳</span>}
            </button>

            <button className="exportar-opcion" onClick={() => exportar('fountain')} disabled={!!cargando}>
              <span className="exportar-icono">🎬</span>
              <div>
                <div className="exportar-nombre">{t('exp_fountain')}</div>
                <div className="exportar-desc">{t('exp_fountain_desc')}</div>
              </div>
              {cargando === 'fountain' && <span className="exportar-spin">⟳</span>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
