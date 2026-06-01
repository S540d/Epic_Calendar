# Epic Calendar

Ein interaktiver, zoom- und scrollbarer Zeitstrahl durch die Geschichte. Pro Kontinent eigene Zeitleisten, gefiltert nach Kategorien (Erdzeitalter, Natur, Zivilisationen, Nationen).

**MVP-Scope:** Europa — Hochkulturen + Erdzeitalter.

## Stack

- React Native + Expo (SDK 52), TypeScript strict
- Rendering: `@shopify/react-native-skia`
- Gesten: `react-native-gesture-handler` + `react-native-reanimated`
- Storage: `@react-native-async-storage/async-storage`
- Publishing: EAS Build + EAS Update (Channels: preview/production)

## Setup

```bash
npm install
npm start            # Expo Dev Server
npm run android      # Android Device/Emulator
npm run ios          # iOS Simulator
npm run web          # Expo Web
```

## Architektur — die wichtigsten Dateien

| Bereich | Datei |
|---|---|
| Entry | `App.tsx`, `index.js` |
| Haupt-Screen | `src/screens/TimelineScreen.tsx` |
| Core-Komponente (Skia + Gesten) | `src/components/TimelineView.tsx` |
| Filter-Chips | `src/components/FilterChipBar.tsx` |
| Kontinent-Switcher | `src/components/ContinentTabBar.tsx` |
| Detail-Modal | `src/screens/EventDetailModal.tsx` |
| Datenschema | `src/data/schema.ts` |
| Daten | `src/data/events/europa.json`, `src/data/events/erdzeitalter.json` |
| Log-Skala Zeit↔Pixel | `src/timeline/scale.ts` |
| LOD (Zoom-Bänder) | `src/timeline/lod.ts` |
| Viewport-Culling | `src/timeline/culling.ts` |
| Design-Tokens | `src/theme/tokens.ts` |

### Warum logarithmische Zeit-Skala?

Der Zeitstrahl spannt sich vom Urknall (~-13,8 Mrd.) bis heute (~2026) — Skalenbereich **>10¹⁰**. Eine lineare Pixelzuordnung ist unbrauchbar. `scale.ts` definiert eine symmetrische Log-Transformation um Jahr 0:

```
t(year) = sign(year) * log10(1 + |year|)
```

Pinch-Zoom verändert `pixelsPerUnit` (Pixel pro `t`-Einheit). LOD-Bänder
(`lod.ts`) blenden Events stufenweise ein: Äonen → Ären → Epochen/Hochkulturen → Jahrhunderte → Jahrzehnte.

## Tests

```bash
npm test          # Jest (Scale-Mathe)
npm run type-check
npm run lint
```

## Publishing

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas update --channel production
```

Vor dem ersten Build: `app.json` → `updates.url` mit der EAS Project ID füllen.

## Roadmap

1. **MVP (jetzt):** Europa, Erdzeitalter + Zivilisationen, Pinch-Zoom, Filter
2. Weitere Kontinente (Asien, Afrika, Amerika, Ozeanien)
3. Kategorie *Natur* (Eiszeiten, Aussterbe-Events, große Vulkanausbrüche)
4. Kategorie *Nationen* (Detail-Ebene unterhalb der Hochkulturen)
5. Suche & Sprung zu Ereignis
6. Persistenz von Zoom-Position & Filter-Preset via AsyncStorage
7. i18n (de / en)

## Standards

Übergeordnete Code-, UX- und Publishing-Standards: siehe `STANDARDS_README.md` und die `technische_vorgaben.md` / `ux-vorgaben.md` / `PUBLISHING_CHECKLIST.md` im Repo-Root.
