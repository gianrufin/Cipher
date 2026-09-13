export async function enterFullscreen(): Promise<void> {
  if (typeof document === 'undefined' || document.fullscreenElement) return;
  const root = document.documentElement;
  if (!root.requestFullscreen) return;
  try {
    await root.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    // Browsers may reserve fullscreen for installed apps or explicit user settings.
  }
}
