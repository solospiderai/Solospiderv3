import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getQueues } from "@/server/queues";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { crawlQueue, promptScanQueue, scoringQueue } = getQueues();
    const [crawl, scan, score] = await Promise.all([
      crawlQueue.getJobCounts(),
      promptScanQueue.getJobCounts(),
      scoringQueue.getJobCounts(),
    ]);

    // Get failed jobs details
    const [crawlFailed, scanFailed, scoreFailed] = await Promise.all([
      crawlQueue.getFailed(0, 20),
      promptScanQueue.getFailed(0, 20),
      scoringQueue.getFailed(0, 20),
    ]);

    const formatFailedJobs = (jobs: any[]) =>
      jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        timestamp: j.timestamp,
        processedOn: j.processedOn,
        finishedOn: j.finishedOn,
      }));

    return NextResponse.json({
      queues: {
        crawl: { name: "Crawl", counts: crawl, failed: formatFailedJobs(crawlFailed) },
        scan: { name: "Prompt Scan", counts: scan, failed: formatFailedJobs(scanFailed) },
        score: { name: "Scoring", counts: score, failed: formatFailedJobs(scoreFailed) },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch queue stats" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { action, queue: queueName, jobId } = body;

    const { crawlQueue, promptScanQueue, scoringQueue } = getQueues();
    const queueMap: Record<string, any> = {
      crawl: crawlQueue,
      scan: promptScanQueue,
      score: scoringQueue,
    };

    const queue = queueMap[queueName];
    if (!queue) {
      return NextResponse.json({ error: "Invalid queue name" }, { status: 400 });
    }

    switch (action) {
      case "pause":
        await queue.pause();
        break;
      case "resume":
        await queue.resume();
        break;
      case "clean":
        await queue.clean(0, 1000, "completed");
        break;
      case "retry":
        if (jobId) {
          const job = await queue.getJob(jobId);
          if (job) await job.retry();
        }
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Queue operation failed" },
      { status: 500 }
    );
  }
}
