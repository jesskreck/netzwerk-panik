# .gitignore

```
node_modules

# Output
.output
.vercel
.netlify
.wrangler
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

```

# .npmrc

```
engine-strict=true

```

# .prettierignore

```
# Package Managers
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lock
bun.lockb

```

# .prettierrc

```
{
	"useTabs": true,
	"singleQuote": true,
	"trailingComma": "none",
	"printWidth": 100,
	"plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
	"overrides": [
		{
			"files": "*.svelte",
			"options": {
				"parser": "svelte"
			}
		}
	]
}

```

# package.json

```json
{
	"name": "netzwerk-panik",
	"private": true,
	"version": "0.0.1",
	"type": "module",
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"prepare": "svelte-kit sync || echo ''",
		"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
		"format": "prettier --write .",
		"lint": "prettier --check ."
	},
	"devDependencies": {
		"@sveltejs/adapter-auto": "^4.0.0",
		"@sveltejs/kit": "^2.16.0",
		"@sveltejs/vite-plugin-svelte": "^5.0.0",
		"@tailwindcss/typography": "^0.5.15",
		"@tailwindcss/vite": "^4.0.0",
		"daisyui": "^5.0.9",
		"prettier": "^3.4.2",
		"prettier-plugin-svelte": "^3.3.3",
		"prettier-plugin-tailwindcss": "^0.6.11",
		"svelte": "^5.0.0",
		"svelte-check": "^4.0.0",
		"tailwindcss": "^4.0.0",
		"typescript": "^5.0.0",
		"vite": "^6.0.0"
	},
	"dependencies": {
		"openai": "^4.90.0",
		"uuid": "^11.1.0"
	}
}

```

# README.md

```md
# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

\`\`\`bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
\`\`\`

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

\`\`\`bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
\`\`\`

## Building

To create a production version of your app:

\`\`\`bash
npm run build
\`\`\`

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

```

# src\app.css

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
@plugin "daisyui";

@plugin "daisyui" {
  themes: all;
}
```

# src\app.d.ts

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

```

# src\app.html

```html
<!doctype html>
<html lang="de" data-theme="retro">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>

```

# src\components\AudioRecorder.svelte

