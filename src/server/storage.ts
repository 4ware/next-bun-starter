import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * File-system storage for upload bytes; metadata stays in the `uploads`
 * table. Files are named by their upload id (a DB-generated UUID, so no
 * path-traversal concerns). Note that files are local to the instance —
 * use a shared volume or object storage when scaling out.
 */
function uploadPath(id: string) {
  return path.join(path.resolve(env.UPLOADS_DIR), id);
}

export async function saveUploadFile(id: string, data: Buffer) {
  await mkdir(path.resolve(env.UPLOADS_DIR), { recursive: true });
  await writeFile(uploadPath(id), data);
}

export async function readUploadFile(id: string): Promise<Buffer | null> {
  try {
    return await readFile(uploadPath(id));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function deleteUploadFile(id: string) {
  await rm(uploadPath(id), { force: true });
}
