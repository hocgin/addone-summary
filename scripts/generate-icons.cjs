const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '../public/icons')

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// 创建简单的 SVG 作为占位符
const svg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="128" y2="128">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#gradient)"/>
  <text x="64" y="80" font-size="48" text-anchor="middle" fill="white" font-weight="bold" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">AI</text>
</svg>`

// 写入 SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg)

// 创建最小的 PNG 文件（1x1 紫色像素）
const minimalPng = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, // 8-bit RGBA
  0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk start
  0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // Compressed data
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // for a purple pixel
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,         // IEND
  0xAE, 0x42, 0x60, 0x82
])

const sizes = [16, 32, 48, 128]
sizes.forEach(size => {
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), minimalPng)
})

console.log('占位图标已创建。请将 public/icons/icon.svg 转换为 PNG 以获得更好的视觉效果。')
