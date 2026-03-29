const COOKIE_ACK_KEY = "lumiel-rgpd-cookie-ack"
const COOKIE_ACK_VERSION = "v1"

export function hasCookieInfoAck(): boolean {
  try {
    return localStorage.getItem(COOKIE_ACK_KEY) === COOKIE_ACK_VERSION
  } catch {
    return false
  }
}

export function setCookieInfoAck(): void {
  try {
    localStorage.setItem(COOKIE_ACK_KEY, COOKIE_ACK_VERSION)
  } catch {
    /* ignore (mode privé, etc.) */
  }
}
