import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
if(!existsSync("output/decision-venv/bin/python"))execFileSync("uv",["venv","--python","3.12","output/decision-venv"],{stdio:"inherit"});
execFileSync("uv",["pip","sync","--python","output/decision-venv/bin/python","runtime/decision-requirements.lock"],{stdio:"inherit"});
console.log("Start the optional local runner with npm run decision:serve. First use downloads Laya weights.");
