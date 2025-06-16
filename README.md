# Shareable Notes

A modern note-taking application with AI-powered insights using Google Gemini API.

## Features

- Create, edit, and organize notes with a rich text editor
- Pin important notes to the top of your list
- AI-powered insights including:
  - Key term extraction
  - Grammar checking
  - Text summarization
  - Word cloud generation
  - Related notes discovery
- Dark/light theme support
- Responsive design for desktop and mobile

## Technologies Used

- React with Redux for state management
- Vite for fast development and building
- Google Gemini API for AI text analysis
- IndexedDB for local storage
- TailwindCSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Google Gemini API key:
   ```
   VITE_GOOGLE_AI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

- `VITE_GOOGLE_AI_API_KEY`: Your Google Gemini API key for accessing AI features

## NLP Features

This application uses Google Gemini API to provide the following natural language processing features:

- **Key Term Extraction**: Identifies important concepts, entities, and terms in your notes
- **Grammar Checking**: Highlights grammar and spelling issues with suggested corrections
- **Summarization**: Generates concise summaries of your notes
- **Word Cloud**: Creates a visual representation of the most important terms
- **Related Notes**: Finds semantically similar notes based on content
