export function fetchOpenAIEvents(id: string, apiKey: string) {
  const url = `https://api.openai.com/v1/responses/${id}/events`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
    },
    // Deno (and modern fetch) will automatically follow redirects
    // and preserve headers.
  });
}
