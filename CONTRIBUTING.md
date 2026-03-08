# Bidra till Kardio.js

Tack för ditt intresse för att bidra till Kardio.js! 🎉

## Kom igång

1. **Forka** detta repository
2. **Klona** din fork lokalt:
   ```bash
   git clone https://github.com/ditt-användarnamn/kardio.js.git
   cd kardio.js
   ```
3. **Skapa en ny branch** för din feature/fix:
   ```bash
   git checkout -b feature/min-nya-feature
   ```

## Utveckling

Kardio.js är avsiktligt enkelt - hela biblioteket finns i en enda fil (`kardio.js`).

### Testa lokalt

1. Öppna `kardio-example.html` direkt i webbläsaren
2. Eller starta en lokal server:
   ```bash
   # Med Python
   python -m http.server 8000
   # Sedan öppna http://localhost:8000/kardio-example.html
   
   # Med Node.js
   npx serve .
   ```

### Kodstil

- Använd vanilla JavaScript (ingen transpilering)
- Kommentarer på engelska i koden, svenska i dokumentation
- Håll allt i en fil för enkelhets skull
- Inga externa beroenden

## Rapportera buggar

Använd [GitHub Issues](../../issues) och inkludera:

- **Beskrivning** av problemet
- **Steg för att återskapa**
- **Förväntad funktion** vs faktisk funktion
- **Browser/operativsystem** information
- **Exempelkod** om möjligt

## Föreslå funktioner

Skapa en [GitHub Issue](../../issues) med:

- **Beskriv functionen** tydligt
- **Motivering** - varför är den användbar?
- **Exempel** på hur den skulle användas
- **Implementation ideas** (valfritt)

## Pull Requests

1. **Se till** att din kod fungerar med `kardio-example.html`
2. **Uppdatera dokumentation** om din förändring påverkar API:et
3. **Skriv ett tydligt commit-meddelande**
4. **Öppna en PR** mot `main`-branchen

### Commit-meddelanden

Använd följande format:
- `feat: lägg till ny funktionalitet`
- `fix: fixa bug i X`  
- `docs: uppdatera README`
- `refactor: förbättra kod struktur`

## Licens

Genom att bidra accepterar du att dina bidrag licensieras under MIT-licensen.