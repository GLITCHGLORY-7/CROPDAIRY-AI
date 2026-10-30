"""
CropDiary AI - Agricultural Reasoning & Orchestration Prompts
Compatibility shim: Re-exports canonical definitions from agent/prompts.py.
Preserves existing symbols (SYSTEM_FARM_ORCHESTRATOR, COT_FARM_REASONING_PROMPT)
while pointing directly to canonical agent.prompts.
"""

from agent.prompts import (
    SYSTEM_PROMPT,
    COT_REASONING_TEMPLATE,
    FEW_SHOT_EXAMPLES,
)

# Backwards-compatible aliases for legacy callers
SYSTEM_FARM_ORCHESTRATOR = SYSTEM_PROMPT
COT_FARM_REASONING_PROMPT = COT_REASONING_TEMPLATE

__all__ = [
    "SYSTEM_PROMPT",
    "COT_REASONING_TEMPLATE",
    "FEW_SHOT_EXAMPLES",
    "SYSTEM_FARM_ORCHESTRATOR",
    "COT_FARM_REASONING_PROMPT",
]
