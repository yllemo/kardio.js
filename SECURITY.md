# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Om du upptäcker en säkerhetsrisk i Kardio.js:

1. **Rapportera INTE** den som en publik GitHub issue
2. **Skicka ett mail** till [säkerhets-email] eller skapa en private vulnerability report via GitHub
3. **Inkludera**:
   - Beskrivning av sårbarheten
   - Steg för att reproducera
   - Möjliga konsekvenser
   - Förslag på fix (om du har)

## Svar

Vi strävar efter att:
- Bekräfta mottagande inom 48 timmar
- Tillhandahålla en initial bedömning inom 1 vecka
- Hålla dig uppdaterad om vårt arbete med att åtgärda problemet

## Säkerhetsprinciper

Kardio.js följer dessa säkerhetsprinciper:

- **Ingen data skickas till externa servrar** - allt körs lokalt i webbläsaren
- **CSP-kompatibel** - använder inte `eval()` eller inline scripts
- **XSS-skydd** - all användardata escapas korrekt
- **Begränsad DOM-manipulation** - endast på det tilldelade container-elementet