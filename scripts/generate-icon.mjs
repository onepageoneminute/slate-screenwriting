// Generates build/icon.ico (Windows) and build/icon.png (Mac/Linux) from build/icon.svg.
// Dev tool only — requires `sharp` and `png-to-ico` (npm i -D sharp png-to-ico).
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '..')
const svg = await readFile(path.join(root, 'build', 'icon.svg'))

// Large PNG for Mac/Linux
await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(path.join(root, 'build', 'icon.png'))

// Several sizes for the Windows .ico
const sizes = [16, 24, 32, 48, 64, 128, 256]
const pngs = await Promise.all(
  sizes.map(s => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
)
const ico = await pngToIco(pngs)
await writeFile(path.join(root, 'build', 'icon.ico'), ico)

console.log('✓ Icon generated: build/icon.ico and build/icon.png')
