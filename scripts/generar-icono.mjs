// Genera build/icon.ico (Windows) y build/icon.png (Mac/Linux) a partir de build/icon.svg
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.join(dir, '..')
const svg = await readFile(path.join(raiz, 'build', 'icon.svg'))

// PNG grande para Mac/Linux
await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(path.join(raiz, 'build', 'icon.png'))

// Varios tamaños para el .ico de Windows
const tamanos = [16, 24, 32, 48, 64, 128, 256]
const pngs = await Promise.all(
  tamanos.map(s => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
)
const ico = await pngToIco(pngs)
await writeFile(path.join(raiz, 'build', 'icon.ico'), ico)

console.log('✓ Icono generado: build/icon.ico y build/icon.png')
