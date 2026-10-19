import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const catalog = JSON.parse(readFileSync('docs/validation/catalog.json', 'utf8'));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const ids = new Set();
const represented = new Set();
for (const experiment of catalog.experiments) {
  check(!ids.has(experiment.id), `Duplicate ID: ${experiment.id}`);
  ids.add(experiment.id);
  for (const artifact of experiment.artifacts) {
    represented.add(artifact.path);
    check(existsSync(artifact.path), `Missing: ${artifact.path}`);
    if (existsSync(artifact.path)) {
      check(hash(artifact.path) === artifact.sha256, `Changed evidence: ${artifact.path}`);
      if (artifact.path.endsWith('/retrieval-selection.json') || artifact.path.endsWith('/source-manifest.json') || artifact.path.endsWith('/prediction-first.json') || artifact.path.endsWith('/live-baseline.json') || artifact.path.endsWith('/replay.json') || artifact.path.endsWith('/browser.json') || artifact.path.endsWith('/demo.json') || artifact.path.endsWith('/local.json')) {
        const report = JSON.parse(readFileSync(artifact.path, 'utf8'));
        const folder = artifact.path.slice(0, artifact.path.lastIndexOf('/'));
        if (artifact.path.endsWith('/replay.json')) {
          check(hash(`${folder}/inputs.json`) === report.inputHash, `Changed replay inputs: ${folder}`);
        }
        // Early live attestations predate source snapshots; do not reconstruct them.
        for (const source of report.sourceFiles ?? []) {
          const snapshot = `${folder}/source-snapshot/${source.path}`;
          check(existsSync(snapshot), `Missing source snapshot: ${snapshot}`);
          if (existsSync(snapshot)) check(hash(snapshot) === source.sha256, `Changed source snapshot: ${snapshot}`);
        }
      }
    }
  }
}
for (const alias of catalog.aliases) {
  represented.add(alias.alias);
  check(alias.byteIdentical && hash(alias.canonical) === hash(alias.alias), `Alias differs: ${alias.alias}`);
}
for (const name of readdirSync('docs/research').filter(name => name.endsWith('.json'))) {
  check(represented.has(`docs/research/${name}`), `Unregistered result: ${name}`);
}
for (const artifact of catalog.selectedScreenshots) check(hash(artifact.path) === artifact.sha256, `Changed screenshot: ${artifact.path}`);
for (const test of catalog.testCases) {
  check(!ids.has(test.id), `Duplicate test ID: ${test.id}`);
  ids.add(test.id);
  const line = readFileSync(test.source, 'utf8').split('\n')[test.line - 1];
  check(line?.includes(JSON.stringify(test.name)), `Stale test mapping: ${test.id}`);
}
const run = JSON.parse(readFileSync(catalog.latestSoftwareRun, 'utf8'));
for (const source of run.sourceFiles) {
  check(existsSync(source.path), `Missing audited source: ${source.path}`);
  if (existsSync(source.path)) check(hash(source.path) === source.sha256, `Source differs from current audit: ${source.path}`);
}
for (const command of run.commands) {
  check(command.exitCode === 0, `Failed audit command: ${command.command}`);
  check(existsSync(command.log), `Missing log: ${command.log}`);
}
const counts = run.commands.find(command => command.counts)?.counts;
check(counts?.tests === catalog.testCases.length && counts.pass === counts.tests && counts.fail === 0 && counts.skipped === 0, 'Audit/test register count mismatch');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Validation evidence verified: ${catalog.experiments.length} experiment/plan records, ${catalog.testCases.length} tests, ${catalog.selectedScreenshots.length} screenshots; all historical JSON reports registered.`);
