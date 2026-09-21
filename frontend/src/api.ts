import type { SolveInput, SolveResponse } from "./types";

async function parseOrThrow(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`服务器返回 ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchSample(): Promise<SolveInput> {
  const res = await fetch("/api/sample");
  return parseOrThrow(res);
}

export async function solveRecipe(body: SolveInput): Promise<SolveResponse> {
  const res = await fetch("/api/solve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseOrThrow(res);
}
