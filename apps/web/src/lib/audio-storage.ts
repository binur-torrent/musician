import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { LOCAL_AUDIO_DB, LOCAL_AUDIO_STORE } from "@musician/shared";

interface MusicianAudioDB extends DBSchema {
  tracks: {
    key: string;
    value: {
      trackId: string;
      blob: Blob;
      mimeType: string;
      savedAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<MusicianAudioDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MusicianAudioDB>(LOCAL_AUDIO_DB, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(LOCAL_AUDIO_STORE)) {
          db.createObjectStore(LOCAL_AUDIO_STORE, { keyPath: "trackId" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTrackAudio(
  trackId: string,
  blob: Blob,
  mimeType = "audio/mp4",
) {
  const db = await getDb();
  await db.put(LOCAL_AUDIO_STORE, {
    trackId,
    blob,
    mimeType,
    savedAt: new Date().toISOString(),
  });
}

export async function getTrackAudio(trackId: string) {
  const db = await getDb();
  return db.get(LOCAL_AUDIO_STORE, trackId);
}

export async function deleteTrackAudio(trackId: string) {
  const db = await getDb();
  await db.delete(LOCAL_AUDIO_STORE, trackId);
}

export async function hasTrackAudio(trackId: string) {
  const record = await getTrackAudio(trackId);
  return Boolean(record?.blob);
}

export async function listLocalTrackIds() {
  const db = await getDb();
  return db.getAllKeys(LOCAL_AUDIO_STORE);
}
