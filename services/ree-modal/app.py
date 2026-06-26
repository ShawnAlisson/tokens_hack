"""
Sentinel REE classifier — Modal GPU sidecar for Gensyn reproducible inference.

Deploy:
  cd services/ree-modal
  pip install modal
  modal deploy app.py

The endpoint URL is printed on deploy; set REE_SERVICE_URL in the Next.js .env.
"""

from __future__ import annotations

import glob
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

import modal

MODEL_NAME = os.environ.get("REE_MODEL_NAME", "Qwen/Qwen3-8B")
GPU_TYPE = os.environ.get("REE_GPU", "L4")  # L4: 24GB VRAM — fits 8B comfortably
TASKS_ROOT = "/gensyn/tasks"
MAX_NEW_TOKENS = int(os.environ.get("REE_MAX_NEW_TOKENS", "256"))
# Qwen3 thinking-phase short-circuit (REE docs) — keeps JSON classification snappy
QWEN3_SHORT_CIRCUIT_LENGTH = os.environ.get("REE_QWEN3_SHORT_CIRCUIT_LENGTH", "64")
QWEN3_SHORT_CIRCUIT_TOKEN = os.environ.get("REE_QWEN3_SHORT_CIRCUIT_TOKEN", "151668")

# The REE image sets ENTRYPOINT to gensyn-sdk, which breaks Modal's Python runtime
# (Modal invokes `python ...` and Docker turns that into `gensyn-sdk python ...`).
# Clear ENTRYPOINT so Modal can boot normally; we call gensyn-sdk via subprocess.
ree_image = (
    modal.Image.from_registry(
        "gensynai/ree:v0.4.0",
        add_python="3.11",
        setup_dockerfile_commands=["ENTRYPOINT []"],
    )
    .pip_install("fastapi[standard]")
    .entrypoint([])
)

app = modal.App("sentinel-ree-classify", image=ree_image)
cache_volume = modal.Volume.from_name("gensyn-ree-cache", create_if_missing=True)


def build_classification_prompt(title: str, snippet: str) -> str:
    return f"""You are an expert market intelligence classifier for retail brand analysts.
Analyze the following competitor news/event:
Title: "{title}"
Snippet: "{snippet}"

Perform the following classification task:
1. "severity": Rate the competitive threat level to an activewear brand as:
   - "high": Direct, aggressive price cuts, direct hostile promotions, or high-impact product releases.
   - "medium": Moderate changes, general brand expansions, standard campaigns.
   - "low": Minor news, small sponsorships, generic corporate announcements.
2. "category": Choose one of: "pricing", "product_launch", "influencer_partnership", "logistics_issue", "brand_campaign".
3. "summary": Create a concise, professional 2-sentence summary.

Return ONLY a raw JSON object with this schema:
{{
  "severity": "high" | "medium" | "low",
  "category": string,
  "summary": string
}}"""


def model_task_dir(model_name: str) -> Path:
    safe = model_name.replace("/", "--")
    return Path(TASKS_ROOT) / safe


def parse_classification_json(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object found in model output: {raw_text[:240]}")
    parsed = json.loads(text[start : end + 1])
    severity = parsed.get("severity", "medium")
    if severity not in ("high", "medium", "low"):
        severity = "medium"
    return {
        "severity": severity,
        "category": str(parsed.get("category", "brand_campaign")),
        "summary": str(parsed.get("summary", "")).strip() or "Competitor activity detected.",
    }


def find_latest_receipt(task_dir: Path) -> dict[str, Any] | None:
    pattern = str(task_dir / "metadata" / "receipt_*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        return None
    with open(files[-1], "r", encoding="utf-8") as f:
        return json.load(f)


def run_ree_inference(prompt: str) -> tuple[str, dict[str, Any] | None]:
    task_dir = model_task_dir(MODEL_NAME)
    task_dir.mkdir(parents=True, exist_ok=True)

    sdk_bin = shutil.which("gensyn-sdk")
    if not sdk_bin:
        raise RuntimeError("gensyn-sdk not found on PATH inside REE container")

    cmd = [
        sdk_bin,
        "run-all",
        "--tasks-root",
        TASKS_ROOT,
        "--model-name",
        MODEL_NAME,
        "--prompt-text",
        prompt,
        "--operation-set",
        "reproducible",
        "--max-new-tokens",
        str(MAX_NEW_TOKENS),
        "--no-do-sample",
        "--temperature",
        "0.0",
    ]

    # Qwen3 models spend tokens on an internal "thinking" phase; short-circuit for JSON tasks
    if "Qwen3" in MODEL_NAME:
        cmd.extend(
            [
                "--short-circuit-length",
                QWEN3_SHORT_CIRCUIT_LENGTH,
                "--short-circuit-token",
                QWEN3_SHORT_CIRCUIT_TOKEN,
            ]
        )

    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=840,
        check=False,
    )

    if proc.returncode != 0:
        raise RuntimeError(
            f"gensyn-sdk failed (exit {proc.returncode}): "
            f"{proc.stderr[-2000:] or proc.stdout[-2000:]}"
        )

    receipt = find_latest_receipt(task_dir)
    output_text = proc.stdout.strip()
    if not output_text and receipt:
        output_text = str(receipt.get("output", {}).get("text", ""))
    return output_text, receipt


@app.function(
    gpu=GPU_TYPE,
    timeout=1200,
    memory=32768,
    volumes={"/gensyn": cache_volume},
)
@modal.fastapi_endpoint(method="POST", docs=True)
def classify(payload: dict) -> dict:
    """Classify a competitor threat via Gensyn REE reproducible inference."""
    title = str(payload.get("title", "")).strip()
    snippet = str(payload.get("snippet", "")).strip()
    if not title or not snippet:
        return {"ok": False, "error": "title and snippet are required"}

    try:
        prompt = build_classification_prompt(title, snippet)
        raw_output, receipt = run_ree_inference(prompt)
        classification = parse_classification_json(raw_output)
        cache_volume.commit()

        return {
            "ok": True,
            "classification": classification,
            "model": MODEL_NAME,
            "raw_output": raw_output,
            "receipt": receipt,
            "source": "ree_live",
        }
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "error": str(exc)}


@app.function(volumes={"/gensyn": cache_volume})
@modal.fastapi_endpoint(method="GET")
def health() -> dict:
    """Lightweight health check (no GPU)."""
    return {"ok": True, "model": MODEL_NAME, "gpu": GPU_TYPE, "service": "sentinel-ree-classify"}
