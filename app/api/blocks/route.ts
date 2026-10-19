import { NextResponse } from "next/server";
import { getBlocks } from "@/lib/registry";

export async function GET() {
    const blocks = await getBlocks();
    return NextResponse.json(
        blocks.map((b) => ({ id: b.id, name: b.name })),
        { headers: { "Cache-Control": "no-store" } }
    );
}