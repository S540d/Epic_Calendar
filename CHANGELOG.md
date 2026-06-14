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
