# AI Code Editor - Technical Interview Platform

An AI-powered code editor designed for technical interviews, featuring real-time code analysis, AI assistance, and interactive chat capabilities using OpenAI's GPT models.

## Features

- **Monaco Code Editor**: Full-featured code editor with syntax highlighting
- **AI Chat Interface**: Interactive chat with AI for coding assistance and interview questions
- **Code Analysis**: Real-time code quality assessment and suggestions
- **Multiple Languages**: Support for JavaScript, Python, Java, C++, and TypeScript
- **Code Completion**: AI-powered code completion and suggestions
- **Code Fixing**: Automatic bug detection and fixing
- **Interview Questions**: AI-generated coding challenges with different difficulty levels

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - Code editor (VS Code editor)
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **OpenAI API** - AI integration for chat and code analysis
- **CORS** - Cross-origin resource sharing

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- npm or yarn package manager

## Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env.local`
   - Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development servers:**
   
   **Option 1: Run both frontend and backend together:**
   ```bash
   npm run dev:all
   ```
   
   **Option 2: Run separately:**
   ```bash
   # Terminal 1 - Frontend (Next.js)
   npm run dev
   
   # Terminal 2 - Backend (Express)
   npm run dev:server
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Usage

### Getting Started

1. Open the application in your browser
2. The code editor will load with a sample JavaScript function
3. Use the chat interface to ask for coding help or request interview questions
4. Write code and use the analysis tools

### Key Features

#### Code Editor
- Write code in multiple programming languages
- Syntax highlighting and IntelliSense
- Press `Ctrl+Enter` to analyze code

#### AI Assistant
- Ask questions about algorithms, data structures, or specific coding problems
- Request interview questions with different difficulty levels
- Get explanations and hints for coding challenges

#### Code Analysis Tools
- **Analyze Code**: Get quality assessment, bug detection, and improvement suggestions
- **Complete Code**: AI-powered code completion
- **Fix Code**: Automatic bug fixing and code improvement

### API Endpoints

#### Chat API
- `POST /api/chat/message` - Send message to AI assistant
- `POST /api/chat/generate-question` - Generate coding interview questions

#### Code API
- `POST /api/code/analyze` - Analyze code quality and issues
- `POST /api/code/complete` - Get code completion suggestions
- `POST /api/code/fix` - Fix code issues and bugs

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Backend server port | 3001 |
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3001 |

### Supported Languages

- JavaScript
- Python
- Java
- C++
- TypeScript

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.jsx         # Root layout
│   │   └── page.jsx           # Home page
│   ├── components/            # React components
│   │   ├── CodeEditor.jsx     # Monaco code editor
│   │   ├── ChatInterface.jsx  # AI chat interface
│   │   └── MainEditor.jsx     # Main application component
│   └── lib/                   # Utility libraries
│       ├── api.js             # API service functions
│       └── utils.js           # Helper utilities
├── server/                    # Backend Express server
│   ├── routes/                # API routes
│   │   ├── chat.js           # Chat endpoints
│   │   └── code.js           # Code analysis endpoints
│   └── index.js              # Server entry point
├── public/                    # Static assets
├── .env.example              # Environment template
├── .env.local               # Environment variables (create this)
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── next.config.js          # Next.js configuration
└── postcss.config.js       # PostCSS configuration
```

## Development

### Running Tests
```bash
# Add test commands when tests are implemented
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run server` - Start backend server only
- `npm run dev:server` - Start backend in development mode
- `npm run dev:all` - Start both frontend and backend concurrently

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Ensure your OpenAI API key is correctly set in `.env.local`
   - Check that you have sufficient credits in your OpenAI account

2. **Backend Connection Issues**
   - Verify the backend server is running on port 3001
   - Check CORS configuration if accessing from different domains

3. **Editor Not Loading**
   - Ensure Monaco Editor dependencies are installed
   - Check browser console for JavaScript errors

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed with `npm install`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and development purposes.

## Acknowledgments

- OpenAI for providing the GPT API
- Microsoft for the Monaco Editor
- Vercel team for Next.js
- Tailwind CSS team for the styling framework