export async function waitForCompletion(
  base: string,
  id: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  maxAttempts = 30,
  delayMs = 1000,
) : Promise<string> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "responses=auto",
  };

  let data: any;
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await fetchImpl(`${base}/v1/responses/${id}`, { headers });
    if (!resp.ok) {
      const err: any = new Error("Upstream OpenAI error");
      err.status = resp.status;
      throw err;
    }
    data = await resp.json();
    if (data.status === "completed") break;
    if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }

  if (!data || data.status !== "completed") {
    throw new Error("Timed out waiting for OpenAI response");
  }

  const content = Array.isArray(data.output)
    ? data.output
        .flatMap((item: any) =>
          Array.isArray(item.content)
            ? item.content
                .filter((c: any) => c.type === "output_text")
                .map((c: any) => c.text)
            : [],
        )
        .join("")
    : data.output_text;

  return content;
}