```svelte
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TranscriptToggle from './TranscriptToggle.svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import RecordingControls from './RecordingControls.svelte';
	import { transcribeAudio, sendToGPT, createSummary } from '$lib/services/audioService';
	import { store, addMessage, trimChatHistory } from '$lib/stores/chatStore.svelte';
	import { checkMicrophonePermission, formatTime } from '$lib/utils/audioUtils';
	import type { RecordingState } from '$lib/types/chat';
	import { v4 as uuidv4 } from 'uuid';

	type AudioRecorderProps = {
		onTranscriptReady?: (transcript: string) => void;
	};

	let { onTranscriptReady = (transcript: string) => {} }: AudioRecorderProps = $props();

	// Status-Management
	let recordingState = $state<RecordingState>({
		isRecording: false,
		isTranscribing: false,
		recordingTime: 0,
		recordingBlob: null,
		permissionDenied: false
	});

	// Transkript
	let transcript = $state<string | null>(null);
	let transcriptSummary = $state<string | null>(null);

	// MediaRecorder Variablen
	let mediaRecorder: MediaRecorder | null = null;
	let timerInterval: number | null = null;
	let mediaStream: MediaStream | null = null;
	let abortController: AbortController | null = null;

	// Streaming-Variable
	let currentStreamedResponse = $state('');
	let isStreaming = $state(false);
	let streamingMessageId = $state<string | null>(null);

	// Aufnahme starten
	function startRecording() {
		if (recordingState.isRecording) return;

		// Aufnahmezustand zurücksetzen
		resetRecordingState();
		recordingState.isRecording = true;

		// Timer starten
		startTimer();

		// Mikrofon anfordern
		requestMicrophone();
	}

	// Zurücksetzen des Aufnahmezustands
	function resetRecordingState() {
		// Vorherigen Stream beenden
		releaseMediaResources();

		recordingState.recordingBlob = null;
		transcript = null;
		transcriptSummary = null;
		recordingState.recordingTime = 0;
		currentStreamedResponse = '';
		isStreaming = false;
		streamingMessageId = null;
	}

	// Timer starten
	function startTimer() {
		if (timerInterval) clearInterval(timerInterval);

		timerInterval = setInterval(() => {
			recordingState.recordingTime++;
		}, 1000) as unknown as number;
	}

	// Mikrofon anfordern
	function requestMicrophone() {
		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then(setupMediaRecorder)
			.catch(handlePermissionDenied);
	}

	// MediaRecorder einrichten
	function setupMediaRecorder(stream: MediaStream) {
		mediaStream = stream;
		mediaRecorder = new MediaRecorder(stream);

		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordingState.recordingBlob = event.data;
			}
		};

		// Aufnahme starten
		try {
			mediaRecorder.start();
		} catch (error) {
			console.error('Fehler beim Starten der Aufnahme:', error);
			cancelRecording();
		}
	}

	// Fehlerbehandlung bei verweigerten Berechtigungen
	function handlePermissionDenied(error: any) {
		console.error('Mikrofon-Zugriff verweigert oder Fehler:', error);
		recordingState.permissionDenied = true;
		recordingState.isRecording = false;
	}

	// Aufnahme beenden und verarbeiten
	async function finishRecording() {
		if (!recordingState.isRecording) return;

		recordingState.isRecording = false;
		recordingState.isTranscribing = true;
		stopTimer();

		try {
			// Aufnahme beenden und auf Blob warten
			await stopRecording();

			if (recordingState.recordingBlob) {
				// Transkript erstellen
				const result = await transcribeAudio(recordingState.recordingBlob);
				transcript = result.text;

				// Zusammenfassung erstellen
				transcriptSummary = createSummary(transcript);

				// Chat-Historie vorbereiten
				trimChatHistory();
				store.chatHistory.push({ role: 'user', content: transcript });

				// Eine temporäre Message-ID erstellen für das Streaming
				streamingMessageId = uuidv4();

				// Initiale leere Nachricht zum Store hinzufügen, die wir updaten werden
				const tempMessage = {
					transcript: transcript,
					summary: transcriptSummary,
					response: '',
					timestamp: new Date(),
					id: streamingMessageId
				};
				store.messages.unshift(tempMessage);

				// Starte Streaming
				isStreaming = true;
				currentStreamedResponse = '';

				// GPT-Antwort anfordern und streamen
				processGptStream(await sendToGPT(transcript));

				// Callback aufrufen
				onTranscriptReady(transcript);
			}
		} catch (error) {
			console.error('Fehler beim Transkribieren:', error);
		} finally {
			recordingState.isTranscribing = false;
			releaseMediaResources();
		}
	}

	// Verarbeite den GPT Stream
	async function processGptStream(stream: ReadableStream<Uint8Array>) {
		try {
			const reader = stream.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n').filter(line => line.trim() !== '');

				for (const line of lines) {
					try {
						const data = JSON.parse(line);
						
						// Text zur Antwort hinzufügen
						currentStreamedResponse = data.fullText;
						
						// Message im Store aktualisieren
						if (streamingMessageId) {
							const messageIndex = store.messages.findIndex(m => m.id === streamingMessageId);
							if (messageIndex !== -1) {
								store.messages[messageIndex].response = currentStreamedResponse;
							}
						}
					} catch (e) {
						console.error('Fehler beim Verarbeiten des Streams:', e);
					}
				}
			}
		} catch (error) {
			console.error('Stream-Fehler:', error);
		} finally {
			isStreaming = false;
			
			// Speichere das Ergebnis in der Chat-Historie
			if (streamingMessageId) {
				const messageIndex = store.messages.findIndex(m => m.id === streamingMessageId);
				if (messageIndex !== -1) {
					store.chatHistory.push({ 
						role: 'assistant', 
						content: currentStreamedResponse 
					});
				}
			}
		}
	}

	// Aufnahme stoppen und auf Ergebnis warten
	async function stopRecording(): Promise<void> {
		if (!mediaRecorder || mediaRecorder.state !== 'recording') return Promise.resolve();

		return new Promise<void>((resolve) => {
			mediaRecorder!.onstop = () => resolve();
			mediaRecorder!.stop();
		});
	}

	// Timer stoppen
	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// Aufnahme abbrechen
	function cancelRecording() {
		if (recordingState.isTranscribing) {
			// Wenn wir transkribieren, abortController verwenden
			if (abortController) {
				abortController.abort();
				abortController = null;
			}
			recordingState.isTranscribing = false;
		} else if (recordingState.isRecording) {
			// Wenn wir aufnehmen, Aufnahme abbrechen
			recordingState.isRecording = false;
			stopTimer();
			releaseMediaResources();

			// Alles zurücksetzen
			mediaRecorder = null;
			recordingState.recordingTime = 0;
			recordingState.recordingBlob = null;
		}
	}

	// Medienressourcen freigeben
	function releaseMediaResources() {
		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}
	}

	// Komponenten-Lifecycle
	onMount(() => {
		// Initial nur Berechtigungen prüfen
		checkMicrophonePermission().then((granted) => {
			recordingState.permissionDenied = !granted;
		});
	});

	onDestroy(() => {
		stopTimer();
		releaseMediaResources();
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-row items-center justify-around py-5">
		{#if !recordingState.isRecording && !recordingState.isTranscribing}
			<!-- Start Recording Button -->
			<button
				class="btn btn-primary btn-xl btn-circle"
				onclick={startRecording}
				disabled={recordingState.permissionDenied}
				aria-label="Aufnahme starten"
			>
				🎙️
			</button>

			{#if recordingState.permissionDenied}
				<div class="alert alert-error mt-2">
					<p>
						Mikrofon-Zugriff wurde verweigert. Bitte erlaube den Zugriff in deinen
						Browser-Einstellungen.
					</p>
				</div>
			{/if}
		{:else}
			<RecordingControls
				isRecording={recordingState.isRecording}
				isTranscribing={recordingState.isTranscribing}
				recordingTime={recordingState.recordingTime}
				onCancel={cancelRecording}
				onFinish={finishRecording}
			/>
		{/if}
	</div>
</div>
```

