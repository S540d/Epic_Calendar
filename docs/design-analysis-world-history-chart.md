# Design-Analyse: „World History Timeline" (Schofield & Sims)

> Referenz: das Lehrposter **World History Timeline** von Schofield & Sims
> (ISBN 9780721709413), ein moderner Nachfahre von Joseph Priestleys
> _A New Chart of History_ (1769) und der _Histomap_ (John B. Sparks, 1931).
> Das Poster zeigt Weltgeschichte von 3000 v. Chr. bis 2000 n. Chr. als
> Stream-Chart und ist damit konzeptionell das analoge Gegenstück zu
> Epic Calendar. Diese Analyse beschreibt das Poster-Design und bewertet,
> welche Ideen sich auf Epic Calendar übertragen lassen.

## 1. Wie das Poster funktioniert

### 1.1 Zeit horizontal, Reiche als Farbströme

Die Zeit fließt von links nach rechts. Reiche, Kulturen und Nationen sind
**durchgehende, vertikal gestapelte Farbströme** — keine diskreten Balken.
Die Ströme schwellen an, schrumpfen, verschmelzen und spalten sich:
Eroberungen, Reichsteilungen und Nachfolgestaaten werden als Fluss-Topologie
sichtbar (z. B. Römisches Reich → Ost-/Westrom).

### 1.2 Alle Kontinente gleichzeitig, geografisch sortiert

Das Chart ist nach Kontinenten gruppiert; Kontinente, die auf dem Globus
benachbart sind, liegen auch auf dem Chart nebeneinander. Dadurch ist die
**Parallelität der Weltgeschichte** auf einen Blick erfassbar: Was taten die
Maya, während in Europa Karl der Große regierte?

### 1.3 Farbfamilie pro Kontinent

Jeder Kontinent hat einen begrenzten Farbton-Bereich; einzelne Reiche sind
Schattierungen davon. Der Kontinent ist auf einen Blick identifizierbar,
Reiche bleiben trotzdem unterscheidbar.

### 1.4 Strombreite ≈ Bedeutung

Die vertikale Breite eines Stroms deutet die Bedeutung/Ausdehnung des Reichs
zum jeweiligen Zeitpunkt an.

### 1.5 Personen-/Ereignisleiste

Unter dem Hauptchart läuft ein separates schmales Band mit wichtigen
Persönlichkeiten und Ereignissen: Könige, Politiker, religiöse und
kulturelle Führer, Erfinder.

### 1.6 Nichtlineare Zeitskala (Schwäche)

Ferne Jahrhunderte sind gestaucht, jüngere gedehnt. Das ist der meistgenannte
Kritikpunkt des Posters: verzerrte Proportionen und schwache Abdeckung der
Bronzezeit.

## 2. Übertragbare Ideen

Bewertung gegen den Ist-Stand von Epic Calendar (Stand: lineare Skala
Modell B, Kategorie-Registry in `src/theme/categories.ts`, Schema-Felder
`importance`/`tier`/`lineageId` verdrahtet, Kontinent als Single-Select-Tab
in `ContinentTabBar`).

### Idee 1: Welt-Parallelansicht ⭐ (Aufwand: mittel–hoch)

**Poster-Feature:** alle Kontinente gleichzeitig, geografisch gestapelt.

**Ist-Stand:** Der `global`-Tab mischt Events aller Kontinente in die
Kategorie-Lanes; die Parallelität der Kontinente ist nicht ablesbar.

**Vorschlag:** Ein Anzeigemodus (z. B. Toggle „Weltansicht" oder neues
Verhalten des `global`-Tabs), der statt Kategorie-Lanes **Kontinent-Lanes**
stapelt — geografisch sortiert: Amerika – Europa – Afrika – Asien – Ozeanien.

**Implementierungsskizze:** Die Lane-Achse ist heute die Kategorie
(`LANE_ORDER` aus `categories.ts`, verarbeitet in `TimelineView.tsx` →
`computeLaneData` in `src/timeline/culling.ts`). Für die Weltansicht wird die
Partitionierung von `category` auf `continent` umgestellt; `EventIndex` ist
kategorie-partitioniert und bräuchte eine kontinent-partitionierte Variante
oder einen Filter-Pfad über `getFilteredCategory`. Track-Zuordnung
(`assignTracks`, `buildStableTracksByLane`) funktioniert pro Lane unverändert.

### Idee 2: Farbfamilie pro Kontinent ⭐ (Aufwand: niedrig–mittel)

**Poster-Feature:** begrenzter Farbton-Bereich je Kontinent, Reiche als
Schattierungen.

**Ist-Stand:** Farben hängen an der Kategorie (`CATEGORY_PALETTES` mit
per-Culture-Schattierungen) — dieselbe Mechanik, nur mit Kategorie statt
Kontinent als Familien-Achse.

