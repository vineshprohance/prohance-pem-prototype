/**
 * Inlines dist/ into one self-contained HTML file.
 *
 *   npm run standalone
 *
 * Produces two files in dist-standalone/:
 *   ProHance-PEM.html        a full document you can open from disk or email
 *   artifact-body.html       the same page without doctype/html/head/body, which
 *                            is the form the Claude Artifact tool expects
 *
 * Nothing is fetched at runtime, so the page works offline apart from the
 * Google Fonts link, which falls back to the system sans stack.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const OUT = 'dist-standalone'
const TITLE = 'ProHance PEM'

const assets = readdirSync(join(DIST, 'assets'))
const jsFile = assets.find(f => f.endsWith('.js'))
const cssFile = assets.find(f => f.endsWith('.css'))
if (!jsFile || !cssFile) {
  console.error('No build found. Run `npm run build` first.')
  process.exit(1)
}

const js = readFileSync(join(DIST, 'assets', jsFile), 'utf8')
const css = readFileSync(join(DIST, 'assets', cssFile), 'utf8')

const FONTS = '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">'

const body = `${FONTS}
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>`

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${TITLE}</title>
</head>
<body>
${body}
</body>
</html>
`

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'ProHance-PEM.html'), page)
writeFileSync(join(OUT, 'artifact-body.html'), `<title>${TITLE}</title>\n${body}\n`)

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`
console.log(`${OUT}/ProHance-PEM.html     ${kb(page)}   open from disk, or email it`)
console.log(`${OUT}/artifact-body.html    ${kb(body)}   publish this one as a Claude artifact`)
