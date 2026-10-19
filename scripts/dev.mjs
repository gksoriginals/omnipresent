import {existsSync} from "node:fs";
import { spawn } from "node:child_process";
const children = [];
try{const health=await fetch("http://127.0.0.1:4332/health",{signal:AbortSignal.timeout(1000)});if(!health.ok)throw Error("not ready");}
catch{
 const python=process.env.OMNIPRESENT_RETRIEVAL_PYTHON??"output/retrieval-venv/bin/python";
 if(existsSync(python))children.push(spawn(python,["runtime/retrieval_server.py"],{stdio:"inherit"}));
 else console.warn("Embedding runtime is not installed. Run npm run retrieval:setup before presenting.");
}
children.push(
  spawn(
    process.execPath,
    ["--env-file-if-exists=.env", "--import", "tsx", "server/index.ts"],
    {
      stdio: "inherit",
    },
  ),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    { stdio: "inherit" },
  ),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = code;
}
for (const child of children) child.on("exit", (code) => stop(code ?? 1));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
