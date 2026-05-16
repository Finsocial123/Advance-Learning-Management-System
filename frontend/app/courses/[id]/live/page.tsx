"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Radio } from "lucide-react";

import LiveClassRoom from "@/components/live/LiveClassRoom";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/utils";
import {
  liveService,
  LiveSessionJoinResponse,
} from "@/services/live.service";

export default function StudentLivePage() {
  const params = useParams();
  const courseId = Number(params.id);

  const [session, setSession] = useState<LiveSessionJoinResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const load = async () => {
      try {
        const data = await liveService.getActiveCourseLive(courseId);

        if ("active" in data && data.active === false) {
          setSession(null);
        } else {
          setSession(data as LiveSessionJoinResponse);
        }
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          icon={Radio}
          title="No live class right now"
          description="When your teacher starts a live session, it will appear here."
        />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <div className="flex items-center gap-2 text-rose-400">
          <Radio size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">
            Live Class
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold text-white">{session.title}</h1>

        <p className="mt-1 text-sm text-slate-400">
          You are watching as a student.
        </p>
      </div>

      <LiveClassRoom
        token={session.token}
        serverUrl={session.livekit_url}
        canPublish={false}
      />
    </div>
  );
}
