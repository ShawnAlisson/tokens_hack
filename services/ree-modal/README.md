# Sentinel REE — Modal GPU Sidecar

Runs [Gensyn REE](https://www.gensyn.ai/ree) reproducible inference on Modal T4 GPUs for Sentinel threat classification.

## Prerequisites

- [Modal](https://modal.com) account with credits
- Python 3.10+

## Model & GPU defaults

| Setting | Default | Why |
|---------|---------|-----|
| `REE_MODEL_NAME` | `Qwen/Qwen3-8B` | Strong JSON classification; fits single GPU |
| `REE_GPU` | `L4` | 24GB VRAM on Modal (~$0.80/hr) |

With **$200 Modal credits**, baking 4 demo receipts + rehearsals typically costs **under $5**. First run downloads ~8B weights (~10–15 min).

Other REE-supported options (set before `modal deploy`):

- `Qwen/Qwen3-4B` + `T4` — faster/cheaper, still much better than 0.6B
- `Qwen/Qwen2.5-7B-Instruct` + `L4` — strong instruct tuning
- `Qwen/Qwen3-8B` + `A10` — faster if L4 is slow (~$1.10/hr)

## Setup

```bash
pip install -r requirements.txt
modal setup
```

Add to your shell or project root `.env` (for deploy only — **do not commit**):

```bash
MODAL_TOKEN_ID=ak-xxxxxxxxxxxxxxxx
MODAL_TOKEN_SECRET=as-xxxxxxxxxxxxxxxx
```

Create tokens: `modal token new`

## Deploy

```bash
cd services/ree-modal
modal deploy app.py
```

Copy the printed URL into the Next.js `.env`:

```bash
REE_SERVICE_URL=https://your-workspace--sentinel-ree-classify.modal.run
```

## Bake demo receipts

After deploy, warm the cache for demo threats:

```bash
# from repo root
npx tsx scripts/bake-ree-receipts.ts
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/` | Classify `{ "title": "...", "snippet": "..." }` |
| `GET` | `/health` | Health check (no GPU) |

## Cost tips

- First run per model downloads weights (~5–10 min) — run `bake-ree-receipts.ts` once.
- Modal bills per second; T4 is ~$0.59/hr list rate.
- Set `REE_USE_CACHE=true` in Next.js for instant demo fallback.
