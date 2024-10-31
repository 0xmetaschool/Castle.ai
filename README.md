# Castle.ai : an AI-Powered Chess App

Ready to revolutionize your chess game? Castle.ai brings the power of artificial intelligence to your fingertips by combining cutting-edge AI technology with an intuitive chess interface, creating an unparalleled learning and playing experience.

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Contributions](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact](#contact)

## Demo

🚀 [Live Demo](https://castle-ai.vercel.app/)

## Features

- **Play vs AI**

  - Multiple difficulty levels (Easy, Medium, Hard)
  - AI personalities mimicking famous players:
    - Magnus Carlsen's positional style
    - Garry Kasparov's aggressive tactics
    - Bobby Fischer's precise technique
    - Samay Raina's entertaining approach
  - Interactive gameplay with dynamic board updates
  - Automatic Save and resume games

- **Learn a wide array of 11,493 Openings**

  - Comprehensive opening database
  - Step-by-step interactive tutorials
  - AI-powered explanations for each move
  - Strategic insights and common patterns
  - Practice mode with immediate feedback
  - Progress tracking for each opening
  - Personalized learning paths
  - Common pitfalls and how to avoid them

- **Brainstorm solutions for Chess Puzzles**
  - Curated collection of tactical positions
  - AI-generated hints that guide without spoiling
  - Progressive difficulty scaling
  - Detailed solution explanations
  - Tactical pattern recognition training

Interface Features:

- Responsive design adapting to all screen sizes
- Intuitive drag-and-drop move execution
- Real-time position evaluation
- Dynamic board animations
- Light/Dark theme support
- Accessible UI components
- Cross-platform compatibility
- Offline mode support

## Technologies Used

Frontend:

- Next.js 15 with App Router
- TailwindCSS for responsive styling
- Shadcn UI for component architecture
- Framer Motion for smooth animations
- React Chess Board for game interface
- Chess.js for move validation

Backend:

- MongoDB Atlas for data persistence
- OpenAI GPT-4 API for move analysis
- JWT for secure authentication
- REST API architecture

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- OpenAI API key
- Git installation
- npm or yarn package manager

### How to run the Project

1. **Clone the repository**

```bash
git clone
cd
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:

```env
MONGO_URI=
MONGO_DB=castleAI
OPENAI_API_KEY=
JWT_SECRET=

```

4. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application running.

## Screenshots

## How to use the application

### Playing Against AI

- Select your preferred difficulty level
- Choose an AI personality if desired
- Start the game and make your moves
- Use the game controls to:
  - Reset position
  - Make Quick Saves
  - Load from Quick Saves
  - Game state will be remembered unless the user resgins

### Learning Openings

- Browse the opening database
- Select an opening to study
- Follow the interactive tutorial
- Practice against AI
- Track your progress

### Solving Puzzles

- Choose puzzle difficulty
- Analyze the position
- Make your moves
- Request hints when needed
- Review solution explanations
- Track improvement over time

## Use cases and further enhanchements

### Current Use Cases:

- Educational Platform
  - Chess teachers can use it for interactive lessons
  - Students can practice openings systematically
  - Schools can implement it in chess programs
- Training Tool
  - Club players can improve opening repertoire
  - Tactical training through puzzles
  - Practice specific positions against AI
- Entertainment
  - Casual players can enjoy games against AI
  - Chess enthusiasts can explore new openings
  - Players can challenge themselves with puzzles

### Further Enhancements:

#### Technical Improvements

- Implement WebSocket for real-time multiplayer
- Add game state persistence for all features
- Optimize AI response time
- Enhanced mobile responsiveness

#### Feature Additions

- Multiplayer functionality
- Tournament organization system
- Opening repertoire builder
- Personal progress analytics
- Advanced game analysis tools
- Video lessons integration
- Community forums and discussions

#### AI Enhancements

- More grandmaster playing styles or Custom data sets
- More AI personalities
- Personalized learning paths
- Advanced position evaluation
- Interactive endgame training
- Opening recommendation system

### User Experience

- Custom theme creator
- Board and piece customization
- Achievement system
- Social features and sharing
- Progress tracking dashboard
- Game analytics and statistics

## Contributing

We welcome contributions! Follow these steps:

1. Fork the repository (` gh repo fork https://github.com/0xmetaschool/<update>.git`)
2. Create your feature branch (` git checkout -b feature/AmazingFeature`)
3. Commit changes (` git commit -m 'Add AmazingFeature'`)
4. Push to branch (` git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/0xmetaschool/Castle.ai/blob/main/LICENSE.txt) file for details.

## Acknowledgments

- OpenAI for GPT-4 API access
- shadcn team for the component library

## Contact

Please open an issue in the GitHub repository for any queries or support.
