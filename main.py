#!/usr/bin/env python3
"""
CropDiary AI - Universal CLI Entry Point
HackerRank Orchestrate Pillar 1: Automated Agent Evaluator Entry Point
Accepts CLI arguments: --requests, --output, --data-dir
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, List

# Ensure agent package is resolvable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from agent.farm_agent import CropDiaryAgent


def run_pipeline(requests_path: str, output_path: str, data_dir: str):
    """
    Executes CropDiary AI Agent across batch inputs or single evaluation request.
    Produces strictly structured, schema-valid output.
    """
    print(f"[*] Initializing CropDiary AI Agent Orchestrator...")
    print(f"[*] Data Directory: {data_dir}")
    print(f"[*] Input Requests: {requests_path}")
    print(f"[*] Target Output:  {output_path}")

    agent = CropDiaryAgent(model_name=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))

    requests: List[Dict[str, Any]] = []

    # Handle input file (JSON array, JSON line, or fallback sample)
    if os.path.exists(requests_path):
        with open(requests_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content.startswith("["):
                requests = json.loads(content)
            elif content.startswith("{"):
                requests = [json.loads(content)]
            else:
                # Text lines as individual queries
                requests = [{"id": f"req-{i+1}", "query": line.strip()} for i, line in enumerate(content.splitlines()) if line.strip()]
    else:
        # Fallback sample evaluation requests
        requests = [
            {
                "id": "eval-001",
                "query": "Paddy leaves showing spindle lesions with grey centre. Rain expected tomorrow in Thanjavur.",
                "crop_name": "Paddy",
                "latitude": 10.787,
                "longitude": 79.1378
            },
            {
                "id": "eval-002",
                "query": "Calculate my profit per acre on Cotton for Kharif 2025.",
                "farm_id": "farm-thanjavur",
                "plot_id": "plot-1"
            },
            {
                "id": "eval-003",
                "query": "What subsidies can I get for a 3-acre farm in Tamil Nadu?",
                "state": "Tamil Nadu",
                "acres": 3.0
            }
        ]

    results = []
    for req in requests:
        query = req.get("query", "")
        req_id = req.get("id", "req-unknown")
        print(f"[*] Processing Request [{req_id}]: {query[:60]}...")
        output = agent.execute_turn(query=query, context=req)
        results.append({
            "request_id": req_id,
            "status": "SUCCESS",
            "agent_response": output
        })

    # Ensure parent output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Successfully executed {len(results)} requests. Output written to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="CropDiary AI Agentic Orchestrator")
    parser.add_argument("--requests", type=str, default="data/sample_requests.json", help="Path to input requests file")
    parser.add_argument("--output", type=str, default="evaluation/predictions.json", help="Path to output predictions")
    parser.add_argument("--data-dir", type=str, default="data", help="Path to reference datasets")

    args = parser.parse_args()
    run_pipeline(args.requests, args.output, args.data_dir)


if __name__ == "__main__":
    main()
