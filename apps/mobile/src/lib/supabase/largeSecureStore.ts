import * as aesjs from "aes-js";
import { getRandomBytes } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";

// Official Supabase Expo pattern: only the AES key lives in SecureStore; the
// encrypted session blob lives in MMKV (SecureStore has a small size limit).
const storage = createMMKV({ id: "growbase-supabase-auth" });

async function encrypt(key: string, value: string): Promise<string> {
  const encryptionKey = getRandomBytes(32);
  const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
  const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
  await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
  return aesjs.utils.hex.fromBytes(encryptedBytes);
}

async function decrypt(key: string, value: string): Promise<string | null> {
  const encryptionKeyHex = await SecureStore.getItemAsync(key);
  if (!encryptionKeyHex) return null;
  const cipher = new aesjs.ModeOfOperation.ctr(
    aesjs.utils.hex.toBytes(encryptionKeyHex),
    new aesjs.Counter(1),
  );
  const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
  return aesjs.utils.utf8.fromBytes(decryptedBytes);
}

export const largeSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = storage.getString(key);
    if (!encrypted) return null;
    try {
      return await decrypt(key, encrypted);
    } catch {
      // Corrupt blob or missing key → treat as signed-out, drop the bad entry.
      await this.removeItem(key);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    storage.set(key, await encrypt(key, value));
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } finally {
      storage.remove(key);
    }
  },
};
