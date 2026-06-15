/**
 * Soft local lock for profiles (system-design §4.2). This is NOT access control —
 * there is nothing sensitive to protect and the data never leaves the device. It
 * only discourages casual profile switching on a shared device. Stored as
 * `saltHex:hashHex` (salted SHA-256).
 */
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const data = new TextEncoder().encode(toHex(salt.buffer) + passphrase);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return `${toHex(salt.buffer)}:${toHex(digest)}`;
}

export async function verifyPassphrase(
  passphrase: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const data = new TextEncoder().encode(saltHex + passphrase);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest) === hashHex;
}
