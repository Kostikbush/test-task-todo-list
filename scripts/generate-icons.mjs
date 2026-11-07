import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const icon = await readFile(new URL('../public/favicon.svg', import.meta.url))
await Promise.all(
  [192, 512].map((size) =>
    sharp(icon)
      .resize(size, size)
      .png()
      .toFile(
        new URL(`../public/pwa-${size}x${size}.png`, import.meta.url).pathname.replace(
          /^\/(?=[A-Za-z]:)/,
          '',
        ),
      ),
  ),
)
const mark = await sharp(icon).resize(308, 308).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#277966' } })
  .composite([{ input: mark, gravity: 'center' }])
  .png()
  .toFile(
    new URL('../public/pwa-maskable.png', import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/, ''),
  )
