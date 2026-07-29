import { describe, expect, test } from "bun:test";
import { deleteUploadFile, readUploadFile, saveUploadFile } from "./storage";

const anId = () => crypto.randomUUID();

describe("upload file storage", () => {
  test("round-trips file bytes", async () => {
    const id = anId();
    const data = Buffer.from("not really a png");

    await saveUploadFile(id, data);
    const read = await readUploadFile(id);

    expect(read?.equals(data)).toBe(true);
    await deleteUploadFile(id);
  });

  test("returns null for unknown files", async () => {
    expect(await readUploadFile(anId())).toBeNull();
  });

  test("deleting is idempotent and removes the file", async () => {
    const id = anId();
    await saveUploadFile(id, Buffer.from("bytes"));

    await deleteUploadFile(id);
    await deleteUploadFile(id); // no throw on second delete

    expect(await readUploadFile(id)).toBeNull();
  });

  test("overwrites an existing file", async () => {
    const id = anId();
    await saveUploadFile(id, Buffer.from("one"));
    await saveUploadFile(id, Buffer.from("two"));

    expect((await readUploadFile(id))?.toString()).toBe("two");
    await deleteUploadFile(id);
  });
});
