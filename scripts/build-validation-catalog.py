from pathlib import Path
import json,hashlib,re,datetime,shutil
base=Path('.')
software_runs=[(p,json.loads(p.read_text())) for p in Path('docs/validation/runs').glob('*/run.json')]
latest_path,latest_run=max(software_runs,key=lambda pair:pair[1]['startedAt'])
latest_id=latest_run['id']
records=[
('EXP-001','Runtime isolation and streaming audio','executed','docs/research/runtime-probe-results.json','npm run probe:audio && npm run probe','Actual upstream WAV; Moonshine worker and synthetic CPU stress. One-run timing, not LLM contention or physical-microphone evidence.'),
('EXP-002','Agent SDK integration and unavailable-model recovery','executed-with-provider-blocker','docs/research/agent-preparation-validation.json','npm test','Initial 9-test snapshot uses mocked model streams; live endpoint failed because weights were not available. Later experiments resolved availability.'),
('EXP-003','Real local interview, storyteller and scene director','executed','docs/research/agent-live-validation.json',None,'Single scripted local-model trial; later audience-copy correction is a separate experiment.'),
('EXP-004','Audience-facing copy and private-note separation','executed','docs/research/agent-audience-copy-validation.json',None,'Local-model success with audience text. Current probe/source may differ from the exact historic run.'),
('EXP-005','Diagram/chart tool generation and source validation','executed','docs/research/visual-agent-validation.json','npm run probe:visuals','One successful local model run after tool-schema fixes; not a statistical factual-quality evaluation.'),
('EXP-006','Speech, approved-scene decisions and exact-cache replay','executed','docs/research/speech-loop-cache-validation.json','npm run probe:speech-loop','macOS say audio, actual STT/Qwen. Duplicate speech-loop-validation.json is the same run, not another replicate.'),
('EXP-007','File ingestion and preparation/canvas workflow','executed-with-browser-attestation','docs/research/workflow-redesign-validation.md','npm test','Actual fixture extraction plus documented browser checks. Historical source revision and full browser assertions were not archived.'),
('EXP-008','Projects, unsent drafts, saved-story isolation and persistence','executed-with-browser-attestation','docs/research/project-session-validation.json','npm test','Historic 27-test snapshot. Statements about no deletion are historical; later removal tests supersede them.'),
('EXP-009','Responsive geometry, floating controls and wheel containment','executed-with-browser-attestation','docs/projects_and_story_library.md',None,'Initial emulated-viewport checks missed native-window clipping; later null-viewport/native-window and real wheel checks corrected the method. Not all browser code is retained.'),
('EXP-010','Story upsert, duplicate consolidation and reversible removal','executed-with-browser-attestation','docs/projects_and_story_library.md','npm test','31-test milestone described in source report; current workspace tests recheck state invariants. Browser evidence remains local screenshots.'),
('EXP-011','Piper adaptive narration baseline','executed','docs/research/adaptive-baseline-validation.json',None,'Three actual audio replays; first prompt and preparation. Known topic bias; not directly comparable causally with follow-up preparation.'),
('EXP-012','Fresh browser preparation and adaptive narration follow-up','executed','docs/research/adaptive-followup-validation.json',None,'Historical standalone-browser trial with three real audio replays, one preparation and two renderers. Its launch path has been retired with the browser prototype; evidence is retained.'),
('EXP-013','Native OpenUI/JSON generation baseline','executed-negative-result','docs/research/renderer-format-baseline.json','npm run probe:renderers','Two requests per library; all four failed validation. Historic prompt/input hashes were not retained.'),
('EXP-014','Native OpenUI/JSON generation after prompt clarification','executed-negative-result','docs/research/renderer-format-validation.json','npm run probe:renderers','All four failed validation. This does not rank renderer quality; model/prompt/format were confounded.'),
('EXP-015','Independent primary/secondary System One screen','executed-design-limitation','docs/research/system-one-initial-validation.json',None,'12 synthetic development cases, repeats and changing adapters. Local Laya startup failures must not count as model accuracy failures. Alias system-one-validation.json is identical.'),
('EXP-016','Laya CPU and hosted open-weight Kev screen','executed','docs/research/system-one-open-validation.json','DECISION_PROVIDERS=laya,kev npm run probe:decisions','Initial question design; hosted Kev is not a local Kev performance test. Present probe uses revised questions.'),
('EXP-017','Per-topic System One inclusion screen','executed','docs/research/system-one-v2-validation.json','npm run probe:decisions','Development cases reused after policy changes; no untouched holdout. Five models, with malformed/no-decision Qwen responses counted in total attempts.'),
('EXP-018','Qwen required-tool retry screen','executed-negative-result','docs/research/system-one-qwen-required-validation.json','DECISION_PROVIDERS=qwen npm run probe:decisions','All 12 attempts recorded no decision. Detailed failed tool-call payloads are absent, so root cause remains unproven.'),
('EXP-019','Same-audio Jev/Laya/Microsoft live decision replay','executed','docs/research/system-one-live-validation.json',None,'Three sequential same-WAV replays; no runtime errors. Changes and holds are not semantic quality labels. No physical microphone.'),
('EXP-020','Audited software suite before controller comparison','executed','docs/validation/runs/RUN-20261017-documentation-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Historical pre-controller 43-test source snapshot, environment, command exit codes and raw logs. Later software audit supersedes current-suite status.'),
('EXP-021','Console-only connection and diagnostic checks','partial-evidence',None,None,'Jev/Kev connection checks and simplified Qwen tool/grammar diagnostics were observed during work but lack dedicated retained result files. Do not use their console-only numbers as benchmark results.'),
('EXP-022','Rules/FSM/behaviour-tree/hybrid offline replay comparison','executed-development-screen','docs/validation/runs/RUN-20261017-controller-comparison-v2/controller-benchmark.json','npm run benchmark:controllers -- <unique-run-id>','21 synthetic regression scenarios, 48 decisions per controller, plus 9 lexical retrieval cases. No model calls, independent holdout or production migration. Earlier v1 result retained separately in its run directory.'),
('EXP-023','Software audit after controller prototypes','executed','docs/validation/runs/RUN-20261017-controller-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current source hashes, tests and build logs; does not rerun historical browser, audio or hosted model experiments.'),
('PLAN-001','Independent labels and asynchronous controller/selector integration','planned',None,None,'Offline controllers and bounded model-assisted retrieval selection are measured in EXP-022/024/025. Independent human labels, missing-evidence policy and asynchronous FSM/selector/live integration remain unvalidated.'),
('EXP-024','EmbeddingGemma 2 retrieval and bounded Jev/Laya selection','executed-development-screen','docs/validation/runs/RUN-20261017-semantic-selection-v1/retrieval-selection.json','npm run benchmark:retrieval -- <unique-run-id>','18 prepared texts across 3 projects; 12 calibration queries and 24 synthetic evaluation queries. Oracle menus are label-informed diagnostics; not an independent holdout. No app migration.'),
('EXP-025','Unfiltered semantic shortlist follow-up','executed-development-follow-up','docs/validation/runs/RUN-20261017-semantic-selection-raw-v2/retrieval-selection.json','SHORTLIST_METHODS=semantic-raw npm run benchmark:retrieval -- <unique-run-id>','Same evaluation cases reused after identifying gate false negatives. No independent confirmation; prompts and dataset unchanged.'),
('EXP-026','Software audit after semantic retrieval','executed','docs/validation/runs/RUN-20261017-retrieval-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current tests/build/source hashes; no automatic replay of paid models or audio/browser trials.'),
('EXP-027','Cloudflare Clef family connectivity and primary metadata','executed-connectivity-only','docs/validation/runs/RUN-20261017-clef-connectivity/connectivity.json','npx tsx scripts/clef-connectivity-probe.ts <unique-run-id>','One retained request per variant; not independent quality cases. Public repository metadata does not identify exact hosted checkpoint weights.'),
('EXP-028','Cloudflare Clef and Clef-flash bounded selection','executed-development-screen','docs/validation/runs/RUN-20261017-clef-comparison-v1/retrieval-selection.json','SHORTLIST_PROVIDERS=clef,clef-flash SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- <unique-run-id>','Same frozen synthetic evaluation set and menu, no tuning; gated/raw arms reuse cases. Hosted OpenRouter timing, not local or direct Workers AI performance.'),
('EXP-029','Cloudflare Clef-omni with fresh Jev reference','executed-development-screen','docs/validation/runs/RUN-20261017-clef-omni-jev-reference/retrieval-selection.json','SHORTLIST_PROVIDERS=clef-omni,jev SHORTLIST_METHODS=semantic,semantic-raw npm run benchmark:retrieval -- <unique-run-id>','Sequential single-attempt arms; unchanged text corpus/menu. Does not evaluate audio, images, video, self-hosted weights or independent holdout.'),
('EXP-030','Software audit after Cloudflare adapter addition','executed','docs/validation/runs/RUN-20261017-clef-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current tests/build/source hashes. No paid model, browser or voice experiment rerun implied.'),
('EXP-031','Prediction-first hybrid component retrieval and speculative prefetch','executed-development-screen','docs/validation/runs/RUN-20261017-prediction-first-v1/prediction-first.json','npm run benchmark:prediction -- <unique-run-id>','18 scripted steps, 9 components per project; 49 hosted Clef-omni requests. All search arms use BM25 plus dense RRF. Current-context routing, prior-only forecasts and final decisions use different metrics. Virtual lead timing is not live scheduling evidence. Local Clef setup was cancelled before weight download at user request.'),
('EXP-032','Current software audit after prediction-first prototype','executed','docs/validation/runs/RUN-20261017-prediction-first-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current tests/build/source hashes; includes hybrid component facets, forecast scopes/epochs/TTL and malformed response guards. No implied repeat of paid, voice or browser experiments.'),
('EXP-033','Larger constructed library with identical final grounding','executed-development-screen','docs/validation/runs/RUN-20261017-large-library-v1/large-library.json','node --import tsx scripts/large-library-benchmark.ts <unique-run-id>','432 constructed assets, 16 development cases, three counterbalanced passes. Warm catalog refresh, query encoding, fallbacks and grounding included. No independent real-library holdout, content-changing refresh or visible-paint validation.'),
('EXP-034','Software audit after library search prototype','executed','docs/validation/runs/RUN-20261017-library-policy-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current source/tests/build only; does not repeat hosted model benchmark or establish live integration.'),
('EXP-035','Grounded cue bypass and minimum-change decisions','executed-development-screen','docs/validation/runs/RUN-20261017-cue-policy-v1/cue-policy.json','node --import tsx scripts/cue-policy-benchmark.ts <unique-run-id>','432 constructed assets, 23 authored cases, three repeated passes. Exact whole-utterance prepared cues, independent arm caches, changed-document refresh, grounding fallbacks and retain operations. No real-library holdout, renderer or live-default validation.'),
('EXP-036','Software audit after cue policy prototype','executed','docs/validation/runs/RUN-20261017-cue-policy-final-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current source/tests/build; does not rerun hosted models, speech or UI.'),
('EXP-037','Claim-level evidence and intent gate comparison','executed-development-screen','docs/validation/runs/RUN-20261017-evidence-gate-v1/evidence-gate.json','node --import tsx scripts/evidence-gate-benchmark.ts <unique-run-id>','432 constructed scope assets plus six source-backed EIA/USGS concept cards; 37 authored development cases, three passes. Changed-text refreshes, final guards and grounding fallbacks included. User selected the source starter; independent review, natural STT and real-media acceptance remain pending.'),
('EXP-038','Software audit after evidence contract implementation','executed','docs/validation/runs/RUN-20261017-evidence-contract-final-audit/run.json','node scripts/audit-validation.mjs <unique-run-id>','Current source/tests/build only; no automatic rerun of hosted model, speech, browser or independent review.'),
('PLAN-004','Independent review and natural speech on selected source-backed starter','planned','docs/research/source_backed_review.md',None,'User selected prepared EIA/USGS cards. Source-backed development cases are not independent holdout evidence; review status remains pending.'),
('EXP-039','Default evidence baseline live coordinator replay','executed-integration','docs/validation/runs/RUN-20261017-baseline-live-v3/live-baseline.json','node --import tsx scripts/baseline-live-probe.ts <unique-run-id>','Actual websocket, local EmbeddingGemma and hosted Clef-omni; supported selection, missing audit evidence and quoted intent. Scripted text only; no physical microphone, renderer paint or model-selection billing study.'),
('EXP-040','Baseline product UI, preparation fixes and Mermaid browser review','executed-with-browser-attestation','docs/research/baseline_rollout.md',None,'Actual local-model preparation and save/reload/library/preview; desktop/narrow geometry and wheel checks, four rendered Mermaid diagrams. Earlier failed preparation attempts preserved. No physical microphone or independent source review.'),
('EXP-041','Software audit after modular baseline rollout','executed',str(latest_path),'node scripts/audit-validation.mjs <unique-run-id>','Current tests/typecheck/build/source hashes. Superseded director tests retired; baseline/model-boundary/no-migration tests added. Does not repeat model, browser or audio trials.'),
('EXP-042','Shared replay runner hybrid wiring parity','executed-synthetic-parity','docs/validation/runs/RUN-20261019-replay-parity-v4/replay.json','npm run replay:baseline -- <unique-run-id>','438 fixture assets, 37 authored cases, three passes per arm. Synthetic embeddings and deterministic evidence-derived grounding; validates wiring and accounting, not independent model quality or latency gains.'),
('EXP-043','Frontend service extraction browser verification','executed-synthetic-browser','docs/validation/runs/RUN-20261019-frontend-browser/browser.json',None,'Historical standalone-browser check using a seeded synthetic story. 1440/900/600 geometry, draft reload, session switching, sidebar persistence, independent scroll, library and ready view. Launch script is retired; no physical microphone or live interview/model trial.'),
('EXP-044','Composition planner separation and guarded retention replay','executed-synthetic-replay','docs/validation/runs/RUN-20261019-composition-planners-v1/replay.json','npx tsx scripts/composition-replay.ts <unique-run-id>','Five authored scenarios, three passes per planner. Real layout/reveal assertions, scripted selection/missing outcome. No model calls, independent labels, new multi-component synthesis or latency winner claim.'),
('EXP-045','Component evidence and optional paired composition replay','executed-synthetic-replay','docs/validation/runs/RUN-20261019-component-coverage-v3/replay.json','npx tsx scripts/component-coverage-replay.ts <unique-run-id>','Eight authored scenarios, three passes per planner. Fixed selected component; tests coverage/compatibility/withdrawal invariants, not model, retrieval or natural-speech quality.'),
('EXP-046','Component coverage disclosure browser and persistence checks','executed-synthetic-browser','docs/validation/runs/RUN-20261019-component-coverage-browser/browser.json',None,'Historical standalone-browser check with seeded reviewed text/diagram story, coverage disclosure and 1440/900/600 geometry. Launch script is retired; earlier invalid UUID/connection-limit failures retained. No microphone or new model generation.'),
('EXP-047','Bounded richer synthesis replay','executed-synthetic-replay','docs/validation/runs/RUN-20261019-synthesis-v2/replay.json','npx tsx scripts/synthesis-replay.ts <unique-run-id>','15 authored scenarios, three passes per arm; actual composition counts/slot checks, fixed primary selections. No new model, speech or independent semantic benchmark.'),
('EXP-048','Four-component OpenUI and JSON-render browser checks','executed-synthetic-browser','docs/validation/runs/RUN-20261019-synthesis-browser/browser.json',None,'Historical standalone-browser renderer comparison: four components, two real chart SVGs and synthetic PNG, both renderer packages at 1440/900/600. Temporary harness and launch path are retired; no microphone or full product acceptance.'),
('EXP-049','Reviewed local preparation and actual Chrome spoken rich demo','executed-with-disclosed-intervention','docs/validation/runs/RUN-20261019-full-spoken-demo/demo.json',None,'Actual Qwen preparation, presenter reference/coverage correction, Piper audio to Moonshine to synthesis in Chrome. Tuned synthetic headings; failed preparation/recognition attempts retained. 4/2/4 and 2/4/2 observed, not untouched speech acceptance.'),
('EXP-050','Compiled snapshots, exact vector cache and preparation readiness','executed-local-embedding-parity','docs/validation/runs/RUN-20261019-compiled-cache-v5/replay.json','node --import tsx scripts/optimization-replay.ts <unique-run-id>','Real local EmbeddingGemma, 12 synthetic-story requests repeated three times per arm, two metadata refreshes per pass, deterministic selection stub. Exact outcomes compared with archived presenter. Includes startup and final checks; not independent quality, hosted cost, STT or paint acceptance.'),
('EXP-051','Small local decision input feasibility','executed-negative-development-probe','docs/validation/runs/RUN-20261019-local-decision-feasibility/local.json','node --import tsx scripts/local-decision-feasibility.ts <unique-run-id>','Pinned local Laya, six synthetic cases repeated twice. Full requests rejected on token budget; compact requests valid but 4/12 correct. Direct model probe without live guards, no quantization or hosted calls.'),
('EXP-052','Native compact local classifiers and host evidence overlay','executed-negative-development-screen','docs/validation/runs/RUN-20261019-compact-local-v1/replay.json','node --import tsx scripts/prepare-compact-local.ts <unique-run-id>','24 authored cases under three option orders; local Laya and native GLiNER English/multilingual. Direct quality and actual guard overlay reported separately. No candidate passed the frozen precision gate; no quantization or default change.'),
('EXP-053','Semantic label codec development follow-up','executed-negative-development-followup','docs/validation/runs/RUN-20261019-compact-local-semantic-v1/replay.json','runtime/compact_local_benchmark.py --codec semantic','Same frozen 24 cases after observed failures; only label IDs change. Two local GLiNER variants, no independent holdout, retrieval, STT or live UI acceptance.'),
('EXP-054','Local-only role assignment: host eligibility, hybrid ranking and classifier preference','executed-development-role-replay','docs/validation/runs/RUN-20261019-local-roles-v2/replay.json','node --import tsx scripts/local-role-replay.ts <unique-run-id>','438 authored/source-backed cards plus a declared alternate; 42 cases repeated three times per arm. Real local embeddings/native classifier, isolated caches and scheduled refresh/withdrawal. All arms 126/126; no hosted calls or independent natural-speech acceptance.'),
('EXP-055','Normal local profile coordinator integration','executed-local-text-integration','docs/validation/runs/RUN-20261019-local-roles-live/local.json','node --import tsx scripts/local-only-live-probe.ts output/<unique-name>','Actual coordinator and embedding runtime: omitted profile selects local hybrid, four-component synthesis, missing-evidence hold, zero provider attempts. Text protocol only; no audio, STT or browser paint claim.'),
('EXP-056','Bounded local preference runtime and feedback loop','executed-local-text-integration','docs/validation/runs/RUN-20261019-local-preference-loop-v1/local.json','node --import tsx scripts/local-preference-live-probe.ts output/<unique-name>','Real coordinator, embeddings and native worker readiness; 300 ms deadline triggered local fallback; four-component synthesis, missing evidence retention and project/story feedback; no audio or browser acceptance.'),
('EXP-057','Runtime preference repeated large-library replay','executed-local-model','docs/validation/runs/RUN-20261019-local-preference-runtime-v1/replay.json','node --import tsx scripts/local-role-replay.ts RUN-unique-id','42 authored cases, three passes, three arms, real local embeddings/native classifier. No new preference-quality holdout; same acceptable alternatives as EXP-054. Separate live warm probe overlapped near end; not isolated timing.'),
('EXP-058','Warm native preference coordinator loop','executed-local-text-integration','docs/validation/runs/RUN-20261019-local-preference-loop-v2/local.json','node --import tsx scripts/local-preference-live-probe.ts output/<unique-name>','One native choice, one deadline fallback, one retained turn; missing feedback and zero provider attempts. Same-machine replay contention; text protocol only.'),
('EXP-059','Distinct eligible-asset preference quality and small reranker','executed-development-quality-screen','docs/validation/runs/RUN-20261019-preference-quality-v1/replay.json','node --import tsx scripts/preference-quality-replay.ts RUN-unique-id','32 authored exact-preference cases, three passes, 458-entry library, real local embeddings and two native workers. Oracle intent isolates preference; actual interpreter rejects all 32. GLiNER misses budget; MiniLM is fast but no accuracy gain. Not independent speech acceptance.'),
('EXP-060','Piper to Moonshine to presenter commit preference acceptance','executed-negative-audio-integration','docs/validation/runs/RUN-20261019-preference-audio-v2/local.json','node --import tsx scripts/preference-audio-loop.ts RUN-unique-id','Three authored TTS utterances per arm; real paced PCM/STT/controller and no transcript injection. Explanatory utterance splits and is held; missing/retain behavior passes. No browser paint or physical microphone. Earlier v1 selected first completed segment; preserved with full event stream.'),
('EXP-061','Dynamic INT8 narrow preference diagnostic','executed-negative-precision-screen','docs/validation/runs/RUN-20261019-preference-int8-v1/replay.json','node --import tsx scripts/preference-precision-replay.ts RUN-unique-id','Same frozen 32 role cases, three rotated menus. INT8 Linear/qnnpack is slower, 89/96 unrestricted versus 96/96 FP32; all timed calls fall back. Rotated fallback menu is not hybrid-ranked, so its timed accuracy is not comparable to EXP-059. Checkpoint storage unchanged; peak includes conversion.'),
('EXP-062','Public snapshot local defaults and synthesis integration','executed-local-text-integration','docs/validation/runs/RUN-20261019-public-defaults-live/local.json','node --import tsx scripts/local-only-live-probe.ts output/unique-name','Restarted normal dev command without planner override; local hybrid plus default synthesis makes four supported components and holds missing evidence. No provider attempts; text protocol only, not audio or browser acceptance.'),
('EXP-063','Alpha release browser speech and lifecycle acceptance','executed-mixed-browser-audio','docs/validation/runs/RUN-20261019-release-live-v1/browser.json',None,'Real local interview and fourth-attempt story after brief refinement; Piper virtual microphone, Moonshine, embeddings, audience projection, reconnect and fresh-session recovery. Battery selection and missing evidence pass; panel STT split fails. No physical microphone or independent speech acceptance.'),
('EXP-064','Transcript assembly versus a separate story-signal index','executed-local-audio-ablation','docs/validation/runs/RUN-20261019-transcript-ablation-v2/local.json','node --import tsx scripts/speech-assembly-replay.ts RUN-unique-id','Four authored Piper recordings shared across per-final, temporal and signal-assisted arms. v1 overlap bug retained; v2 temporal and extra index both 4/4 versus per-final 3/4. Removed index has no incremental demonstrated benefit. Current command runs only the retained arms; historical three-arm source is frozen.'),
('EXP-065','Minimal transcript assembly after signal-index removal','executed-local-audio-development','docs/validation/runs/RUN-20261019-transcript-minimal-v3/local.json','node --import tsx scripts/speech-assembly-replay.ts RUN-unique-id','Same four recordings, one pass per case. Panel starts on battery view and must change canvas. Minimal assembly 4/4 versus per-final 3/4; unknown costs and retain preserved. Adds quiet-window latency; not independent microphone, semantic-quality or p95 acceptance.'),
('EXP-066','Native SwiftUI app shell, model settings and packaged coordinator','executed-local-software-and-package-check','docs/validation/runs/RUN-20261020-swiftui-native-v1/run.json','node scripts/audit-validation.mjs RUN-20261020-swiftui-native-v1','Native SwiftUI interface, credential-safe model settings, owner-only persistence, bundled TypeScript coordinator and official standalone Node runtime. Includes coordinator HTTP health/settings smoke and app compilation. No model inference, real microphone, speech-quality or interactive UI acceptance.'),
('EXP-067','SwiftUI package runtime imports and refreshed source evidence','executed-local-software-and-package-check','docs/validation/runs/RUN-20261020-swiftui-native-v2/run.json','node scripts/audit-validation.mjs RUN-20261020-swiftui-native-v2','Rechecks current documentation/source hashes and loads the bundled Transformers.js plus native ONNX runtime before the packaged coordinator HTTP smoke. No model weights, inference, real microphone or interactive native UI trial.'),
('PLAN-002','Media retrieval, dimensions and semantic answer cache comparison','planned','docs/embeddinggemma_use_cases.md',None,'Text-only embedding retrieval and exact query caching are measured in EXP-024/025. Multimodal encoders, smaller dimensions and semantic answer reuse remain unvalidated.'),
('PLAN-003','Alternative STT, Groq, orchestration and desktop comparisons','research-only','docs/baseline_technology_research.md',None,'Moonshine Medium/sherpa, Groq/other local sizes, alternative orchestration frameworks and Electron were not benchmarked as winners.'),
]
entries=[]
for id,title,status,path,command,notes in records:
 e={'id':id,'title':title,'status':status,'reproduceCurrentPath':command,'limitations':notes,'artifacts':[]}
 if path:
  p=Path(path);content=p.read_bytes();a={'path':path,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)}
  if p.suffix=='.json':
   d=json.loads(content);a['recordedAt']=d.get('recordedAt',d.get('date',d.get('startedAt')));a['scope']=d.get('scope');
   if isinstance(d.get('results'),list):
    rs=d['results'];a['attempts']=len(rs)
    if rs and 'valid' in rs[0]:a['valid']=sum(bool(r.get('valid')) for r in rs)
   if 'summary' in d:a['summary']=d['summary']
  e['artifacts'].append(a)
  if p.name=='run.json':
   for command_record in d.get('commands',[]):
    log=Path(command_record['log']);data=log.read_bytes();e['artifacts'].append({'path':str(log),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id in ['EXP-024','EXP-025','EXP-027','EXP-028','EXP-029','EXP-031','EXP-039']:
  folder=Path(path).parent
  for extra_name in ['retrieval.json','selection.jsonl','start-manifest.json','bootstrap-missing-pillow.log','bootstrap-missing-torchvision.log','source-manifest.json','model-metadata.json','paired-summary.json','steps.jsonl','model-requests.jsonl','local-setup-note.json','inputs.json']:
   extra=folder/extra_name
   if extra.exists():
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id in ['EXP-045','EXP-046']:
  folders=sorted(Path('docs/validation/runs').glob('RUN-20261019-component-coverage-v*')) if id=='EXP-045' else [Path(path).parent]
  for folder in folders:
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id in ['EXP-047','EXP-048']:
  folders=sorted(Path('docs/validation/runs').glob('RUN-20261019-synthesis-v*')) if id=='EXP-047' else [Path(path).parent]
  for folder in folders:
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-060':
  for folder in sorted(Path('docs/validation/runs').glob('RUN-20261019-preference-audio-v*')):
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-054':
  for folder in sorted(Path('docs/validation/runs').glob('RUN-20261019-local-roles-v*')):
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-064':
  for folder in sorted(Path('docs/validation/runs').glob('RUN-20261019-transcript-ablation-v*')):
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id in ['EXP-065','EXP-063','EXP-062','EXP-061','EXP-059','EXP-058','EXP-057','EXP-056','EXP-055','EXP-052','EXP-053']:
  for extra in sorted(Path(path).parent.glob('*')):
   if extra.is_file() and str(extra)!=path:
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-051':
  for extra in sorted(Path(path).parent.glob('*')):
   if extra.is_file() and str(extra)!=path:
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-050':
  for folder in sorted(Path('docs/validation/runs').glob('RUN-20261019-compiled-cache-v*')):
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-049':
  for extra in sorted(Path(path).parent.glob('*')):
   if extra.is_file() and str(extra)!=path:
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-044':
  for extra in sorted(Path(path).parent.glob('*')):
   if extra.is_file() and str(extra)!=path:
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-043':
  for extra in sorted(Path(path).parent.glob('*')):
   if extra.is_file() and str(extra)!=path:
    data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-042':
  for folder in sorted(Path('docs/validation/runs').glob('RUN-20261019-replay-parity-v*')):
   for extra in sorted(folder.glob('*')):
    if extra.is_file() and str(extra)!=path:
     data=extra.read_bytes();e['artifacts'].append({'path':str(extra),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 if id=='EXP-022':
  old=Path('docs/validation/runs/RUN-20261017-controller-comparison-v1/controller-benchmark.json');data=old.read_bytes();e['artifacts'].append({'path':str(old),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'scope':'Initial run before index fingerprint hardening and additional invariant tests; retained, not an independent dataset.'})
 if id=='EXP-039':
  for old in [Path('docs/validation/runs/RUN-20261017-baseline-live-v1/live-baseline.json'),Path('docs/validation/runs/RUN-20261017-baseline-live-v2/live-baseline.json')]:
   data=old.read_bytes();e['artifacts'].append({'path':str(old),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'scope':'Earlier live integration replay, retained separately from the latest source snapshot.'})
 if id=='EXP-040':
  for old in sorted(Path('docs/validation/runs/RUN-20261017-baseline-ui-v1').glob('*.log')):
   data=old.read_bytes();e['artifacts'].append({'path':str(old),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
 entries.append(e)
aliases=[]
for canonical,alias in [('docs/research/speech-loop-cache-validation.json','docs/research/speech-loop-validation.json'),('docs/research/system-one-initial-validation.json','docs/research/system-one-validation.json')]:
 same=Path(canonical).read_bytes()==Path(alias).read_bytes();aliases.append({'canonical':canonical,'alias':alias,'byteIdentical':same})
testcases=[]
for p in sorted(Path('tests').glob('*.test.*')):
 s=p.read_text()
 for i,m in enumerate(re.finditer(r'\btest\(\s*"([^"\n]+)"',s),1):
  testcases.append({'id':f"TEST-{p.stem.replace('.test','').upper()}-{i:02}",'name':m.group(1),'source':str(p),'line':s[:m.start()].count('\n')+1,'evidenceRun':latest_id})
# Selected synthetic screenshots are copied out of ignored output/ as durable local evidence.
evidence=[];dest=Path('docs/validation/evidence');dest.mkdir(exist_ok=True)
for name in ['prepare-scroll-locked.png','story-removal.png','adaptive-chart-fixed.png','adaptive-followup-generation-first.png','jev-live-complete.png','laya-live-complete.png','microsoft-decision-live-complete.png']:
 p=Path('output/playwright')/name
 target=dest/name
 if not target.exists() and p.exists():shutil.copyfile(p,target)
 if target.exists():
  evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Synthetic fixture/demo screenshot; not a timed decision trace or independent semantic judgement.'})
for p in sorted(Path('output/baseline-review').glob('*.png')):
 target=dest/('baseline-'+p.name)
 if not target.exists():shutil.copyfile(p,target)
 evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Observed synthetic demonstration in the current baseline UI; not a semantic quality or latency measurement.'})
for p in sorted(Path('output/playwright/frontend-modularity').glob('*.png')):
 target=dest/('frontend-modularity-'+p.name)
 shutil.copyfile(p,target)
 evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Synthetic frontend extraction fixture; layout and persistence evidence only.'})
for p in sorted(Path('output/playwright/component-coverage-v5').glob('*.png')):
 target=dest/('component-coverage-'+p.name)
 shutil.copyfile(p,target)
 evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Synthetic component contract review and layout; not real model or microphone evidence.'})
for p in sorted(Path('docs/validation/runs/RUN-20261019-synthesis-browser').glob('*.png')):
 target=dest/('synthesis-'+p.name)
 shutil.copyfile(p,target)
 evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Actual renderer geometry on authored synthetic synthesis fixture; not live model/STT evidence.'})
for p in sorted(Path('docs/validation/runs/RUN-20261019-full-spoken-demo').glob('*.png')):
 target=dest/('full-spoken-demo-'+p.name)
 shutil.copyfile(p,target)
 evidence.append({'path':str(target),'originalPath':str(p),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'scope':'Actual Chrome audio replay after disclosed presenter edits on synthetic story.'})
catalog={'schemaVersion':1,'latestSoftwareRun':str(latest_path),'assembledAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Retrospective evidence register. Paths and hashes identify available artifacts, not missing historic source snapshots. Not a certification or production-readiness claim.','experiments':entries,'aliases':aliases,'testCases':testcases,'selectedScreenshots':evidence}
Path('docs/validation/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
print('Registered',len(entries),'experiments/plans,',len(testcases),'tests,',len(evidence),'screenshots; aliases:',aliases)

summary=latest_run['commands'][0]['counts']
s='# Test and experiment register\n\nCurrent source test mapping: '+latest_id+'. Historical experiments retain their own versions and counts. See [evidence rules](README.md).\n\n## Experiments and plans\n\n'
for e in entries:
 s+=f"### {e['id']} — {e['title']}\n\nStatus: **{e['status']}**.\n\n"
 for a in e['artifacts']:s+=f"Evidence: [{Path(a['path']).name}](../../{a['path']}). Hash retained in catalog.\n\n"
 s+=e['limitations']+'\n\n'
 if e['reproduceCurrentPath']:s+='Current reproduction entry point: `'+e['reproduceCurrentPath']+'`. Inspect prerequisites/output paths before running; model probes may incur costs.\n\n'
s+=f"## Current individual software cases\n\n{summary['pass']}/{summary['tests']} passed in {latest_id}, {summary['fail']} failed, {summary['skipped']} skipped.\n\n| ID | Case | Source |\n|---|---|---|\n"
for t in testcases:s+=f"| {t['id']} | {t['name'].replace('|','/')} | [{t['source']}:{t['line']}](../../{t['source']}#L{t['line']}) |\n"
Path('docs/validation/test-register.md').write_text(s)
