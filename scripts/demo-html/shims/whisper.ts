// 시연 HTML용 받아쓰기: Groq Whisper를 브라우저에서 직접 부른다 (서버 /transcribe와 같은 모델·언어)
export async function whisper(file: Blob, name = "audio.webm"): Promise<string> {
  const form = new FormData();
  form.append("file", file, name);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "ko");
  form.append("response_format", "json");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form });
  if (!res.ok) throw new Error(`Whisper ${res.status}`);
  return ((await res.json()).text ?? "").trim();
}
