# Airlock - AI Code Debugger

A VS Code-inspired React application for AI-powered code debugging and analysis.

## Features

- **Code Editor**: Monaco Editor with Python syntax highlighting
- **AI Debugging**: Integration with DeepSeek model via Ollama
- **AST Analysis**: Python Abstract Syntax Tree analysis for code insights
- **VS Code-like UI**: Familiar interface with resizable panels and dark/light themes
- **PDF Export**: Generate reports from debugging results

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor component
- **React Resizable Panels** - Layout management
- **Lucide React** - Icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.