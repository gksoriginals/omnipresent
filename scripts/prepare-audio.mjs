import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const url =
  "https://raw.githubusercontent.com/moonshine-ai/moonshine/main/test-assets/two_cities_16k.wav";
const response = await fetch(url);
if (!response.ok) throw Error(`Fixture download failed: ${response.status}`);
const data = Buffer.from(await response.arrayBuffer());
if (
  createHash("sha256").update(data).digest("hex") !==
  "14a5a09479cab470db7de4fd16c0e18a8a88c03cc6d92a09a658e857ee1f73a5"
)
  throw Error(
    "Upstream audio fixture changed; review before updating its checksum",
  );
await mkdir("output/probe", { recursive: true });
await writeFile("output/probe/two_cities_16k.wav", data);
console.log("Saved upstream Moonshine test audio for explicit replay.");
