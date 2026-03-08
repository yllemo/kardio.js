# AI.md — Kardio.js instruktioner för AI-assistenter

Detta dokument beskriver hur du som AI-assistent korrekt genererar och integrerar Kardio.js-diagram. Följ reglerna nedan noggrant för att producera giltig, fungerande kod.

---

## Vad är Kardio.js?

Ett fristående JavaScript-bibliotek (en enda fil: `kardio.js`) som renderar interaktiva kortdiagram i ett HTML-element. Korten representerar noder och kan kopplas med relationer. Användaren kan flytta korten, redigera innehåll och växla layoutläge.

Biblioteket exponerar ett globalt objekt `Kardio` med metoderna `render()`, `parse()` och `autoInit()`.

---

## Grundläggande integrationsmönster

### Mönster A — Programmatisk (föredraget)

Använd detta när du skriver JavaScript. Undviker HTML-escaping-problem.

```html
<div id="diagram" style="height: 600px"></div>
<script src="kardio.js"></script>
<script>
  Kardio.render('#diagram', `
    // DSL här — normala citattecken fungerar i template literals
    card A "Titel A" "Beskrivning" #tagg blue
    card B "Titel B" green
    A --> B : "relation" blue
  `);
</script>
```

### Mönster B — Inline HTML-attribut

Använd detta när du skriver statisk HTML utan JavaScript. Kräver HTML-escaping av citattecken.

```html
<div class="kardio" style="height: 600px" data-kardio="
  card A &quot;Titel A&quot; &quot;Beskrivning&quot; #tagg blue
  card B &quot;Titel B&quot; green
  A --> B : &quot;relation&quot; blue
"></div>
<script src="kardio.js"></script>
```

> **Regel:** Citattecken `"` i `data-kardio`-attribut MÅSTE skrivas som `&quot;`. Annars parsas HTML-attributet felaktigt.

---

## DSL-grammatik (fullständig)

```
program     := (kommentar | kortrad | relationsrad | tomrad)*
kommentar   := "//" <text till radslut>
kortrad     := "card" ALIAS CITATSTRÄNG [CITATSTRÄNG] [TAGG] [FÄRG] [DATUM]
relationsrad:= ALIAS PIL ALIAS [":" CITATSTRÄNG] [LINJESTIL] [FÄRG] [TJOCKLEK]

ALIAS       := /[A-Za-z0-9_-]+/          (inga mellanslag)
CITATSTRÄNG := '"' <text utan citattecken> '"'
TAGG        := '#' /[A-Za-z0-9_-]+/
FÄRG        := blue|purple|green|orange|red|grey|cyan|pink|yellow|white
DATUM       := /\d{4}(-\d{2})?(-\d{2})?/
PIL         := --> | -->- | -->.. | <-- | <--- | <--.. | <--> | <-->- | <-->.. | --- | ---- | ---..
LINJESTIL   := solid | dashed | dotted
TJOCKLEK    := /\d+(\.\d+)?px/
```

---

## Kortdefinitioner — alla kombinationer

```
// Minimum — bara alias och titel
card A "Titel"

// Med beskrivning
card B "Titel" "Längre beskrivning"

// Med tagg
card C "Titel" #kategori

// Med färg
card D "Titel" purple

// Med datum (för tidslinjeläge)
card E "Titel" 2024-03

// Alla fält
card F "Titel" "Beskrivning" #tagg green 2024-06
```

**Tillåtna alias-tecken:** bokstäver, siffror, bindestreck, underscore. Inga mellanslag.
Bra: `A`, `backend_api`, `node-1`, `Strategi2024`
Fel: `backend api`, `"nod"`, `1st`

---

## Relationsdefinitioner — alla pilar och stilar

