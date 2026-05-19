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

  console.log('API START')

  const { keyword } = req.body

  if (!keyword) {
    return res.status(400).json({
      error: 'keyword required'
    })
  }

  let browser

  try {

    console.log('BROWSER OPEN')

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })

    console.log('NEW PAGE')

    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    )

    console.log('GOTO START')

    await page.goto(
      `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      }
    )

    console.log('GOTO END')

    await page.waitForSelector('.total_tit', {
      timeout: 10000
    })

    const links = await page.$$eval('.total_tit', els => {

      return els.map(el => ({
        title: el.innerText?.trim(),
        href: el.href
      }))

    })

    console.log('LINKS:', links.length)

    const items = links.slice(0, 30)

    res.json({
      success: true,
      keyword,
      total: items.length,
      items
    })

  } catch (e) {

    console.log('ERROR')

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
