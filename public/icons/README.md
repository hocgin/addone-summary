# 图标文件

此目录需要包含以下尺寸的图标文件：

- icon16.png - 16x16 像素
- icon32.png - 32x32 像素
- icon48.png - 48x48 像素
- icon128.png - 128x128 像素

可以使用以下工具生成图标：

1. 在线工具：https://favicon.io/
2. 设计工具：Figma, Sketch, Adobe Illustrator
3. 命令行工具：ImageMagick

临时可以使用以下 SVG 转换为 PNG：

```svg
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="url(#gradient)"/>
  <text x="64" y="80" font-size="48" text-anchor="middle" fill="white" font-weight="bold">AI</text>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="128" y2="128">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
</svg>
```