```
// Riktning framåt (A → B)
A --> B
A -->- B                    // streckad
A -->.. B                   // prickad

// Riktning bakåt (A ← B)
A <-- B
A <--- B                    // streckad
A <--.. B                   // prickad

// Dubbelriktad (A ↔ B)
A <--> B
A <-->- B                   // streckad
A <-->.. B                  // prickad

// Ingen pil (A — B)
A --- B
A ---- B                    // streckad
A ---.. B                   // prickad

// Med etikett (kolon + citatsträng)
A --> B : "etikett"

// Med etikett och stil
A --> B : "etikett" dashed

// Med etikett, stil och färg
A --> B : "etikett" dashed purple

// Med tjocklek
A --> B : "viktig" blue 2px

// Allt
A --> B : "etikett" dashed purple 2px
```

**Ordning på valfria tokens** efter etiketten spelar ingen roll — parsern identifierar typ automatiskt (färgord, stilord, px-värde).

---

## Färgreferens

| Token | Färg | Primär användning |
|---|---|---|
| `blue` | `#4f8fff` | Standard, ledning, strategi |
| `purple` | `#a78bfa` | Design, UX, produkter |
| `green` | `#34d399` | Teknik, backend, OK-status |
| `orange` | `#fb923c` | Marknad, varning, stödfunktioner |
| `red` | `#f87171` | Fel, kritiska beroenden, risker |
| `grey` | `#6b7280` | Inaktiva, externa, oprioriterade |
| `cyan` | `#22d3ee` | Data, analys, infrastruktur |
| `pink` | `#f472b6` | HR, kommunikation, mjuka värden |
| `yellow` | `#fbbf24` | Varningar, idéer, highlight |
| `white` | `#e8eaf0` | Neutral, dokumentation |

---

## Semantiska konventioner (rekommendationer)

Använd konsekvent färg- och pilval för att göra diagram läsbara:

```
// Hierarki / rapportering
chef --> medarbetare : "leder" blue

// Beroende (A kräver B för att fungera)
frontend --> backend : "kräver" green dashed

// Flöde / process
steg1 --> steg2 --> steg3

// Dubbelriktad kommunikation / integration
systemA <--> systemB : "API" purple

// Svagt samband / referens
A ---.. B : "se även" grey

// Feedback-loop
output --> input : "informerar" cyan dotted

// Konflikt / blockering
taskA --- taskB : "blockerar" red
```

---

## Typiska diagram att generera

### Org-schema

```
card ceo    "VD"          #ledning blue
card cto    "CTO"         #teknik  purple
card cmo    "CMO"         #marknad orange
card dev1   "Lead Dev"    #teknik  green
card dev2   "Senior Dev"  #teknik  green

ceo --> cto  : "rapporterar" blue
ceo --> cmo  : "rapporterar" blue
cto --> dev1 : "leder"       purple
cto --> dev2 : "leder"       purple
```

### Systemarkitektur

```
card ui     "Frontend"   "React SPA"        #frontend purple
card api    "API Gateway" "REST/GraphQL"    #backend  green
card auth   "Auth"        "JWT + OAuth2"   #säkerhet orange
card db     "Databas"     "PostgreSQL"     #data     cyan
card cache  "Cache"       "Redis"          #infra    grey

ui    --> api   : "anropar"    purple
api   --> auth  : "validerar"  orange dashed
api   --> db    : "läser"      green
api   --> cache : "cachar"     grey dotted
cache --> db    : "fallback"   grey dotted
```

### Processkarta / flöde

```
card start   "Start"      2024-01
card analys  "Analys"     2024-02
card design  "Design"     2024-03
card bygg    "Bygg"       2024-04
card test    "Test"       2024-05
card drifts  "Driftsätt"  2024-06

start  --> analys  blue
analys --> design  purple
design --> bygg    green
bygg   --> test    orange
test   --> drifts  : "godkänd" green
test   --> bygg    : "avvisad" red dashed
```

### Mindmap / konceptkarta

```
card centrum  "AI-strategi"  "Kärnkoncept"  blue
card data     "Data"         #grund         cyan
card modeller "Modeller"     #grund         purple
card applik   "Applikationer" #tillämpning  green
card styrning "Styrning"     #tillämpning   orange

centrum --> data      : "kräver"  cyan
centrum --> modeller  : "kräver"  purple
centrum --> applik    : "möjliggör" green
centrum --> styrning  : "kräver"  orange
data    --> modeller  : "tränar"  purple dashed
modeller --> applik   : "driver"  green dashed
```

