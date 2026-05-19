const express = require('express')
const cors = require('cors')
const { chromium } = require('playwright')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('rank api server')
})

app.post('/api/rank/check', async (req, res) => {

  const { keyword, targetUrl } = req.body

  if (!keyword || !targetUrl) {
    return res.status(400).json({
      error: 'keyword, targetUrl required'
    })
  }

  let browser

  try {

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })

    const page = await browser.newPage()

    await page.goto(
      `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      }
    )

    await page.waitForTimeout(3000)

    const links = await page.$$eval('a', els => {

      return els
        .map(el => ({
          title: el.innerText?.trim(),
          href: el.href
        }))
        .filter(item => item.href)

    })

    const items = links.slice(0, 30)

    res.json({
      success: true,
      keyword,
      total: items.length,
      items
    })

  } catch (e) {

    console.error(e)

    res.status(500).json({
      success: false,
      message: e.message
    })

  } finally {

    if (browser) {
      await browser.close()
    }

  }

})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`server running : ${PORT}`)
})
