const { app, BrowserWindow, shell, ipcMain, dialog, Menu, MenuItem } = require('electron')
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')

const DEV = !app.isPackaged

// Una sola instancia: si ya está abierta y abres otro guion, se reutiliza la ventana
const tieneLock = app.requestSingleInstanceLock()
if (!tieneLock) app.quit()

let archivoPendiente = null // ruta de un .slate con el que se abrió la app

function archivoSlateDe(argv) {
  const a = (argv || []).find(x => typeof x === 'string' && x.toLowerCase().endsWith('.slate'))
  return a && fs.existsSync(a) ? a : null
}

// ── Configuración (carpeta de biblioteca elegida) ──────────────────────────
// Se guarda en la carpeta de datos de usuario del sistema (no en la biblioteca).
function rutaConfig() {
  return path.join(app.getPath('userData'), 'config.json')
}
function leerConfig() {
  try { return JSON.parse(fs.readFileSync(rutaConfig(), 'utf-8')) } catch { return {} }
}
function guardarConfig(cfg) {
  try { fs.writeFileSync(rutaConfig(), JSON.stringify(cfg, null, 2), 'utf-8') } catch {}
}

function crearVentana() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Slate',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#f0efe9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'win32' ? { frame: true } : {}),
  })

  if (DEV) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Corrector ortográfico: idioma elegido por el usuario, o derivado de la interfaz
  const cfg0 = leerConfig()
  aplicarCorrector(win, cfg0.idiomaCorrector || correctorPorDefecto(cfg0.idioma || 'es'))

  // Menú de clic derecho con sugerencias de corrección
  win.webContents.on('context-menu', (_e, params) => {
    const menu = new Menu()

    for (const sugerencia of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: sugerencia,
        click: () => win.webContents.replaceMisspelling(sugerencia),
      }))
    }
    if (params.misspelledWord) {
      if (params.dictionarySuggestions.length === 0) {
        menu.append(new MenuItem({ label: 'Sin sugerencias', enabled: false }))
      }
      menu.append(new MenuItem({ type: 'separator' }))
      menu.append(new MenuItem({
        label: 'Añadir al diccionario',
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      }))
      menu.append(new MenuItem({ type: 'separator' }))
    }

    if (params.isEditable || params.selectionText) {
      menu.append(new MenuItem({ role: 'cut',   label: 'Cortar',  enabled: params.editFlags.canCut }))
      menu.append(new MenuItem({ role: 'copy',  label: 'Copiar',  enabled: params.editFlags.canCopy }))
      menu.append(new MenuItem({ role: 'paste', label: 'Pegar',   enabled: params.editFlags.canPaste }))
      menu.append(new MenuItem({ role: 'selectAll', label: 'Seleccionar todo' }))
    }

    if (menu.items.length) menu.popup()
  })
}

// Activa el diccionario del corrector. Usa el idioma de corrección elegido por
// el usuario si existe; si no, lo deriva del idioma de la interfaz.
function correctorPorDefecto(idiomaUI) {
  return idiomaUI === 'en' ? 'en-US' : 'es-ES'
}
function aplicarCorrector(win, codigo) {
  try {
    const disp = win.webContents.session.availableSpellCheckerLanguages || []
    const elegido = disp.includes(codigo) ? codigo : 'en-US'
    win.webContents.session.setSpellCheckerLanguages([elegido])
  } catch {}
}

// ── Utilidades de biblioteca ────────────────────────────────────────────────
const EXT = '.slate'              // nueva extensión (asociable a la app)
const EXT_VIEJA = '.guion.json'   // formato anterior, se migra solo
const INDICE = '_biblioteca.json' // guarda las carpetas (Largos, Cortos…)

// Lee y parsea un archivo de guion (.slate). Devuelve el proyecto o null.
async function leerProyectoArchivo(ruta) {
  try {
    const datos = JSON.parse(await fsp.readFile(ruta, 'utf-8'))
    datos._archivo = path.basename(ruta)
    return datos
  } catch { return null }
}

function sanear(nombre) {
  return (nombre || 'sin-titulo').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60) || 'sin-titulo'
}
function rutaProyecto(carpeta, proyecto) {
  return path.join(carpeta, `${sanear(proyecto.nombre)}-${proyecto.id}${EXT}`)
}

async function leerBiblioteca(carpeta) {
  if (!carpeta) return { proyectos: [], carpetas: [] }
  await fsp.mkdir(carpeta, { recursive: true })
  let archivos = await fsp.readdir(carpeta)

  // Migración: renombrar los .guion.json antiguos a .slate (sin perder nada)
  for (const a of archivos) {
    if (a.endsWith(EXT_VIEJA)) {
      const nuevo = a.slice(0, -EXT_VIEJA.length) + EXT
      try { await fsp.rename(path.join(carpeta, a), path.join(carpeta, nuevo)) } catch {}
    }
  }
  archivos = await fsp.readdir(carpeta)

  const proyectos = []
  for (const a of archivos) {
    if (!a.endsWith(EXT)) continue
    try {
      const datos = JSON.parse(await fsp.readFile(path.join(carpeta, a), 'utf-8'))
      datos._archivo = a
      proyectos.push(datos)
    } catch {}
  }
  let carpetas = []
  try {
    carpetas = JSON.parse(await fsp.readFile(path.join(carpeta, INDICE), 'utf-8')).carpetas || []
  } catch {}
  return { proyectos, carpetas }
}

