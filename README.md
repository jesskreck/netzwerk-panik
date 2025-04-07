# Netzwerk-Panik App

Eine Svelte 5 Anwendung, die dir hilft, Nervosität vor Networking-Events abzubauen.

**Demo**: [https://panik.jesskreck.de/](https://panik.jesskreck.de/)

## Features

- 🎙️ **Audio-basierte Eingabe**: Sprich deine Sorgen ein und lass die KI dir helfen, sie zu sortieren
- 🤖 **KI-Coaching**: Erhalte maßgeschneiderte Motivation und praktische Tipps
- 💬 **Vordefinierte Prompts**: Schnellauswahl für typische Sorgen, wenn du nicht selbst sprechen möchtest
- 🎯 **Event-Ziele**: Definiere und konkretisiere deine Ziele für das Networking-Event
- 💡 **Gesprächsthemen**: Erarbeite passende Gesprächsthemen und Einstiege


## Technologie-Stack

- **Frontend**: Svelte 5 mit Runes für reaktiven State-Management
- **Backend**: SvelteKit 2 (Server-Komponenten, API-Routen, SSR)
- **Styling**: TailwindCSS 4 mit DaisyUI als Komponenten-Bibliothek
- **APIs**: 
  - OpenAI für Audio-Transkription (`gpt-4o-mini-transcribe`)
  - Chat-Completion via `gpt-4o-mini` für Antwortgenerierung
- **Deployment**: Netlify mit edge-optimierten SvelteKit-Adapter
- **Build-Tools**: Vite für schnelle Entwicklungsumgebung
- **Typensicherheit**: TypeScript für statische Typprüfung


## Projektstruktur

```
netzwerk-panik/
├── src/
│   ├── components/       # Wiederverwendbare UI-Komponenten
│   │   ├── ChatCompletion/  # Chat-bezogene Komponenten
│   │   └── layout/       # Layout-Komponenten
│   ├── lib/
│   │   ├── assets/       # Bilder und andere Assets
│   │   ├── services/     # API-Dienste und Business-Logik
│   │   ├── stores/       # Svelte Stores für Zustandsverwaltung
│   │   ├── types/        # TypeScript-Typdefinitionen
│   │   └── utils/        # Hilfsfunktionen
│   └── routes/
│       ├── api/          # API-Endpunkte (OpenAI)
│       ├── eventziele/   # Zielsetzungsseite
│       ├── talk/         # Hauptchat-Seite
│       └── themen/       # Gesprächsthemen-Seite
└── static/              # Statische Assets wie Favicon
```

### Installation

1. Repo klonen:
   ```bash
   git clone https://github.com/yourusername/netzwerk-panik.git
   cd netzwerk-panik
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Umgebungsvariablen einrichten:
   Erstelle eine `.env`-Datei im Wurzelverzeichnis mit folgendem Inhalt:
   ```
   OPENAI_API_KEY=dein_openai_api_key
   ```

4. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

5. Öffne deinen Browser unter [http://localhost:5173](http://localhost:5173)

## Verwendung der App

1. **Startseite**: Hier findest du eine kurze Einführung und kannst mit "Pep-Talk" starten
2. **Chat-Modi**: Die App bietet drei verschiedene Gesprächsmodi:
   - **Talk**: Hauptmodus für Pep-Talks bei akuter Nervosität
   - **Eventziele**: Definiere deine Ziele für das Event
   - **Themen**: Erarbeite Gesprächsthemen und -einstiege

3. **Audio-Aufnahme**: Klicke auf das Mikrofon-Icon 🎙️ am unteren Bildschirmrand, um deine Sorgen einzusprechen
4. **Vorgefertigte Prompts**: Alternativ kannst du die vordefinierten Nachrichtenvorschläge verwenden
5. **Antworten**: Die KI analysiert deine Eingabe und gibt personalisierte Ratschläge


## Lizenz

MIT