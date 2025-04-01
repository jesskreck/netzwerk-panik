# Netzwerk-Panik App

Eine Svelte 5 Anwendung, die dir hilft, Nervosität vor Networking-Events abzubauen.

## Features

- 🎙️ **Audio-basierte Eingabe**: Sprich deine Sorgen ein und lass die KI dir helfen, sie zu sortieren
- 🤖 **KI-Coaching**: Erhält maßgeschneiderte Motivation und praktische Tipps
- 💬 **Vordefinierte Prompts**: Schnellauswahl für typische Sorgen, wenn du nicht selbst sprechen möchtest

## Technologien

- [Svelte 5](https://svelte.dev) mit den neuen Runes-Features für reaktiven State
- [SvelteKit 2](https://kit.svelte.dev) für Routing und Serverless-Funktionen
- [TailwindCSS 4](https://tailwindcss.com) und [DaisyUI](https://daisyui.com) für das UI
- [OpenAI API](https://openai.com) für Transkription und KI-Antworten

## Einrichtung

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

## Deployment auf Netlify

Diese Anwendung ist für das Deployment auf Netlify optimiert:

1. Stelle sicher, dass `@sveltejs/adapter-netlify` korrekt konfiguriert ist (siehe `svelte.config.js`)

2. Überprüfe die Netlify-Konfiguration in `netlify.toml`

3. Erstelle eine `_redirects`-Datei im `static`-Verzeichnis mit folgendem Inhalt:
   ```
   /* /index.html 200
   ```

4. Baue die Anwendung:
   ```bash
   npm run build
   ```

5. Deploye auf Netlify durch:
   - Verbinden deines GitHub-Repos in Netlify, oder
   - Manuelles Hochladen des `build`-Verzeichnisses

6. Konfiguriere die Umgebungsvariablen (besonders den OPENAI_API_KEY) in den Netlify-Einstellungen

## Projektstruktur

- `/src/components` - Wiederverwendbare UI-Komponenten
- `/src/lib` - Services, Stores und gemeinsam genutzte Utilities
- `/src/routes` - Seitenstruktur und Routing
- `/static` - Statische Assets und Dateien

## Lizenz

MIT