"use client";

import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";

interface LiveClassRoomProps {
  token: string;
  serverUrl: string;
  canPublish?: boolean;
}

export default function LiveClassRoom({
  token,
  serverUrl,
  canPublish = false,
}: LiveClassRoomProps) {
  return (
    <div className="h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-slate-800 bg-black shadow-2xl">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video={canPublish}
        audio={canPublish}
        className="h-full"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
