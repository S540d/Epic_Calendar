# Changelog

## [Unreleased]

### Fixed

- **Lane-Labels hochkant (PR #124):** `LANE_LABEL_WIDTH` 96 → 28 px. Labels werden mit einem inneren View (width=laneHeight, height=28) um –90° gedreht – spart 68 px Canvas-Breite auf Web und Native.
- **Zukunfts-Padding behoben (PR #124):** `PRESENT_RIGHT_PAD_FRACTION` (skalierte mit Viewport-Spanne: 15 % von 5 Mrd. Jahren = 750 Mio. Jahre Zukunfts-Scroll) ersetzt durch `PRESENT_RIGHT_BUFFER_YEARS = 200` – fester Puffer unabhängig vom Zoom-Level.
- **Achsen-Anker am linken Viewport-Rand (PR #124):** `generateTicks` prependet jetzt ein Anker-Label bei px=0 mit dem formatierten Viewport-Startjahr, wenn der erste reguläre Tick mehr als `TICK_LABEL_WIDTH` (90 px) vom linken Rand entfernt ist. Der sichtbare Bereich hat immer eine Datumsbeschriftung am Anfang.

### Added

- **Wissenschaft-Events gerettet (#122):** 4 Events aus `feature/natur-wissenschaft-highlights-v3` wurden wiederhergestellt, die beim Merge von v5 verloren gingen: Einstein Annus Mirabilis (1905), Sputnik 1 (1957), Juri Gagarin (1961), Apollo 11 (1969). `natur-wissenschaft.json` enthält jetzt 6 statt 2 Events.
- **CLAUDE.md: Web-Renderer-Doku (#115):** Architekturnotiz zum viewport-relativen Web-Renderer (`TimelineCanvasWeb`, GestureDetector + Mausrad-Shim, unified viewport-Hook) nachgezogen.
- **Ozeanien-Daten (Issue #121):** Neue Datei `src/data/events/ozeanien.json` mit 30 Events: australische Aborigines (65.000 v. Chr.), Lapita-Kultur, polynesische Expansion (Samoa/Tonga → Marquesas → Hawaii → Osterinsel → Maori-Neuseeland) mit `lineageId: "polynesische-expansion"`, Nan Madol, Europäische Entdeckung & Kolonisierung.
- **P2-Content-Lücken geschlossen (Issue #121):**
  - `asien.json` +17: Südostasien (Srivijaya, Pagan, Sukhothai, Ayutthaya, Majapahit, Đại Việt, Malakka-Sultanat); P3: Chinesischer Bürgerkrieg, Koreakrieg, Teilung Koreas, Timuridenreich.
  - `erdzeitalter.json` +9: Regionale Steinzeit-Events (Lascaux, Altamira, Göbekli Tepe, Jōmon-Kultur, San-Kulturen Afrikas, Mal'ta-Buret' Sibirien).
  - `afrika.json` +11: Ishango-Knochen, Bantu-Expansion (`lineageId: "bantu-expansion"`), Nok-Kultur, Garamanten, D'mt-Reich, Kanem-Reich, Kilwa-Sultanat, Mutapa-Reich.
  - `amerika.json` +7: Poverty Point, Pueblo/Anasazi, Cahokia, Tairona-Kultur.
- `lineageId` konsequent in neuen Daten eingesetzt: `"polynesische-expansion"`, `"bantu-expansion"`, `"java-reiche"`, `"srivijaya"` — bereit für spätere Rendering-Implementierung.

### Changed

- **Lineare Zeitskala (Phase 2, Issue #93):** Die Zeitachse verwendet jetzt
  viewport-lokale lineare Abbildung (Modell B). `yearToT(year) = year` und
  `tToYear(t) = t` sind Identity-Funktionen; `pixelsPerUnit` entspricht
  Pixeln pro Jahr, `offsetX` direkt einem Jahreswert. Der volle 5-Mrd.-Span
  wird im Hauptview bewusst nicht dargestellt – Einstieg über die Landing Page.
  LOD-Grenzen neu kalibriert für lineare Skala (ppu-Schwellen: 2e-6 / 5e-4 /
  0.02 / 2). Viewport-Reaktion in `useTimelineViewport` auf Pixel- bzw.
  PPU-relativ umgestellt (5 px / 1 % Schwelle). Zoom-to-fit für Punkt-Events
  auf 200-Jahr-Minimum erhöht. (#93, Phase 2)

- **Kategorie-Registry als Single Source of Truth** (`src/theme/categories.ts`):
  Farben, Lane-Hintergründe, Paletten, Chip-/Lane-Reihenfolge, Default- und
  Disabled-Auswahl sowie die abgeleiteten Arrays (`VALID_CATEGORIES`,
  `CHIP_CATEGORIES`, `LANE_ORDER`, `DEFAULT_CATEGORIES`, `DISABLED_CATEGORIES`)
  stammen jetzt aus einer einzigen geordneten Config. Eine neue Kategorie = ein
  Eintrag. `tokens.ts`, `FilterChipBar`, `TimelineView`, `TimelineScreen` und die
  Daten-Tests konsumieren die Registry; Optik und Verhalten bleiben identisch.
  (#93, Stufe 1.1)

### Added

- **Schematischer Zeitstrahl (Phase 2.2, Issue #93):** Neue horizontale
  `SchematicTimeline`-Leiste oben auf der Landing Page (EpochOverviewScreen).
  Zeigt alle Top-Level-Epochen als gleich breite, farbige Segmente im
  U-Bahn-Plan-Stil. Tippen auf ein Segment springt direkt zur Epoche.
  Beschriftung via `t('epochNav.<key>')`, vollständig i18n-konform. (#93)
- Farbiges, klickbares **Epochen-Band** direkt unter der Zeitachse (Erde, Dinos,
  Frühmenschen, Antike, Mittelalter, Neuzeit) – ersetzt die separate Chip-Leiste;
  Klick auf ein Segment zoomt zur Epoche. Scrollt mit der Zeitachse mit.
- **„Zu heute"-Button (⌖)** neben den Zoom-Buttons – holt die Ansicht aus jeder
  Position/Zoomstufe zuverlässig zur Gegenwart zurück.
- **Epochen-Übersicht (Landing Page)**: Die App startet jetzt mit einer
  übersichtlichen Epochen-Auswahl statt direkt im Zeitstrahl. Alle Epochen
  von der kosmischen Frühzeit bis zur Neuzeit sind als Kacheln sichtbar –
  mit Zeitraum und tatsächlicher Dauer (z. B. „186 Mio. Jahre" für Dinos).
  Das macht die logarithmische Verzerrung des Zeitstrahls erklärbar: Die
  Zahlen sprechen für sich. (#77)
- **Gezielter Zoom beim Epochen-Einstieg**: Wird eine Epoche auf der
  Landing Page gewählt, öffnet sich der Zeitstrahl direkt auf diesen
  Zeitraum (statt immer bei der menschlichen Vorgeschichte). (#77)
- **Epoch-Chip-Leiste (Drill-Down)**: Eine neue horizontale Chip-Leiste
  unterhalb des Epochen-Bands erlaubt schnellen Epochenwechsel direkt aus
  dem Zeitstrahl – ohne Umweg über die Landing Page. Tap auf
  „Menschheitsgeschichte ▸" zeigt Unterepocen (Steinzeit, Hochkulturen,
  Antike, Mittelalter, Neuzeit); „← Zurück" kehrt zur Übersicht zurück. (#81)
- **Zoom-Animation beim Epochen-Einstieg**: Tap auf eine Epochen-Kachel
  zeigt kurz den Gesamtzeitstrahl, bevor die Kamera auf den Zielbereich
  zoomt (600 ms). Web: ScrollView scrollt sichtbar zum Ziel. (#81)
- **Minimap-Highlight**: Vor dem Epochen-Zoom pulsiert die Zielposition
  ~450 ms auf der Minimap – zeigt dem Nutzer vorab „wohin die Reise geht". (#81)
- i18n: `epochNav.*`-Keys für Landing Page (DE/EN).

### Added

- **Frühmenschen-Spezies** im Zeitstrahl: Australopithecus, Homo erectus,
  Homo heidelbergensis, Neandertaler, Homo sapiens, Out-of-Africa-Migration,
  Höhlenmalerei, Letzte Eiszeit, Neolithikum – alle als globale Events in
  der Zivilisations-Lane sichtbar.
- **Epochen-Band** (EpochBand) jetzt konsistent mit der Chip-Navigation:
  Segmente entsprechen 1:1 den `NAVIGATION_EPOCHS` (kosmische Frühzeit →
  Steinzeit → Frühe Hochkulturen → … → Neuzeit) statt eines eigenständigen
  Sets – gleiche Labels, gleiche Farben.
- Titel und Untertitel im Zeitstrahl-Header sind jetzt klickbar und führen
  zurück zur Epochen-Übersicht (Landing Page).

### Fixed

- Epoch-Chip-Leiste friert nach 2–3 Klicks ein: `hasZoomedToEpochRef`
  wurde nie zurückgesetzt und blockierte alle Folge-Klicks – ersetzt durch
  `lastZoomedEpochRef` mit Koordinatenvergleich. (#82)
- Jahreszahlen auf der Zeitachse zeigten `–15k` statt `15.000 v. Chr.` –
  k/Tsd-Suffix entfernt, alle menschlichen Jahreszahlen nun vollständig
  mit Tausendertrenner und v./n. Chr.-Suffix.
- „Heute" steht näher am rechten Rand: `PRESENT_RIGHT_PAD_FRACTION`
  von 0.5 → 0.15 reduziert.

### Fixed (older) (`useAnimatedReaction` lief

auch auf Web und überschrieb `jsOffsetX` mit einem veralteten Wert) – Reaction
jetzt nur nativ.

- Web: Navigation blieb nach Pan in die Vergangenheit hängen – fragiler
  `webJumpScrollX`-State-Roundtrip entfernt; Sprünge scrollen direkt.
- Web: Zoom nach Klick auf „Neuzeit" sprang zu einem unverwandten früheren Jahr –
  `zoomToFit` nutzt jetzt die echte (in der Log-Skala kurze) Spanne moderner
  Epochen statt eines zu großen Minimums.
- Web: Zoom-/Sprung-Buttons waren unsichtbar (`position:fixed` in einem
  scrollenden Container) – nur noch der Lane-Bereich scrollt, Buttons fix.
- Web: Lanes überlappten bei mehreren Kategorien (Nationen über Zivilisationen) –
  Lane-Höhen werden auf Web aus den scroll-getriebenen Lane-Daten berechnet.
- Performance: Scroll löst erst ab ~6 px Bewegung ein Re-Render aus.
- Zeitstrahl beginnt jetzt bei −5 Mrd (Erdentstehung) statt beim Urknall; mehr
  vertikaler Platz pro Spur (`TRACK_HEIGHT` 60→80).

- i18n: Fehlende/abweichende Übersetzungs-Keys – UI zeigte Roh-Keys statt Texte
  (`app.title`, `app.subtitle`, `category.*`, `continent.europa` …, `zoom.level.*`,
  `chip.soon`, `popover.*`, `event.culture/million/thousand`). DE + EN ergänzt,
  Regressionstest für Key-Vollständigkeit hinzugefügt.
- Zeitachse: Anzahl der Tick-Beschriftungen wird an die Breite angepasst –
  keine überlappenden Jahreszahlen mehr bei schmalen Screens / tiefem Zoom.
- Web: Untere Lanes/Spuren wurden bei mehreren Kategorien am unteren
  Bildschirmrand abgeschnitten – Timeline-Bereich scrollt jetzt vertikal.
- Web: Timeline startete beim initialen Laden immer am Urknall statt bei
  „Heute" – `useWindowDimensions()` liefert beim ersten Render oft `width=0`,
  was `contentOffset` und `pixelsPerUnit` falsch initialisierte. Ein einmaliger
  `useEffect` korrigiert beides nach dem ersten Render mit gültiger Canvas-Breite.

### Changed

- Code-Pflege (#68): Zeit-Span-Konstanten (`T_MIN`/`T_MAX`/`T_PRESENT`,
  `BIG_BANG_YEAR`/`PRESENT_YEAR`, `FULL_T_SPAN`) zentral in `src/timeline/scale.ts`
  als Single Source of Truth. Bisher in `TimelineView` und `lod.ts` dupliziert
  (Risiko divergierender Werte). `lod.ts` re-exportiert sie kompatibel.
- Datenschema gehärtet (#68): `validateEvent()` in `src/data/schema.ts` prüft
  Pflichtfelder inkl. `minZoomLevel`; neue Tests gegen die Event-JSONs und den
  Validator (vorheriger Test übersah ein fehlendes `minZoomLevel`).
- Code-Pflege (#68): Sichtbarkeits-/Track-Berechnung für Web und Native in
  einer geteilten Funktion `computeLaneData()` (`src/timeline/culling.ts`)
  zusammengeführt. Vorher doppelt in `TimelineView` (`visibleByLane`/
  `webVisibleByLane`, `tracksByLane`/`webTracksByLane`, je eigene Overflow-
  Zählung) — Bugfixes mussten zweimal erfolgen. Beide Pfade übergeben jetzt nur
  noch ihren eigenen Sichtbereich; alles Weitere ist identisch.
- Code-Pflege (#68): Viewport-State und Zoom-/Pan-/Jump-Logik aus `TimelineView`
  in den Hook `useTimelineViewport()` (`src/components/useTimelineViewport.ts`)
  extrahiert (offset/ppu-SharedValues, JS-Spiegel, Web-Scroll-Mirror, Worklet↔JS-
  Sync, `zoomToFit`/`zoomAtPoint`/`zoomIn`/`zoomOut`/`handleMinimapJump`).
  TimelineView von ~1187 auf ~1013 Zeilen verschlankt; das plattformabhängige
  Branching liegt jetzt gebündelt im Hook. Kein Verhaltensbruch.
- Code-Pflege (#68): Render-Pfade entflochten — Web und Native sind jetzt
  eigene Komponenten `TimelineCanvasWeb`/`TimelineCanvasNative` hinter einem
  Prop-Interface; geteilte Styles/Konstanten/Helfer in `timelineRenderShared.ts`,
  die Gesten in `useTimelineGestures()`. `TimelineView` ist nur noch Logik +
  Komposition und von ~1013 auf **~359 Zeilen** geschrumpft (ursprünglich 1367).
  Kein Verhaltensbruch. Schließt die Code-Pflege-Akzeptanzkriterien von #68 ab.
- UX: „Heute" lässt sich jetzt zentrieren (Pan/Zoom bis zur Bildschirmmitte),
  da die jüngste Geschichte im Fokus steht. Rechts von „Heute" gibt es bewusst
  keine Achsen-Beschriftung.
- UX: Schnellauswahl-Chips (Urknall, Dinosaurier …) liegen jetzt direkt unter
  der Zeitachse statt unter der Minimap.

### Added

- Mobile-UX: Persistenter Zoom-Level-Indikator (Äonen → Jahre) (#36)
- Mobile-UX: Epochen-Kontext im Breadcrumb (z. B. „Mesozoikum") (#37)
- Mobile-UX: Doppeltipp zum Hineinzoomen (zentriert auf den Tap-Punkt) (#43)

### Changed

- Mobile-UX: Mindest-Trefferzone von 44px pro Event – auch dünne Balken sind sicher antippbar (#33)
- Mobile-UX: Tap/Pan-Trennung – Auswahl erst beim Loslassen statt beim Berühren, weniger Fehl-Taps und versehentliches Scrollen (#34)
- Mobile-UX: Zoom-/Home-Buttons auf 44px vergrößert (#45)
- Web: Zeitachse und Kategorie-Labels bleiben beim vertikalen Scrollen sichtbar (sticky)
- Web: Zoom-Buttons fixiert (immer rechts unten sichtbar)
- Web & Native: Pan/Zoom-Clamp – kein Scrollen über „Heute" hinaus in die Zukunft möglich
- Track-Höhe von 52px auf 60px erhöht, Lane-Padding von 8px auf 10px (mehr Luft zwischen Balken)

## [0.1.0] - 2026-06-07

### Added

- Interaktiver logarithmischer Zeitstrahl (Urknall bis heute) mit Skia-Rendering
- Europa-Datensatz: Hochkulturen + Erdzeitalter
- Asien, Afrika & Amerika: 140 historische Events (#8)
- Kontinent-Switcher + Kategorie-Filter mit AsyncStorage-Persistenz (#6)
- Accessibility-Verbesserungen: Screen Reader, Rollen, Zustände (#9)
- Design-System: Token-Erweiterung & UI-Primitives (#11)
- 48 Unit-Tests (#10)
- Deutsch/Englisch Unterstützung (i18n) (#7)
- Mobile-UX-Überarbeitung: Orientierung, lesbare Labels, parallele Balken (#26)
- Standardisierung: CLAUDE.md, Commands, CI-Standards, Prettier, protect-main (#28)
