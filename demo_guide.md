# Antigravity Campaign Counter-Strike — Interactive Demo Playbook

This masterclass playbook guides you through a flawless, narrative-driven demonstration of the Antigravity Autonomous Brand Counter-Strike platform. It is structured into 6 sequential scenes designed to capture judges' attention, prove causal relationships, and demonstrate enterprise value.

---

## Technical Setup (Pre-Demo Check)

1. **Verify Development Port**: 
   Ensure your Next.js application is running. By default, if Port `3000` is occupied, it runs on Port `3001`. Check your terminal logs or open:
   `http://localhost:3001` or `http://localhost:3000`

2. **Seeded Fresh State**:
   To present a clean dashboard, you can optionally reset/seed the local offline data:
   ```bash
   # Erases old history and seeds beautiful initial competitor news & brand insights
   npx tsx scripts/seed-demo-data.ts
   ```

---

## 🎬 The Presentation Playbook

### Scene 1: The Brand Positioning Guard (Establish Context)
> **Goal**: Show the judges that the AI is fully grounded in the brand's real identity, not just hallucinating generic templates.

* **Action**: Draw the presenter's attention to the **Right Sidebar** under **Zone C: Brand Context Shield**.
* **Talking Points**:
  - *"We are demonstrating this platform with **Gymshark** as our active tenant."*
  - *"Look at the positioning summary in the sidebar. This summary was retrieved directly from **Senso.ai's Brand Vector Database**. It knows our premium standards, high-quality seamless wear, and D2C core values."*
  - *"Below that, we see our **Strategic Watchlist** monitoring competitors (Lululemon, Nike, ASOS). You can click on any competitor to pull up their market shares and aggregated historic threats."*

---

### Scene 2: The Signal Stream (Incoming Threats)
> **Goal**: Demonstrate real-time data ingestion and automated threat classification.

* **Action**: Draw attention to the **Bottom Left** card: **Intelligence Stream**.
* **Talking Points**:
  - *"Our Sentinel agent sweeps the open web (simulated using cached Tavily search profiles) and channels raw articles into this **Intelligence Stream** via a live Server-Sent Events (SSE) connection."*
  - *"Notice the lateral colored ribbons on each card. Sentinel classifies severity on-the-fly: **High severity** (like Nike running a 40% flash sale) or **Medium severity** (Lululemon testing bio-nylon sustainable ranges)."*
  - *"Each threat lists its sources and timestamps. We have a robust, MD5 URL-hashing deduplication layer that ensures we never process the same article twice."*

---

### Scene 3: Orchestrating the Strike (The Pipeline Visualizer)
> **Goal**: Show off the multi-agent orchestration and explain the "brain" of the platform.

* **Action**: Direct the judges to the top **Command Console** and click the large button: **"Run Autonomous Campaign Strike"**.
* **Visual Moments of Delight**:
  - Watch the **Pipeline Execution Visualizer** light up as the nodes flow:
    1. **Sentinel Node** (Cyan glow) activates to process and filter the threat.
    2. **Strategist Node** (Purple glow) spins, querying Senso.ai's brand database and evaluating **Prometheux Vadalog reasoning axioms**.
    3. **Actor Node** (Emerald glow) executes, compiling a professional campaign brief and publishing it.
    4. **x402 Micropayment Node** triggers, capturing the transaction fee.
* **Talking Points**:
  - *"When I click 'Run Strike', we invoke our autonomous multi-agent sequence."*
  - *"As the visualizer shows, Sentinel filters the event, Strategist evaluates our brand strengths using formal Vadalog logic, Actor syncs the resulting brief to Notion, and our x402 payment rail records a micro-payment revenue of $0.49."*

---

### Scene 4: The Signature Reveal (The Copywriter Brief)
> **Goal**: Demonstrate the extreme visual quality of the output and prove grounding.

* **Action**: Once the pipeline completes, a spectacular card slides into view inside the **Command Console**: **"GENERATED CAMPAIGN BRIEF"**.
* **Talking Points**:
  - *"Immediately upon execution, the platform reveals the generated marketing campaign brief in our command console."*
  - *"Look at the copy block: It has generated structured copy tailored specifically for our brand voice, with bold UK-spelling ('overpriced', 'Everyday Seamless')."*
  - *"At the bottom, look at the logical provenance: It displays the exact Vadalog logic rule applied (e.g., *Rule 1: Direct Price Cut*) and the specific Senso brand facts used to ground this copywriting. This ensures 100% safety with zero-impersonation."*
  - *"I can click 'Copy' to immediately transfer this ad copy directly to my clipboard for deployment."*

---

### Scene 5: Causal Linkage & Historical Review
> **Goal**: Demonstrate the deep integration and interactive connection between elements.

* **Action**: Go to the **Published Counter-Strikes** ledger on the bottom right. Click on any historical card in the list.
* **Visual Moments of Delight**:
  - The card you click highlights with a **glowing emerald outline**, and the central **Command Console** instantly updates to show that specific campaign's full copy brief, strategic stance, and Notion link!
* **Talking Points**:
  - *"Not only can we view live strikes, but we can also interactively audit our entire campaign ledger. Clicking on any published strike in this list instantly pulls its creative copy, brand facts, and distribution channels back into our Command Center."*
  - *"This gives our marketing teams a seamless, unified cause-and-effect workspace."*

---

### Scene 6: Live Integration Audit (Notion Database & Immutable Citations)
> **Goal**: Prove that the actions are real and fully synchronized, ending on a high note.

* **Action**:
  1. Click the **"View Notion Page"** or **"View Sync'd Notion Canvas"** button on the active brief.
  2. Notice the simulated/live Notion workspace page opens showing structured database blocks.
  3. Direct attention to the **Bottom Right Sidebar**: **Provenance Ledger**.
* **Talking Points**:
  - *"When our Actor agent publishes, it doesn't just print text — it structures database block schemas directly inside our Notion workspaces."*
  - *"Furthermore, for absolute enterprise accountability, every single published campaign brief appends an immutable, audit-trail trace into our root `cited.md` file."*
  - *"Our Provenance Ledger reads and displays this `cited.md` file in real-time, providing click-through citations for legal, financial, and management audits."*
  - *"(Bonus) Look at our telemetry metrics bar at the top: It has aggregated the $0.49 fee into our running **Total Intelligence Revenue**, representing an fully self-sustaining, autonomous AI agency."*

---

## 💡 Quick Tips for Presenting to Judges
- **Slow down on the Visualizer**: Don't rush after clicking 'Run Strike'. Let the judges watch the node connections light up; it makes the underlying LangGraph framework feel real and tangible.
- **Focus on Grounding**: Highlight that the copy isn't "random ChatGPT prose" — emphasize that the *Rules Applied* and *Grounded Brand Facts* badges at the bottom prove the AI is operating within safe corporate boundaries.
- **Show the Clipboard Copy**: Actually click the "Copy" button and show a toast popup, proving a polished, micro-interaction-rich UX.