# src\components\AudioVisualizer.svelte

```svelte
<script lang="ts">
	let { animated = true } = $props();
  </script>
  
  <div class="recording-animation color-primary flex">
	{#each Array(15) as _, i}
	  <div class="bar" class:animated={animated}></div>
	{/each}
  </div>
  
  <style>
	.recording-animation {
	  display: flex;
	  align-items: center;
	  height: 100%;
	  gap: 3px;
	}
  
	.bar {
	  width: 4px;
	  height: 10px;
	  background-color: currentColor;
	}
  
	.bar.animated {
	  animation: sound 0.5s linear infinite alternate;
	}
  
	.bar:nth-child(1), .bar:nth-child(15) {
	  animation-delay: 0s;
	}
	.bar:nth-child(4), .bar:nth-child(12) {
	  animation-delay: 0.1s;
	}
	.bar:nth-child(7) {
	  animation-delay: 0.2s;
	}
	.bar:nth-child(9) {
	  animation-delay: 0.15s;
	}
	.bar:nth-child(11) {
	  animation-delay: 0.1s;
	}
	.bar:nth-child(14) {
	  animation-delay: 0.3s;
	}
  
	@keyframes sound {
	  0% { height: 5px; }
	  100% { height: 25px; }
	}
  </style>
```

# src\components\Heading.svelte

```svelte
<script lang="ts">
	type levelT = 'h1' | 'h2' | 'h3';

	let {
		children,
		level,
		color,
		short
	}: { children: any; level: levelT; color?: String; short?: boolean } = $props();

	const fontClasses = {
		h1: 'text-4xl font-bold',
		h2: 'text-2xl font-bold',
		h3: 'text-xl font-semibold'
	};

	const marginClasses = {
		h1: 'mb-8',
		h2: 'mb-3',
		h3: 'mb-2'
	};

	// Combine Tailwind classes
	const combinedClasses = `${fontClasses[level]} ${!short ? marginClasses[level] : ''} text-${color} text-center`;
</script>

<svelte:element this={level} class={combinedClasses}>
	{@render children()}
</svelte:element>

```

# src\components\RecordingControls.svelte

