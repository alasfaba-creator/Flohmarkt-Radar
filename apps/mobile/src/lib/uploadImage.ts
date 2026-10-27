import { supabase } from './supabase';

// Lädt ein lokales Foto (URI aus dem ImagePicker) unter <user_id>/<zeitstempel>.jpg hoch und gibt den Pfad zurück.
export async function uploadImage(bucket: string, userId: string, uri: string) {
  const body = await (await fetch(uri)).arrayBuffer();
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}
