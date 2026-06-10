# Changelog

## [Unreleased]

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