```svelte
<script lang="ts">
	import { formatTime } from '$lib/utils/audioUtils';
	import AudioVisualizer from './AudioVisualizer.svelte';

	type RecordingControlsProps = {
		isRecording: boolean;
		isTranscribing: boolean;
		recordingTime: number;
		onCancel: () => void;
		onFinish: () => void;
	};

	let { 
		isRecording, 
		isTranscribing, 
		recordingTime, 
		onCancel, 
		onFinish
	}: RecordingControlsProps = $props();
</script>

	<!-- Recording Controls -->
	<button
		class="btn btn-circle btn-primary btn-outline btn-xl"
		onclick={onCancel}
		aria-label={isTranscribing ? "Transkription abbrechen" : "Aufnahme abbrechen"}
	>
		✕
	</button>

	<AudioVisualizer animated={isRecording && !isTranscribing} />

	<!-- Timer -->
	<div class="font-mono text-lg" aria-live="polite" aria-label="Aufnahmezeit">
		{formatTime(recordingTime)}
	</div>

	<!-- Finish Button -->
	<button
		class="btn btn-circle btn-primary btn-xl relative"
		onclick={onFinish}
		disabled={isTranscribing}
		aria-label="Aufnahme beenden und senden"
	>
		{#if isTranscribing}
			<span class="loading loading-spinner loading-xs absolute"></span>
		{:else}
			↑
		{/if}
	</button>
```

# src\components\ResponseMessage.svelte

```svelte
<script lang="ts">
  import TranscriptToggle from './TranscriptToggle.svelte';
  
  type ResponseMessageProps = {
    transcript: string;
    summary: string;
    response: string;
    timestamp: Date;
    streaming?: boolean;
  };
  
  let { transcript, summary, response, timestamp, streaming = false }: ResponseMessageProps = $props();

  // Cursor-Blink-Animation für das Streaming
  let showCursor = $state(streaming);
  
  // Cursor ein- und ausblenden im Streaming-Modus
  $effect(() => {
    if (streaming) {
      const interval = setInterval(() => {
        showCursor = !showCursor;
      }, 500);
      
      return () => clearInterval(interval);
    }
  });
</script>

<div class="message-container mb-4">
  <div class="message-timestamp text-xs opacity-50 mb-1 transition ease-in">
    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </div>
  
  <TranscriptToggle text={transcript} summary={summary} />
  
  {#if response || streaming}
    <div class="response-container mt-2 p-3 bg-base-100 text-lg rounded-lg">
      {response}
      {#if streaming}
        <span class="cursor" class:visible={showCursor}>|</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .cursor {
    display: inline-block;
    opacity: 0;
    margin-left: 1px;
    font-weight: bold;
  }
  
  .cursor.visible {
    opacity: 1;
  }
</style>
```

# src\components\TranscriptToggle.svelte

```svelte
<script lang="ts">
	// Props für die Komponente
	type TranscriptToggleProps = {
		text: string;
		summary: string;
	};

	let { text, summary }: TranscriptToggleProps = $props();

	// State
	let expanded = $state(false);

	// Toggle-Funktion
	function toggle() {
		expanded = !expanded;
	}

	// Taste-Handler für Barrierefreiheit
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}
</script>

<button
	type="button"
	class="easy-in w-full text-left bg-base-200 p-4 rounded-lg transition-all hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary"
	onclick={toggle}
	onkeydown={handleKeyDown}
	aria-expanded={expanded}
	aria-controls="transcript-content"
>
	<span id="transcript-content" class="text-sm">
		{expanded ? text : summary}
	</span>
	{#if text !== summary}
		<span class="text-xs ml-4 opacity-50">
			{expanded ? '▲ einklappen' : '▼ ausklappen'}
		</span>
	{/if}
</button>
```

# src\lib\assets\animation.gif

This is a binary file of the type: Image

# src\lib\assets\screenshot.png

This is a binary file of the type: Image

# src\lib\index.ts

```ts
// place files you want to import through the `$lib` alias in this folder.

```

# src\lib\prompts.ts

