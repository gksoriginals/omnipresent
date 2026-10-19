"""Download only the pinned experimental reranker files into the existing HF cache."""
import json
from pathlib import Path
from huggingface_hub import snapshot_download
spec=json.loads(Path('runtime/preference-reranker-model.json').read_text())
print(snapshot_download(spec['model'],revision=spec['revision'],allow_patterns=['config.json','model.safetensors','tokenizer.json','tokenizer_config.json','special_tokens_map.json','vocab.txt']))
