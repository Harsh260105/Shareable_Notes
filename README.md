# Shareable Notes

<!-- Project Logo -->
<p align="left">
  <img src="public/notes-icon.svg" alt="Shareable Notes Logo" width="120" />
</p>

A modern, AI-powered note-taking application with advanced insights using Google Gemini API.

> **This is a robust mini project, built in just about a week, to showcase best practices in React, Redux (with persistent storage), and deep AI integration.**
>
> ## 💪 Technical Achievement
>
> **The rich text editor is built ENTIRELY FROM SCRATCH—no Quill, no TinyMCE, no Draft.js, no ready-made editors whatsoever. Just pure JavaScript logic and DOM manipulation. While this may not look like much at first glance, building a fully functional rich text editor from the ground up represents significant technical effort and deep understanding of web fundamentals.**

---

## 🌐 Live Demo

Check out the live app here: [https://shareable-notes-three.vercel.app/](https://shareable-notes-three.vercel.app/)

## 🎥 Demo Video

Watch a walkthrough of the app here: [Loom Demo Video](https://www.loom.com/share/a1e1274a0a28441cb46bf50957b9742e?sid=63bff59b-25ed-4e40-95af-57833e5eda24)

---

## ✨ Features

- **CUSTOM-BUILT RICH TEXT EDITOR FROM SCRATCH** - Unlike most note apps that use libraries like Quill or Draft.js, this editor is built entirely with vanilla JavaScript and custom DOM manipulation
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

> ![Demo](https://www.loom.com/share/a1e1274a0a28441cb46bf50957b9742e?sid=6accea9f-5e45-49b3-891f-55e5dd50e2eb)

---

## 🛠️ Technologies Used

- [React](https://react.dev/) with Redux and [redux-persist](https://github.com/rt2zz/redux-persist) for state management and persistence
- **100% CUSTOM JavaScript implementation for the rich text editor** - No Quill, no Draft.js, no TinyMCE, or any other text editor library was used. This demonstrates deep understanding of DOM manipulation and browser APIs
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

## 🔧 Technical Details

### Custom Rich Text Editor

The centerpiece of this project is the entirely custom-built rich text editor. While it would have been much easier to use an existing solution like Quill.js, Draft.js, or TinyMCE, building one from scratch presented a significant technical challenge that demonstrates deep understanding of:

- DOM manipulation and content-editable behavior
- Selection APIs and range manipulation
- Event handling for complex user interactions
- State management for undo/redo functionality
- Custom formatting commands without relying on third-party code

This implementation showcases true front-end development skills by creating something most developers would simply import from a library.

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
- Edit notes with the **from-scratch custom rich text editor** (formatting, styling, and editing all implemented with pure JavaScript)
- Pin/unpin notes for quick access
- Use the AI Insights panel to analyze your notes
- Switch between dark and light themes

---

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [React](https://react.dev/)
