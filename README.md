# Castle.ai
A Chess game where you can learn and play with AI.

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

[https://castle-ai-metaschool.vercel.app/](https://castle-ai-metaschool.vercel.app/)

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

### Installation

1. Clone the repository

```bash
git clone https://github.com/0xmetaschool/Castle.ai.git
cd
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables
   Create a `.env.local` file in the root directory:

```env
MONGO_URI=
MONGO_DB=castleAI
OPENAI_API_KEY=
JWT_SECRET=
```

To obtain the required credentials:

- `MONGO_URI`: Create a free MongoDB Atlas cluster and obtain your connection string from [MongoDB Atlas](https://www.mongodb.com/docs/atlas/tutorial/connect-to-your-cluster/)
- `OPENAI_API_KEY`: Generate an API key from your [OpenAI dashboard](https://platform.openai.com/api-keys)
- `JWT_SECRET`: This can be any long, random string. For production, you can generate a secure random string using a tool like [generate-secret](https://generate-secret.vercel.app/32)

4. Start the development server

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Screenshots

<div align="center">
  <img src="public/App.gif" alt="Application Demo" width="800px" />
</div>

## How to use the application

### Playing Against AI

- Select your preferred difficulty level
- Choose an AI personality if desired
- Start the game and make your moves
- Use the game controls to:
  - Reset position
  - Make Quick Saves
  - Load from Quick Saves
  - The game state will be remembered unless the user resigns

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

## Use Cases & Future Enhancements
Here's what you can do with Castle.ai and what's coming next:

**Current Use Cases**

- Educational Platform
  - Chess teachers can use it for interactive lessons
  - Students can practice openings systematically
  - Schools can implement it in chess programs
- Training Tool
  - Club players can improve their opening repertoire
  - Tactical training through puzzles
  - Practice specific positions against AI
- Entertainment
  - Casual players can enjoy games against AI
  - Chess enthusiasts can explore new openings
  - Players can challenge themselves with puzzles

**Coming Soon:**

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

Want to contribute? Check out our contributing guidelines below!


## Contributing

We love contributions! Here's how you can help make the project even better:

1. Fork the repository (`gh repo fork https://github.com/0xmetaschool/Castle.ai.git`)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/0xmetaschool/Castle.ai/blob/main/LICENSE) file for details.

## Frequently Asked Questions (FAQs)

### Q1: Do I need to create an account to use Castle.ai?
To access the full features of Castle.ai including game saves, opening progress tracking, and personalized statistics, you'll need to create an account. Creating an account is free and allows you to:
- Save and resume your games
- Track your progress in opening studies
- Save your puzzle-solving statistics
- Access personalized learning paths
- Sync your preferences across devices

### Q2: What makes Castle.ai different from other chess learning platforms?
Castle.ai offers several unique features:
- AI personalities that authentically mimic famous players' styles:
  - Magnus Carlsen's positional play
  - Garry Kasparov's aggressive tactics
  - Bobby Fischer's precise technique
  - Samay Raina's entertaining approach
- Access to 11,493 chess openings with interactive tutorials
- AI-powered move explanations and analysis
- Progressive learning system that adapts to your skill level
- Seamless integration of learning, practice, and entertainment features

### Q3: What skill level is Castle.ai designed for?
Castle.ai is designed for chess players at every level:

Beginners:
- Easy-mode AI opponents
- Basic opening fundamentals
- Guided puzzle solving
- Interactive tutorials
- Step-by-step learning paths

Intermediate Players:
- Medium difficulty AI games
- Tactical pattern recognition
- Comprehensive opening studies
- Position analysis tools

Advanced Players:
- Hard-mode AI challenges
- Complex tactical puzzles
- Deep opening preparation
- Advanced position evaluation
- Custom training scenarios

### Q4: What technical requirements do I need to run Castle.ai?
Minimum Requirements:
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection for full features
- Device with at least 4GB RAM
- Screen resolution of 1024x768 or higher

Recommended Setup:
- High-speed internet connection
- 8GB+ RAM
- 1920x1080 or higher resolution
- Updated browser version
- Desktop or laptop computer for optimal experience

