// Capa de almacenamiento.
// En la app de escritorio (Electron) guarda cada guion como archivo en la carpeta
// elegida. En el navegador (desarrollo) usa localStorage como respaldo.

const api = typeof window !== 'undefined' ? window.electronAPI : null
export const esEscritorio = !!(api && api.esEscritorio)

const K_PROY = 'guionista_proyectos'
const K_CARP = 'guionista_carpetas'

function leerArrayLS(k) {
  try { return JSON.parse(localStorage.getItem(k)) || [] } catch { return [] }
}

// Carga inicial: { carpeta, proyectos, carpetas }
export async function cargar() {
  if (esEscritorio) {
    const r = await api.leerBiblioteca()
    return { carpeta: r.carpeta || null, proyectos: r.proyectos || [], carpetas: r.carpetas || [] }
  }
  return { carpeta: 'navegador', proyectos: leerArrayLS(K_PROY), carpetas: leerArrayLS(K_CARP) }
}

// Abre el diálogo para elegir carpeta (solo escritorio) y recarga la biblioteca
export async function elegirCarpeta() {
  if (!esEscritorio) return null
  const carpeta = await api.elegirCarpeta()
  if (!carpeta) return null
  return await cargar()
}

// Guarda un proyecto. Devuelve el proyecto (con _archivo actualizado en escritorio).
export async function guardarProyecto(proyecto) {
  if (esEscritorio) {
    const r = await api.guardarProyecto(proyecto)
    return r?.archivo ? { ...proyecto, _archivo: r.archivo } : proyecto
  }
  const arr = leerArrayLS(K_PROY)
  const i = arr.findIndex(p => p.id === proyecto.id)
  if (i >= 0) arr[i] = proyecto; else arr.push(proyecto)
  localStorage.setItem(K_PROY, JSON.stringify(arr))
  return proyecto
}

export async function borrarProyecto(proyecto) {
  if (esEscritorio) { await api.borrarProyecto(proyecto); return }
  localStorage.setItem(K_PROY, JSON.stringify(leerArrayLS(K_PROY).filter(p => p.id !== proyecto.id)))
}

export async function guardarCarpetas(carpetas) {
  if (esEscritorio) { await api.guardarCarpetas(carpetas); return }
  localStorage.setItem(K_CARP, JSON.stringify(carpetas))
}

// Guion con el que se abrió la app (doble clic en un .slate), o null
export async function archivoInicial() {
  if (esEscritorio) return await api.archivoInicial()
  return null
}

// Escucha aperturas de guion cuando la app ya está abierta
export function onAbrirArchivo(cb) {
  if (esEscritorio) api.onAbrirArchivo(cb)
}

// Idiomas del corrector ortográfico (solo escritorio)
export async function idiomasCorrector() {
  if (esEscritorio) return await api.idiomasCorrector()
  return { disponibles: [], actual: null }
}
export async function setIdiomaCorrector(codigo) {
  if (esEscritorio) await api.setIdiomaCorrector(codigo)
}

// Importar Fountain: devuelve { nombre, texto } o null
export async function importarFountain() {
  if (esEscritorio) return await api.importarFountain()
  return await new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.fountain,.txt,.spmd'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return resolve(null)
      const reader = new FileReader()
      reader.onload = () => resolve({ nombre: f.name.replace(/\.[^.]+$/, ''), texto: String(reader.result) })
      reader.readAsText(f)
    }
    input.click()
  })
}
