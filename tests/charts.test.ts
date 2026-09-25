/* Chart geometry guards. Run with:  npm run test:charts
 * These are the rungs and ratios the product's charts land on. Changing one
 * moves every bar and every area path, so it should be a deliberate edit. */
import { COLUMN, OVERLAY_POINT_PADDING, columnWidth, niceMax } from '../src/components/charts/primitives.ts'

let fails = 0
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(46)} got ${JSON.stringify(got)} want ${JSON.stringify(want)}`)
}

/* the full ladder, including the rungs a simpler version drops */
eq('niceMax 0.9', niceMax(0.9), 1)
eq('niceMax 1.2', niceMax(1.2), 1.5)
eq('niceMax 1.8', niceMax(1.8), 2)
eq('niceMax 2.4', niceMax(2.4), 2.5)
eq('niceMax 2.8', niceMax(2.8), 3)
eq('niceMax 3.4', niceMax(3.4), 4)
eq('niceMax 4.6', niceMax(4.6), 5)
eq('niceMax 6.2', niceMax(6.2), 7.5)
eq('niceMax 8.1', niceMax(8.1), 10)
eq('niceMax 112', niceMax(112), 150)
eq('niceMax 88.26 (vendor score)', niceMax(88.26), 100)
eq('niceMax 49.8 (vendor score)', niceMax(49.8), 50)
eq('niceMax 0', niceMax(0), 1)

/* overlay geometry: the wide series sits behind, the narrow one in front,
   both centred on the category. A 51.8px slot is the nine-month view. */
const slot = 51.8
const wide = columnWidth(slot, OVERLAY_POINT_PADDING[0])
const narrow = columnWidth(slot, OVERLAY_POINT_PADDING[1])
eq('wide column width', +wide.toFixed(2), +(slot * 0.8 * 0.9).toFixed(2))
eq('narrow column width', +narrow.toFixed(2), +(slot * 0.8 * 0.44).toFixed(2))
eq('narrow sits inside wide', narrow < wide, true)
eq('max point width caps wide bars', columnWidth(400, OVERLAY_POINT_PADDING[0]) <= COLUMN.maxPointWidth + 0.01, true)
eq('cap keeps the width ratio', +(columnWidth(400, OVERLAY_POINT_PADDING[1]) / columnWidth(400, OVERLAY_POINT_PADDING[0])).toFixed(4),
   +(narrow / wide).toFixed(4))

console.log(fails ? `\n${fails} chart geometry mismatches` : '\nall chart geometry checks passed')
process.exit(fails ? 1 : 0)
