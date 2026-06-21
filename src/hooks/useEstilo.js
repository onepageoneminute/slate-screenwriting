import { useState, useEffect } from 'react'

const CLAVE = 'guionista_estilos'

export const ESTILOS_DEFAULT = {
  // Tema
  modoOscuro:        false,
  // Editor
  numerosEscena:     true,   // "1. INT. PASILLO - DÍA"
  numeroPagina:      true,   // número en esquina superior derecha del folio
  tamanoFuente:      12,     // 11 / 12 / 13 pt
  subrayarEscena:    false,
  negritaPersonaje:  true,
  parenteticoCursiva: true,

  // PDF
  portadaEnPDF:      true,
  numerarEscenasPDF: true,
}

export function useEstilo() {
  const [estilos, setEstilos] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE)
      if (guardado) return { ...ESTILOS_DEFAULT, ...JSON.parse(guardado) }
    } catch {}
    return ESTILOS_DEFAULT
  })

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(estilos))
  }, [estilos])

  function toggle(clave) {
    setEstilos(e => ({ ...e, [clave]: !e[clave] }))
  }

  function setValor(clave, valor) {
    setEstilos(e => ({ ...e, [clave]: valor }))
  }

  return { estilos, toggle, setValor }
}
