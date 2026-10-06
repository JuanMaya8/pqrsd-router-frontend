/** The staff key lives only in sessionStorage (cleared when the tab closes). Storage can throw (private mode, blocked): never rely on it. */
const KEY = 'pqrsd.staffKey';

export function loadStaffKey(): string {
  try {
    return window.sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveStaffKey(value: string): void {
  try {
    if (value) window.sessionStorage.setItem(KEY, value);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
