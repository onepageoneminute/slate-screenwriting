import { saveAs } from 'file-saver'
import fuenteRegularUrl from '../assets/fonts/CourierPrime-Regular.ttf?url'
import fuenteBoldUrl from '../assets/fonts/CourierPrime-Bold.ttf?url'

// Carga e incrusta Courier Prime (la fuente estándar de guion) en el documento jsPDF.
// Se cachea en base64 para no re-descargar en cada exportación.
let _fuentesB64 = null
async function cargarFuentes() {
  if (_fuentesB64) return _fuentesB64
  async function aBase64(url) {
    const buf = await (await fetch(url)).arrayBuffer()
    let bin = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin)
  }
  const [reg, bold] = await Promise.all([aBase64(fuenteRegularUrl), aBase64(fuenteBoldUrl)])
  _fuentesB64 = { reg, bold }
  return _fuentesB64
}

function registrarFuente(doc, fuentes) {
  doc.addFileToVFS('CourierPrime-Regular.ttf', fuentes.reg)
  doc.addFont('CourierPrime-Regular.ttf', 'CourierPrime', 'normal')
  doc.addFileToVFS('CourierPrime-Bold.ttf', fuentes.bold)
  doc.addFont('CourierPrime-Bold.ttf', 'CourierPrime', 'bold')
}

// ─── FOUNTAIN ────────────────────────────────────────────────────────────────

export function exportarFountain(proyecto) {
  const lineas = [`Title: ${proyecto.nombre}`, 'Author: ', '', '']

  for (const b of proyecto.bloques) {
    const t = b.texto?.trim() || ''
    switch (b.tipo) {
      case 'encabezado':
        lineas.push(t || 'INT. LUGAR - DÍA')
        lineas.push('')
        break
      case 'accion':
        lineas.push(t)
        lineas.push('')
        break
      case 'personaje':
        lineas.push(t.toUpperCase())
        break
      case 'parentetico':
        lineas.push(t.startsWith('(') ? t : `(${t})`)
        break
      case 'dialogo':
        lineas.push(t)
        lineas.push('')
        break
      case 'transicion':
        lineas.push(`> ${t.toUpperCase()}`)
        lineas.push('')
        break
      default:
        lineas.push(t)
        lineas.push('')
    }
  }

  const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, `${proyecto.nombre}.fountain`)
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
//
// Formato de guion ESPAÑOL/EUROPEO en A4 (210 × 297 mm)
// Fuente Courier Prime 12pt a interlineado SIMPLE (6 líneas/pulgada = 4.233mm/línea),
// con una línea en blanco entre elementos.
// Márgenes: izq 35mm (3.5cm, deja hueco para encuadernar), der/sup/inf 25mm (2.5cm).
// Sangrías de personaje/diálogo según la convención internacional (la misma que
// usan Final Draft, Celtx, Fade In…), medidas desde el margen izquierdo.