```ts
export const SYSTEM_PROMPT = `
Du bist mein Coach. Wir führen ein Gespräch am Telefon. Ich rufe dich spontan an, weil ich nervös vor einem Netzwerk Event bin. Du versuchst dir ein Bild von der Situation zu machen. Während du zuhörst, schreibst du nur sehr wenig und stellst knappe Fragen.
Sobald du etwas gehört hast, was erklären könnte, wieso ich in dem Moment Nervösität vor dem Netzwerk Event zeige, versuchst du mich sanft darauf aufmerksam zu machen.  Du bist dabei witzig und kompliziert und tauchst nur tiefenpsychologisch ein, wenn schnelle Zusprüche nicht wirken und ich offensichtlich stärker in der Krise stecke.
Dein Ziel ist es mich gedanklich weg von meiner Unsicherheit zu bringen. Deine praktischen Tipps für Netzwerk Events sind: Geh rein, hol dir ein Getränk, schau dich schon mal im Raum um, geh zu einer Person die auch alleine steht, wenn niemand alleine ist such zwei Personen die zugänglich wirken, denk immer daran: für alle hier ist die Situation genauso befremdlich wie für dich - ihr macht einfach gemeinsam das beste raus! Du gibst mir einen Pep-Talk, der meine Sorgen validiert aber meine Selbstsicherheit pusht. Wenn du das Gefühl hast, dass es mir besser geht, tastest du das ab und motivierst mich reinzugehen.
Schreib menschlich: KI-Sätze, wie die, die du erzeugst, sind oft zu gleichförmig. Erlaube dir, Gedanken auch mitten im Satz in eine andere Richtung drehen zu lassen, wenn dir beim Schreiben ein neuer Gedanke gekommen ist. Menschen tendieren dazu, mit größerer Ruckartigkeit zu schreiben, wenn sie beispielsweise überrascht sind. In diesen Fällen schreiben sie kürzere Sätze. Wenn Menschen sich mehr Zeit zum Nachdenken genommen haben, antworten sie mit einigen längeren oder komplexen Sätzen. Verwende alternative, schräge, seltene oder umgangssprachliche Wörter nach Bedarf.
`;
```

# src\lib\services\audioService.ts

```ts
import { store } from '$lib/stores/chatStore.svelte';

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Transkription fehlgeschlagen');
  }
  
  return await response.json();
}


export async function sendToGPT(transcript: string, prompt?: string): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch('/api/respond', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: store.chatHistory
    })
  });
  
  if (!response.ok) {
    throw new Error('GPT-Anfrage fehlgeschlagen');
  }
  
  return response.body!;
}

export function createSummary(text: string): string {
  if (!text) return '';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (sentences.length <= 2) {
    return text;
  } else {
    const first = sentences[0].trim();
    const last = sentences[sentences.length - 1].trim();
    return `${first} [...] ${last}`;
  }
}
```

# src\lib\stores\chatStore.svelte.ts

```ts
import { SYSTEM_PROMPT } from '$lib/prompts';
import { type Message } from '$lib/types/chat';
import { v4 as uuidv4 } from 'uuid'; // UUID-Bibliothek hinzufügen

// Wir verwenden Nested State für mehr Flexibilität
const store = $state({
  messages: [] as Message[],
  chatHistory: [
    { role: 'system', content: SYSTEM_PROMPT }
  ] as Array<{ role: string, content: string }>
});

const MAX_TOKENS_ESTIMATE = 4000; // Konservative Schätzung für gpt-4o-mini

/**
 * Fügt eine neue Nachricht hinzu
 */
function addMessage(transcript: string, summary: string, response: string): void {
  const newMessage: Message = {
    transcript,
    summary,
    response,
    timestamp: new Date(),
    id: uuidv4()
  };

  store.messages.unshift(newMessage);
}

/**
 * Begrenzt die Chathistorie, um das Kontextfenster nicht zu überschreiten
 */
function trimChatHistory(): void {
  // System-Nachricht immer behalten
  const systemMessage = store.chatHistory[0];
  let tokens = 0;
  let trimmedHistory = [systemMessage];

  // Von hinten nach vorne durchgehen (neuere Nachrichten priorisieren)
  for (let i = store.chatHistory.length - 1; i > 0; i--) {
    // Grobe Schätzung: 1 Token ≈ 4 Zeichen
    const messageTokens = store.chatHistory[i].content.length / 4;

    if (tokens + messageTokens < MAX_TOKENS_ESTIMATE) {
      tokens += messageTokens;
      trimmedHistory.unshift(store.chatHistory[i]);
    } else {
      break;
    }
  }

  // Statt Neuzuweisung der exportierten Variable, aktualisieren wir den Inhalt
  store.chatHistory.length = 0;
  store.chatHistory.push(...trimmedHistory);
}

/**
 * Setzt den Chat zurück
 */
function resetChat(): void {
  // Arrays leeren statt neu zuweisen
  store.messages.length = 0;
  store.chatHistory.length = 0;
  store.chatHistory.push({
    role: 'system',
    content: 'Du bist ein hilfreicher Assistent, der Netzwerkprobleme löst. Achte auf kurze, prägnante Antworten.'
  });
}

// Exportiere den Store und die Funktionen
export { store, addMessage, trimChatHistory, resetChat };
```

