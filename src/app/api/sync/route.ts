import { NextRequest, NextResponse } from "next/server";
import { runSync, isSyncRunning, getCurrentSync, type SyncType } from "@/lib/tmdbSync";
import { getRecentSyncLogs } from "@/lib/movieDatabase";

export async function GET() {
  const running = isSyncRunning();
  const current = getCurrentSync();
  const recentLogs = getRecentSyncLogs(10);

  return NextResponse.json({
    is_running: running,
    current_sync: current,
    recent_logs: recentLogs,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = (body.type || "full") as SyncType;

    if (!["full", "trending", "popular", "discover"].includes(type)) {
      return NextResponse.json({ error: "Invalid sync type. Use: full, trending, popular, discover" }, { status: 400 });
    }

    if (isSyncRunning()) {
      return NextResponse.json({ error: "A sync is already running", current: getCurrentSync() }, { status: 409 });
    }

    // Run sync in background (don't await - return immediately)
    const syncPromise = runSync(type);
    
    // Wait just 500ms to get the initial log created
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      message: `${type} sync started`,
      sync: getCurrentSync(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
