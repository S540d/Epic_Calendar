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

- Logarithmische Zeitskala: `log10(jetzt - timestamp)` → Pixel-Position
- LOD-Bänder steuern welche Events bei welchem Zoom sichtbar sind
- `culling.ts`: filtert Events außerhalb des Viewports
- `formatYear.ts`: formatiert Jahreszahlen (v. Chr., Mio., Mrd.)
- `lod.ts`: Level-of-Detail-Berechnung

### Datenhaltung

- `src/data/` – statische Daten (Europa, Asien, Afrika, Amerika)
- `src/data/schema.ts` – gemeinsames Event-Schema
- AsyncStorage: Kontinent-Auswahl + Kategorie-Filter persistent

### Build & Test

```bash
npm test          # Jest-Tests (48 Unit-Tests)
npm run lint      # ESLint
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
│   ├── TimelineView.tsx       # Haupt-Canvas (Skia)
│   ├── TimeAxis.tsx           # Zeitachse
│   ├── TimelineBreadcrumb.tsx # Zoom-Breadcrumb
│   ├── EventDetailModal.tsx   # Detail-Modal
│   └── ...
├── data/
│   ├── schema.ts              # Event-Typen
│   ├── europe.ts              # Europa-Daten
│   ├── asia.ts                # Asien-Daten
│   └── ...
├── timeline/
│   ├── culling.ts             # Viewport-Culling
│   ├── lod.ts                 # Level of Detail
│   ├── formatYear.ts          # Jahr-Formatierung
│   └── __tests__/
├── theme/
│   └── tokens.ts              # Design-Tokens
└── screens/
    └── EventDetailModal.tsx
```

---

## Bekannte Eigenheiten

- `baseUrl: '/Epic_Calendar'` in `app.json` – für GitHub Pages nötig
- Skia auf Web: kein `WithSkiaWeb` – weiße Seite → Standard-Canvas-Fallback
- `react-native-reanimated` 3.x (nicht 4.x) – Expo SDK 52 Kompatibilität
- `jest-expo ~52` erwartet `"jest": "^29"` (nicht 30.x!)

## Do's and Don'ts

### ✅ Do:

- i18n für alle User-Texte (DE + EN)
- CHANGELOG.md bei user-facing Änderungen aktualisieren
- LOD-Bänder bei neuen Events prüfen
- Tests für Timeline-Logik schreiben

### ❌ Don't:

- Keine direkten main-Commits
- Keine hardcodierten deutschen/englischen Strings
- Kein `WithSkiaWeb` importieren (bricht Web-Build)
- Nicht `--no-verify` nutzen außer auf explizite Bitte

## Referenzen

- [GitHub Issues](https://github.com/S540d/Epic_Calendar/issues)
- [project-templates Standards](https://github.com/S540d/project-templates)
