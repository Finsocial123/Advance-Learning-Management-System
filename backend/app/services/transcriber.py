# import os
# import httpx

# async def transcribe_video(video_url: str) -> str:
#     """
#     Download video from R2 and send to Groq Whisper for transcription.
#     Returns transcript as plain text.
#     """

#  # Download video bytes from R2
#     async with httpx.AsyncClient() as http:
#         response = await http.get(video_url)
#         video_bytes = response.content

#     #Send to Whisper
#     async with httpx.AsyncClient() as http:
#         response = await http.post(
#             "https://api.groq.com/openai/v1/audio/transcriptions",
#             headers={"Authorization": f"Bearer {os.environ.get('GROQ_API_KEY')}"},
#             files={"file": ("video.mp4", video_bytes, "video/mp4")},
#             data={"model": "whisper-large-v3"}
#         )
#         result = response.json()

#     return result.get("text", "")


import os
import tempfile
import subprocess
import httpx
from faster_whisper import WhisperModel

# Load once at startup
model = WhisperModel("base", device="cpu", compute_type="int8")


def extract_audio(video_path: str) -> str:
    audio_path = video_path.rsplit(".", 1)[0] + "_audio.mp3"
    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-ac", "1", "-ar", "16000", "-vn", "-b:a", "32k",
        audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    return audio_path


async def transcribe_video(video_url: str) -> str:
    """
    Download video from Cloudinary, extract audio with ffmpeg,
    transcribe with faster-whisper. Returns plain text transcript.
    """

    # Download video from Cloudinary
    async with httpx.AsyncClient(timeout=120) as http:
        response = await http.get(video_url)
        video_bytes = response.content

    # Save video to temp file
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(video_bytes)
        video_path = tmp.name

    audio_path = None

    try:
        # Extract audio with ffmpeg
        audio_path = extract_audio(video_path)

        # Transcribe
        segments, info = model.transcribe(audio_path, beam_size=5)

        text = " ".join(seg.text for seg in segments)

        return text.strip()

    finally:
        # Always clean up temp files
        if os.path.exists(video_path):
            os.remove(video_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)