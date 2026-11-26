# Responsive and accessibility QA

Checked on 2026-11-26 against the Docker Compose stack (`web` on http://localhost:5173, seeded data).
Issue: #38.

## How it was checked

- **Pages:** home, catalogue, item details (signed out and as a customer, where the booking form lives),
  login, register, 404, dashboard overview (customer and staff), My rentals, staff desk,
  catalogue management and reports.
- **Widths:** 375 px (phone), 768 px (tablet) and 1280 px (desktop), each in English and Estonian.
- **Horizontal scrolling:** the page's `scrollWidth` compared with the viewport width, and every element
  checked for sticking out of the viewport (elements inside their own scroll container are allowed).
- **Text overflow:** buttons, labels, links, badges and table cells checked for text wider than their box.
- **Dialogs and menus:** the mobile menu, account menu, add item, add category and the desk's receive
  dialog, opened at 375 px and 768 px in Estonian.
- **Keyboard:** Tab through every page at 375 px and 1280 px; each focus stop must look different when
  focused (outline, ring, border or background).
- **Lighthouse:** the accessibility category in Chrome's built-in Lighthouse, mobile and desktop, in both
  languages.

## Results

| Check | Result |
| --- | --- |
| Horizontal scrolling at 375 / 768 / 1280 px | None on any page, in either language |
| Text overflowing buttons, cards, tables | One problem found and fixed (see below) |
| Visible focus on every Tab stop | Yes, on every page |
| Form labels | Every field has a label (Lighthouse `label` audit passes) |
| Lighthouse accessibility, before fixes | 96–100 (lowest: dashboard overview on desktop) |
| Lighthouse accessibility, after fixes | **100** on all 13 pages, mobile and desktop, English and Estonian |

Wide tables (staff desk, My rentals, catalogue management) scroll sideways inside their own card on
phones; the page itself does not scroll sideways.

## Problems found and fixed

1. **Colour contrast.** The muted text colour `#6c757d` had a contrast ratio of 4.49:1 on the light
   table-header and sidebar background `#fafafa` (WCAG AA needs 4.5:1). It is now `#646d74`: 5.05:1 on
   `#fafafa` and 4.59:1 on the lavender accent background. Dark mode already passed (`#a6a6a6`, 6.1:1 or more).
2. **Estonian labels in the home page search at 375 px.** "Kättesaamine" and "Tagastamine" were wider
   than the half-width date fields. The calendar icons in those two fields are now hidden below 640 px.
3. **No way to skip the header with the keyboard.** A "Skip to main content" / "Liigu põhisisu juurde"
   link is now the first Tab stop on every page. It appears when focused and moves focus to `<main>`.
