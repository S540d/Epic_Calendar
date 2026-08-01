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
- `culling.ts`: filtert Events außerhalb des Viewports; `computeLaneData` akzeptiert optionales `eventIndex?` für O(hits+log n)-Queries sowie `maxImportanceRank?` (Detailgrad-Filter) und liefert zusätzlich `connectorsByLane`. `assignTracks` ist lineage-aware (gleiche `lineageId` bevorzugt dieselbe Zeile); `computeLineageConnectors(events, trackMap)` baut die Verbindungslinien zwischen aufeinanderfolgenden Lineage-Events. `buildStableTracksByLane(lanes, continent, maxImportanceRank, eventIndex)` berechnet Tracks einmal viewport-unabhängig über die volle gefilterte Kategorie (siehe #146 B1 unten); wird optional als `stableTracksByLane` an `computeLaneData` übergeben.
- `eventIndex.ts`: `EventIndex`-Klasse — Kategorie-partitioniert, startYear-sortiert; `buildEventIndex(events)` + `queryVisible(query)` (Binärsuche) + `getFilteredCategory({category, continent, maxImportanceRank})` (alle Events einer Kategorie ohne Zeitraum-/Zoom-Filter, Basis für `buildStableTracksByLane`); in `TimelineView` verdrahtet via `computeLaneData`
- `formatYear.ts`: formatiert Jahreszahlen (v. Chr., Mio., Mrd.)
- `search.ts` (#146 A): `searchEvents(events, query)` — Präfix-/Substring-Suche über `title`/`culture`/`tags`, diakritik- und case-insensitiv, Score-basiertes Ranking (exakter Titel-Match zuerst). `parseYearQuery(query)` erkennt reine Jahreszahl-Eingaben (`"500"`, `"-500"`, `"500 v. Chr."`, `"3 Mio v. Chr."`) und liefert das Jahr oder `null`.
- `lod.ts`: Level-of-Detail-Berechnung, exportiert `T_MIN`, `T_MAX`, `FULL_T_SPAN`; `PRESENT_RIGHT_BUFFER_YEARS = 200` + `clampOffsetX()` begrenzen Scroll nach rechts
- `scale.ts`: `yearToT`, `tToYear`, `pixelToYear`, `viewportYearRange`
- `epoch.ts`: **einzige Epochen-Quelle** — `NavigationEpoch`-Typ (inkl. `color`) + `NAVIGATION_EPOCHS`-Baum (kosmische Frühzeit → Neuzeit, 6 Wurzeln / 20 Knoten / 3 Ebenen). Helfer: `flattenEpochs()`, `epochsAtDepth(d)` / `epochsAtDepthCached(d)` (Baum auf Ebene `d` geschnitten mit Fill-Semantik → 6/10/16 Segmente, lückenlos), `epochBandDepth(spanYears)` (Bandtiefe aus sichtbarer Spanne), `epochPathAt(year)` (Vorfahrenkette) und `epochPathForViewport(start, end)` (Breadcrumb-Pfad mit `MIN_CRUMB_COVERAGE`-Guard). Ranges sind **rechts halboffen** (Jahr 1500 = Neuzeit), Ausnahme: die rechte Kante am Ende des Baums ist geschlossen, damit `PRESENT_YEAR` in `contemporary` fällt.
- **MAX_EVENTS_PER_LANE = 40** (in `timelineRenderShared.ts`) – Skia-Loop, Hit-Test und Label-Overlay sind alle auf diesen Wert gecappt. Überschuss erscheint als Cluster-Badge.
- **Lineare Skala (seit #93 Phase 2):** Die Zeitachse verwendet **viewport-lokal lineare** Abbildung (Modell B). `yearToT(year) = year` / `tToYear(t) = t` sind Identity-Funktionen; `pixelsPerUnit` = Pixel pro Jahr. LOD-Schwellen: 2e-6 / 5e-4 / 0.02 / 2 (ppu). Der Gesamtüberblick ist als `LandmarkTimeline` auf der Landing Page verfügbar.
- **Landing-Page-Zeitstrahl linear (`LandmarkTimeline`):** Die **Erdgeschichte ist linear** skaliert (`linearPos()`, konsistent zu Modell B der interaktiven Timeline) — von der Erdentstehung (`EARTH_FORMATION_YEAR = -4.6 Mrd.`) bis heute (`PRESENT_YEAR = 2026`). Der **Urknall** liegt außerhalb dieser Skala (würde die Erdgeschichte sonst zu einem Punkt stauchen) und wird als fixer Marker links neben der Erdentstehung platziert (`BIG_BANG_FRAC = 0.05`, Achsenbeginn `AXIS_START_FRAC = 0.2`). Urknall **und** Erdentstehung zeigen ihren **Zeitpunkt** (`formatEventYear`, via `SHOW_YEAR`-Set) und sind durch einen Achsenbruch (gestrichelte Prelude-Linie + `//`-Glyph) getrennt. **Nicht mehr logarithmisch** (kein `logPos`/`Math.log10` mehr). Kuratierte Landmarks (von links nach rechts): Urknall (außerhalb) → Erde entsteht → Erstes Leben (-3,8 Mrd.) → [Annotation: „Milliarden Jahre nur Mikroben"] → Erste Säugetiere (-225 Mio.) → Dinos (-252–66 Mio., als Balken) → Erste Hominide (-2,5 Mio.). Mondentstehung entfernt (auf linearer Skala redundant zur Erdentstehung).
- **Web-Renderer viewport-relativ (seit #115):** `TimelineCanvasWeb` rendert Balken wie Native: `x = (startYear − jsOffsetX) × ppu`. Kein `webCanvasWidth` (wäre Milliarden Pixel breit). Pan via RNGH `GestureDetector` + `wheel`-Event-Shim (Ctrl/⌘+Wheel = Zoom). `useTimelineViewport` hat keine Platform-Branches mehr — `withTiming` gilt für web und native gleich.
- **Lineage-Verbindungslinien (`lineageId` verdrahtet):** `assignTracks` hält nicht-überlappende Nachfolger derselben `lineageId` in einer Zeile; `computeLineageConnectors` erzeugt die Linien (`connectorsByLane`), die beide Renderer **unter** den Balken zeichnen (gedämpfte Kategoriefarbe, ~2 px).
- **Stabile Track-Zuordnung (#146 B1):** `TimelineView` berechnet `stableTracksByLane` per `useMemo` mit Deps `[lanes, continent, maxImportanceRank]` (NICHT `jsOffsetX`/`jsPixelsPerUnit`) und reicht sie an `computeLaneData` durch. Damit bleibt die Zeilennummer eines Events beim Pannen/Zoomen konstant — vorher lief `assignTracks` pro Frame über die viewport-gecappte Menge, wodurch Events zwischen Zeilen sprangen. `computeLaneData` remappt die im Viewport sichtbaren globalen Tracknummern zusätzlich dicht auf 0..k (Reihenfolge bleibt erhalten, nur Lücken kollabieren), sonst würden global weit auseinanderliegende Zeilen die Lane-Höhe explodieren lassen. Ohne `stableTracksByLane` fällt `computeLaneData` auf das alte Verhalten zurück (von bestehenden Tests genutzt).
- **Tier-Hierarchie für Zeilen-Ordnung (#70):** Optionales `tier`-Feld (`'epoche' | 'reich' | 'dynastie'`) im Schema; `TIER_RANK`/`tierRank()`-Helfer (epoche=0, reich=1, dynastie=2). `assignTracks` sortiert primär nach `tierRank` (via `byTierGlobalThenStart`), dann global-first, dann chronologisch — dadurch liegen `epoche`-Bänder oben, `reich` (Default bei fehlendem `tier`) in der Mitte, `dynastie` unten. Löst das Problem, dass langlaufende Reiche (Byzanz 330–1453) über zeitlich späteren Epochen-Phasen (Renaissance, Aufklärung) standen. 8 Epochen-Bänder in `europa.json` tragen `tier: 'epoche'`; `dynastie` ist vorbereitet, aber noch nicht bespielt. Kultur-Homogenität pro Zeile bleibt _innerhalb_ eines Tiers erhalten.
- **Kultur-getrennte Zeilen (#146 B2):** Zeilen in `assignTracks` sind strikt kultur-homogen: Jede automatisch vergebene Zeile hat einen Besitzer (`culture`-String oder `null` für neutrale Events), fremde Kulturen dürfen sie **nie** belegen — auch nicht als Platz-Fallback. Ein Event ohne freie eigene Zeile öffnet eine neue Zeile seiner Kultur, statt in eine fremde zu mischen. Lineage-Gruppen beanspruchen die Zeile ihrer Kultur (Span-Reservierung bleibt); Singletons werden global-first + chronologisch platziert, wodurch neue Zeilen von oben nach unten in Reihenfolge ihres ersten Events entstehen. Manuelle `track`-Overrides pinnen weiterhin exakte Zeilennummern (Besitzer = Kultur des ersten Events). Mehr Zeilen als beim rein geometrischen Packen — akzeptiert, da B1s Dense-Remapping die sichtbare Höhe begrenzt.
- **Detailgrad-Filter (`importance` verdrahtet):** Der Detailgrad (**Kinder / Schulwissen** / Standard / Alles) setzt `maxImportanceRank` als kumulativen Schwellwert in `filterVisible`/`queryVisible`. Default „Alles" (= alles sichtbar, abwärtskompatibel); Events ohne `importance` zählen als `extended`. Ergänzt den automatischen Zoom-LOD um eine manuelle Achse; persistiert als `detailLevel`. UI ist eine Segmented-Control direkt in `SettingsModal` (kein eigenständiges Component mehr — die frühere `DetailLevelSelector`-Komponente war verwaist, duplizierte dieselbe UI und wurde entfernt). Die unterste Stufe `core` = **Kinder/Schulwissen** (i18n `detailLevel.core`, EN „Kids / school basics") ist systematisch über **alle** Kategorien mit typischem Schulwissen bespielt (Stand: erdzeitalter 10, herrscher 50, nation 35, zivilisation 86, natur 46 core) — beim Ergänzen neuer Events dieselbe Balance halten und offensichtliches Schulwissen `importance: 'core'` geben.
- **Navigation & Orientierung (konsolidiert):** Der Zeitstrahl hat **ein** primäres „Wo bin ich?"-Element: `EpochBreadcrumbBar` (eigene Zeile unter dem Epochenband) zeigt Zoom-Pille + antippbaren Epochenpfad („Menschheit › Antike › Hellenismus") + Zeitraum. Jeder Krümel ruft `zoomToFit` auf die Range seines Knotens — dadurch ersetzt die Leiste die früheren `EpochChipBar` (Drill-Down-Chips), `EpochNavArrows` (◀/▶ über dem Canvas), `TimelineBreadcrumb` und `ZoomLevelIndicator`. Verbleibende Sprung-Mechanismen: Breadcrumb (Epochen), `TimelineMinimap` (Position im Gesamtzeitstrahl), `EpochBand` (räumlicher Kontext, scrollt mit) und der Zoom-Cluster. Breadcrumb und Band lösen denselben Baum für denselben Viewport auf und zeigen daher immer dieselbe Ebene. Der Titelblock im Header ist das einzige Home-Control (der zusätzliche ⌂-Button ist entfallen).
- **Settings-Menü (`SettingsModal`):** Bottom-Sheet-Modal, öffnet per ⚙-Icon im Header beider Screens. Drei Sections: Erscheinungsbild (Dark/Light-Mode-Toggle), Darstellung (Detailgrad, FPS-Monitor-Toggle), Sprache (DE/EN). Dark Mode via `ThemeContext`; Sprache via i18next + AsyncStorage-Persistenz.
- **FPS-Monitor (#5):** `useFpsMonitor(enabled)` misst die Bildrate via Reanimated `useFrameCallback` (UI-Thread, 500ms-Sample-Fenster, `runOnJS` zurück zu React State); läuft nur bei `enabled=true` (kein Overhead im Default-Fall). `FpsMonitor`-Komponente rendert eine farbcodierte Pill (≥50 FPS grün, ≥30 gelb, sonst rot), non-interactive. In beiden Renderern (`TimelineCanvasWeb`/`TimelineCanvasNative`) im `topRightGroup`-Flex-Container (`timelineRenderShared.ts`); Kinder dieses Containers dürfen **nicht** selbst `position: absolute` sein, sonst überlappen sie sich am selben Eck. Seit der Navigations-Konsolidierung ist der FPS-Monitor das einzige Kind. Toggle „FPS-Monitor anzeigen" im Settings-Menü, persistiert als `showFpsMonitor` (Default: aus).
- **Kategorie „Kultur & Kunst" (`kultur`, Issue #76):** Sechste Kategorie in `src/theme/categories.ts` (Farbe `#A85FC2`, `laneOrder: 5` = unterste Lane) für gesellschaftliche Strömungen und Kunstgeschichte (Barock, Wiener Klassik, Weimarer Klassik, Romantik, Biedermeier, Impressionismus, Expressionismus, Bauhaus), vorerst aus deutscher/europäischer Perspektive in `europa.json`. Nicht `defaultActive` (wie `nation`/`herrscher`). **`zivilisation` vs. `nation`:** konzeptionelle Abgrenzung für neue Inhalte in `docs/event-flags.md` dokumentiert (`zivilisation` = Völker/Wanderungen, `nation` = Staatsgebilde) — bestehende Events werden nicht rückwirkend migriert.
- **Kometen-/Asteroideneinschläge unter `erdzeitalter` (Issue #76):** `geo-vredefort-impakt`, `geo-sudbury-impakt`, `geo-tunguska-ereignis` in `erdzeitalter.json` markieren wichtige Einschlagsereignisse direkt in der Erdzeitalter-Lane (ergänzt den bereits vorhandenen Chicxulub-Eintrag unter `natur`).
- **Kinderdarstellung / Lernsprüche (`mnemonic`, Issue #171):** Optionales Schema-Feld `mnemonic?: string` für bekannte Eselsbrücken zu einzelnen Jahreszahlen (z. B. „753, Rom kroch aus dem Ei." bei `eu-herr-romulus`, „333 v. Chr. – bei Issos besiegt Alexander der Große die Perser." beim neuen Event `eu-schlacht-issos`). Wird im `EventDetailModal` unterhalb der Beschreibung hervorgehoben angezeigt (i18n-Label `event.mnemonic`), sofern gesetzt.
- **ThemeContext (`useTheme()`):** `ThemeProvider` in `App.tsx` liefert `{ isDark, colors, toggleTheme }`. `darkColors`/`lightColors` in `src/theme/ThemeContext.tsx`. Alle UI-Chrome-Komponenten nutzen `useTheme()` mit `makeStyles(colors)`-Pattern (dynamisch, per `useMemo`). **Canvas-Renderer** (Skia/Canvas2D) und deren Overlays bleiben dunkel (statische `colors`-Importe).

### Datenhaltung

- `src/data/` – statische Daten: 7 JSON-Dateien, 568 Events gesamt (europa, asien, afrika, amerika, ozeanien, erdzeitalter, natur-wissenschaft)
- `src/data/schema.ts` – gemeinsames Event-Schema (`TimelineEvent` mit optionalen Feldern: `importance`, `tags`, `lineageId`, `regions` seit Phase 1.2; `tier` seit #70). `importance`/`lineageId`/`tier` sind verdrahtet: `importanceRank`/`passesImportance`-Helfer + `IMPORTANCE_RANK` speisen den Detailgrad-Filter; `lineageId` steuert Track-Zuordnung + Verbindungslinien; `tier` (`tierRank`/`TIER_RANK`) ist die primäre Zeilen-Sortier-Achse in `assignTracks`. `tags`/`regions` bleiben Slots.
- `src/data/regions.ts` – `RegionConfig`-Typ + `REGIONS`-Skelett für hierarchische Geo-Filter (Phase 1.4; kein UI bis Phase 3)
- `docs/event-flags.md` – menschenlesbare Flag-Referenz: alle Event-Achsen mit Pflicht/optional, Werten, LOD-Tabelle (Phase 1.5)
- AsyncStorage-Keys: `activeCategories`, `selectedContinent`, `detailLevel`, `theme_isDark`, `i18n_language`, `showFpsMonitor` (alle via `usePersistedState` oder direkt AsyncStorage)

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
│   ├── EpochBreadcrumbBar.tsx     # Primäre Orientierung: Zoom-Pille + antippbarer Epochenpfad + Zeitraum
│   ├── FpsMonitor.tsx             # FPS-Overlay-Pill (#5, opt-in via Settings, Layout via topRightGroup)
│   ├── useFpsMonitor.ts           # Reanimated useFrameCallback-Hook für FpsMonitor
│   ├── TimelineMinimap.tsx        # Übersichtsleiste (Tap + a11y-Actions)
│   ├── EpochBand.tsx              # Visuelles Epochen-Band, zoomabhängig verfeinert (Ebene via epochBandDepth)
│   ├── EpochOverviewScreen.tsx    # Landing Page: aufklappbare Epochen-Kacheln (Props: onSelectEpoch, onShowFullTimeline, onOpenSettings, onOpenSearch)
│   ├── FilterChipBar.tsx          # Kategorie-/Kontinent-Filter
│   ├── SettingsModal.tsx          # Settings-Bottom-Sheet (Dark Mode, Detailgrad, FPS-Monitor, Sprache)
│   ├── SearchModal.tsx            # Such-Bottom-Sheet (#146 A): Ereignis-/Jahr-Suche, Tap → jumpToEvent/jumpToYear
│   ├── LandmarkTimeline.tsx       # Landmark-Zeitstrahl auf der Landing Page (linear; Urknall außerhalb der Skala)
│   ├── ContinentTabBar.tsx        # Kontinent-Auswahl
│   └── ui/                        # Shared UI-Primitives
├── data/
│   ├── schema.ts              # Event-Typen (inkl. optionale Slots: importance, tags, lineageId, regions)
│   ├── regions.ts             # RegionConfig + REGIONS-Skelett (Phase 1.4, kein UI)
│   ├── events/                # Statische JSON-Daten: europa (202), asien (91), afrika (66), amerika (70), ozeanien (40), erdzeitalter (31), natur-wissenschaft (68) → 568 Events gesamt
│   └── ...
├── timeline/
│   ├── culling.ts             # Viewport-Culling + computeLaneData() (opt. eventIndex, maxImportanceRank) + lineage-aware assignTracks + computeLineageConnectors
│   ├── eventIndex.ts          # EventIndex: Kategorie-partitioniert, Binärsuche O(hits+log n)
│   ├── lod.ts                 # Level of Detail + T_MIN/T_MAX/FULL_T_SPAN
│   ├── scale.ts               # yearToT, tToYear, pixelToYear
│   ├── epoch.ts               # Einzige Epochen-Quelle: NAVIGATION_EPOCHS-Baum + Pfad-/Tiefen-Helfer
│   ├── formatYear.ts          # Jahr-Formatierung
│   ├── search.ts              # searchEvents (title/culture/tags) + parseYearQuery (#146 A)
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

Canvas-Overlay-Komponenten (EpochBand, EpochBreadcrumbBar, …) nutzen weiterhin statische `colors`-Imports aus `tokens.ts` — der Canvas-Hintergrund bleibt immer dunkel.

---

## Bekannte Eigenheiten

- `baseUrl: '/Epic_Calendar'` in `app.json` – für GitHub Pages nötig
- **Web-HTML-Template (#149):** Bei Metro-Web (kein Expo Router) wird das HTML-Template aus `public/index.html` gelesen (nicht `web/index.html` – das ist der alte `@expo/webpack-config`-Pfad und wird von Metro ignoriert). `public/` wird von `expo export --platform web` 1:1 nach `dist/` kopiert – auch `robots.txt`/`sitemap.xml` liegen dort.
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
- `SearchModal` folgt demselben Sibling-Pattern wie `SettingsModal` (#146 A) — erreichbar von beiden Screens. Anders als `epochRange` (nur beim Mount ausgewertet) reagieren `TimelineView`s `jumpToEvent`/`jumpToYear`-Props auf **jede** Änderung via `requestId` (monoton hochgezählt in `TimelineScreen`, nicht `event.id`), damit ein erneuter Sprung zum selben Ziel die Animation erneut auslöst. Bei Event-Treffern setzt `handleSearchSelectEvent` in `TimelineScreen` zuerst Kategorie/Kontinent, damit das Ziel-Event unter den aktiven Filtern überhaupt sichtbar ist, bevor der Zoom-Jump feuert.

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

| #    | Titel                                                                             | Priorität    |
| ---- | --------------------------------------------------------------------------------- | ------------ |
| #76  | Mehr Inhalte (Wissenschaft, Zivilisationen, Kultur, Kategorie „Kultur und Kunst") | P2 / Content |
| #162 | Farblogik für Spuren-Farben                                                       | offen        |
| #163 | Weitere Filterungen (Länder-Filter innerhalb Kontinent)                           | offen        |
| #171 | Kinderdarstellung („einfach") — Lernsprüche zu Events                             | offen        |

## Referenzen

- [GitHub Issues](https://github.com/S540d/Epic_Calendar/issues)
- [project-templates Standards](https://github.com/S540d/project-templates)

<!-- GLOBAL POLICY:START -->

## [GLOBAL POLICY]

> Automatisch synchronisiert aus project-templates (Issue #7). Nicht manuell editieren –
> Änderungen hier werden beim nächsten Sync überschrieben. Quelle anpassen statt lokal.

- PRs immer gegen `testing`, nie direkt gegen `staging` oder `main`
- Merge auf `main` nur mit expliziter schriftlicher Freigabe
- `--delete-branch` nur für Feature-Branches (nie staging/testing)
- **Lokales Branch-Cleanup:** `main` und `testing` NIE löschen — auch nicht beim Bulk-Delete verwaister `[gone]`-Branches. Ein fehlender `origin/main`/`origin/testing` ist ein **wiederherzustellender Defekt** (lokal behalten, nach origin zurückpushen), kein Aufräum-Signal.
- `--no-verify` nur auf explizite Bitte
- **Vor jedem Push: lokale Tests ausführen** (`npm test` bzw. projektspezifischer Test-Befehl) – kein Push ohne grüne lokale Tests
- **Kein Merge bei CI-Fail** – Branch Protection erzwingt das technisch; nie mit `--admin` umgehen außer auf explizite Bitte

## [ANDROID BUILD – PFLICHTREGELN]

- **Git-Tag** nach jedem Play-Store-Upload setzen: `git tag vX.Y.Z && git push origin vX.Y.Z` – der Tag markiert den tatsächlich veröffentlichten Stand und dient als Changelog-Baseline für den nächsten Build
- **EAS Local Build (DrawFromMemory):** Workingdir vor jedem Build leeren: `rm -rf ~/tmp/eas-build && mkdir -p ~/tmp/eas-build` – ein nicht-leeres Verzeichnis bricht den Build sofort ab
- **Disk-Check vor EAS Build:** Skia-Libraries benötigen ~5–8 GB. Bei < 5 GB frei: `npm cache clean --force && rm -rf ~/.npm/_npx` (~13 GB, sicher löschbar)
- **JAVA_HOME** für EAS/Expo-Builds explizit auf Android Studio JBR setzen: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- **Gradle-Lock nach Absturz:** Bei "Cannot lock file hash cache"-Fehler Daemons stoppen: `pkill -f GradleDaemon`, dann Workingdir leeren und neu starten
- **AAB-Archiv:** Gebaute Release-AABs in einem **gitignored** `aab-archive/`-Verzeichnis im Repo-Root ablegen (in `.gitignore` aufnehmen – AABs sind 3–110 MB und gehören nie in die Git-History). Benennung: `<Projekt>-vX.Y.Z-vc<versionCode>-YYYY-MM-DD.aab`. **Retention: max. 2 Dateien** (aktuelles Release + ein Vorgänger für schnelles Rollback); ältere AABs löschen. Der Git-Tag `vX.Y.Z` ist die eigentliche Release-Baseline – ältere AABs lassen sich daraus jederzeit neu bauen.

## [CI – CACHE-CLEANUP]

- **Cache-Cleanup-Workflow** (`.github/workflows/cache-cleanup.yml`) in jedem Repo mit GitHub-Actions-Caches: löscht wöchentlich (So 03:00 UTC) bzw. on-demand alle Action-Caches älter als der jeweils letzte Lauf. GitHub-Limit ist 10 GB pro Repo – ohne Cleanup laufen Build-Caches (node_modules, Gradle, Expo) voll und verdrängen frische Einträge. Vorlage: `cache-cleanup.yml` in project-templates.
<!-- GLOBAL POLICY:END -->
