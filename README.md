# Shareable Notes

<!-- Project Logo -->
<p align="center">
  <img src="public/notes-icon.svg" alt="Shareable Notes Logo" width="120" />
</p>

A modern, AI-powered note-taking application with advanced insights using Google Gemini API.

> **This is a robustmini project, built in just about a week, to showcase best practices in React, Redux (with persistent storage), and deep AI integration.**

---

## 🌐 Live Demo

Check out the live app here: [https://shareable-notes-three.vercel.app/](https://shareable-notes-three.vercel.app/)

## 🎥 Demo Video

Watch a walkthrough of the app here: [Loom Demo Video](https://www.loom.com/share/a1e1274a0a28441cb46bf50957b9742e?sid=63bff59b-25ed-4e40-95af-57833e5eda24)

---

## ✨ Features

- Create, edit, and organize notes with a rich text editor
- Pin important notes to the top of your list
- **Heavily AI-powered insights:**
  - Key term extraction
  - Grammar checking
  - Text summarization
  - Word cloud generation
  - Related notes discovery
- Dark/light theme support
- Responsive design for desktop and mobile
- Local storage with IndexedDB
- **Redux with persistent storage** for reliable state management
- Built with best practices for maintainability and scalability
- Fast performance with Vite and TailwindCSS

## 🚀 Demo

> ![Demo Screenshot](public/demo-screenshot.png)

---

## 🛠️ Technologies Used

- [React](https://react.dev/) with Redux and [redux-persist](https://github.com/rt2zz/redux-persist) for state management and persistence
- [Vite](https://vitejs.dev/) for fast development and building
- [Google Gemini API](https://ai.google.dev/) for AI text analysis
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for local storage
- [TailwindCSS](https://tailwindcss.com/) for styling

---

## ⚡ Getting Started

1. **Clone the repository**
   ```sh
   git clone https://github.com/your-username/shareable-notes.git
   cd shareable-notes
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Set up environment variables**
   - Create a `.env` file in the root directory:
     ```env
     VITE_GOOGLE_AI_API_KEY=your_gemini_api_key_here
     ```
4. **Start the development server**
   ```sh
   npm run dev
   ```
5. **Open your browser** and visit [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

- `VITE_GOOGLE_AI_API_KEY`: Your Google Gemini API key for accessing AI features

---

## 🤖 AI/NLP Features

This application uses Google Gemini API to provide the following natural language processing features:

- **Key Term Extraction:** Identifies important concepts, entities, and terms in your notes
- **Grammar Checking:** Highlights grammar and spelling issues with suggested corrections
- **Summarization:** Generates concise summaries of your notes
- **Word Cloud:** Creates a visual representation of the most important terms
- **Related Notes:** Finds semantically similar notes based on content

---

## 📄 Usage

- Create a new note using the "+" button
- Edit notes with the rich text editor
- Pin/unpin notes for quick access
- Use the AI Insights panel to analyze your notes
- Switch between dark and light themes

---

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [React](https://react.dev/)

---
