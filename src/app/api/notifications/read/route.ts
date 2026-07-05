import { db } from "@/utils/db";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { notificationId } = body; // If provided, mark one. Otherwise, mark all.

    if (notificationId) {
      await db
        .update(notification)
        .set({ read: true })
        .where(and(eq(notification.id, notificationId), eq(notification.userId, userId)));
    } else {
      await db
        .update(notification)
        .set({ read: true })
        .where(eq(notification.userId, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