**Vorschlag:** Analog zur bestehenden Registry ein `CONTINENT_PALETTES`
(z. B. Europa = Blautöne, Asien = Rottöne, Afrika = Erdtöne, Amerika =
Grüntöne, Ozeanien = Violett), aktiv in der Weltansicht aus Idee 1. Die
per-Culture-Schattierungslogik der Renderer bleibt identisch, nur die
Palette-Quelle wechselt.

### Idee 3: Merge/Split-Konnektoren ⭐ (Aufwand: mittel)

**Poster-Feature:** Ströme spalten sich (Reichsteilung) und verschmelzen
(Eroberung).

**Ist-Stand:** `lineageId` verbindet aufeinanderfolgende Events als
**1:1-Kette**; `computeLineageConnectors` (`src/timeline/culling.ts`)
zeichnet die Linien.

**Vorschlag:** Verzweigende Lineages (1:n und n:1): Rom → Ostrom + Westrom,
Alexanderreich → Diadochenreiche, Kalifat → Nachfolge-Dynastien.

**Implementierungsskizze:** Schema um `parentLineageIds?: string[]` (oder
`lineageId` als Baum-Pfad) erweitern; `computeLineageConnectors` erzeugt pro
Kind eine Linie vom Endpunkt des Eltern-Events zum Startpunkt des
Kind-Events — ggf. mit kleinem vertikalem Versatz, da Kinder in anderen
Tracks liegen. Beide Renderer zeichnen Konnektoren bereits unter den Balken;
nur die Linien-Erzeugung ändert sich, nicht das Rendering.

### Idee 4: Balkenhöhe nach `importance` (Aufwand: niedrig)

**Poster-Feature:** Strombreite ≈ Bedeutung.

**Ist-Stand:** Alle Balken haben dieselbe Höhe; `importance`
(`core`/`extended`/`detail`) ist verdrahtet, steuert aber nur die
Sichtbarkeit (Detailgrad-Filter).

**Vorschlag:** Statische Höhe je Rang (z. B. core = 100 %, extended = 75 %,
detail = 55 % der Track-Höhe) — kein echtes Streamgraph, nur drei
Höhenstufen. Betroffene Stellen: Balken-Geometrie in
`timelineRenderShared.ts` und beiden Renderern; Hit-Test muss dieselbe Höhe
verwenden.

### Idee 5: Persönlichkeiten-Band (Aufwand: niedrig)

**Poster-Feature:** schmale Leiste mit Königen, Erfindern, Führern unter dem
Hauptchart.

**Ist-Stand:** Die Kategorie `herrscher` (116 Events) ist bereits die
unterste Lane (`laneOrder: 4`), wird aber wie alle anderen Lanes mit Balken
gerendert.

**Vorschlag:** Die `herrscher`-Lane bewusst als **Personen-Leiste** stylen:
kompaktere Track-Höhe, Punkt-Marker + Name statt Balken für kurze
Lebens-/Regierungszeiten (Punkt-Event-Rendering existiert seit #160). Ein
Flag in der Kategorie-Registry (z. B. `laneStyle: 'compact'`) hält das
deklarativ.

## 3. Bewusst nicht übernommen

### Nichtlineare Zeitskala ❌

Das Poster staucht die ferne Vergangenheit — genau die Verzerrung, die
Epic Calendar mit #93 (Wechsel von logarithmisch auf viewport-lokal linear,
Modell B) bewusst abgeschafft hat. Der bekannteste Kritikpunkt am Poster
bestätigt diese Entscheidung. Zoom + `LandmarkTimeline` (mit Achsenbruch für
den Urknall) lösen das Problem der großen Zeitspannen besser als eine
verzerrte Skala.

### Echte Streamgraph-Formen ❌ (vorerst)

Organisch geschwungene, breitenvariable Ströme wie im Poster kollidieren mit
der Architektur: Track-Packing (`assignTracks`), Rechteck-Hit-Test und
`MAX_EVENTS_PER_LANE`-Capping setzen rechteckige Balken voraus. Der
ästhetische Gewinn rechtfertigt den Umbau nicht — Idee 4 (drei Höhenstufen)
liefert einen Großteil des visuellen Effekts zu einem Bruchteil der Kosten.

## 4. Empfohlene Reihenfolge

| Schritt | Idee | Warum zuerst |
| ------- | -------------------------------- | ------------------------------------------ |
| 1 | Idee 4 (Balkenhöhe) | kleinster Eingriff, sofort sichtbarer Wert |
| 2 | Idee 5 (Persönlichkeiten-Band) | klein, nutzt vorhandenes Punkt-Rendering |
| 3 | Idee 2 (Kontinent-Paletten) | Vorarbeit für die Weltansicht |
| 4 | Idee 1 (Welt-Parallelansicht) | Kern-Idee, braucht 2 als Grundlage |
| 5 | Idee 3 (Merge/Split-Konnektoren) | unabhängig, Content-Pflege nötig |

Jede Idee sollte als eigenes GitHub-Issue mit Verweis auf dieses Dokument
angelegt werden.
