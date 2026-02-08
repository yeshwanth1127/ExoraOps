import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  await requireSession();
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || !file.size) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }
  const ext = path.extname(file.name) || ".bin";
  const basename = `${randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filePath = path.join(UPLOAD_DIR, basename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buf);
  const url = `/uploads/${basename}`;
  return NextResponse.json({ url });
}
