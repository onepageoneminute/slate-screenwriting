import './SelectorIdioma.css'

export default function SelectorIdioma({ onElegir }) {
  return (
    <div className="selidioma">
      <div className="selidioma-caja">
        <div className="selidioma-logo">🎬 Slate</div>
        <h1>Elige tu idioma · Choose your language</h1>
        <div className="selidioma-opciones">
          <button onClick={() => onElegir('es')}>
            <span className="selidioma-bandera">🇪🇸</span>
            Español
          </button>
          <button onClick={() => onElegir('en')}>
            <span className="selidioma-bandera">🇬🇧</span>
            English
          </button>
        </div>
        <p className="selidioma-nota">Podrás cambiarlo después · You can change it later</p>
      </div>
    </div>
  )
}
