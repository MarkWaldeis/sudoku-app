/**
 * Tactile feedback via the Web Vibration API.
 * Supported on Android Chrome/Firefox; silently no-ops on iOS Safari and
 * desktop browsers where `navigator.vibrate` is unavailable.
 */

const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

const vibrate = (pattern: number | number[]): void => {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration can throw in edge-case environments – feedback is best-effort.
  }
};

/** Light tap – cell selection, tab switches, button presses. */
export const hapticTap = (): void => vibrate(8);

/** Short confirm – correct number placed, purchase succeeded. */
export const hapticSuccess = (): void => vibrate(18);

/** Double pulse – wrong number, locked level, denied action. */
export const hapticError = (): void => vibrate([25, 45, 25]);

/** Celebratory pattern – level completed. */
export const hapticVictory = (): void => vibrate([20, 60, 20, 60, 80]);
