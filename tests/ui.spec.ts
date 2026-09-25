import { expect, test } from '@playwright/test'

/* Filter coverage. Every control must change the numbers on screen.
 * Run with:  npm run test:ui   (or npx playwright test) */

const LENSES = ['vendorPerformance', 'capacityUtilizationHealth', 'costEfficiency']

const hero = (page: import('@playwright/test').Page) =>
  page.$$eval('.kpi .kpi-val', els => els.map(e => e.textContent).join('|'))

test.describe('lens pages', () => {
  for (const lens of LENSES) {
    test(`${lens}: every filter recomputes`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(String(e)))

      await page.goto(`/#/${lens}`)
      await expect(page.locator('.vhead')).toHaveCount(3)

      // period tabs
      const seen = new Set<string>()
      for (const p of ['Yearly', 'Quaterly', 'Monthly', 'Weekly']) {
        await page.click(`[data-period="${p}"]`)
        seen.add(await hero(page))
      }
      expect(seen.size, 'each period produces a different hero row').toBeGreaterThan(2)

      // year picker
      await page.click('[data-period="Yearly"]')
      const before = await hero(page)
      await page.click('[data-pop="date"]')
      await page.click('[data-popbody="date"] [data-setyear="2025"]')
      await expect(page.locator('[data-pop="date"] .cv')).toHaveText('2025')
      expect(await hero(page)).not.toBe(before)

      // quarter picker
      await page.click('[data-period="Quaterly"]')
      await page.click('[data-pop="date"]')
      await page.click('[data-popbody="date"] [data-setq="1"]')
      await expect(page.locator('[data-pop="date"] .cv')).toHaveText('Q1 2025')

      // month picker
      await page.click('[data-period="Monthly"]')
      await page.click('[data-pop="date"]')
      await page.click('[data-popbody="date"] [data-setmonth="3"]')
      await expect(page.locator('[data-pop="date"] .cv')).toHaveText('Apr 2025')

      // day range
      await page.click('[data-period="Weekly"]')
      await page.click('[data-pop="date"]')
      const days = page.locator('[data-popbody="date"] [data-day]')
      await days.nth(9).click()
      await days.nth(13).click()
      await expect(page.locator('[data-pop="date"] .cv')).toContainText('–')

      // vendor multiselect narrows the grid
      await page.click('[data-period="Yearly"]')
      await page.click('[data-pop="vend"]')
      await page.locator('[data-popbody="vend"] .vendOpt').nth(2).uncheck()
      await page.locator('[data-popbody="vend"] .vendOpt').nth(1).uncheck()
      await page.click('[data-popbody="vend"] [data-act="vendApply"]')
      await expect(page.locator('.vhead')).toHaveCount(1)

      // metric chip narrows the sections
      const sectionsAll = await page.locator('.sect').count()
      const chips = page.locator('.chip')
      await chips.nth(await chips.count() - 1).click()
      expect(await page.locator('.sect').count()).toBeLessThan(sectionsAll)

      // reset restores everything
      await page.click('[data-act="reset"]')
      await expect(page.locator('.vhead')).toHaveCount(3)

      // clearing the vertical empties the page
      await page.click('[data-pop="vert"]')
      await page.click('[data-testid="vert-all"]')
      await page.click('[data-popbody="vert"] [data-act="vertApply"]')
      await expect(page.locator('.vhead')).toHaveCount(0)
      await expect(page.locator('.nodata')).toHaveCount(1)

      expect(errors, 'no console errors').toEqual([])
    })
  }
})

test('vendor detail opens, recomputes and returns', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto('/#/vendorPerformance')
  await page.locator('.vhead').first().click()
  await expect(page.locator('.phead h1')).toHaveText('PH Engineering')

  const seen = new Set<string>()
  for (const p of ['Yearly', 'Quaterly', 'Monthly', 'Weekly']) {
    await page.click(`[data-dperiod="${p}"]`)
    seen.add(await page.$$eval('.dkpi .v', els => els.map(e => e.textContent).join('|')))
  }
  expect(seen.size).toBeGreaterThan(2)

  await page.click('[data-act="back"]')
  await expect(page.locator('.phead h1')).toHaveText('Vendor Performance')
  expect(errors).toEqual([])
})