// ── IPC ───────────────────────────────────────────────────────────────────
function registrarIPC() {
  ipcMain.handle('config:get', () => leerConfig())

  ipcMain.handle('biblioteca:elegir', async () => {
    const r = await dialog.showOpenDialog({
      title: 'Elige la carpeta para tus guiones',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (r.canceled || !r.filePaths[0]) return null
    const cfg = leerConfig()
    cfg.carpeta = r.filePaths[0]
    guardarConfig(cfg)
    return cfg.carpeta
  })

  ipcMain.handle('biblioteca:leer', async () => {
    const cfg = leerConfig()
    const datos = await leerBiblioteca(cfg.carpeta)
    return { carpeta: cfg.carpeta || null, ...datos }
  })

  ipcMain.handle('proyecto:guardar', async (_e, proyecto) => {
    const cfg = leerConfig()
    if (!cfg.carpeta) return { ok: false, error: 'sin-carpeta' }
    // Si cambió el nombre, borrar el archivo viejo
    if (proyecto._archivo) {
      const viejo = path.join(cfg.carpeta, proyecto._archivo)
      const nuevo = rutaProyecto(cfg.carpeta, proyecto)
      if (path.basename(viejo) !== path.basename(nuevo)) {
        try { await fsp.unlink(viejo) } catch {}
      }
    }
    const limpio = { ...proyecto }
    delete limpio._archivo
    const destino = rutaProyecto(cfg.carpeta, proyecto)
    await fsp.writeFile(destino, JSON.stringify(limpio, null, 2), 'utf-8')
    return { ok: true, archivo: path.basename(destino) }
  })

  ipcMain.handle('proyecto:borrar', async (_e, proyecto) => {
    const cfg = leerConfig()
    if (!cfg.carpeta || !proyecto._archivo) return { ok: false }
    try { await fsp.unlink(path.join(cfg.carpeta, proyecto._archivo)) } catch {}
    return { ok: true }
  })

  ipcMain.handle('carpetas:guardar', async (_e, carpetas) => {
    const cfg = leerConfig()
    if (!cfg.carpeta) return { ok: false }
    await fsp.writeFile(path.join(cfg.carpeta, INDICE), JSON.stringify({ carpetas }, null, 2), 'utf-8')
    return { ok: true }
  })

  ipcMain.handle('idioma:set', (e, idioma) => {
    const cfg = leerConfig()
    cfg.idioma = idioma
    guardarConfig(cfg)
    // Si el usuario no ha elegido idioma de corrector aparte, seguir a la interfaz
    if (!cfg.idiomaCorrector) {
      const win = BrowserWindow.fromWebContents(e.sender)
      if (win) aplicarCorrector(win, correctorPorDefecto(idioma))
    }
    return { ok: true }
  })

  ipcMain.handle('corrector:idiomas', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const disp = win ? (win.webContents.session.availableSpellCheckerLanguages || []) : []
    const cfg = leerConfig()
    return { disponibles: disp, actual: cfg.idiomaCorrector || correctorPorDefecto(cfg.idioma || 'es') }
  })

  ipcMain.handle('corrector:set', (e, codigo) => {
    const cfg = leerConfig()
    cfg.idiomaCorrector = codigo
    guardarConfig(cfg)
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win) aplicarCorrector(win, codigo)
    return { ok: true }
  })

  ipcMain.handle('archivo:inicial', async () => {
    if (!archivoPendiente) return null
    const proy = await leerProyectoArchivo(archivoPendiente)
    archivoPendiente = null
    return proy
  })

  ipcMain.handle('importar:fountain', async () => {
    const r = await dialog.showOpenDialog({
      title: 'Importar guion Fountain',
      properties: ['openFile'],
      filters: [{ name: 'Fountain / Texto', extensions: ['fountain', 'txt', 'spmd'] }],
    })
    if (r.canceled || !r.filePaths[0]) return null
    const texto = await fsp.readFile(r.filePaths[0], 'utf-8')
    const nombre = path.basename(r.filePaths[0]).replace(/\.[^.]+$/, '')
    return { nombre, texto }
  })
}

// Envía a la ventana la orden de abrir un guion (cuando la app ya está abierta)
async function enviarAbrirArchivo(ruta) {
  const proy = await leerProyectoArchivo(ruta)
  if (!proy) return
  const win = BrowserWindow.getAllWindows()[0]
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
    win.webContents.send('abrir-archivo', proy)
  }
}

// macOS: doble clic en un .slate
app.on('open-file', (e, ruta) => {
  e.preventDefault()
  if (app.isReady() && BrowserWindow.getAllWindows().length) enviarAbrirArchivo(ruta)
  else archivoPendiente = ruta
})

// Windows: segunda instancia (doble clic con la app ya abierta)
app.on('second-instance', (_e, argv) => {
  const f = archivoSlateDe(argv)
  if (f) enviarAbrirArchivo(f)
  else {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) { if (win.isMinimized()) win.restore(); win.focus() }
  }
})

app.whenReady().then(() => {
  archivoPendiente = archivoSlateDe(process.argv)
  registrarIPC()
  crearVentana()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
