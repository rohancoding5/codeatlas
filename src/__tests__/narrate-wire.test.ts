import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { narrate } from "../narrate.js";
import type { DomainMap } from "../types.js";

function sampleMap(): DomainMap {
  return {
    domains: [
      { name: "auth", files: ["src/auth/session.ts"] },
      { name: "payments", files: ["src/payments/charge.ts"] },
      { name: "ui", files: ["src/ui/button.ts"] },
    ],
    edges: [
      { from: "ui", to: "auth", weight: 3 },
      { from: "ui", to: "payments", weight: 2 },
      { from: "payments", to: "auth", weight: 1 },
    ],
  };
}

function startFakeMessagesServer(payload: unknown): Promise<{ server: Server; url: string; requests: unknown[] }> {
  const requests: unknown[] = [];
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        requests.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "msg_1",
            type: "message",
            role: "assistant",
            model: "claude-opus-5",
            stop_reason: "end_turn",
            stop_sequence: null,
            content: [{ type: "text", text: JSON.stringify(payload) }],
            usage: { input_tokens: 40, output_tokens: 120 },
          }),
        );
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolvePromise({ server, url: `http://127.0.0.1:${port}`, requests });
    });
  });
}

function sampleNarrative() {
  return {
    summary: "auth sits at the center, both payments and ui depend on it",
    notableConcerns: ["auth has 2 incoming edges, changes there are high risk"],
  };
}

test("narrate sends the domain map and parses a real structured narrative back", async () => {
  const { server, url, requests } = await startFakeMessagesServer(sampleNarrative());
  try {
    const narrative = await narrate(sampleMap(), { apiKey: "test-key", baseURL: url });

    assert.match(narrative.summary, /auth sits at the center/);
    assert.equal(narrative.notableConcerns.length, 1);

    const sent = requests[0] as { model: string; messages: { content: string }[] };
    assert.equal(sent.model, "claude-opus-5");
    assert.match(sent.messages[0].content, /ui -> auth \(3 imports\)/);
    assert.match(sent.messages[0].content, /payments -> auth \(1 import\)/);
  } finally {
    server.close();
  }
});

test("narrate throws when claude's response doesn't match the schema", async () => {
  const { server, url } = await startFakeMessagesServer({ notEvenCloseToTheSchema: true });
  try {
    await assert.rejects(() => narrate(sampleMap(), { apiKey: "test-key", baseURL: url }), /summary|notableConcerns/);
  } finally {
    server.close();
  }
});

test("narrate notes when there are no cross-domain edges", async () => {
  const { server, url, requests } = await startFakeMessagesServer(sampleNarrative());
  try {
    await narrate({ domains: [{ name: "root", files: ["index.ts"] }], edges: [] }, { apiKey: "test-key", baseURL: url });
    const sent = requests[0] as { messages: { content: string }[] };
    assert.match(sent.messages[0].content, /no cross-domain import edges found/);
  } finally {
    server.close();
  }
});
