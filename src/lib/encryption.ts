/**
 * Client-side AES encryption utilities for secure file storage
 * Uses AES-256-GCM for authenticated encryption
 */

// Generate a random 256-bit key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Export a key to raw format
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.exportKey('raw', key);
}

// Import a key from raw format
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Generate a random IV (Initialization Vector)
export function generateIV(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
}

// Encrypt file data
export async function encryptFile(
  fileData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileData
  );
}

// Decrypt file data
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
}

// Convert ArrayBuffer to base64 string for storage
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert base64 string back to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert Uint8Array to hex string
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hex string to Uint8Array
export function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}