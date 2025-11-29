# Structura AI Writer

A powerful, bi-directional AI writing assistant that bridges the gap between structured outlining and long-form content generation. Built with React, TypeScript, and Google Gemini.

## 🚀 Features

### 1. Intelligent Outline Management
- **Visual Block Editor**: Create and organize your outline using a drag-and-drop interface.
- **Markdown Mode**: Switch to a text-based editor to write your outline using standard markdown headers (`#`, `##`, `###`).
- **AI Generation**: Generate a structured outline from a simple topic or refine an existing one.
- **Hierarchy Control**: Easily indent/outdent blocks to define structure levels.

### 2. Advanced Content Generation
- **Model Selection**: Choose your preferred AI model (e.g., `gemini-2.5-flash`) or input a custom model name.
- **Language Support**: Generate content in any language (English, Chinese, Spanish, etc.) with a global language selector.
- **Style & Tone**: Customize the writing voice (Formal, Casual, Persuasive, etc.) and provide custom instructions.
- **Selective Generation**: Generate content for the entire outline or specific selected blocks.

### 3. Review & Refinement
- **Inline Remarks View**: Toggle a side-by-side view to see AI suggestions and remarks directly next to your content.
- **Remarks Panel**: A dedicated side panel for deep interaction with the AI regarding specific blocks.
- **AI Suggestions**: Ask for improvements or alternative phrasings and get instant AI feedback.
- **Comments & Annotations**: Tag blocks with "Must", "Maybe", or "Creative" notes to guide the writing process.

## 🛠️ Technical Implementation

### Core Stack
- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4

### Key Libraries
- **AI Integration**: `@google/genai` (Google Gemini API)
- **Drag & Drop**: `@hello-pangea/dnd` (Accessible, list-based drag and drop)
- **Icons**: `lucide-react`
- **UUID**: `uuid` for unique block identification

### Architecture Highlights
- **State Management**: Centralized state in `App.tsx` manages the complex interactions between outline blocks, content, and UI modes.
- **Service Layer**: `geminiService.ts` abstracts all AI interactions, ensuring consistent error handling and configuration (model, language, system instructions).
- **Component Design**: Modular components (`BlockItem`, `RemarksPanel`) promote reusability and separation of concerns.

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/cbzheng/outline-writing-bigeneration.git
    cd outline-writing-bigeneration
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Configure API Key**
    - Open the app in your browser.
    - Click the **Key Icon** in the top right.
    - Enter your Google Gemini API Key.

## 📦 Deployment

This project is configured for automatic deployment to **GitHub Pages** using GitHub Actions.
- The workflow file is located at `.github/workflows/deploy.yml`.
- Pushing to the `main` branch triggers a build and deploy.
