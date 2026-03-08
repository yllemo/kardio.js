# Kardio.js

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![JavaScript](https://img.shields.io/badge/language-JavaScript-yellow)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

Interaktivt kortdiagram-bibliotek för webben. Rendera drag-and-drop-kort med relationer och layoutlägen direkt i HTML — utan ramverk, utan byggsteg.

Inspirerat av Mermaid, men fokuserat på **interaktivitet**: korten kan flyttas, kopplas och redigeras av användaren i realtid.

## ✨ Funktioner

- 🎯 **Inga beroenden** — En enda JavaScript-fil
- 🎨 **Interaktiva kort** — Drag-and-drop, redigering i realtid
- 🔗 **Flexibla relationer** — Pilar, etiketter, stilar
- 📱 **Responsiv** — Fungerar på alla skärmstorlekar
- ⚡ **Snabb start** — Ladda automatiskt från HTML-attribut
- 🎛️ **Flera layouter** — Hierarki, mindmap, nätverk, tidslinje
- 💾 **Export/Import** — JSON och DSL-format
- 🌈 **10 färgteman** — Inbyggda färgscheman

---

## 🚀 Demo

Se [kardio-example.html](kardio-example.html) för en fullständig demo med tre testlägen.

### Snabbtest i webbläsare

Kopiera och klistra in detta i en HTML-fil:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kardio.js Test</title>
</head>
<body>
  <div id="diagram" style="height: 500px; border: 1px solid #ccc;"></div>
  
  <script src="https://cdn.jsdelivr.net/gh/användare/kardio.js/kardio.js"></script>
  <script>
    Kardio.render('#diagram', `
      card A "Strategi"   "Vart vi är på väg" #ledning blue   2024-01
      card B "Produkt"    "Vad vi bygger"     #produkt purple 2024-02  
      card C "Teknik"     "Hur vi bygger det" #teknik  green  2024-03

      A --> B : "prioriterar" blue
      B --> C : "kräver"      purple dashed
    `);
  </script>
</body>
</html>
```

---

## Installation

Kopiera `kardio.js` till ditt projekt. Inga beroenden krävs.

```html
<script src="kardio.js"></script>
```

Biblioteket laddar automatiskt typsnitt (Syne + Space Mono) via Google Fonts och injicerar all nödvändig CSS i `<head>` vid första anrop.

---

## Snabbstart

### Alternativ 1 — Auto-init via HTML-attribut

Lägg DSL-koden direkt i `data-kardio`-attributet. Biblioteket initialiserar alla `.kardio`-element automatiskt när sidan laddas.

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>

  <div class="kardio" style="height:600px" data-kardio="
    card A &quot;Strategi&quot;   &quot;Vart vi är på väg&quot; #ledning blue   2024-01
    card B &quot;Produkt&quot;    &quot;Vad vi bygger&quot;     #produkt purple 2024-02
    card C &quot;Teknik&quot;     &quot;Hur vi bygger det&quot; #teknik  green  2024-03

    A --> B : &quot;prioriterar&quot; blue
    B --> C : &quot;kräver&quot;      purple dashed
  "></div>

  <script src="kardio.js"></script>
</body>
</html>
```

> **OBS:** Använd `&quot;` för citattecken inuti HTML-attribut. Använd alternativ 2 för att slippa detta.

---

### Alternativ 2 — Programmatisk render (rekommenderas)

```html
<div id="diagram" style="height:600px"></div>
<script src="kardio.js"></script>
<script>
  const diagram = Kardio.render('#diagram', `
    card A "Strategi"   "Vart vi är på väg" #ledning blue   2024-01
    card B "Produkt"    "Vad vi bygger"     #produkt purple 2024-02
    card C "Teknik"     "Hur vi bygger det" #teknik  green  2024-03

    A --> B : "prioriterar" blue
    B --> C : "kräver"      purple dashed
  `);
</script>
```

---

## DSL-syntax

Kardio använder ett enkelt radbaserat språk. Varje rad är antingen ett **kort** eller en **relation**. Rader som börjar med `//` är kommentarer och ignoreras.

### Kort

```
card <id> "<titel>" ["<beskrivning>"] [#tagg] [färg] [datum]
```

| Del | Typ | Obligatorisk | Beskrivning |
|---|---|---|---|
| `id` | identifierare | ja | Unikt alias som används i relationer. Inga mellanslag. |
| `"titel"` | citerad sträng | ja | Kortets rubrik |
| `"beskrivning"` | citerad sträng | nej | Brödtext under rubriken |
| `#tagg` | token med `#` | nej | Grupperingstagg, visas som `#tagg` |
| `färg` | nyckelord | nej | Se färgtabell nedan. Standard: `blue` |
| `datum` | `YYYY`, `YYYY-MM` eller `YYYY-MM-DD` | nej | Används för sortering i tidslinjeläget |

**Exempel:**
```
card vision  "Vision"         "Vart vi är på väg"  #strategi blue   2024-01
card backend "Backend-API"    "REST och databas"   #teknik   green  2024-03
card qa      "Testning"                            #teknik   orange
```

---

### Relationer

```
<från-id> <pil> <till-id> [: "<etikett>"] [stil] [färg] [Npx]
```

| Del | Obligatorisk | Beskrivning |
|---|---|---|
| `från-id` | ja | Alias på källkortet |
| `pil` | ja | Pilsymbol (se tabell) |
| `till-id` | ja | Alias på målkortet |
| `"etikett"` | nej | Text som visas längs linjen, föregås av `:` |
| `stil` | nej | `solid` (standard), `dashed`, `dotted` |
| `färg` | nej | Linjefärg (se färgtabell). Standard: `blue` |
| `Npx` | nej | Linjetjocklek, t.ex. `2px`. Standard: `1.5px` |

**Pilsymboler:**

| Symbol | Riktning | Linjestil |
|---|---|---|
| `-->` | A → B | solid |
| `-->-` | A → B | streckad |
| `-->..` | A → B | prickad |
| `<--` | A ← B | solid |
| `<---` | A ← B | streckad |
| `<--..` | A ← B | prickad |
| `<-->` | A ↔ B | solid |
| `<-->-` | A ↔ B | streckad |
| `<-->..` | A ↔ B | prickad |
| `---` | A — B (ingen pil) | solid |
| `----` | A — B (ingen pil) | streckad |
| `---..` | A — B (ingen pil) | prickad |

**Exempel:**
```
vision   --> strategi  : "formar"        blue   2px
strategi --> teknik    : "kräver"        green  dashed
teknik   <-- data      : "informerar"    cyan   dotted 1px
api      <--> frontend : "kommunicerar"  purple
chef     --- medarbetare                 grey
```

---

### Färger

| Nyckelord | Hex | |
|---|---|---|
| `blue`   | `#4f8fff` | Standard |
| `purple` | `#a78bfa` | |
| `green`  | `#34d399` | |
| `orange` | `#fb923c` | |
| `red`    | `#f87171` | |
| `grey`   | `#6b7280` | |
| `cyan`   | `#22d3ee` | |
| `pink`   | `#f472b6` | |
| `yellow` | `#fbbf24` | |
| `white`  | `#e8eaf0` | |

---

## JavaScript API

### `Kardio.render(target, src)`

Renderar ett diagram i ett befintligt DOM-element. Returnerar en instans med metoder.

```js
const inst = Kardio.render('#diagram', dslString);
// Eller med DOM-element direkt:
const inst = Kardio.render(document.getElementById('diagram'), dslString);
```

### `Kardio.parse(src)`

Parsar DSL utan rendering. Returnerar rå JSON-data.

```js
const data = Kardio.parse(dslString);
console.log(data.cards);        // Array av kortobjekt
console.log(data.connections);  // Array av kopplingsobjekt
```

### Instansmetoder

| Metod | Beskrivning |
|---|---|
| `inst.load(dslString)` | Ersätter nuvarande diagram med ny DSL. Nollställer all state. |
| `inst.getJSON()` | Returnerar `{ cards, connections }` med nuvarande state inkl. manuella ändringar. |
| `inst.getDSL()` | Laddar ner nuvarande state som `.kardio`-fil. |
| `inst.destroy()` | Tar bort event listeners och rensar container-elementet. |

---

## Interaktiva funktioner

Alla instanser har en inbyggd meny (☰ uppe till höger).

**Visningslägen** — arrangerar korten med animerade övergångar:

| Läge | Beskrivning |
|---|---|
| Fritt | Fri drag-and-drop, ingen automatisk layout |
| Hierarki | Org-schema baserat på relationsriktningar, rötter överst |
| Mindmap | Första kortet i mitten, övriga radiellt runtomkring |
| Nätverk | Jämnt rutnät med variation |
| Tidslinje | Horisontell sortering efter `datum`-fältet |

**Korthantering:** skapa, redigera (✎ vid hover), ta bort (✕ vid hover), drag-and-drop.

**Relationshantering:** skapa via menyn → koppla, redigera genom att klicka på en linje (öppnar panel för etikett, stil, riktning, färg, tjocklek), ta bort via panelen.

**Export/Import:** JSON (bevarar position), DSL (`.kardio`-fil), import av JSON.

**Tangent:** `Esc` avbryter kopplingsläget.

---

## JSON-dataformat

```json
{
  "cards": [
    {
      "id": 1,
      "alias": "vision",
      "title": "Vision",
      "body": "Vart vi är på väg",
      "tag": "strategi",
      "color": "blue",
      "date": "2024-01",
      "x": 80,
      "y": 120
    }
  ],
  "connections": [
    {
      "id": 1733000000000,
      "from": 1,
      "to": 2,
      "label": "formar",
      "color": "blue",
      "style": "solid",
      "direction": "forward",
      "weight": 1.5
    }
  ]
}
```

Giltiga värden: `style` → `solid | dashed | dotted`, `direction` → `forward | backward | both | none`.

---

## Containerkrav

Containern behöver en explicit höjd.

```html
<!-- Fast höjd -->
<div id="diagram" style="height: 500px"></div>

<!-- Helskärm -->
<div id="diagram" style="height: 100vh"></div>

<!-- I en layout med overflow -->
<div id="diagram" style="height: 600px; border-radius: 12px; overflow: hidden"></div>
```

---

## Filstruktur

```
kardio.js            Biblioteket — fristående, inga beroenden
kardio-example.html  Exempelfil med tre demolägen
README.md            Denna fil — dokumentation för utvecklare
AI.md                Instruktioner optimerade för AI-assistenter
```