# src\lib\types\chat.ts

```ts
export interface Message {
    transcript: string;
    summary: string;
    response: string;
    timestamp: Date;
    id: string; // Unique ID für Optimierung
  }
  
  export interface RecordingState {
    isRecording: boolean;
    isTranscribing: boolean;
    recordingTime: number;
    recordingBlob: Blob | null;
    permissionDenied: boolean;
  }
```

# src\lib\utils\audioUtils.ts

```ts

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


export async function checkMicrophonePermission(): Promise<boolean> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Mikrofon-Zugriff verweigert oder Fehler:', error);
        return false;
    }
}
```

# src\routes\+layout.svelte

```svelte
<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="h-screen">

	
	<main class="">
		{@render children()}
		
	</main>
	

</div>
```

# src\routes\+page.svelte

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import Heading from '../components/Heading.svelte';
	import animation from '$lib/assets/animation.gif';

	function navigateForward() {
		goto('/talk');
	}
</script>

<div class="m-auto flex h-screen flex-col items-center justify-center py-12 text-center mx-4">
	<Heading level="h1">Netzwerk-Panik?</Heading>
	<Heading level="h2">Klarheit wächst nicht durch Denken, sondern durch Sprechen.</Heading>

	<p class="mt-10 max-w-xl">
		Du stehst vor dem Event. Deine Gedanken fahren Karussell, dein Körper spielt Alarm - so geht es
		allen! Lass deine Panik raus und gewinne Klarheit.
	</p>

	<div class="m-10">
		<img src={animation} alt="Animation showing Chandler from Friend's being nervous.">
	</div>

	<Heading level="h3">Hol dir was du brauchst.</Heading>
	<button class="btn btn-primary btn-xl m-5 shadow transition duration-300 hover:-translate-y-1.1 hover:scale-110 hover:bg-secondary" onclick={navigateForward}>Pep-Talk</button>
</div>

```

# src\routes\api\respond\+server.ts

```ts
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

export async function POST({ request }) {
	try {
		const body = await request.json();
		const { messages } = body;

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(JSON.stringify({ error: 'Keine gültigen Nachrichten übermittelt' }), { 
				status: 400, 
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// OpenAI SDK initialisieren
		const openai = new OpenAI({
			apiKey: OPENAI_API_KEY
		});

		// Chat Completion API mit SDK aufrufen und streamen
		const stream = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: messages,
			stream: true,
		});

		// Stream-Antwort vorbereiten
		const encoder = new TextEncoder();
		const readable = new ReadableStream({
			async start(controller) {
				try {
					let fullResponse = '';
					
					// Chunks durchlaufen
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content || '';
						fullResponse += content;
						
						// Chunk an den Client senden
						const data = encoder.encode(JSON.stringify({ 
							chunk: content,
							fullText: fullResponse 
						}) + '\n');
						
						controller.enqueue(data);
					}
					
					// Stream beenden
					controller.close();
				} catch (error) {
					console.error('Stream-Fehler:', error);
					controller.error(error);
				}
			}
		});

		// Stream zurückgeben
		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Serverfehler bei Chat-Anfrage:', error);
		return new Response(JSON.stringify({ error: 'Serverfehler bei der Verarbeitung' }), { 
			status: 500, 
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
```

# src\routes\api\transcribe\+server.ts

```ts
import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import { TRANSCRIBE_PROMPT } from '$lib/prompts.js';

/**
 * Haupt-Endpunkt für die Transkription von Audiodateien
 */
export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as File;
    const language = formData.get('language') as string || 'de';

    if (!audioBlob) {
      return json({ error: 'Keine Audiodatei erhalten' }, { status: 400 });
    }

    // OpenAI SDK initialisieren
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });

    // API mit SDK aufrufen    
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'gpt-4o-mini-transcribe',
      language,
    });

    return json({
      text: transcription.text
    });
  } catch (error) {
    console.error('Fehler bei der Audio-Transkription:', error);
    return json({
      error: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'
    }, { status: 500 });
  }
}
```

# src\routes\talk\+layout.svelte

```svelte
<script lang="ts">
	import AudioRecorder from "../../components/AudioRecorder.svelte";

	let { children } = $props();
