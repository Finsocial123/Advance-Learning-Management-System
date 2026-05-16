"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Radio, XCircle } from "lucide-react";

import LiveClassRoom from "@/components/live/LiveClassRoom";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { getErrorMessage } from "@/lib/utils";
import {
  liveService,
  LiveSessionJoinResponse,
} from "@/services/live.service";

export default function TeacherLivePage() {
  const { checked } = useRoleGuard(["teacher", "admin"]);
  const params = useParams();
  const router = useRouter();

  const courseId = Number(params.id);

  const [session, setSession] = useState<LiveSessionJoinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!checked || !courseId) return;

    const start = async () => {
      try {
        const data = await liveService.startCourseLive(courseId);
        setSession(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    start();
  }, [checked, courseId]);

  const handleEnd = async () => {
    if (!session) return;

    setEnding(true);

    try {
      await liveService.endLiveSession(session.session_id);
      toast.success("Live class ended");
      router.push("/teacher/courses");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnding(false);
    }
  };

  if (!checked || loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-shell px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-slate-400">Could not start live class.</p>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-rose-400">
            <Radio size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Live Now
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-white">
            {session.title}
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Students can join this class from the course page.
          </p>
        </div>

        <Button variant="danger" loading={ending} onClick={handleEnd}>
          <XCircle size={16} />
          End Live
        </Button>
      </div>

      <LiveClassRoom
        token={session.token}
        serverUrl={session.livekit_url}
        canPublish
      />
    </div>
  );
}