test('roles change the landing lens and the visible metrics', async ({ page }) => {
  await page.goto('/')
  await page.selectOption('[data-testid="role-switcher"]', 'delivery-manager')
  await expect(page.locator('.phead h1')).toHaveText('Capacity & Utilization')
  await expect(page.locator('.chip', { hasText: 'Headcount by Role' })).toHaveCount(0)

  await page.selectOption('[data-testid="role-switcher"]', 'finance-manager')
  await expect(page.locator('.phead h1')).toHaveText('Cost Efficiency')
})

test('metric tooltips are keyboard reachable and carry the spec copy', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  const info = page.locator('.info-btn').first()
  await info.focus()
  await expect(page.locator('.info-pop').first()).toBeVisible()
  await expect(info).toHaveAttribute('aria-label', /Productive work delivered/)
})

test('chart hover shows a tooltip', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.locator('.sect .chart .hotpt').first().hover()
  await expect(page.locator('.chart-tip')).toBeVisible()
})

/* ------------------------------------------------------------------ *
 *  Regression guards from the September audit. Each of these would
 *  have caught a defect that shipped in v1.0.
 * ------------------------------------------------------------------ */

test('columns render at their real height, not a CSS-collapsed one', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.waitForSelector('.col-bar')
  const boxes = await page.$$eval('.col-bar', els =>
    els.map(e => (e as SVGGraphicsElement).getBBox().height))
  expect(boxes.length, 'columns are drawn at all').toBeGreaterThan(10)
  // a CSS rule leaking onto the SVG once pinned every bar to 7px
  expect(Math.max(...boxes), 'tallest column is a real height').toBeGreaterThan(40)
  expect(boxes.filter(h => h > 0 && h < 4).length, 'no collapsed columns').toBe(0)
})

test('paired columns overlay on the category, as the product draws them', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.waitForSelector('.col-bar')
  const geo = await page.evaluate(() => {
    const sect = [...document.querySelectorAll('.sect')]
      .find(s => s.querySelector('h3')?.textContent?.includes('Output Rate') && s.querySelector('.col-bar'))
    const bars = [...(sect?.querySelectorAll('.col-bar') ?? [])]
      .map(e => (e as SVGGraphicsElement).getBBox())
    return bars.slice(0, 2).map(b => ({ mid: +(b.x + b.width / 2).toFixed(1), w: +b.width.toFixed(1) }))
  })
  expect(geo.length).toBe(2)
  // same centre: overlaid, not side by side
  expect(Math.abs(geo[0].mid - geo[1].mid)).toBeLessThan(0.6)
  // and the front series is the narrower one
  expect(geo[1].w).toBeLessThan(geo[0].w)
})

test('filter buttons are disabled when there is nothing to do', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-pop="vend"]')
  await expect(page.locator('[data-act="vendReset"]')).toBeDisabled()
  await expect(page.locator('[data-act="vendApply"]')).toBeDisabled()
  await expect(page.locator('[data-act="reset"]')).toBeDisabled()
  await expect(page.locator('[data-act="apply"]')).toBeDisabled()
})

test('popover Apply commits the staged selection and closes', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-pop="vend"]')
  await page.locator('[data-popbody="vend"] .vendOpt').nth(2).uncheck()
  // staging must not touch the page yet
  await expect(page.locator('.vhead')).toHaveCount(3)
  await expect(page.locator('[data-act="vendApply"]')).toBeEnabled()
  await page.click('[data-act="vendApply"]')
  await expect(page.locator('.vhead')).toHaveCount(2)
  await expect(page.locator('[data-popbody="vend"]')).toHaveClass(/hidden/)
})

test('the page-level Apply commits the staged selection too', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-pop="vend"]')
  await page.locator('[data-popbody="vend"] .vendOpt').nth(2).uncheck()
  await expect(page.locator('[data-act="apply"]')).toBeEnabled()
  await page.click('[data-act="apply"]')
  await expect(page.locator('.vhead')).toHaveCount(2)
  await expect(page.locator('[data-pop="vend"] .cv')).toHaveText(/\+ 1 More/)
})