export async function exportarPDF(proyecto, estilos = {}) {
  const { jsPDF } = await import('jspdf')

  // A4
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  registrarFuente(doc, await cargarFuentes())
  doc.setLineHeightFactor(1.0) // interlineado simple exacto dentro de cada párrafo
  const PW = 210  // ancho página A4
  const PH = 297  // alto página A4

  // Márgenes (estándar español)
  const ML = 35       // izquierdo 3.5cm
  const MR = PW - 25  // derecho 2.5cm → 185mm
  const MT = 25       // superior 2.5cm
  const MB = PH - 25  // inferior límite = 272mm

  const ANCHO = MR - ML // 150mm de área de escritura

  // Posiciones horizontales (desde el borde izq de página), relativas al margen
  const X_ACCION    = ML            // al margen
  const X_PERSONAJE = ML + 55.88    // +2.2" sobre el margen
  const X_DIALOGO   = ML + 25.4     // +1" sobre el margen
  const X_PAREN     = ML + 38.1     // +1.5" sobre el margen
  const ANCHO_DIAL  = 88.9          // 3.5" de ancho
  const ANCHO_PAREN = 60.0          // ~2.4" de ancho

  const FS = 12          // tamaño de fuente pt
  const LH = 4.233       // interlineado SIMPLE: 12pt = 1/6" = 4.233mm

  let y = MT
  let numeroPagina = 0      // 0 = portada (sin número)
  let hablanteActual = null // personaje que está hablando (para el CONT'D al cambiar de página)

  doc.setFont('CourierPrime', 'normal')
  doc.setFontSize(FS)

  function nuevaPagina() {
    doc.addPage()
    numeroPagina++
    y = MT
    // Número de página arriba a la derecha
    doc.setFontSize(FS)
    doc.setFont('CourierPrime', 'normal')
    doc.setTextColor(0)
    doc.text(`${numeroPagina}.`, MR, MT - 6, { align: 'right' })
  }

  // Escribe texto línea a línea, partiendo entre páginas si hace falta.
  // Si es diálogo y se corta, pone "(MÁS)" al pie y repite "PERSONAJE (CONT'D)"
  // (en gris suave) al inicio de la página siguiente.
  function texto(t, x, ancho, bold = false, alinear = 'left', esDialogo = false) {
    doc.setFont('CourierPrime', bold ? 'bold' : 'normal')
    doc.setFontSize(FS)
    const partes = doc.splitTextToSize(t || '', ancho)

    for (let k = 0; k < partes.length; k++) {
      if (y + LH > MB) {
        if (esDialogo && hablanteActual) {
          doc.setFont('CourierPrime', 'normal')
          doc.setTextColor(0)
          doc.text('(MÁS)', X_DIALOGO, y)
          nuevaPagina()
          // Nombre del personaje + (CONT'D) en gris suave
          doc.setFont('CourierPrime', 'bold')
          doc.setTextColor(150)
          doc.text(`${hablanteActual.toUpperCase()} (CONT'D)`, X_PERSONAJE, y)
          doc.setTextColor(0)
          y += LH
          doc.setFont('CourierPrime', bold ? 'bold' : 'normal')
        } else {
          nuevaPagina()
        }
      }
      doc.text(partes[k], x, y, { align: alinear })
      y += LH
    }
    return partes.length
  }

  function espacio(mm = LH) { y += mm }

  // ── PORTADA ──────────────────────────────────────────────────────────────
  const p = proyecto.portada || {}
  const autor    = p.autor    || ''
  const contacto = p.contacto || ''
  const email    = p.email    || ''
  const telefono = p.telefono || ''
  const version  = p.version  || 'Primera versión'
  const fecha    = p.fecha    || ''
  const registro = p.registro || ''

  if (estilos.portadaEnPDF !== false) {
    doc.setFont('CourierPrime', 'bold')
    doc.setFontSize(18)
    doc.text(proyecto.nombre.toUpperCase(), PW / 2, 100, { align: 'center' })

    doc.setFont('CourierPrime', 'normal')
    doc.setFontSize(FS)
    doc.text('escrito por', PW / 2, 116, { align: 'center' })
    doc.setFont('CourierPrime', 'bold')
    doc.text(autor || 'Autor', PW / 2, 124, { align: 'center' })

    doc.setFont('CourierPrime', 'normal')
    doc.setFontSize(10)
    const lineasIzq = [autor, contacto, email, telefono].filter(Boolean)
    lineasIzq.forEach((l, i) => doc.text(l, ML, MB + 8 + i * 5))
    const lineasDer = [version, fecha, registro].filter(Boolean)
    lineasDer.forEach((l, i) => doc.text(l, MR, MB + 8 + i * 5, { align: 'right' }))
  }

  // ── CONTENIDO ─────────────────────────────────────────────────────────────
  nuevaPagina()

  // Pre-calcular números de escena
  let numEsc = 0
  const numsPorId = {}
  proyecto.bloques.forEach(b => {
    if (b.tipo === 'encabezado') numsPorId[b.id] = ++numEsc
  })
  const numerarEscenas = estilos.numerarEscenasPDF !== false

  const bloques = proyecto.bloques

  // Modelo de "espacio ANTES": una sola línea en blanco entre elementos.
  // Diálogo y paréntesis van pegados a lo que tienen encima (personaje/diálogo).
  const ESPACIO_ANTES = {
    encabezado: 1,
    accion: 1,
    personaje: 1,
    dialogo: 0,
    parentetico: 0,
    transicion: 1,
  }

  let primerBloque = true

  for (let i = 0; i < bloques.length; i++) {
    const b = bloques[i]
    const t = (b.texto || '').trim()
    if (!t) continue

    // Una sola línea en blanco antes (salvo el primer bloque de contenido)
    if (!primerBloque) espacio(LH * (ESPACIO_ANTES[b.tipo] ?? 1))

    const prefNum = numerarEscenas && numsPorId[b.id] ? `${numsPorId[b.id]}. ` : ''

    switch (b.tipo) {
      case 'encabezado':
        hablanteActual = null
        texto((prefNum + t).toUpperCase(), X_ACCION, ANCHO, true)
        break

      case 'accion':
        hablanteActual = null
        texto(t, X_ACCION, ANCHO, false)
        break

      case 'personaje': {
        // CONT'D: mismo personaje que el último que habló en la escena
        let cont = ''
        for (let j = i - 1; j >= 0; j--) {
          if (bloques[j].tipo === 'encabezado') break
          if (bloques[j].tipo === 'personaje' && bloques[j].texto.trim()) {
            if (bloques[j].texto.trim().toUpperCase() === t.toUpperCase()) cont = " (CONT'D)"
            break
          }
        }
        hablanteActual = t  // recordamos quién habla para el corte de página
        // Evitar que el nombre quede huérfano al pie: necesita sitio para el cue + 2 líneas
        if (y + 3 * LH > MB) nuevaPagina()
        texto(t.toUpperCase() + cont, X_PERSONAJE, ANCHO, true)
        break
      }

      case 'parentetico':
        texto(t.startsWith('(') ? t : `(${t})`, X_PAREN, ANCHO_PAREN)
        break

      case 'dialogo':
        texto(t, X_DIALOGO, ANCHO_DIAL, false, 'left', true) // esDialogo: permite (MÁS)/(CONT'D)
        break

      case 'transicion':
        hablanteActual = null
        texto(t.toUpperCase(), MR, ANCHO, true, 'right')
        break
    }

    primerBloque = false
  }

  doc.save(`${proyecto.nombre}.pdf`)
}

