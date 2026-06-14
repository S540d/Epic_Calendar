# Changelog

## [Unreleased]

### Fixed

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
