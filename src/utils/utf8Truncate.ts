export function utf8Truncate(str: string, maxBytes = 200): string {
  const encoder = new TextEncoder();
  let bytes = encoder.encode(str);
  while (bytes.length > maxBytes) {
    str = str.slice(0, -1);
    bytes = encoder.encode(str);
  }
  return str;
}
