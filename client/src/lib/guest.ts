// Stable guest ID management - persisted in localStorage
const GUEST_ID_KEY = "jc_flashcards_guest_id";

export function getGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function clearGuestId(): void {
  localStorage.removeItem(GUEST_ID_KEY);
}

export function isGuestId(id: string): boolean {
  return id.startsWith("guest-");
}
