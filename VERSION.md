# Version history

Newest first. One line per change. Bump the minor number for new capability,
the patch number for fixes only.

## 1.1.0, 23 Sep 2026

Full chart and functionality audit against the v1.0 HTML prototype and the live
build at enhance.prohance.io, then every finding fixed.

Fixed
- Column charts rendered 7px tall. A `.bar` rule written for the progress bars
  was also matching the SVG rects, and CSS geometry beats the SVG attribute.
- Paired columns were drawn side by side. The product overlays them: a wide bar
  behind, a narrower bar centred in front. Now matched, including top-only
  rounded corners and a width cap so short series do not become slabs.
- Axis maxima were wrong on every chart. The rounding ladder was missing its
  1.5, 3, 4 and 7.5 rungs.
- Vendor Score trend axis now follows the data the way the product does, instead
  of being floored at 50.
- Both Reset and Apply pairs did nothing visible. Multiselect changes now stage
  behind Apply, Reset restores and applies, both close the popover, the page-level
  pair acts on whatever is staged, and all four disable when there is nothing to do.
- Headcount by Role showed the licensed headcount; it is the sum of the mapped
  roles, which is why the product reads 69 for PH Engineering and not 75.
- Over and Under Utilized Employee showed a period comparison the product does not.
- Sparklines were the wrong size and missing their gradient fill.
- The x-axis caption on three metrics said "Day" regardless of period.

Changed
- "Cost at Risk" is now "Cost Loss" and "Idle Cost" is "Idle Time Cost", both
  shipped in the live build and asked for by the metric tooltip spec.
- Second vertical added so the vertical filter is demonstrably real. No vendors
  are assigned to it yet, so selecting it alone gives the empty state.
- Clearing every vertical empties the page; clearing every vendor falls back to all.

Added
- `npm run test:charts`, a browser-free guard on the axis ladder and column geometry.
- Twelve Playwright tests, one per defect above.

## 1.0.0, 16 Sep 2026

First local project. Vite, React and TypeScript, hand-drawn SVG charts, no chart
library.

- Computed dataset: one deterministic daily series per vendor, calibrated so
  Yearly 2026 reproduces the live product's published figures exactly.
- Three lenses, the vendor drilldown, four working date pickers, vertical and
  vendor filters, metric chips.
- Config-driven: vendors, verticals, lenses, roles, copy, thresholds and theme
  are seven JSON files; metrics are a registry of pure functions.
- Role-based views with a "View as" switcher.
- `npm run test:engine` and a Playwright filter sweep.
- `npm run standalone` emits one self-contained HTML file.
