# Claude Code Instructions – Epic Calendar

## Project Overview

Epic Calendar – Interaktiver logarithmischer Zeitstrahl von Urknall bis heute.
Visualisiert historische Events, Erdzeitalter und Hochkulturen aus mehreren Kontinenten.

**Tech Stack:**

- React Native mit Expo SDK 52
- TypeScript
- @shopify/react-native-skia (Canvas-Rendering der Zeitachse)
- react-native-reanimated 3.x (Animationen)
- react-native-gesture-handler (Pinch/Pan)
- @react-native-async-storage/async-storage (Persistenz)
- i18next / react-i18next (DE/EN)
- Web-Deploy via GitHub Pages (`/Epic_Calendar` base URL)

## Workflow & Git Management

### Branch-Strategie

**IMPORTANT: Apply these rules to ALL changes unless explicitly overridden:**

1. **Always create a PR** – auch für kleine Änderungen
2. **Work on `testing` branch** – niemals direkt auf main committen
3. **Branch-Sync** – vor Arbeit auf testing sicherstellen:
   - `testing` ≥ `main` (gleicher Commit oder neuer)

**Workflow:**

```
git checkout testing
git pull origin testing
git merge origin/main  (falls nötig)

git checkout -b feature/issue-XXX

# ... Änderungen ...

gh pr create --base testing --title "Fix #XXX: ..." --body "..."
```

### Pull Request Requirements

- Titel: Issue-Nummer referenzieren (z.B. "Fix #28: Standardisierung")
- Target: **immer `testing`** (nicht main)
- CI muss grün sein vor Merge
- Merge Feature→testing: `gh pr merge <nr> --squash --delete-branch`
- Merge testing→main: `gh pr merge <nr> --squash` (kein `--delete-branch`!) + `--admin`

---

## Development Guidelines

### Code Style

- TypeScript mit strikter Typisierung
- Skia-Rendering: alle Koordinaten in logarithmischer Skala berechnen
- LOD-Bänder (Level of Detail): Granularität abhängig vom Zoom-Level
- Keine hardcodierten Texte – immer i18n (`useTranslation`)

### Besonderheiten der Zeitachse

- Logarithmische Zeitskala: `yearToT(year)` / `tToYear(t)` aus `@/timeline/scale`
- LOD-Bänder steuern welche Events bei welchem Zoom sichtbar sind
  - Bandgrenzen: `< 12` → 0, `< 30` → 1, `< 100` → 2, `< 500` → 3, else → 4
- `culling.ts`: filtert Events außerhalb des Viewports
- `formatYear.ts`: formatiert Jahreszahlen (v. Chr., Mio., Mrd.)
- `lod.ts`: Level-of-Detail-Berechnung, exportiert `T_MIN`, `T_MAX`, `FULL_T_SPAN`
- `scale.ts`: `yearToT`, `tToYear`, `pixelToYear`, `viewportYearRange`
- `epoch.ts`: Epoche-Mapping für Breadcrumb
- **MAX_EVENTS_PER_LANE = 15** – Skia-Loop, Hit-Test und Label-Overlay sind alle auf diesen Wert gecappt. Überschuss erscheint als Cluster-Badge.

### Datenhaltung

- `src/data/` – statische Daten (Europa, Asien, Afrika, Amerika)
- `src/data/schema.ts` – gemeinsames Event-Schema
- AsyncStorage: Kontinent-Auswahl + Kategorie-Filter persistent

### Build & Test

```bash
npm test          # Jest-Tests (94 Unit-Tests)
npm run lint      # ESLint (flat-config via eslint.config.cjs)
npm run type-check # TypeScript
npm run build:web  # Expo Web-Export (GitHub Pages)
```

### Environments

- **Web (Produktion):** https://s540d.github.io/Epic_Calendar/
- **Lokal:** `npx expo start --web`

---

## Module Structure

```
App.tsx
src/
├── components/
│   ├── TimelineView.tsx        # Haupt-Canvas (Skia + Web-Fallback)
│   ├── TimeAxis.tsx            # Zeitachse
│   ├── TimelineBreadcrumb.tsx  # Zoom-Breadcrumb mit Epochen-Kontext
│   ├── TimelineMinimap.tsx     # Übersichtsleiste (Tap + a11y-Actions)
│   ├── EpochJumpBar.tsx        # Schnellsprung-Chips (Urknall→Heute)
│   ├── FilterChipBar.tsx       # Kategorie-/Kontinent-Filter
│   ├── ContinentTabBar.tsx     # Kontinent-Auswahl
│   ├── ZoomLevelIndicator.tsx  # Persistenter LOD-Indikator
│   ├── EventDetailModal.tsx    # Detail-Modal
│   ├── EventPickerPopover.tsx  # Disambiguierung bei überlappenden Events
│   └── ui/                    # Shared UI-Primitives
├── data/
│   ├── schema.ts              # Event-Typen
│   ├── europe.ts              # Europa-Daten
│   ├── asia.ts                # Asien-Daten
│   └── ...
├── timeline/
│   ├── culling.ts             # Viewport-Culling
│   ├── lod.ts                 # Level of Detail + T_MIN/T_MAX/FULL_T_SPAN
│   ├── scale.ts               # yearToT, tToYear, pixelToYear
│   ├── epoch.ts               # Epoche-Mapping
│   ├── formatYear.ts          # Jahr-Formatierung
│   └── __tests__/
├── theme/
│   └── tokens.ts              # Design-Tokens
└── screens/
    └── EventDetailModal.tsx
```