test('popover Reset restores everything, applies it and closes', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-pop="vend"]')
  await page.locator('[data-popbody="vend"] .vendOpt').nth(2).uncheck()
  await page.click('[data-act="vendApply"]')
  await expect(page.locator('.vhead')).toHaveCount(2)

  await page.click('[data-pop="vend"]')
  await expect(page.locator('[data-act="vendReset"]')).toBeEnabled()
  await page.click('[data-act="vendReset"]')
  await expect(page.locator('.vhead')).toHaveCount(3)
  await expect(page.locator('[data-pop="vend"] .cv')).toHaveText('All Vendor')
  await expect(page.locator('[data-popbody="vend"]')).toHaveClass(/hidden/)
})

test('page-level Reset restores the whole filter bar', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-period="Monthly"]')
  await page.click('[data-pop="vend"]')
  await page.locator('[data-popbody="vend"] .vendOpt').nth(2).uncheck()
  await page.click('[data-act="vendApply"]')
  await expect(page.locator('[data-act="reset"]')).toBeEnabled()
  await page.click('[data-act="reset"]')
  await expect(page.locator('.vhead')).toHaveCount(3)
  await expect(page.locator('[data-period="Yearly"]')).toHaveClass(/on/)
  await expect(page.locator('[data-act="reset"]')).toBeDisabled()
})

test('a vertical with no vendors gives the empty state', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await page.click('[data-pop="vert"]')
  // leave only the second vertical, which has no vendors assigned yet
  await page.locator('[data-popbody="vert"] .vertOpt').nth(0).uncheck()
  await page.click('[data-act="vertApply"]')
  await expect(page.locator('.vhead')).toHaveCount(0)
  await expect(page.locator('.nodata')).toHaveCount(1)
})

test('headcount aside is the sum of the mapped roles', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  const check = await page.evaluate(() => {
    const sect = [...document.querySelectorAll('.sect')]
      .find(s => s.querySelector('h3')?.textContent?.includes('Headcount by Role'))
    const aside = sect?.querySelector('.aside')?.textContent ?? ''
    const counts = [...(sect?.querySelectorAll('.rl b') ?? [])].map(b => Number(b.textContent))
    return { aside, sum: counts.reduce((a, b) => a + b, 0) }
  })
  expect(check.aside).toBe(`${check.sum} headcount`)
})

test('the two employee tiles carry no period comparison', async ({ page }) => {
  await page.goto('/#/capacityUtilizationHealth')
  for (const label of ['Over Utilized Employee', 'Under Utilized Employee']) {
    const tile = page.locator('.kpi', { hasText: label })
    await expect(tile.locator('.delta')).toHaveCount(0)
  }
})

test('metric names follow config/copy.json', async ({ page }) => {
  await page.goto('/#/vendorPerformance')
  await expect(page.locator('.kpi-label', { hasText: 'Cost Loss' })).toHaveCount(1)
  await page.goto('/#/capacityUtilizationHealth')
  await expect(page.locator('.sect h3', { hasText: 'Idle Time Cost' }).first()).toBeVisible()
  // the key-value row inside the card follows the same rename
  await expect(page.locator('.sect .kv', { hasText: 'Idle Time Cost' }).first()).toBeVisible()
})

test('the x-axis caption follows the period, not a hardcoded label', async ({ page }) => {
  await page.goto('/#/costEfficiency')
  await page.click('[data-period="Yearly"]')
  const caps = await page.$$eval('.xcap', els => els.map(e => e.textContent))
  expect(caps.every(c => c === 'Month'), `captions were ${caps.join(',')}`).toBe(true)
  await page.click('[data-period="Weekly"]')
  const weekly = await page.$$eval('.xcap', els => els.map(e => e.textContent))
  expect(weekly.every(c => c === 'Day'), `captions were ${weekly.join(',')}`).toBe(true)
})
