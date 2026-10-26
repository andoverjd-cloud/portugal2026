import { put, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const secret = form.get("secret") as string;
  const oldUrl = form.get("url") as string;
  const pathname = form.get("pathname") as string;
  const file = form.get("image") as File;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  await del(oldUrl, { token });
  const result = await put(pathname, file, { access: "public", token, addRandomSuffix: false });

  return NextResponse.json({ ok: true, url: result.url });
}
