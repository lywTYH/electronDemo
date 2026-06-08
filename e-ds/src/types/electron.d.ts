export interface ElectronAPI {
  startChat: (value: string) => Promise<unknown>;
  cancelChat: () => void;
  onChatUpdate: (callback: (data: string) => void) => void;
  onChatError: (callback: (error: Error) => void) => void;
  onChatCancelled: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
