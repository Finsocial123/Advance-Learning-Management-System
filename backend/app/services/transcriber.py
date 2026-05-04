import os
import math
import tempfile
import asyncio
import httpx
import ffmpeg
import imageio_ffmpeg as iio_ffmpeg
import base64
from dotenv import load_dotenv

load_dotenv()

MAX_FILE_SIZE = 23 * 1024 * 1024  # 23 MB

# Set ffmpeg binary for ffmpeg-python
os.environ["FFMPEG_BINARY"] = iio_ffmpeg.get_ffmpeg_exe()

def encode_audio_to_base64(audio_bytes):
    return base64.b64encode(audio_bytes).decode("utf-8")

def extract_audio(video_bytes: bytes) -> bytes:
    """Extract audio from video bytes, return MP3 bytes."""
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as video_file:
        video_file.write(video_bytes)
        video_path = video_file.name

    audio_path = video_path.replace(".mp4", ".mp3")
    try:
        (
            ffmpeg
            .input(video_path)
            .output(
                audio_path,
                format="mp3",
                acodec="libmp3lame",
                ar=16000,
                ac=1,
                audio_bitrate="32k"
            )
            .overwrite_output()
            .run(quiet=True, cmd=os.environ["FFMPEG_BINARY"])
        )
        with open(audio_path, "rb") as f:
            return f.read()
    finally:
        os.unlink(video_path)
        if os.path.exists(audio_path):
            os.unlink(audio_path)

def split_audio(audio_bytes: bytes, chunk_size: int = MAX_FILE_SIZE) -> list[bytes]:
    """Split audio bytes into chunks under the size limit."""
    if len(audio_bytes) <= chunk_size:
        return [audio_bytes]
    num_chunks = math.ceil(len(audio_bytes) / chunk_size)
    chunk_length = len(audio_bytes) // num_chunks
    chunks = []
    for i in range(num_chunks):
        start = i * chunk_length
        end = start + chunk_length if i < num_chunks - 1 else len(audio_bytes)
        chunks.append(audio_bytes[start:end])
    return chunks

async def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.mp3") -> str:
    base64_audio = base64.b64encode(audio_bytes).decode("utf-8")

    async with httpx.AsyncClient(timeout=120) as http:
        response = await http.post(
            "https://openrouter.ai/api/v1/audio/transcriptions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/whisper-large-v3-turbo",
                "input_audio": {
                    "data": base64_audio,
                    "format": "mp3"
                },
                "response_format": "text",
                "language": "en"
            }
        )

        # log the error body if it fails
        if response.status_code != 200:
            print(f"OpenRouter STT error: {response.status_code} - {response.text}")
            response.raise_for_status()

        result = response.json()

        # response_format="text" still returns JSON with a text field
        if isinstance(result, dict):
            return result.get("text", "")
        return result  # sometimes returns plain string
    

async def transcribe_video(video_bytes: bytes) -> str:
    """Full pipeline: extract audio, split if needed, transcribe."""
    # Run extraction in thread to avoid blocking event loop
    audio_bytes = await asyncio.to_thread(extract_audio, video_bytes)
    if len(audio_bytes) <= MAX_FILE_SIZE:
        return await transcribe_audio_bytes(audio_bytes)
    chunks = split_audio(audio_bytes)
    transcripts = []
    for chunk in chunks:
        transcript = await transcribe_audio_bytes(chunk)
        transcripts.append(transcript)
    return " ".join(transcripts)