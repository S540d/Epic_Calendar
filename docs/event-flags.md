# Event-Flags & Achsen-Referenz

Konsolidierte, hierarchische Übersicht aller Felder eines `TimelineEvent`.
Die TypeScript-Typen in `src/data/schema.ts` sind die maschinenlesbare Quelle; dieses Dokument ist die menschenlesbare Ergänzung.

---

## Übersicht

```
TimelineEvent
├── Identität       id, title, description
├── Zeit            startYear, endYear
├── Klassifikation  category → culture, importance, tags
├── Geografie       continent → regions
├── Beziehung       lineageId
└── Darstellung     minZoomLevel, color, iconKey, track
```

---

## Achsen im Detail

### Identität

| Feld          | Typ      | Pflicht | Beschreibung                                     |
| ------------- | -------- | ------- | ------------------------------------------------ |
| `id`          | `string` | ✅      | Einzigartiger stabiler Bezeichner (Kebab-Case).  |
| `title`       | `string` | ✅      | Kurzer Anzeigename (i18n-ready, derzeit direkt). |
| `description` | `string` | –       | Optionaler Fließtext für das Detail-Modal.       |

**Konvention:** `id` folgt dem Muster `<kategorie>-<kurzname>`, z. B. `geo-hadaikum`, `eu-roemisches-reich`.

---

### Zeit

| Feld        | Typ      | Pflicht | Beschreibung                                                   |
| ----------- | -------- | ------- | -------------------------------------------------------------- |
| `startYear` | `number` | ✅      | Beginnjahr. Negativ = v. Chr. Bsp: `−753` = Römische Gründung. |
| `endYear`   | `number` | –       | Endjahr. Fehlt → Punktereignis (Dauer = 0).                    |

**Invariante:** `endYear >= startYear` (wird von `validateEvent` geprüft).

**Sonderfall:** Geologische Äonen können Milliarden Jahre umspannen (z. B. `startYear: -4_600_000_000`). Der logarithmische → lineare Zoom-Übergang (Phase 2) ändert nichts an diesen Werten.

---

### Klassifikation

```
category  (Pflicht, Registry-gesteuert)
└── culture  (optional, freier String: "Subkategorie")
└── importance  (optional: 'core' | 'extended' | 'detail')
└── tags  (optional: string[])
```

#### `category`

| Wert           | Farbe     | Lane | Aktiv per Default |
| -------------- | --------- | ---- | ----------------- |
| `erdzeitalter` | `#4A8FA8` | ✅   | ✅                |
| `zivilisation` | `#C28B4A` | ✅   | ✅                |
| `nation`       | `#7C9CFF` | ✅   | –                 |
| `natur`        | `#4FA86A` | –    | – (soon)          |
| `herrscher`    | `#CF8A30` | –    | – (kein Lane)     |

