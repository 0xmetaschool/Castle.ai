# Castle.ai
Castle.ai helps you in your chess journey with AI-powered learning and gameplay. Experience chess like never before by playing against AI personalities that mirror grandmasters' styles. Whether you're a beginner looking to learn openings or an advanced player solving complex puzzles, Castle.ai provides a personalized path to chess mastery.

Built with Next.js and AI technology, this open-source template helps developers create their own AI-powered Chess game.

## Live Demo

[https://castle-ai-metaschool.vercel.app/](https://castle-ai-metaschool.vercel.app/)

## Features

- Advanced player authentication and profiles with game history tracking
- AI-powered chess engine with legendary player personalities and styles
- Interactive learning system with 11,000+ openings and detailed explanations
- Tactical puzzle trainer with progressive difficulty and smart hints

## Technologies Used

- Next.js 15 with App Router
- Tailwind, Shadcn, FramerMotion for UI
- React Chess Board for game interface

## Use Cases
- Create a premium chess coaching platform with AI-powered personalized training programs and gameplay analysis
- Build a chess community platform where players can learn, compete against AI personalities, and track their progress
- Launch a chess learning app focused on opening mastery and tactical improvement through AI-guided practice

## Installation Steps

1. Clone the repository

```bash
git clone https://github.com/0xmetaschool/Castle.ai.git
cd Castle.ai
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

- Start a game by selecting difficulty level and AI personality of your choice
- Use game controls to save, load, or reset positions during gameplay
- Browse and select from 11,000+ openings in the comprehensive database
- Practice selected openings with interactive tutorials and AI opponent
- Challenge yourself with puzzles at your preferred difficulty level
- Track your progress across games, openings, and puzzle-solving sessions

## Contributing

We love contributions! Here's how you can help make the project even better:

1. Fork the repository (`gh repo fork https://github.com/0xmetaschool/Castle.ai.git`)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/0xmetaschool/Castle.ai/blob/main/LICENSE) file for details.

## Contact
Please open an issue in the GitHub repository for any queries or support.
