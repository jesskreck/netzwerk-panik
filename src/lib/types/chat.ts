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