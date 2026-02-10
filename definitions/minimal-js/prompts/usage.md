# Usage Instructions

A vanilla HTML/CSS/JS template for stunning, hand-crafted web pages. No frameworks, no build steps—just beautiful design with modern CSS techniques.

## Included Libraries
- **Google Fonts** — Inter font family for crisp, modern typography
- **Lucide Icons** — 1000+ beautiful open-source icons (MIT licensed)
- **Tailwind CSS (CDN)** — Utility-first CSS framework loaded via CDN

**Important**: Always use Tailwind CSS via CDN script tag only. Never use the Tailwind CLI, PostCSS, or any build-time Tailwind configuration. Add Tailwind classes directly in HTML.

### Tailwind CDN Setup
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

Then use Tailwind utility classes directly:
```html
<h1 class="text-3xl font-bold underline">Hello world!</h1>
```

---

## Visual Design Patterns

### Glass Morphism Cards
Create depth with frosted glass effects. Combine `glass` with `hover-lift` for interactive cards that float on hover:
```html
<div class="card glass hover-lift">
```

### Gradient Text
Make headings pop with animated gradient fills using `gradient-text` on any text element.

### Ambient Glow
The `ambient-glow` div creates soft radial gradients in the background. Customize colors in CSS to match your brand.

### Staggered Animations
Wrap elements in a `stagger` container for cascading entrance animations—each child animates 0.1s after the previous.

---

## Layout Building Blocks

### Hero Sections
Full-height hero with centered content, badge, headline, subtitle, and action buttons. Use `hero`, `hero-content`, and `hero-actions` classes.

### Responsive Grids
Auto-fitting grid that adapts from 1 to 3+ columns:
```html
<div class="grid">
  <!-- Cards automatically arrange -->
</div>
```

### Stats Displays
Showcase metrics with large gradient numbers and uppercase labels using `stats-grid`, `stat-value`, and `stat-label`.

### Sections
Alternate between `section` (white) and `section section-alt` (light gray) for visual rhythm.

---

## Interactive Elements

### Buttons
- **Primary**: `btn` — gradient background with glow shadow
- **Outline**: `btn btn-outline` — transparent with border
- **Sizes**: Add `btn-sm` or `btn-lg`

### Scroll Reveal
Add `reveal` class to any element for fade-up animation when scrolled into view. JavaScript handles the intersection observer automatically.

### Smooth Scrolling
Anchor links like `href="#services"` automatically smooth-scroll to their targets.

### Sticky Header
The `header glass` becomes more opaque as user scrolls, handled by JavaScript.

---

## Icons

Add Lucide icons anywhere with the `data-lucide` attribute:
```html
<i data-lucide="rocket"></i>
<i data-lucide="sparkles"></i>
<i data-lucide="heart"></i>
```

Popular icons for business sites: `target`, `zap`, `gem`, `mail`, `phone`, `map-pin`, `check-circle`, `star`, `users`, `clock`, `shield`, `award`

Browse all icons: https://lucide.dev/icons

---

## Theming

### Color Customization
All colors flow from CSS variables in `:root`. Change `--accent` and `--accent-secondary` to transform the entire site's color scheme instantly.

### Light/Dark Adaptation
Variables like `--bg-primary`, `--text-primary`, and `--surface` control the base theme. Swap their values to create dark mode variants.

### Shadow & Glow
Use `--shadow`, `--shadow-lg`, and `--glow` for consistent depth. Add `glow` class to any element for accent-colored glow effect.

---

## Typography

- **Headings**: Fluid sizing with `clamp()` for responsive scaling
- **Body text**: Uses `--text-secondary` for comfortable reading
- **Muted text**: Apply `--text-muted` for less important info

---

## Common Patterns

### Feature Cards with Icons
Card with centered icon, title, and description—perfect for services or features.

### Call-to-Action Blocks
Combine `cta-card glass glow` for attention-grabbing contact sections.

### Contact Info with Icons
Inline icons before text create scannable contact details.

### Badges
Small `badge` elements for social proof like "⭐ Trusted by 500+ customers".
