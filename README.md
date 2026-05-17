# HARVIS

> **H**ome **A**ssistant **R**eal-time **V**isual **I**ntelligence **S**ystem

A Home Assistant theme and animated Lovelace card inspired by J.A.R.V.I.S. from the Iron Man films. Dark navy background, glowing cyan accents, animated arc reactor with rotating rings and scanner sweep.

---

## Features

- Full HA UI theme — sidebar, cards, inputs, toggles, energy dashboard
- `harvis-card` — animated arc reactor with:
  - Multiple counter-rotating rings with tick marks and arc segments
  - Scanner sweep beam
  - Pulsing arc reactor core with hexagonal inner geometry
  - Live clock display or sensor entity value
  - Configurable size, color, and speed
- Example Lovelace dashboard layout

---

## Installation

### Via HACS (recommended)

1. Open HACS → **Frontend**
2. Click the three-dot menu → **Custom repositories**
3. Add `https://github.com/scottdsauer/harvis` with category **Lovelace**
4. Search for **HARVIS** and install
5. Add the theme (see below)

### Manual

1. Download `harvis-card.js` and place it in `/config/www/harvis/harvis-card.js`
2. Copy `themes/harvis.yaml` into `/config/themes/harvis.yaml`
3. In `configuration.yaml` make sure you have:
   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
   ```
4. Add the resource to Lovelace:
   - **Settings → Dashboards → Resources → Add Resource**
   - URL: `/local/harvis/harvis-card.js`
   - Type: `JavaScript module`
5. Restart Home Assistant

---

## Activate the Theme

**Profile → Theme → HARVIS**

Or set it as default in `configuration.yaml`:
```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/harvis/harvis-card.js
```

---

## Using the Card

### Basic (shows live clock)
```yaml
type: custom:harvis-card
title: HARVIS
show_time: true
```

### Display a sensor entity
```yaml
type: custom:harvis-card
title: CPU TEMP
entity: sensor.processor_temperature
```

### Full configuration
```yaml
type: custom:harvis-card
title: HARVIS         # Text label above the arc reactor
show_time: true       # Show live clock in center (default: true)
entity: sensor.xxx    # Entity to display — overrides show_time
size: 300             # Card diameter in px (default: 300)
color: "#00d4ff"      # Primary color (default: #00d4ff)
speed: 1              # Animation speed multiplier (default: 1)
```

---

## Requirements

- Home Assistant 2023.1+
- HACS (for easy install) or manual resource registration

---

## License

MIT — free to use, modify, and distribute.
