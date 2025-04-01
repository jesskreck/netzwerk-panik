<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TranscriptToggle from './TranscriptToggle.svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import RecordingControls from './RecordingControls.svelte';
	import { transcribeAudio, sendToGPT, createSummary } from '$lib/services/audioService';
	import { processGptStream } from '$lib/services/messageService';
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

				// GPT-Antwort anfordern und streamen
				processGptStream(await sendToGPT(transcript), streamingMessageId);

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