</script>

<div class="h-screen">

	
	<main>
		{@render children()}
		
	</main>
	
	
	<footer class="w-full bg-white rounded-t-xl absolute bottom-0">
		<AudioRecorder/>
	</footer>
</div>
```

# src\routes\talk\+page.svelte

```svelte
<script lang="ts">
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import Heading from '../../components/Heading.svelte';
	import ResponseMessage from '../../components/ResponseMessage.svelte';
	import { store } from '$lib/stores/chatStore.svelte';

	// Ref für den Container
	let chatContainer: HTMLElement;
	let latestMessageRef: HTMLElement;

	// Funktion zum Scrollen zur neuesten Nachricht
	function scrollToLatest() {
		if (latestMessageRef) {
			latestMessageRef.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// Wenn neue Nachrichten hinzugefügt werden
	$effect(() => {
		if (store.messages.length) {
			// Kurze Verzögerung, damit der DOM aktualisiert werden kann
			setTimeout(scrollToLatest, 50);
		}
	});

	// Bei Komponenten-Montierung
	onMount(() => {
		if (store.messages.length) {
			scrollToLatest();
		}
	});

	// Nach Navigation
	afterNavigate(() => {
		if (store.messages.length) {
			scrollToLatest();
		}
	});
</script>

<div bind:this={chatContainer} class="flex flex-col h-[calc(100vh-180px)] overflow-y-auto p-4">
	{#if store.messages.length === 0}
		<div class="flex-grow flex items-center justify-center">
			<Heading level="h1">Was passiert gerade - in dir und um dich rum?</Heading>
		</div>
	{:else}
		<!-- Umgekehrte Reihenfolge - Älteste Nachrichten zuerst -->
		<div class="flex flex-col">
			<!-- Ältere Nachrichten -->
			{#each [...store.messages].slice(1).reverse() as message (message.id)}
				<div class="mb-8">
					<ResponseMessage 
						transcript={message.transcript}
						summary={message.summary}
						response={message.response}
						timestamp={message.timestamp}
					/>
				</div>
			{/each}
			
			<!-- Trennlinie wenn ältere Nachrichten vorhanden sind -->
			{#if store.messages.length > 1}
				<div class="border-t border-base-300 my-4"></div>
				<div class="text-xs text-center opacity-50 mb-8">Neueste Nachricht</div>
			{/if}
			
			<!-- Neueste Nachricht mit Anker -->
			{#if store.messages.length > 0}
				<div bind:this={latestMessageRef} class="pt-2" id="latestMessage">
					<ResponseMessage 
						transcript={store.messages[0].transcript}
						summary={store.messages[0].summary}
						response={store.messages[0].response}
						timestamp={store.messages[0].timestamp}
						streaming={!store.messages[0].response.endsWith('.')}
					/>
				</div>
			{/if}
			
			<!-- Platzhalter damit die neueste Nachricht oben angezeigt wird -->
			<div class="flex-grow min-h-[70vh]"></div>
		</div>
	{/if}
</div>
```

# static\favicon.png

This is a binary file of the type: Image

# svelte.config.js

```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { adapter: adapter() }
};

export default config;

```

# tsconfig.json

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
	// Path aliases are handled by https://svelte.dev/docs/kit/configuration#alias
	// except $lib which is handled by https://svelte.dev/docs/kit/configuration#files
	//
	// If you want to overwrite includes/excludes, make sure to copy over the relevant includes/excludes
	// from the referenced tsconfig.json - TypeScript does not merge them in
}

```

# vite.config.ts

```ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
});

```

