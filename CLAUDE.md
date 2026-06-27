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
  - **Squash nur hier** (Feature-Branch wird verworfen → kompakte Historie).
- Merge testing→main: `gh pr merge <nr> --merge` (echter Merge-Commit, **kein Squash**, kein `--delete-branch`) + `--admin`
  - **Kein Squash zwischen zwei langlebigen Branches:** Squash erzeugt auf `main` einen neuen Commit ohne `testing` als Vorfahr → die Branches teilen keine Historie mehr und jeder Folge-Sync produziert dieselben Konflikte (Divergenz). Ein Merge-Commit hält `testing`-Commits als Vorfahren von `main`.
  - Danach: `main` → `testing` zurückführen (`gh pr merge --merge` oder Fast-Forward), damit `testing` ≥ `main` bleibt.

---

## Development Guidelines

### Code Style

- TypeScript mit strikter Typisierung
- Skia-Rendering: alle Koordinaten in logarithmischer Skala berechnen
- LOD-Bänder (Level of Detail): Granularität abhängig vom Zoom-Level
- Keine hardcodierten Texte – immer i18n (`useTranslation`)

### Besonderheiten der Zeitachse

- Logarithmische Zeitskala: `yearToT(year)` / `tToYear(t)` aus `@/timeline/scale`
- LOD-Bänder steuern welche Events bei welchem Zoom sichtbar sind (ppu-Schwellen: `2e-6` / `5e-4` / `0.02` / `2` → Level 0–4)
- `culling.ts`: filtert Events außerhalb des Viewports; `computeLaneData` akzeptiert optionales `eventIndex?` für O(hits+log n)-Queries sowie `maxImportanceRank?` (Detailgrad-Filter) und liefert zusätzlich `connectorsByLane`. `assignTracks` ist lineage-aware (gleiche `lineageId` bevorzugt dieselbe Zeile); `computeLineageConnectors(events, trackMap)` baut die Verbindungslinien zwischen aufeinanderfolgenden Lineage-Events.
- `eventIndex.ts`: `EventIndex`-Klasse — Kategorie-partitioniert, startYear-sortiert; `buildEventIndex(events)` + `queryVisible(query)` (Binärsuche); in `TimelineView` verdrahtet via `computeLaneData`
- `formatYear.ts`: formatiert Jahreszahlen (v. Chr., Mio., Mrd.)
- `lod.ts`: Level-of-Detail-Berechnung, exportiert `T_MIN`, `T_MAX`, `FULL_T_SPAN`; `PRESENT_RIGHT_BUFFER_YEARS = 200` + `clampOffsetX()` begrenzen Scroll nach rechts
- `scale.ts`: `yearToT`, `tToYear`, `pixelToYear`, `viewportYearRange`
- `epoch.ts`: Epoche-Mapping für Breadcrumb + `NavigationEpoch`-Typ + `NAVIGATION_EPOCHS`-Baum (kosmische Frühzeit → Neuzeit)
- **MAX_EVENTS_PER_LANE = 40** (in `timelineRenderShared.ts`) – Skia-Loop, Hit-Test und Label-Overlay sind alle auf diesen Wert gecappt. Überschuss erscheint als Cluster-Badge.
- **Lineare Skala (seit #93 Phase 2):** Die Zeitachse verwendet **viewport-lokal lineare** Abbildung (Modell B). `yearToT(year) = year` / `tToYear(t) = t` sind Identity-Funktionen; `pixelsPerUnit` = Pixel pro Jahr. LOD-Schwellen: 2e-6 / 5e-4 / 0.02 / 2 (ppu). Der Gesamtüberblick ist als `LandmarkTimeline` auf der Landing Page verfügbar.
- **Landing-Page-Zeitstrahl linear (`LandmarkTimeline`):** Die **Erdgeschichte ist linear** skaliert (`linearPos()`, konsistent zu Modell B der interaktiven Timeline) — von der Erdentstehung (`EARTH_FORMATION_YEAR = -4.6 Mrd.`) bis heute (`PRESENT_YEAR = 2026`). Der **Urknall** liegt außerhalb dieser Skala (würde die Erdgeschichte sonst zu einem Punkt stauchen) und wird als fixer Marker links neben der Erdentstehung platziert (`BIG_BANG_FRAC = 0.05`, Achsenbeginn `AXIS_START_FRAC = 0.2`). Urknall **und** Erdentstehung zeigen ihren **Zeitpunkt** (`formatEventYear`, via `SHOW_YEAR`-Set) und sind durch einen Achsenbruch (gestrichelte Prelude-Linie + `//`-Glyph) getrennt. **Nicht mehr logarithmisch** (kein `logPos`/`Math.log10` mehr). Kuratierte Landmarks (von links nach rechts): Urknall (außerhalb) → Erde entsteht → Erstes Leben (-3,8 Mrd.) → [Annotation: „Milliarden Jahre nur Mikroben"] → Erste Säugetiere (-225 Mio.) → Dinos (-252–66 Mio., als Balken) → Erste Hominide (-2,5 Mio.). Mondentstehung entfernt (auf linearer Skala redundant zur Erdentstehung).
- **Web-Renderer viewport-relativ (seit #115):** `TimelineCanvasWeb` rendert Balken wie Native: `x = (startYear − jsOffsetX) × ppu`. Kein `webCanvasWidth` (wäre Milliarden Pixel breit). Pan via RNGH `GestureDetector` + `wheel`-Event-Shim (Ctrl/⌘+Wheel = Zoom). `useTimelineViewport` hat keine Platform-Branches mehr — `withTiming` gilt für web und native gleich.
- **Lineage-Verbindungslinien (`lineageId` verdrahtet):** `assignTracks` hält nicht-überlappende Nachfolger derselben `lineageId` in einer Zeile; `computeLineageConnectors` erzeugt die Linien (`connectorsByLane`), die beide Renderer **unter** den Balken zeichnen (gedämpfte Kategoriefarbe, ~2 px).
- **Detailgrad-Filter (`importance` verdrahtet):** `DetailLevelSelector` (Wesentliches/Standard/Alles) setzt `maxImportanceRank` als kumulativen Schwellwert in `filterVisible`/`queryVisible`. Default „Alles" (= alles sichtbar, abwärtskompatibel); Events ohne `importance` zählen als `extended`. Ergänzt den automatischen Zoom-LOD um eine manuelle Achse; persistiert als `detailLevel`. Einstellung jetzt im **Settings-Menü** (nicht mehr als Inline-Bar).
- **Settings-Menü (`SettingsModal`):** Bottom-Sheet-Modal, öffnet per ⚙-Icon im Header beider Screens. Drei Sections: Erscheinungsbild (Dark/Light-Mode-Toggle), Darstellung (Detailgrad), Sprache (DE/EN). Dark Mode via `ThemeContext`; Sprache via i18next + AsyncStorage-Persistenz.
- **ThemeContext (`useTheme()`):** `ThemeProvider` in `App.tsx` liefert `{ isDark, colors, toggleTheme }`. `darkColors`/`lightColors` in `src/theme/ThemeContext.tsx`. Alle UI-Chrome-Komponenten nutzen `useTheme()` mit `makeStyles(colors)`-Pattern (dynamisch, per `useMemo`). **Canvas-Renderer** (Skia/Canvas2D) und deren Overlays bleiben dunkel (statische `colors`-Importe).

### Datenhaltung

- `src/data/` – statische Daten: 7 JSON-Dateien, 548 Events gesamt (europa, asien, afrika, amerika, ozeanien, erdzeitalter, natur-wissenschaft)
- `src/data/schema.ts` – gemeinsames Event-Schema (`TimelineEvent` mit optionalen Feldern: `importance`, `tags`, `lineageId`, `regions` seit Phase 1.2). `importance`/`lineageId` sind verdrahtet: `importanceRank`/`passesImportance`-Helfer + `IMPORTANCE_RANK` speisen den Detailgrad-Filter; `lineageId` steuert Track-Zuordnung + Verbindungslinien. `tags`/`regions` bleiben Slots.
- `src/data/regions.ts` – `RegionConfig`-Typ + `REGIONS`-Skelett für hierarchische Geo-Filter (Phase 1.4; kein UI bis Phase 3)
- `docs/event-flags.md` – menschenlesbare Flag-Referenz: alle Event-Achsen mit Pflicht/optional, Werten, LOD-Tabelle (Phase 1.5)
- AsyncStorage-Keys: `activeCategories`, `selectedContinent`, `detailLevel`, `theme_isDark`, `i18n_language` (alle via `usePersistedState` oder direkt AsyncStorage)

### Build & Test

```bash
npm test          # Jest-Tests
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
│   ├── TimelineView.tsx           # Komposition: Logik + Routing Web/Native
│   ├── TimelineCanvasWeb.tsx      # Web-Renderer (viewport-relativ, GestureDetector + Mausrad-Shim)
│   ├── TimelineCanvasNative.tsx   # Native-Renderer (Skia + Reanimated)
│   ├── timelineRenderShared.ts    # Geteilte Konstanten/Helfer (beide Renderer)
│   ├── useTimelineViewport.ts     # Viewport-State + Zoom/Pan/Jump-Commands (unified web+native)
│   ├── useTimelineGestures.ts     # RNGH Pan/Pinch/Tap-Gesten
│   ├── TimeAxis.tsx               # Zeitachse
│   ├── TimelineBreadcrumb.tsx     # Zoom-Breadcrumb mit Epochen-Kontext
│   ├── TimelineMinimap.tsx        # Übersichtsleiste (Tap + a11y-Actions)
│   ├── EpochBand.tsx              # Visuelles Epochen-Band (ersetzt EpochJumpBar)
│   ├── EpochChipBar.tsx           # Zweistufige Chip-Leiste für schnelle Epochen-Navigation
│   ├── EpochNavArrows.tsx         # Quick-Jump-Pfeile (← Epoche / Epoche →) im Timeline-Header
│   ├── EpochOverviewScreen.tsx    # Landing Page: Epochen-Kacheln als Einstieg (Props: onSelectEpoch, onShowFullTimeline, onOpenSettings)
│   ├── FilterChipBar.tsx          # Kategorie-/Kontinent-Filter
│   ├── DetailLevelSelector.tsx    # Detailgrad-Segmented-Control (wiederverwendbar; genutzt in SettingsModal)
│   ├── SettingsModal.tsx          # Settings-Bottom-Sheet (Dark Mode, Detailgrad, Sprache)
│   ├── LandmarkTimeline.tsx       # Landmark-Zeitstrahl auf der Landing Page (linear; Urknall außerhalb der Skala)
│   ├── ContinentTabBar.tsx        # Kontinent-Auswahl
│   ├── ZoomLevelIndicator.tsx     # Persistenter LOD-Indikator
│   └── ui/                        # Shared UI-Primitives
├── data/
│   ├── schema.ts              # Event-Typen (inkl. optionale Slots: importance, tags, lineageId, regions)
│   ├── regions.ts             # RegionConfig + REGIONS-Skelett (Phase 1.4, kein UI)
│   ├── events/                # Statische JSON-Daten: europa (190), asien (90), afrika (66), amerika (70), ozeanien (40), erdzeitalter (28), natur-wissenschaft (64) → 548 Events gesamt
│   └── ...
├── timeline/
│   ├── culling.ts             # Viewport-Culling + computeLaneData() (opt. eventIndex, maxImportanceRank) + lineage-aware assignTracks + computeLineageConnectors
│   ├── eventIndex.ts          # EventIndex: Kategorie-partitioniert, Binärsuche O(hits+log n)
│   ├── lod.ts                 # Level of Detail + T_MIN/T_MAX/FULL_T_SPAN
│   ├── scale.ts               # yearToT, tToYear, pixelToYear
│   ├── epoch.ts               # Epoche-Mapping + NavigationEpoch + NAVIGATION_EPOCHS
│   ├── formatYear.ts          # Jahr-Formatierung
│   └── __tests__/
├── theme/
│   ├── tokens.ts              # Design-Tokens (statisch; canvas-Komponenten nutzen dies direkt)
│   └── ThemeContext.tsx       # ThemeProvider + useTheme() + darkColors/lightColors
└── screens/
    ├── TimelineScreen.tsx     # Haupt-Screen: Landing Page ↔ Timeline-Umschaltung + SettingsModal
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

### makeStyles-Pattern (Theming)

UI-Chrome-Komponenten definieren Styles als Funktion über `ThemeColors` und rufen sie per `useMemo` auf:

```ts
const { colors } = useTheme();
const styles = useMemo(() => makeStyles(colors), [colors]);

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { backgroundColor: colors.bg },
    // ...
  });
}
```

Canvas-Overlay-Komponenten (ZoomLevelIndicator, EpochBand, …) nutzen weiterhin statische `colors`-Imports aus `tokens.ts` — der Canvas-Hintergrund bleibt immer dunkel.

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
- `TFunction` aus `i18next` als Typ für Helper-Funktionen, die `t` übergeben bekommen — `(k: string) => string` oder `(k: string, o?: object) => string` ist inkompatibel mit dem strikten `TFunction<"translation", undefined>`-Typ.
- `useTimelineViewport` akzeptiert `initialEpochRange?: { startYear: number; endYear: number }` — setzt den Anfangs-Viewport auf die gewählte Epoche (statt `humanHistoryViewState`). Wird beim Remount von `TimelineView` ausgewertet (kein Laufzeit-Update nach Mount).
- `EpochOverviewScreen` → `TimelineScreen`: Navigation via `showOverview`-State in `TimelineScreen.tsx`. `TimelineView` mountet neu bei jedem Epochen-Wechsel (kein `resetKey` mehr nötig).
- `EpochOverviewScreen` erhält **kein** `onToggleLanguage`/`currentLanguage` mehr — stattdessen `onOpenSettings`, das den `SettingsModal` in `TimelineScreen` öffnet.
- `SettingsModal` liegt immer als `<>…</>` Sibling beider Screens in `TimelineScreen`; Modal-Visible-State bleibt in `TimelineScreen`. Dadurch ist das Modal auch auf dem Overview-Screen erreichbar.

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

| #    | Titel                                                   | Priorität       |
| ---- | ------------------------------------------------------- | --------------- |
| #5   | Performance-Optimierung (Skia + Reanimated)             | ongoing         |
| #5   | Performance-Optimierung (Skia + Reanimated)             | ongoing         |
| #70  | Skalierbarkeit: mehr Events, Filter, Kategorien         | Epic / Tracker  |
| #76  | Mehr Inhalte (Zivilisationen/Nationen-Trennung, Kultur) | P2 / Content    |

## Referenzen

- [GitHub Issues](https://github.com/S540d/Epic_Calendar/issues)
- [project-templates Standards](https://github.com/S540d/project-templates)
