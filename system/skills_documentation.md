# 📚 KRACKED_OS Skills Library

This document compiles all the custom skills available in your environment. These skills are designed to help you build, ship, and extend the KRACKED_OS ecosystem.

## 📋 Table of Contents
1.  [Onboarding](#1-onboarding)
2.  [Vibe Coding](#2-vibe-coding)
3.  [Builder Guide](#3-builder-guide)
4.  [Skill Creator](#4-skill-creator)

---

## 1. Onboarding
*File: `skills/onboarding/SKILL.md`*

# 🚀 Welcome to the Project!

We're excited to have you on board. This guide will help you get set up and start contributing quickly.

## 📌 KRACKED_OS: Our Mission
**KRACKED_OS** is a community-driven initiative to empower developers in Selangor and beyond to build impactful applications using AI.

### Core Values
-   **Community First**: We build for the people.
-   **Vibe High**: Coding should be fun and creative.
-   **Ship Fast**: We use AI to move from idea to product in record time.

## 🏮 Local Best Practices
-   **Learn the Map**: Don't just stay in your "Home." Explore other "Districts" (folders) to see how others build.
-   **Ping the Locals**: Ask questions in the group chat. We are a community of Builders.
-   **Vibe-Check Your Tools**: Ensure your Virtual Proxy (AI Agent) is always updated with the latest context.

## 🧠 The Vibe Mental Model
Understanding your environment is key. Think of it this way:
-   **The Computer** = Your **State**.
-   **The Hard Drive** = High-level **Districts**.
-   **Folders** = **Homes** that house all the "living" files and apps.
-   **AI Tools** = Your **Virtual Proxy**. They navigate the State, visit Districts, and work in Homes on your behalf.

> **Note on Installations**: When you install a tool (like `npm install`), you are essentially furnishing the "Home" with the appliances your Virtual Proxy needs to do its job.

## 🛠️ Tooling & Setup
Before you dive into the code, ensure you have the following tools installed and configured:

1.  **Cursor Editor**: Our primary IDE. Ensure you have the latest version.
2.  **Antigravity Agent**: Your AI pair programmer.
3.  **Supabase CLI**: For local database development (if applicable).
4.  **Node.js & npm**: Ensure you're on the LST version.

### Setup Steps:
1.  **Clone the Repo**: `git clone [repository-url]`
2.  **Install Dependencies**: `npm install`
3.  **Copy Env**: `cp .env.example .env` (Ask a team lead for the values).
4.  **Run Dev**: `npm run dev`

## 🎭 Culture & Communication
- **Vibe Coding**: We embrace "vibe coding" (see the `vibe-coding` skill).
- **Discord/Slack**: [Insert Link] is our primary communication channel.
- **Standups**: Everyday at [Time] in [Location/Link].

## 📂 Local Resources
We have a local reference project available:
`e:\WebAPP\KDA_OS`

This folder contains:
-   **system/SkillCreator.md**: Advanced guide for building skills.
-   **Source Code**: Example implementation of a KRACKED_OS app.
-   **Styling**: Reference for our design system.

## ✅ First PR Checklist
To make your first contribution smooth, follow this checklist:
- [ ] Read the `vibe-coding` skill.
- [ ] Set up the local environment.
- [ ] Pick a "Good First Issue" from the backlog.
- [ ] Create a feature branch: `feature/your-initials-description`.
- [ ] Ensure all tests pass: `npm test`.
- [ ] Ask for a review in the `#dev` channel.

---

## 2. Vibe Coding
*File: `skills/vibe-coding/SKILL.md`*

# ✨ Vibe Coding: The Philosophy

> **"No codes only vibes."**

"Vibe coding" is about shifting your primary role from a manual coder to a "Vibe Architect." You use natural language to guide AI models (like Antigravity) to build and refine applications at the speed of thought.

## 🌈 Core Principles

1.  **Fun & Creative**: Building should be joy, not a chore. There are no limits to your imagination. If you can dream it, we can vibe it.
2.  **Human-Like > AI-Slop**: Avoid generic, cookie-cutter "AI looks" (like standard glassmorphism every time). Inject your unique personality.
3.  **Speed > Perfection (Initially)**: Don't get bogged down in the syntax early on. Focus on the "vibe" and the flow. Let the AI handle the boilerplate.
4.  **Aesthetic-First Development**: Design is NOT an afterthought. We build premium, high-impact UIs from the start.
5.  **Prompt as Pair Programmer**: Treat the AI as a world-class senior engineer. Provide context, intent, and constraints, but let it propose implementations.
6.  **The 2-3 Tries Rule**: If a feature isn't working after 2-3 prompts, STOP. Rethink your approach or simplify the request. Don't brute-force it.

## 🎨 From Static to Premium
Don't settle for "it works." Make it **feel** alive.
-   **Static**: A button that clicks.
-   **AI Look**: A button with a gradient and shadow.
-   **Human Premium**: A button that scales on press, has a magnetic hover effect, and plays a subtle sound.

## 🚀 Prompting for the Vibe

### Bad Prompt:
> "Make a login page." (Too vague, result will be generic).

### Good "Vibe" Prompt:
> "Create a sleek, dark-mode login page with a glassmorphism effect. Use a deep indigo and midnight blue palette. The inputs should have subtle glow effects on focus. Make it feel premium and tech-forward. Ensure it's responsive."

## ✅ The Vibe Check
Before you finalize a feature, ask yourself:
- [ ] Does it look **premium**? (No default colors, good spacing, nice fonts).
- [ ] Is it **interactive**? (Hover states, smooth transitions, micro-animations).
- [ ] Is the code **clean enough**? (Readable structure, even if AI-generated).
- [ ] Did I **verify** it actually works? (Run `npm run dev` and check).

## 🏮 The Vibe Artisan's Rules
-   **Listen to the Proxy**: If your Virtual Proxy suggests a way to do things, consider it. They can see the whole "District" faster than you can.
-   **Imagination > Brute-Force**: If a prompt is failing, stop typing. Stare at your screen. Imagine the solution first, then tell your Proxy.
-   **Vibe Early, Vibe Often**: Don't wait until the Building is finished to check the style. Test your colors and layout every 2-3 components.

---

## 3. Builder Guide
*File: `skills/builder-guide/SKILL.md`*

# 🏗️ The Builder's Guide: From Zero to One

Welcome to the ultimate guide for building modern web applications with AI, tailored for the **KRACKED_OS** ecosystem. This document covers everything from setting up your environment to pitching your final product.

## 1. 🛠️ Preparation & Prerequisites

Before you start building, ensure your "digital workshop" is ready.

### 🧠 The Builder's Mindset
-   **Building an App** = Constructing a **Building**. You need a strong foundation (database), security (walls/locks), and utility (features) for people to live in.
-   **Visiting Apps** = Walking into someone else's building.
-   **GitHub** = Your **Warehouse**. Pushing/Pulling is updating your inventory.
-   **OpenClaw** = The **Consciousness** of your Virtual Proxy. Installing it gives your agent "self-awareness" to provide better feedback.

### Essential Tools
-   **Antigravity Agent**: Your primary AI partner.
-   **Cursor/VS Code**: The code editor.
-   **Node.js (LTS)**: JavaScript runtime.
-   **Git**: Version control.

### The Stack
We recommend the following stack for speed and scalability (aligned with KRACKED_OS):
-   **Framework**: Vite (React).
-   **Styling**: Tailwind CSS (Standard for KRACKED_OS).
-   **Database**: Supabase (PostgreSQL + Auth).
-   **Deployment**: Vercel.

---

## 2. 🧠 Prompting Mastery: The "2-3 Rule"

The biggest mistake new builders make is overwhelming the AI.

### 🚫 The Mistake
> "Build me a fully functional e-commerce site with a cart, stripe integration, and a admin dashboard, also make it blue."
> *(Result: The AI gets confused, hallucinates, or produces broken code.)*

### ✅ The "2-3 Rule"
Limit your prompts to **2-3 specific instructions** at a time.

### 🛑 The "Stop & Think" Protocol
A common trap is getting fixated on a broken feature and burning through tokens.
1.  **The Limit**: If a feature isn't working after **3 attempts**, STOP.
2.  **The Question**: Ask yourself, "Is this critical for the MVP? or am I just obsessing?"
3.  **The Pivot**: If it's not critical, **kill it** or simplify it.
4.  **Token Discipline**: Every failed prompt is wasted cost. Be strategic.

### 🌟 The "Master Prompt" (Initialization)
While the "2-3 Rule" is for iteration, your **first** prompt should be a "Master Prompt." This sets the foundation for your entire building.

**The Master Prompt Template:**
> "Initialize a [Stack: Vite/React/Tailwind] app called [Name].
> **Goal**: [Brief problem & solution].
> **Theme**: [Design Style], [Primary Colors], [Fonts].
> **Core Features**:
> 1. [Feature 1]
> 2. [Feature 2]
> 3. [Feature 3]
> **User Flow**: [How a user interacts from land to goal].
> **Security**: [RLS, Env variables, Input validation].
> **Structure**: [Follow standard /src structure]."

#### Example Workflow:
1.  **Prompt 1**: "Create a responsive navbar with a logo on the left and 'Home', 'About', 'Contact' links on the right."
2.  **Prompt 2**: "Style the navbar to have a glassmorphism effect with a blur background and sticky positioning."
3.  **Prompt 3**: "Add a mobile hamburger menu that slides in from the right when clicked."

### Building Your First Component
1.  **Identify**: What component do you need? (e.g., "Hero Section").
2.  **Describe**: What does it look like? (e.g., "Large title, subtitle, two CTA buttons").
3.  **Refine**: Add specific style constraints (e.g., "Use the KRACKED_OS Red (#CE1126) for the primary button").

---

## 3. 💡 Ideation & Strategy

Don't just build code; build a solution.

### Core Questions (The "Why")
-   **Problem**: What specific pain point are you solving?
-   **Solution**: How does your app solve it better/faster/cheaper?
-   **User**: Who is desperate for this solution?
-   **Pitch**: Can you explain it in one sentence? (*"Uber for Dog Walkers"*)

### Monetization Models
-   **Freemium**: Free core features, paid premium features.
-   **Subscription (SaaS)**: Monthly/Yearly recurring revenue.
-   **One-time Purchase**: Pay once for a digital asset.
-   **Ads/Sponsorship**: Traffic-based revenue.

---

## 4. 💻 Building the App

### Step 1: File Structure & Security
Keep your project organized.
```text
/src
  /components # Reusable UI components
  /pages      # App routes
  /lib        # Utility functions (supabase, helpers)
  /assets     # Static assets (images, icons)
```
**Security Hardening**:
-   Never commit `.env` files.
-   Use Row Level Security (RLS) in Supabase.
-   Validate all user inputs.

### Step 2: Design Identity
Don't just copy. Create.
-   **Find Your Style**: Are you Minimalist? Brutalist? Retro-Pop? Cyber-Y2K?
-   **Theme**:
    -   **Primary**: Selangor Red (`#CE1126`).
    -   **Background**: Deep Black (`#0a0a0a`).
    -   **Accent**: Pick a color that represents *you*.
-   **Font**: Inter or Plus Jakarta Sans.
-   **Vibe**: Bold, energetic, community-driven.

> **Pro Tip**: Don't default to glassmorphism unless it fits the vibe. Explode the box.

### Step 3: APIs & Data
-   **Fetching**: Use `fetch`, `axios`, or TanStack Query.
-   **Scraping**: If you need external data, use tools like Firecrawl or simple puppeteer scripts (respecting `robots.txt`).

---

## 5. 🚀 Deployment

### GitHub
1.  Initialize git: `git init`
2.  Commit changes: `git add . && git commit -m "Initial commit"`
3.  Push to a new repository.

### Vercel
1.  Import your GitHub repo into Vercel.
2.  Add your Environment Variables (from your `.env`).
3.  Click **Deploy**.

### Supabase
1.  Create a new project.
2.  Get your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
3.  Run the SQL editor to set up your tables.

---

## 🏘️ Town Planning: Best Practices

Ensuring your "Building" is sustainable requires good planning.

-   **Keep the Home Clean**: Regularly "sweep" your folders. Delete unused components and clean up your imports. A cluttered home confuses your Virtual Proxy.
-   **Document the District**: Add brief `// comments` to complex logic. Think of these as "Public Signage" to help other Proxies navigate your work.
-   **Build for Residents, not Tourists**: Focus on utility. Don't add features just for show; ensure your users can actually live and thrive in your app.
-   **Secure the Perimeter**: Your Building is only as strong as its walls. Check your Supabase RLS policies and validate every input.

---

## 6. 🔧 Troubleshooting

When things break (and they will):

1.  **Read the Error**: 90% of the solution is in the error message.
2.  **Paste & Go**: Copy the **exact error code/stack trace** and paste it into the agent. Don't summarize; give the raw data.
3.  **Visual Context**: If it's a UI issue, provide a **screenshot**. Your Virtual Proxy needs to "see" the district to fix it.
4.  **Explain the Vibe**: If the code is right but it feels wrong, **describe the problem**. "It feels laggy," or "The transition is too jarring."
5.  **Isolate**: Comment out code until it works again to find the culprit.
6.  **Check Logs**: Look at the terminal or browser console.

---

## 4. Skill Creator
*File: `skills/skill-creator/SKILL.md`*

# 🧬 Skill Creator: Building the Builder

Skills are modular, self-contained packages that extend Antigravity's capabilities. They transform a general-purpose agent into a specialized expert.

## 1. 📂 Anatomy of a Skill

A skill consists of a `SKILL.md` file and optional resources.

```text
skills/
└── my-skill/
    ├── SKILL.md          <-- The brain (Required)
    ├── scripts/          <-- Python/Bash scripts (Optional)
    ├── references/       <-- Markdown docs/schemas (Optional)
    └── assets/           <-- Templates/Images (Optional)
```

### The `SKILL.md` File
This is the entry point. It **must** start with YAML frontmatter:

```yaml
---
name: my-skill
description: A clear description of WHAT this skill does and WHEN to use it.
---
```

## 2. 🧠 Principles of Good Skills

1.  **Concise is Key**: The context window is precious. Keep instructions high-level.
2.  **Progressive Disclosure**:
    -   **Level 1**: Metadata (Always loaded).
    -   **Level 2**: `SKILL.md` Body (Loaded on trigger).
    -   **Level 3**: References/Scripts (Loaded ONLY when needed).
3.  **Determinisim**: Use scripts (`scripts/`) for fragile tasks (e.g., PDF manipulation) rather than asking the LLM to "figure it out."

## 3. ✍️ Creating a Skill (Step-by-Step)

### Step 1: Initialize
Use the generator script to create the boilerplate:
```bash
scripts/init_skill.py my-new-skill
```

### Step 2: Define the Logic
-   **If it's a workflow**: Write clear, numbered steps in `SKILL.md`.
-   **If it's knowledge**: Put large docs in `references/` (e.g., `references/api-docs.md`) and link to them.
-   **If it's a tool**: Write a Python script in `scripts/`.

### Step 3: Package & Distribute
Validate your skill structure:
```bash
scripts/package_skill.py skills/my-new-skill
```

## 4. 📚 Best Practices

-   **System Prompts**: You can add "System Prompt" style advice in the `SKILL.md`.
    -   *Example*: "When writing SQL, ALWAYS use Common Table Expressions (CTEs)."
-   **Examples**: Provide concrete examples of inputs and outputs.
-   **Avoid Fluff**: No `README.md` or `CHANGELOG.md` inside the skill folder. Only what the agent needs.

---

## 5. Moon Builder Proxy
*File: `Skills/moon-builder-proxy/SKILL.md`*

# Moon Builder Proxy

This skill is a more mature Moon-specific operator layer for KRACKED_OS.

It keeps the same foundational startup flow as IJAM:
- load `system/IJAM_UNIFIED.md`
- run a memory sweep through `memory/log.md`
- review relevant skills in `Skills/`
- inspect the real code path before acting

It then raises the operating standard:
- more founder-operator tone
- tighter execution discipline
- clearer issue, impact, action framing
- stronger bias toward the smallest verifiable next move

Use it when acting on Moon's behalf to:
- translate rough founder intent into execution
- debug React/Vite flows with repo-aware context
- guide KRACKED_OS product and build decisions
- package repeated workflows into reusable skills
