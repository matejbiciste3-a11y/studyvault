import { list } from "@vercel/blob";

export const BLOB_PREFIX = "studyvault/docs/";

export type StudyDocument = {
  pathname: string;
  title: string;
  category: string;
  size: number;
  uploadedAt: string;
  contentType: string;
};

function decode(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return value;
  }
}

export function parseDocument(blob: {
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
}): StudyDocument | null {
  if (!blob.pathname.startsWith(BLOB_PREFIX)) return null;

  const parts = blob.pathname.slice(BLOB_PREFIX.length).split("/");
  if (parts.length !== 2) return null;

  const [categoryEncoded, filename] = parts;
  const titleEncoded = filename.replace(/^\d+-/, "").replace(/\.[^.]+$/, "");
  return {
    pathname: blob.pathname,
    title: decode(titleEncoded),
    category: decode(categoryEncoded),
    size: blob.size,
    uploadedAt: blob.uploadedAt.toISOString(),
    contentType: blob.contentType ?? "application/octet-stream"
  };
}

export async function getDocuments() {
  const result = await list({
    prefix: BLOB_PREFIX,
    limit: 1000,
    access: "private"
  });

  return result.blobs
    .map((blob) => parseDocument(blob))
    .filter((document): document is StudyDocument => document !== null)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
