# 🧠 Lexel - Real-Time AI Collaborative Workspace

[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://lexel-final.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

**Lexel** is a next-generation, real-time AI collaborative workspace built around an infinite canvas. Designed to supercharge brainstorming and dynamic content generation, Lexel seamlessly blends visual spatial thinking with advanced LLM orchestration. 

---

## 🌟 What This Application Provides

Lexel redefines how teams and creators brainstorm by merging free-form visual organization with intelligent AI context management:

*   **Infinite Canvas Collaboration:** Built using a powerful spatial interface (Tldraw integration), allowing users to map out ideas, notes, and visual elements seamlessly.
*   **Intelligent State Processing Pipeline:** Features a custom parsing engine that converts spatial canvas data, nodes, and relationships into semantic text structures digestible by LLMs.
*   **AI-Powered Brainstorming & Generation:** Integrated with the Gemini API to provide real-time context-aware answers, summaries, and content synthesis directly from your visual workspace.
*   **High-Performance UI:** Optimized for speed, fluidity, and accessibility across devices using modern web tooling.

---

## 🗺️ Page Functionality & Architecture

Here is an overview of the core views and modular components within the application:

### 1. Landing / Workspace Home (`/`)
*   **Functionality:** The entry point to the application where users can initiate a new session, view recent workspaces, or configure global settings.
*   **Key Features:** Quick-start templates, workspace history list, and authentication state management.

### 2. Infinite Canvas Workspace (`/workspace/[id]`)
*   **Functionality:** The core creative engine of Lexel. 
*   **Key Features:** 
    *   Full multi-tool drawing, shape creation, and sticky-note management.
    *   Spatial grouping and node interconnection.
    *   Real-time synchronization for collaborative team sessions.

### 3. AI Assistant Panel / Context Hub
*   **Functionality:** A side-drawer or modal interface interacting directly with the canvas state.
*   **Key Features:** Sends selected canvas elements or full spatial context to the Gemini API backend, returning structured insights, synthesized bullet points, or generated text snippets back onto the workspace.

---

## 💻 Tech Stack

*   **Frontend:** TypeScript, Next.js (React), Tailwind CSS, Tldraw (Canvas SDK)
*   **Backend & API:** Node.js, Next.js Serverless API Routes
*   **AI Integration:** Gemini API for LLM orchestration and context evaluation
*   **Deployment:** Vercel

---

## ⚙️ Local Development & Setup

### Prerequisites
*   Node.js (v18 or higher installed)
*   npm, yarn, or pnpm
*   A valid Gemini API Key (`GEMINI_API_KEY`)

### Installation Steps

1. **Clone the Repository:**
```bash
git clone [https://github.com/your-username/lexel.git](https://github.com/your-username/lexel.git)
cd lexel
