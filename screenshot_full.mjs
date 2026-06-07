import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const dir = join(__dirname, 'screenshots')
await mkdir(dir, { recursive: true })
const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 })
await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' })
await page.evaluate(() => {
  document.querySelectorAll('.reveal, .fade').forEach(el => el.classList.add('in'))
  document.querySelectorAll('.h-in').forEach(el => {
    el.style.opacity = '1'
    el.style.transform = 'none'
    el.style.animation = 'none'
  })
  document.querySelectorAll('*').forEach(el => {
    const s = el.style
    if (s.animation || s.opacity === '0') {
      s.opacity = '1'
      s.transform = 'none'
      s.animation = 'none'
    }
  })
})
await new Promise(r => setTimeout(r, 600))
await page.screenshot({ path: join(dir, 'full.png'), fullPage: true })
await browser.close()
console.log('done')