Quelle: `src/theme/categories.ts` (Single Source of Truth, PR #95).

#### `culture`

Freier String, der die Unterkategorie innerhalb einer Kategorie benennt.
Bsp: `"Äon"`, `"Phanerozoikum"`, `"römisch"`, `"maya"`.
Wird künftig per Config validierbar (Phase 1.4+).

#### `importance` _(verdrahtet: Detailgrad-Filter)_

| Wert       | Rang | Bedeutung                                           |
| ---------- | ---- | --------------------------------------------------- |
| `core`     | 0    | Unverzichtbar – erscheint auf jedem Detailgrad.     |
| `extended` | 1    | Standard-Sichtbarkeit (Default für Events ohne Feld). |
| `detail`   | 2    | Nur auf höchstem Detailgrad.                         |

Der **Detailgrad-Filter** (`DetailLevelSelector`) wirkt als kumulativer
Schwellwert: Stufe „Wesentliches" zeigt nur `core`, „Standard" zusätzlich
`extended`, „Alles" auch `detail`. Events **ohne** `importance` werden wie
`extended` behandelt. Default-Stufe ist „Alles" (`detail`) → keine
Verhaltensänderung ohne Nutzeraktion. Ergänzt den automatischen Zoom-LOD
(`minZoomLevel`) um eine manuelle Steuerung.

#### `tags` _(Schema-Slot, Phase 1.2, noch nicht verdrahtet)_

Freie Schlüsselwörter für künftige Filter und Suche. Bsp: `["krieg", "religion"]`.

---

### Geografie

```
continent  (Pflicht)
└── regions  (optional: string[], Schema-Slot Phase 1.2)
```

#### `continent`

| Wert       | Bedeutung                                                    |
| ---------- | ------------------------------------------------------------ |
| `europa`   | Europa (inkl. Russland westlich d. Urals, nach Konvention).  |
| `asien`    | Asien.                                                       |
| `afrika`   | Afrika.                                                      |
| `amerika`  | Nord- und Südamerika.                                        |
| `ozeanien` | Australien / Ozeanien.                                       |
| `global`   | Kontinent-übergreifend; erscheint in jedem Kontinent-Filter. |

**Filterlogik:** `global` ist immer sichtbar, unabhängig vom gewählten Kontinent.

#### `regions` _(Schema-Slot, Phase 1.2 + 1.4, noch nicht verdrahtet)_

Array von Region-IDs aus `src/data/regions.ts`. Ermöglicht Mehrfachzugehörigkeit (z. B. ein Event gehört zu `westeuropa` und `mediterraneum`). Hierarchisch über `RegionConfig.parents`.

---

### Beziehung

#### `lineageId` _(verdrahtet)_

Verbindet politische Nachfolger desselben Staatswesens in einer Lane.
Bsp: `"frankreich"` verknüpft Merowingerreich → Karolingerreich → Königreich Frankreich.
Wirkung: `assignTracks` legt Events mit gleicher `lineageId` bevorzugt in dieselbe
Zeile (sofern überlappungsfrei); `computeLineageConnectors` erzeugt zwischen
aufeinanderfolgenden Lineage-Events auf derselben Zeile eine Verbindungslinie, die
beide Renderer (Skia/Web) unter den Balken zeichnen.

---

### Darstellung

| Feld           | Typ                     | Pflicht | Beschreibung                                                                 |
| -------------- | ----------------------- | ------- | ---------------------------------------------------------------------------- |
| `minZoomLevel` | `0 \| 1 \| 2 \| 3 \| 4` | ✅      | Niedrigstes LOD-Band, bei dem dieses Event sichtbar wird.                    |
| `color`        | `string` (CSS-Farbe)    | –       | Überschreibt die Kategorie-Farbe aus der Registry.                           |
| `iconKey`      | `string`                | –       | Schlüssel für ein Emoji/Icon-Set (noch kein globales Icon-Set definiert).    |
| `track`        | `number` (0-basiert)    | –       | Manueller Track-Override. Fehlt → automatisch per `assignTracks()` vergeben. |

#### `minZoomLevel` — LOD-Bänder

| Wert | Name         | Pixel/t-Einheit | Typische Inhalte                          |
| ---- | ------------ | --------------- | ----------------------------------------- |
| `0`  | Äonen        | < 12            | Geologische Äonen, Urknall.               |
| `1`  | Ären         | 12 – 29         | Ären, Perioden, frühe Hochkulturen.       |
| `2`  | Epochen      | 30 – 99         | Zivilisationen, Reiche (Default-Ansicht). |
| `3`  | Jahrhunderte | 100 – 499       | Dynastien, Kriege, Entdeckungen.          |
| `4`  | Jahre        | ≥ 500           | Einzeljahr-Events, Schlachten, Personen.  |

Quelle: `src/timeline/lod.ts::pixelsPerUnitToZoomLevel`.

---

## Abhängigkeiten & Validierung

```
validateEvent(event, validCategories)  ←  src/data/schema.ts
    prüft: id, title, startYear, endYear ≥ startYear,
           category ∈ VALID_CATEGORIES, continent ∈ VALID_CONTINENTS,
           minZoomLevel ∈ {0,1,2,3,4}
    ignoriert: optionale Felder (culture, importance, tags, regions, lineageId, color, iconKey, track)
```

Neue optionale Felder werden von `validateEvent` nur geprüft, wenn sie vorhanden sind (Phase 1.2). Bestehende Events bleiben unverändert valid.

---

## Erweiterungsregeln

1. **Neue Kategorie** → Eintrag in `src/theme/categories.ts` (Registry). Keine weitere Streuänderung.
2. **Neue Region** → Eintrag in `src/data/regions.ts`. Kein UI nötig bis Phase 3.
3. **Neues optionales Feld** → `schema.ts` erweitern + `validateEvent` ergänzen + dieses Dokument aktualisieren.
4. **Neuer `importance`-Wert** → Abstraktion in `schema.ts` + LOD-/Filter-Logik anpassen.
