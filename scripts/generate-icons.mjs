import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const dir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const svgIcon = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#7C3AED"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-size="${size * 0.45}px" fill="white">✨</text>
</svg>`

async function generate() {
  for (const size of sizes) {
    const svg = svgIcon(size)
    const outputPath = path.join(dir, `icon-${size}x${size}.png`)
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outputPath)
    console.log(`生成 icon-${size}x${size}.png`)
  }
}

generate().catch(console.error)