---

## JavaScript API — användning i kod

```js
// Enkel render
const inst = Kardio.render('#container', dslString);

// Byt innehåll dynamiskt
inst.load(nyttDslString);

// Hämta aktuell state som JSON (inkl. manuella ändringar)
const state = inst.getJSON();
// state.cards       — array av kortobjekt
// state.connections — array av kopplingsobjekt

// Parsa DSL utan rendering
const parsed = Kardio.parse(dslString);

// Rensa och ta bort
inst.destroy();

// Flera instanser på samma sida
const inst1 = Kardio.render('#diagram-a', dslA);
const inst2 = Kardio.render('#diagram-b', dslB);
```

---

## JSON-datastrukturer

### Kortobjekt (fullständigt)

```json
{
  "id": 1,
  "alias": "backend",
  "title": "Backend-API",
  "body": "REST och databas",
  "tag": "teknik",
  "color": "green",
  "date": "2024-03",
  "x": 340,
  "y": 260
}
```

Valfria fält med standardvärden: `body: ""`, `tag: ""`, `color: "blue"`, `date: ""`, `x/y` sätts av auto-layout.

### Kopplingsobjekt (fullständigt)

```json
{
  "id": 1733000000000,
  "from": 1,
  "to": 2,
  "label": "kräver",
  "color": "green",
  "style": "dashed",
  "direction": "forward",
  "weight": 1.5
}
```

| Fält | Typ | Tillåtna värden | Standard |
|---|---|---|---|
| `id` | number | unik, helst `Date.now()` | — |
| `from` | number | `id` på ett kort | — |
| `to` | number | `id` på ett kort | — |
| `label` | string | valfri text | `""` |
| `color` | string | se färgtabell | `"blue"` |
| `style` | string | `solid`, `dashed`, `dotted` | `"solid"` |
| `direction` | string | `forward`, `backward`, `both`, `none` | `"forward"` |
| `weight` | number | 1–6 | `1.5` |

---

## Vanliga misstag att undvika

**Citattecken i HTML-attribut utan escaping:**
```html
<!-- FEL -->
<div data-kardio='card A "Titel" blue'></div>

<!-- RÄTT -->
<div data-kardio="card A &quot;Titel&quot; blue"></div>

<!-- RÄTT — programmatisk undviker problemet -->
<script>Kardio.render('#el', `card A "Titel" blue`);</script>
```

**Mellanslag i alias:**
```
// FEL
card backend api "Backend API"

// RÄTT
card backend_api "Backend API"
```

**Referens till odeklarerat alias:**
```
// FEL — X är inte deklarerat med card
A --> X : "relation"

// RÄTT
card X "Mål"
A --> X : "relation"
```

**Container utan höjd:**
```html
<!-- FEL — diagrammet syns inte -->
<div id="diagram"></div>

<!-- RÄTT -->
<div id="diagram" style="height: 600px"></div>
```

**Etikett utan kolon:**
```
// FEL
A --> B "etikett"

// RÄTT
A --> B : "etikett"
```

---

## Checklista för korrekt generering

Innan du returnerar kod med Kardio, verifiera:

- [ ] `kardio.js` laddas med `<script src="kardio.js"></script>`
- [ ] Containern har explicit höjd (`height: Npx` eller `height: 100vh`)
- [ ] Varje kort har ett unikt alias utan mellanslag
- [ ] Alla alias som används i relationer är deklarerade med `card`
- [ ] Citattecken i `data-kardio`-attribut är escapade som `&quot;`
- [ ] Pilsymboler används exakt som dokumenterat (`-->`, `<-->` etc.)
- [ ] Etikett på relation föregås av `:` och är citerad: `: "text"`
- [ ] Tjocklekar anges med `px`-suffix: `2px`
