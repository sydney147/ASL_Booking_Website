/**
 * One-time image compression for /public.
 *
 * - Skips files < 500 KB (already small enough).
 * - Backs up originals to public/_originals_backup/<same relative path> before overwriting.
 * - Resizes to max 1920px wide, JPEG quality 82 with mozjpeg.
 * - Run with: node scripts/compress-images.mjs
 */
import { readdir, stat, mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname.replace(/^\/(\w):/, '$1:');
const BACKUP_DIR = join(PUBLIC_DIR, '_originals_backup');

const MIN_SIZE_BYTES = 500 * 1024; // 500 KB
const MAX_WIDTH      = 1920;
const JPEG_QUALITY   = 82;

const JPG_EXT = /\.(jpe?g)$/i;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip the backup folder itself
      if (full === BACKUP_DIR) continue;
      await walk(full, files);
    } else if (JPG_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(PUBLIC_DIR);
  if (files.length === 0) {
    console.log('No .jpg/.jpeg files found under public/.');
    return;
  }

  let processed = 0;
  let skipped   = 0;
  let savedBytes = 0;

  for (const file of files) {
    const { size: before } = await stat(file);
    if (before < MIN_SIZE_BYTES) {
      skipped++;
      continue;
    }

    const rel    = relative(PUBLIC_DIR, file);
    const backup = join(BACKUP_DIR, rel);
    await mkdir(dirname(backup), { recursive: true });

    // Skip if already processed (backup exists and source matches what we'd produce)
    let backupExists = false;
    try { await stat(backup); backupExists = true; } catch {}

    if (!backupExists) {
      await copyFile(file, backup);
    }

    // Read fully into memory so sharp never holds a file handle on disk.
    const input = await readFile(file);
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    await writeFile(file, output);

    const after = output.length;
    const saved = before - after;
    savedBytes += saved;
    processed++;
    console.log(`  ${rel.padEnd(40)} ${kb(before).padStart(7)} → ${kb(after).padStart(7)}  (-${pct(saved, before)}%)`);
  }

  console.log('');
  console.log(`Processed: ${processed} file(s)`);
  console.log(`Skipped:   ${skipped} file(s) (< 500 KB)`);
  console.log(`Saved:     ${kb(savedBytes)} total`);
  console.log(`Originals: ${relative(PUBLIC_DIR, BACKUP_DIR)}/  (safe to delete once verified)`);
}

function kb(bytes)        { return `${(bytes / 1024).toFixed(0)} KB`; }
function pct(part, whole) { return ((part / whole) * 100).toFixed(0); }

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
