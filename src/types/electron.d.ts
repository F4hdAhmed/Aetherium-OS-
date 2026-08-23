import type { AetheriumDesktopApi } from './contracts';

declare global {
  interface Window {
    aetherium?: AetheriumDesktopApi;
  }
}

export {};

