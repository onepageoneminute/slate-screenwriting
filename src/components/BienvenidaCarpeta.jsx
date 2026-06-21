import './BienvenidaCarpeta.css'
import { useIdioma } from '../i18n.js'

export default function BienvenidaCarpeta({ onElegir }) {
  const { t } = useIdioma()
  return (
    <div className="bienvenida">
      <div className="bienvenida-caja">
        <div className="bienvenida-logo">🎬 Slate</div>
        <h1>{t('bienvenido')}</h1>
        <p>{t('bienvenida_texto')}</p>
        <button className="bienvenida-btn" onClick={onElegir}>
          📁 {t('elegir_carpeta')}
        </button>
        <p className="bienvenida-nota">{t('bienvenida_nota')}</p>
      </div>
    </div>
  )
}
