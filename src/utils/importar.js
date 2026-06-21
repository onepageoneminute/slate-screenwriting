// Parser de Fountain → bloques del editor.
// Soporta lo esencial: encabezados, acción, personaje, diálogo, paréntesis, transición.

let _id = 1
const nuevoBloque = (tipo, texto) => ({ id: Date.now() * 1000 + (_id++), tipo, texto: texto.trim() })

const ES_ENCABEZADO = /^(INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[\s.]/i
const ES_TRANSICION = /^[A-ZÁÉÍÓÚÑ ]+(A|TO):\s*$/   // "CORTE A:", "CUT TO:"

export function parseFountain(texto) {
  const lineas = String(texto).replace(/\r\n?/g, '\n').split('\n')
  const bloques = []
  let enDialogo = false
  let i = 0

  // Saltar página de título (líneas "Clave: valor" al principio hasta una línea en blanco)
  if (/^[A-Za-zÁÉÍÓÚÑ ]+:\s/.test(lineas[0] || '')) {
    while (i < lineas.length && lineas[i].trim() !== '') i++
    while (i < lineas.length && lineas[i].trim() === '') i++
  }

  for (; i < lineas.length; i++) {
    const cruda = lineas[i]
    const t = cruda.trim()

    if (t === '') { enDialogo = false; continue }

    // Encabezado de escena (o forzado con ".")
    if (ES_ENCABEZADO.test(t) || (t.startsWith('.') && !t.startsWith('..'))) {
      bloques.push(nuevoBloque('encabezado', t.replace(/^\./, '')))
      enDialogo = false
      continue
    }

    // Transición (forzada con ">" o "ALGO A:")
    if (t.startsWith('>') || ES_TRANSICION.test(t)) {
      bloques.push(nuevoBloque('transicion', t.replace(/^>/, '').replace(/<$/, '')))
      enDialogo = false
      continue
    }

    // Paréntesis (acotación) dentro de un diálogo
    if (enDialogo && t.startsWith('(') && t.endsWith(')')) {
      bloques.push(nuevoBloque('parentetico', t.replace(/^\(|\)$/g, '')))
      continue
    }

    // Personaje: línea en mayúsculas (o forzada con "@"), seguida de algo no vacío
    const forzadoPersonaje = t.startsWith('@')
    const pareceMayus = t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t) && t.length <= 40
    const siguienteNoVacia = (lineas[i + 1] || '').trim() !== ''
    if (!enDialogo && (forzadoPersonaje || pareceMayus) && siguienteNoVacia) {
      bloques.push(nuevoBloque('personaje', t.replace(/^@/, '')))
      enDialogo = true
      continue
    }

    // Diálogo (si venimos de un personaje/paréntesis)
    if (enDialogo) {
      bloques.push(nuevoBloque('dialogo', t))
      continue
    }

    // Cualquier otra cosa: acción
    bloques.push(nuevoBloque('accion', t))
  }

  if (bloques.length === 0) {
    bloques.push(nuevoBloque('encabezado', 'INT. LUGAR - DÍA'))
  }
  return bloques
}
