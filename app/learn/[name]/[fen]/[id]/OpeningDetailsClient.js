"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OpeningDetailsClient({ name, fen, id }) {
  const router = useRouter();
  const [game, setGame] = useState(null);
  const gameRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const moveAudioRef = useRef(null);

  useEffect(() => {
    try {
      const audio = new Audio("/move-self.wav");
      console.log("Audioooo : ", audio);

      // Add loading event listener
      audio.addEventListener("canplaythrough", () => {
        console.log("Audio loaded successfully");
      });

      // Add error event listener
      audio.addEventListener("error", (e) => {
        console.error("Audio loading error:", {
          error: e.target.error,
          src: audio.src,
          readyState: audio.readyState,
        });
      });

      moveAudioRef.current = audio;

      // Optional: Preload the audio
      audio.load();

      // Cleanup listeners on unmount
      return () => {
        audio.removeEventListener("canplaythrough", () => {});
        audio.removeEventListener("error", () => {});
      };
    } catch (err) {
      console.error("Error initializing audio:", err);
    }
  }, []);

  const playMoveSound = () => {
    try {
      if (moveAudioRef.current) {
        console.log("Attempting to play sound from:", moveAudioRef.current.src);
        moveAudioRef.current.currentTime = 0;
        const playPromise = moveAudioRef.current.play();
        console.log(playPromise);

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Audio played successfully");
            })
            .catch((err) => {
              console.error("Playback error:", {
                error: err,
                audioState: {
                  src: moveAudioRef.current.src,
                  readyState: moveAudioRef.current.readyState,
                  paused: moveAudioRef.current.paused,
                  currentTime: moveAudioRef.current.currentTime,
                },
              });
            });
        }
      } else {
        console.error("Audio reference is not initialized");
      }
    } catch (err) {
      console.error("Error in playMoveSound:", err);
    }
  };

  // States
  const [openingDetails, setOpeningDetails] = useState(() => {
    if (name && fen) {
      return {
        name: decodeURIComponent(name),
        fen: decodeURIComponent(fen),
      };
    }
    return null;
  });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userColor, setUserColor] = useState("white");
  const [suggestedMoves, setSuggestedMoves] = useState([]);
  const [openingMoves, setOpeningMoves] = useState([]);
  const [currentOpeningMove, setCurrentOpeningMove] = useState(0);
  const [isOpeningPhase, setIsOpeningPhase] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [moveValidationFunction, setMoveValidationFunction] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  // Auto-scroll effect
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, suggestedMoves]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setGame(null);
      gameRef.current = null;
      setMessages([]);
      setSuggestedMoves([]);
      setIsGameOver(false);
    };
  }, []);

  // Game initialization effect
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      router.push("/");
      return;
    }
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
      fetchUserData(id);
    }
  }, []);

  const updateGame = useCallback((newGame) => {
    setGame(newGame);
    gameRef.current = newGame;
  }, []);

  const addMessage = async (
    content,
    role = "assistant",
    isThinking = false
  ) => {
    setMessages((prev) => [...prev, { role, content, isThinking }]);

    if (!isThinking) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const removeThinkingMessages = () => {
    setMessages((prev) => prev.filter((msg) => !msg.isThinking));
  };

  const LoadingMessage = () => (
    <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg max-w-[85%]">
      <div>Thinking...</div>
    </div>
  );

  // Utility functions for game state checks
  const checkGameEnd = useCallback((currentGame) => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === "w" ? "Black" : "White";
      addMessage(`Checkmate! ${winner} wins!`);
      setIsGameOver(true);
      return true;
    }
    if (currentGame.isDraw()) {
      addMessage("Game is a draw!");
      setIsGameOver(true);
      return true;
    }
    if (currentGame.isStalemate()) {
      addMessage("Stalemate! The game is a draw.");
      setIsGameOver(true);
      return true;
    }
    if (currentGame.isThreefoldRepetition()) {
      addMessage("Draw by threefold repetition!");
      setIsGameOver(true);
      return true;
    }
    if (currentGame.isInsufficientMaterial()) {
      addMessage("Draw by insufficient material!");
      setIsGameOver(true);
      return true;
    }
    return false;
  }, []);
  const makeAMove = useCallback(
    async (move) => {
      if (!gameRef.current) return null;

      const gameCopy = new Chess(gameRef.current.fen());
      let result = null;

      try {
        result = gameCopy.move(move);
      } catch (error) {
        console.error("Move error:", error);
        return null;
      }

      if (result) {
        updateGame(gameCopy);

        // Check game ending conditions
        if (gameCopy.isCheckmate()) {
          const winner = gameCopy.turn() === "w" ? "Black" : "White";
          await addMessage(`Checkmate! ${winner} wins!`);
          setIsGameOver(true);
        } else if (gameCopy.isCheck()) {
          toast("Check!", {
            description: "Your king is in check.",
          });
        } else if (gameCopy.isDraw()) {
          await addMessage("Game is a draw!");
          setIsGameOver(true);
        } else if (gameCopy.isStalemate()) {
          await addMessage("Stalemate! The game is a draw.");
          setIsGameOver(true);
        } else if (gameCopy.isThreefoldRepetition()) {
          await addMessage("Draw by threefold repetition!");
          setIsGameOver(true);
        } else if (gameCopy.isInsufficientMaterial()) {
          await addMessage("Draw by insufficient material!");
          setIsGameOver(true);
        }
      }
      playMoveSound();
      return result;
    },
    [updateGame]
  );

  const getAIMove = useCallback(async () => {
    if (!gameRef.current) return null;

    const aiColor = userColor === "white" ? "b" : "w";
    if (gameRef.current.turn() !== aiColor) return null;

    try {
      const possibleMoves = gameRef.current.moves();
      const prompt = `You are a chess AI assistant. The current game state in FEN notation is: ${gameRef.current.fen()}. 
        The available legal moves in this position are: ${possibleMoves.join(
          ", "
        )}. 
        The difficulty level is set to easy. Please provide the next best move for ${
          aiColor === "w" ? "white" : "black"
        } from the list of available moves in standard algebraic notation (e.g., "e4", "Nf3"). 
        For easy difficulty, choose any legal move from the list, favoring less optimal moves.
        Return ONLY the move in standard algebraic notation, without any additional text.`;

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to fetch AI move");

      const data = await res.json();
      const aiMove = data.response.trim();

      if (possibleMoves.includes(aiMove)) {
        return await makeAMove(aiMove);
      } else {
        const fallbackMove =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        playMoveSound();

        return await makeAMove(fallbackMove);
      }
    } catch (error) {
      console.error("Error getting AI move:", error);
      const possibleMoves = gameRef.current.moves();
      const fallbackMove =
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      return await makeAMove(fallbackMove);
    }
  }, [gameRef, userColor, makeAMove]);

  const handleAIMove = useCallback(async () => {
    if (!gameRef.current || isGameOver) return;

    if (gameRef.current.isGameOver()) {
      checkGameEnd(gameRef.current);
      return;
    }

    // Add thinking message
    await addMessage("Thinking about my move...", "assistant", true);

    try {
      const result = await getAIMove();
      // Remove thinking message
      removeThinkingMessages();

      if (result) {
        await addMessage(`I played ${result.san}`);
      }
    } catch (error) {
      console.error("AI move error:", error);
      removeThinkingMessages();
      toast("Error", {
        description: "Failed to make AI move",
      });
    }
  }, [gameRef, isGameOver, getAIMove, checkGameEnd]);

  const onDrop = useCallback(
    async (sourceSquare, targetSquare) => {
      if (!gameRef.current || isGameOver) return false;

      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      };

      if (isOpeningPhase) {
        const moveResult = await makeAMove(move);
        if (!moveResult) {
          toast("Invalid move", {
            description: "Please try a different move",
          });
          return false;
        }

        if (moveValidationFunction) {
          moveValidationFunction(moveResult.san);
        }

        return true;
      } else {
        // Practice phase
        if (gameRef.current.turn() !== userColor[0]) {
          toast("Not your turn", {
            description: "Please wait for your opponent's move",
          });
          return false;
        }

        const moveResult = await makeAMove(move);
        if (!moveResult) {
          toast("Invalid move", {
            description: "Please try a different move",
          });
          return false;
        }

        // If game isn't over after player's move, let AI move
        if (!isGameOver) {
          setTimeout(handleAIMove, 1000);
        }
        playMoveSound();

        return true;
      }
    },
    [
      gameRef,
      isGameOver,
      isOpeningPhase,
      userColor,
      moveValidationFunction,
      makeAMove,
      handleAIMove,
    ]
  );

  const startGeneralPhase = async () => {
    setIsOpeningPhase(false);
    setSuggestedMoves([]);
    await addMessage(
      "Now you can play the rest of the game. I'll play as your opponent in easy mode."
    );

    // If it's AI's turn after opening, make a move
    if (
      gameRef.current &&
      !isGameOver &&
      gameRef.current.turn() !== userColor[0]
    ) {
      setTimeout(handleAIMove, 1000);
    }
  };

  const handleSuggestedMove = useCallback(
    async (move) => {
      if (!gameRef.current || isGameOver) {
        console.error("Game is not initialized or is over");
        toast("Error", {
          description: "Cannot make move at this time",
        });
        return;
      }

      try {
        const tempGame = new Chess(gameRef.current.fen());
        const possibleMoves = tempGame.moves({ verbose: true });
        const moveDetails = possibleMoves.find((m) => m.san === move);

        if (!moveDetails) {
          toast("Invalid move", {
            description: "Cannot make the suggested move at this position",
          });
          return;
        }

        // Validate turn
        const isWhiteTurn = gameRef.current.turn() === "w";
        const isUserTurn =
          (isWhiteTurn && userColor === "white") ||
          (!isWhiteTurn && userColor === "black");

        if (!isUserTurn) {
          toast("Not your turn", {
            description: "Please wait for the opponent's move",
          });
          return;
        }

        const result = await onDrop(moveDetails.from, moveDetails.to);
        if (!result) {
          toast("Error", {
            description: "Failed to make the move",
          });
        }
      } catch (error) {
        console.error("Error in handleSuggestedMove:", error);
        toast("Error", {
          description: "Failed to make the suggested move",
        });
      }
    },
    [gameRef, isGameOver, userColor, onDrop]
  );

  const fetchUserData = async (id) => {
    try {
      console.log("Fetching user data for ID:", id);
      const response = await fetch(`/api/user?id=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });
      console.log("Response:", response);

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        console.log("User data:", data);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    }
  };

  const parseOpeningMoves = (movesString) => {
    if (!movesString) return [];
    return movesString
      .split(/\d+\.\s*/)
      .filter(Boolean)
      .map((move) => move.trim())
      .flatMap((move) => move.split(/\s+/))
      .filter((move) => move && move.length > 0);
  };

  const getOpeningAdvantage = async (opening) => {
    try {
      const prompt = `You are a chess instructor teaching beginners. In 10-15 words, explain the main advantage of the ${opening.name} opening. Keep it simple and avoid technical terms.`;

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to get opening advantage");

      const data = await res.json();
      return data.response.trim();
    } catch (error) {
      console.error("Error getting opening advantage:", error);
      return "This opening helps control the center and develop pieces quickly.";
    }
  };

  const getMoveExplanation = async (movesSoFar, currentMove) => {
    try {
      const prompt = `You are a chess instructor teaching beginners. The following moves have been played in the ${
        openingDetails.name
      }: ${movesSoFar.join(", ")}. 
      In 10-15 words, explain why the move ${currentMove} is played next. Include a brief strategic reason and mention a famous game if relevant. Keep it simple.`;

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to get move explanation");

      const data = await res.json();
      return data.response.trim();
    } catch (error) {
      console.error("Error getting move explanation:", error);
      return `${currentMove} helps develop pieces and control important squares.`;
    }
  };

  const startOpeningLesson = async (opening, moves) => {
    if (!gameRef.current) {
      console.error("Game not initialized");
      return;
    }

    console.log("Starting opening lesson...");
    setMessages([]);
    setIsOpeningPhase(true);
    setCurrentOpeningMove(0);
    setIsGameOver(false);

    await addMessage(`Welcome ${username}! Let's learn the ${opening.name}.`);
    await addMessage(`You'll be playing as ${userColor} in this opening.`);

    const advantage = await getOpeningAdvantage(opening);
    await addMessage(advantage);

    if (moves && moves.length > 0) {
      setOpeningMoves(moves);
      let moveIndex = 0;
      const playedMoves = [];

      while (moveIndex < moves.length) {
        try {
          const currentMove = moves[moveIndex];
          setCurrentOpeningMove(moveIndex);

          const isUserTurn =
            (moveIndex % 2 === 0 && userColor === "white") ||
            (moveIndex % 2 === 1 && userColor === "black");

          if (isUserTurn) {
            const explanation = await getMoveExplanation(
              playedMoves,
              currentMove
            );
            await addMessage(explanation);
            setSuggestedMoves([currentMove]);

            const movePromise = new Promise((resolve) => {
              setMoveValidationFunction(() => (move) => {
                if (move === currentMove) {
                  resolve(true);
                } else {
                  toast("Incorrect move", {
                    description: "Please make the suggested move to continue",
                  });
                  resolve(false);
                }
              });
            });

            const moveResult = await movePromise;
            if (!moveResult) continue;

            setSuggestedMoves([]);
          } else {
            await addMessage(
              `I'll make the move ${currentMove}`,
              "assistant",
              true
            );
            await new Promise((resolve) => setTimeout(resolve, 500));

            if (!gameRef.current) {
              throw new Error("Game state lost during AI move");
            }

            const tempGame = new Chess(gameRef.current.fen());
            const possibleMoves = tempGame.moves({ verbose: true });
            const moveDetails = possibleMoves.find(
              (m) => m.san === currentMove
            );

            if (moveDetails) {
              removeThinkingMessages();
              const aiMoveResult = await makeAMove({
                from: moveDetails.from,
                to: moveDetails.to,
                promotion: moveDetails.promotion || "q",
              });

              if (!aiMoveResult) {
                throw new Error("Failed to make AI move");
              }
            } else {
              console.error("Invalid AI move:", currentMove);
              toast("Error", {
                description: "Failed to make AI move",
              });
              break;
            }
          }

          playedMoves.push(currentMove);
          moveIndex++;
          setCurrentOpeningMove(moveIndex);
        } catch (error) {
          console.error("Error in opening lesson:", error);
          toast("Error", {
            description: "There was an error in the opening lesson",
          });
          break;
        }
      }

      if (moveIndex === moves.length) {
        await addMessage("Excellent! You've completed the opening sequence!");
        setShowPracticeDialog(true);
      }
    }
  };

  const fetchOpeningDetails = async (openingId) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/openings/${openingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch opening details");
      }

      const data = await response.json();
      console.log("Opening details fetched:", data);

      if (data && data.opening) {
        const opening = data.opening;
        const moves = parseOpeningMoves(opening.moves);
        setOpeningMoves(moves);
        setIsLoading(false);
        await startOpeningLesson(opening, moves);
      } else {
        throw new Error("No opening data available");
      }
    } catch (error) {
      console.error("Error in fetchOpeningDetails:", error);
      toast("Error", {
        description: "Failed to load opening details",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  const handleReset = async () => {
    const newGame = new Chess();
    updateGame(newGame);
    setIsOpeningPhase(true);
    setCurrentOpeningMove(0);
    setSuggestedMoves([]);
    setIsGameOver(false);
    setMessages([]);
    startOpeningLesson(openingDetails, openingMoves);
  };

  // Initial game setup effect
  useEffect(() => {
    if (mounted && openingDetails && id) {
      const newGame = new Chess();
      updateGame(newGame);

      // Analyze first move of the opening
      const tempGame = new Chess();
      const moves = parseOpeningMoves(openingDetails.moves);

      if (moves && moves.length > 0) {
        const firstMove = moves[0];
        try {
          tempGame.move(firstMove);
          const isWhiteOpening = true;
          setUserColor(isWhiteOpening ? "white" : "black");
        } catch (error) {
          const isWhiteOpening = false;
          setUserColor(isWhiteOpening ? "white" : "black");
        }
      }

      fetchOpeningDetails(id).catch((error) => {
        console.error("Error in fetchOpeningDetails:", error);
        toast("Error", {
          description: "Failed to load opening details",
        });
        setIsLoading(false);
      });
    } else {
      if (mounted && !openingDetails) {
        setIsLoading(false);
      }
    }
  }, [mounted, openingDetails, id, updateGame]);

  if (!mounted || !game || !openingDetails) {
    return null;
  }

  const LoadingSkeleton = () => (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Navigation Bar Skeleton */}
      <nav className="h-16 px-6 flex justify-between items-center border-b">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-24" />
        </div>
      </nav>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex gap-8 items-start max-w-[1200px] w-full">
          {/* Left Column - Chessboard Skeleton */}
          <div className="flex-1 flex flex-col items-center">
            <Skeleton className="h-8 w-96 mb-6" /> {/* Title */}
            <div className="flex space-x-2 mb-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
            {/* Chessboard Skeleton */}
            <Skeleton className="w-[600px] h-[600px] mb-6" />
            {/* Buttons Skeleton */}
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Right Column - Tutorial Panel Skeleton */}
          <div className="w-[400px] h-[700px] flex flex-col bg-background rounded-lg border shadow-sm">
            {/* Header Skeleton */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-1 w-full" />
              </div>
            </div>

            {/* Messages Area Skeleton */}
            <div className="flex-1 p-4">
              <div className="flex flex-col space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      index % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <Skeleton
                      className={`h-16 ${
                        index % 2 === 0 ? "w-3/4" : "w-2/3"
                      } rounded-lg`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="p-4 border-t">
              <div className="flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted || !game || !openingDetails || isLoading) {
    return <LoadingSkeleton />;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="h-screen bg-background flex flex-col overflow-hidden bg-white dark:bg-black"
    >
      {/* Navigation Bar */}
      <nav className="h-16 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold dark:text-white text-black">
          Castle.ai
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9 p-0"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 dark:text-white text-black" />
            ) : (
              <Sun className="h-5 w-5 dark:text-white text-black" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-lg font-semibold dark:text-white text-black"
              >
                {username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => router.push(`/home?id=${userId}`)}
              >
                Home
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex gap-8 items-start max-w-[1200px] w-full">
          {/* Left Column - Chessboard */}
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-6 dark:text-white text-black">
              {openingDetails.name}
            </h1>
            <div className="flex space-x-2 mb-4">
              <div
                className={`px-3 py-1 rounded ${
                  game.turn() === "w"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
              >
                White {userColor === "white" ? "(You)" : "(AI)"}
              </div>
              <div
                className={`px-3 py-1 rounded ${
                  game.turn() === "b"
                    ? "bg-white text-black"
                    : "bg-black text-white"
                }`}
              >
                Black {userColor === "black" ? "(You)" : "(AI)"}
              </div>
            </div>

            <div className="w-[600px] mb-6">
              <Chessboard
                id="OpeningBoard"
                boardWidth={600}
                position={game.fen()}
                boardOrientation={userColor}
                onPieceDrop={onDrop}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleReset} disabled={!isOpeningPhase}>
                Reset Position
              </Button>
              <Link href="/learn">
                <Button variant="secondary">Back to Openings</Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Chat & Moves */}
          <div className="w-[400px] h-[700px] flex flex-col bg-white dark:bg-black rounded-lg border shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white text-black">
                  Opening Tutorial
                </h2>
                <Badge variant={isOpeningPhase ? "default" : "secondary"}>
                  {isOpeningPhase ? "Learning Phase" : "Practice Phase"}
                </Badge>
              </div>
              {isOpeningPhase && openingMoves.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-muted-foreground">
                    Move {currentOpeningMove + 1} of {openingMoves.length}
                  </div>
                  <div className="h-1 mt-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 dark:text-white text-black"
                      style={{
                        width: `${
                          ((currentOpeningMove + 1) / openingMoves.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.isThinking ? (
                      <LoadingMessage />
                    ) : (
                      <div
                        className={`relative max-w-[85%] rounded-lg px-4 py-2 dark:text-white text-black ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Suggested Moves */}
            {suggestedMoves.length > 0 && (
              <div className="p-4 border-t">
                <div className="text-sm font-medium mb-2 dark:text-white text-black">
                  Suggested Moves:
                </div>
                <div className="flex gap-2 flex-wrap">
                  {suggestedMoves.map((move, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleSuggestedMove(move)}
                    >
                      {move}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputMessage.trim() === "") return;
                  setMessages((prev) => [
                    ...prev,
                    { role: "user", content: inputMessage },
                  ]);
                  setInputMessage("");
                }}
                className="flex gap-3"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about the opening..."
                  disabled={isGameOver}
                />
                <Button type="submit" disabled={isGameOver}>
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Dialog */}
      <AlertDialog
        open={showPracticeDialog}
        onOpenChange={setShowPracticeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opening Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              You've successfully learned the {openingDetails.name}. What would
              you like to do next?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowPracticeDialog(false);
                handleReset();
              }}
            >
              Practice Again
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowPracticeDialog(false);
                startGeneralPhase();
              }}
            >
              Continue Playing
            </AlertDialogAction>
            <AlertDialogAction onClick={() => router.push("/learn")}>
              Exit to Openings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toaster */}
      <Toaster richColors position="top-right" />
    </motion.div>
  );
}