---

## Architektur-Patterns (TimelineView)

### tapDataRef-Pattern

Stabile `useCallback([], [])` Tap-Handler, die aktuellen Viewport-State über einen Ref lesen:

```ts
const tapDataRef = useRef({ lanes, laneTops, visibleByLane, tracksByLane, jsOffsetX, jsPixelsPerUnit });
useLayoutEffect(() => { Object.assign(tapDataRef.current, { ... }); }); // no deps → every render
const handleCanvasTap = useCallback((px, py) => {
  const { ... } = tapDataRef.current; // immer aktuell
}, []);
```

### zoomToFitRef-Pattern

`zoomToFit` ist ein `useCallback` mit `[canvasWidth, ...]` als Deps. Stable-Handler wie `handleCanvasTap` rufen ihn über einen Ref auf:

```ts
const zoomToFitRef = useRef<...>(() => {});
useLayoutEffect(() => { zoomToFitRef.current = zoomToFit; }, [zoomToFit]);
```

### Gesture-Memoisation

Alle RNGH-Gesten via `useMemo`, Reanimated Shared Values sind stabile Refs:

```ts
const panGesture = useMemo(() => Gesture.Pan()..., [canvasWidth, startOffsetX, offsetX, pixelsPerUnit]);
const gesture = useMemo(() => Gesture.Simultaneous(pan, pinch, exclusive), [pan, pinch, exclusive]);
```

---

## Bekannte Eigenheiten

- `baseUrl: '/Epic_Calendar'` in `app.json` – für GitHub Pages nötig
- Skia auf Web: kein `WithSkiaWeb` – weiße Seite → Standard-ScrollView-Fallback
- `react-native-reanimated` 3.x (nicht 4.x) – Expo SDK 52 Kompatibilität
- `jest-expo ~52` erwartet `"jest": "^29"` (nicht 30.x!)
- ESLint: **flat-config** in `eslint.config.cjs` (via `@eslint/eslintrc` FlatCompat)
- `react-hooks/refs` ist eine **valide** Expo-extended ESLint-Regel. Sie flaggt RNGH `.onEnd`-Callbacks in `useMemo` als false positive (Callbacks laufen außerhalb des Renders). Fix: `// eslint-disable-next-line react-hooks/refs` direkt vor `.onEnd(...)`.
- `react-hooks/immutability` wird für Reanimated `.value`-Writes auf `'warn'` heruntergesetzt (Worklets schreiben intentional auf Shared Values).
- Web-Pfad: `WEB_PPU` ist ein lokaler Alias für `jsPixelsPerUnit` — kein separater Wert.
- `setWebJumpScrollX(null)` muss **innerhalb** von `requestAnimationFrame` aufgerufen werden, nicht synchron im Effect (sonst: "cascading renders" Lint-Fehler).

## Do's and Don'ts

### ✅ Do:

- i18n für alle User-Texte (DE + EN)
- CHANGELOG.md bei user-facing Änderungen aktualisieren
- LOD-Bänder bei neuen Events prüfen
- Tests für Timeline-Logik schreiben
- Hit-Test und Skia-Loop immer auf `MAX_EVENTS_PER_LANE` cappen

### ❌ Don't:

- Keine direkten main-Commits
- Keine hardcodierten deutschen/englischen Strings
- Kein `WithSkiaWeb` importieren (bricht Web-Build)
- Nicht `--no-verify` nutzen außer auf explizite Bitte
- `trackMap?.get(ev.id) ?? 0` im Hit-Test — stattdessen `=== undefined` prüfen und skippen

## Offene Issues (legitim)

| #   | Titel                                       | Priorität       |
| --- | ------------------------------------------- | --------------- |
| #5  | Performance-Optimierung (Skia + Reanimated) | ongoing         |
| #32 | Mobile Usability Überblick                  | Tracker         |
| #46 | Listen-/Story-Modus                         | P3 / Diskussion |
| #51 | Triage-Plan (Tracking-Board)                | Referenz        |

## Referenzen

- [GitHub Issues](https://github.com/S540d/Epic_Calendar/issues)
- [project-templates Standards](https://github.com/S540d/project-templates)