// ─── WORD (.docx) ─────────────────────────────────────────────────────────────

export async function exportarWord(proyecto) {
  const {
    Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer
  } = await import('docx')

  const parrafos = [
    new Paragraph({
      children: [new TextRun({ text: proyecto.nombre.toUpperCase(), bold: true, size: 32, font: 'Courier New' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  ]

  for (const b of proyecto.bloques) {
    const t = b.texto?.trim() || ''

    switch (b.tipo) {
      case 'encabezado':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 22, font: 'Courier New' })],
          spacing: { before: 300, after: 100 },
          border: { bottom: { color: '999999', size: 6, style: 'single' } }
        }))
        break
      case 'accion':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t, size: 22, font: 'Courier New' })],
          spacing: { after: 120 }
        }))
        break
      case 'personaje':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 22, font: 'Courier New' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 0 }
        }))
        break
      case 'parentetico':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t.startsWith('(') ? t : `(${t})`, size: 22, font: 'Courier New', italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
          indent: { left: 1000, right: 1000 }
        }))
        break
      case 'dialogo':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t, size: 22, font: 'Courier New' })],
          spacing: { after: 200 },
          indent: { left: 720, right: 720 }
        }))
        break
      case 'transicion':
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 22, font: 'Courier New' })],
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 200 }
        }))
        break
      default:
        parrafos.push(new Paragraph({
          children: [new TextRun({ text: t, size: 22, font: 'Courier New' })]
        }))
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1440 }
        }
      },
      children: parrafos
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${proyecto.nombre}.docx`)
}
