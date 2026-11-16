// 시연 HTML용 groq-sdk: 브라우저에서 Groq API를 직접 부른다(운영진 11/17 답변: 팀 서버를 거치지 않는 직접 호출은 허용)
export default class Groq {
  constructor(private opts: { apiKey?: string }) {}
  chat = {
    completions: {
      create: async (body: unknown) => {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${this.opts.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Groq ${res.status}`);
        return res.json();
      },
    },
  };
}
