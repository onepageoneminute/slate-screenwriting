const { contextBridge, ipcRenderer } = require('electron')

// API de archivos expuesta de forma segura al frontend.
// Si window.electronAPI existe, la app usa el disco; si no, usa localStorage.
contextBridge.exposeInMainWorld('electronAPI', {
  version: process.versions.electron,
  esEscritorio: true,

  // Configuración / biblioteca
  getConfig:        () => ipcRenderer.invoke('config:get'),
  elegirCarpeta:    () => ipcRenderer.invoke('biblioteca:elegir'),
  leerBiblioteca:   () => ipcRenderer.invoke('biblioteca:leer'),

  // Proyectos
  guardarProyecto:  (proyecto) => ipcRenderer.invoke('proyecto:guardar', proyecto),
  borrarProyecto:   (proyecto) => ipcRenderer.invoke('proyecto:borrar', proyecto),

  // Carpetas (Largos, Cortos…)
  guardarCarpetas:  (carpetas) => ipcRenderer.invoke('carpetas:guardar', carpetas),

  // Importar
  importarFountain: () => ipcRenderer.invoke('importar:fountain'),

  // Idioma del corrector ortográfico
  setIdioma: (idioma) => ipcRenderer.invoke('idioma:set', idioma),
  idiomasCorrector: () => ipcRenderer.invoke('corrector:idiomas'),
  setIdiomaCorrector: (codigo) => ipcRenderer.invoke('corrector:set', codigo),

  // Abrir guion por asociación de archivo (.slate)
  archivoInicial: () => ipcRenderer.invoke('archivo:inicial'),
  onAbrirArchivo: (cb) => ipcRenderer.on('abrir-archivo', (_e, proy) => cb(proy)),
})
