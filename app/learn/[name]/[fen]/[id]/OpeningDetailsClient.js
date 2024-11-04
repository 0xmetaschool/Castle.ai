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
  const scrollAreaRef = useRef(null);
  const moveAudioRef = useRef(null);

  //  Initialize audio
  useEffect(() => {
    try {
      const audio = new Audio("/move-self.wav");
      audio.addEventListener("canplaythrough", () => {});
      audio.addEventListener("error", (e) => {
        console.error("Audio loading error:", {
          error: e.target.error,
          src: audio.src,
          readyState: audio.readyState,
        });
      });

      moveAudioRef.current = audio;
      audio.load();
      return () => {
        audio.removeEventListener("canplaythrough", () => {});
        audio.removeEventListener("error", () => {});
      };
    } catch (err) {
      console.error("Error initializing audio:", err);
    }
  }, []);

  //  Play move sound
  const playMoveSound = () => {
    try {
      if (moveAudioRef.current) {
        moveAudioRef.current.currentTime = 0;
        const playPromise = moveAudioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {})
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

  //  Set opening details
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
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  //  Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  //  Scroll to bottom on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestedMoves, scrollToBottom]);

  //  Clean up on unmount
  useEffect(() => {
    return () => {
      setGame(null);
      gameRef.current = null;
      setMessages([]);
      setSuggestedMoves([]);
      setIsGameOver(false);
    };
  }, []);

  //  Fetch user data
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

  //  Update game state
  const updateGame = useCallback((newGame) => {
    setGame(newGame);
    gameRef.current = newGame;
  }, []);

  //  Handle chat submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === "" || !gameRef.current) return;

    setIsSendingMessage(true);

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: inputMessage,
      },
    ]);

    // Add thinking message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Thinking...",
        isThinking: true,
      },
    ]);

    try {
      const currentPosition = gameRef.current.fen();
      const gamePhase = isOpeningPhase ? "learning phase" : "practice phase";
      const playerColor = userColor;
      const moveNumber = Math.floor(gameRef.current.moveNumber() / 2) + 1;

      const prompt = `You are a helpful chess coach. Context:
        - Opening being studied: ${openingDetails.name}
        - Current game phase: ${gamePhase}
        - Player is playing as: ${playerColor}
        - Current position (FEN): ${currentPosition}
        - Move number: ${moveNumber}
        - Current player's question: ${inputMessage}

        Please provide a short, single sentence and precise response that is relevant to the current game state and opening being studied. Focus on practical advice and clear explanations.`;

      // Send request for AI response
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => !msg.isThinking));

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response.trim(),
        },
      ]);
    } catch (error) {
      console.error("Error in chat:", error);

      // Remove thinking message
      setMessages((prev) => prev.filter((msg) => !msg.isThinking));

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, I had trouble understanding that. Could you try rephrasing your question?",
        },
      ]);
      // Show error toast message
      toast({
        title: "Error",
        description: "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
      setInputMessage("");
      scrollToBottom();
    }
  };

  //  Add message to chat
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

  //  Remove thinking messages
  const removeThinkingMessages = () => {
    setMessages((prev) => prev.filter((msg) => !msg.isThinking));
  };

  //  Loading message component
  const LoadingMessage = () => (
    <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg max-w-[85%]">
      <div className="text-black dark:text-white">Thinking...</div>
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

  //  Make a move and update the game state for both player and AI
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
            description: "king is in check.",
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

  //  Get AI move and update the game state
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

  //  Handle AI move and update the game state
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

  //  Handle operation to be done on drop of a piece on the board
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

  //  Start general phase
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

  //  Handle suggested move click event
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
        // Make move
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

  //  Fetch user data
  const fetchUserData = async (id) => {
    try {
      const response = await fetch(`/api/user?id=${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
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

  //  Parse opening moves from string response returned by API
  const parseOpeningMoves = (movesString) => {
    if (!movesString) return [];
    return movesString
      .split(/\d+\.\s*/)
      .filter(Boolean)
      .map((move) => move.trim())
      .flatMap((move) => move.split(/\s+/))
      .filter((move) => move && move.length > 0);
  };

  //  Get opening advantage
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

  //  Get move explanation
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

  //  Start opening lesson phase
  const startOpeningLesson = async (opening, moves) => {
    if (!gameRef.current) {
      console.error("Game not initialized");
      return;
    }
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
  //  Fetch opening details and start opening lesson
  const fetchOpeningDetails = async (openingId) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/openings/${openingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch opening details");
      }

      const data = await response.json();
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

  //  Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  //  Handle reset
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

  //  Loading skeleton
  const LoadingSkeleton = () => (
    <div className="h-screen  bg-white dark:bg-black flex flex-col overflow-hidden">
      <nav className="h-16 px-6 flex justify-between items-center border-b fixed">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-24" />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6  bg-white dark:bg-black">
        <div className="flex gap-8 items-start max-w-[1200px] w-full">
          <div className="flex-1 flex flex-col items-center">
            <Skeleton className="h-8 w-96 mb-6" />
            <div className="flex space-x-2 mb-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="w-[600px] h-[600px] mb-6" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="w-[400px] h-[700px] flex flex-col  bg-white dark:bg-black rounded-lg border shadow-sm">
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

  //   Main UI
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
      <nav className="h-16 px-6 flex justify-between items-center fixed w-full">
        <div
          className="text-2xl font-bold dark:text-white text-black cursor-pointer"
          onClick={() => router.back()}
        >
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
      <div className="flex-1 flex items-center justify-center p-6 pt-20">
        <div className="flex gap-8 items-start max-w-[1200px] w-full">
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
              <Button onClick={() => handleReset} disabled={!isOpeningPhase}>
                Reset Position
              </Button>
              <Link href="/learn">
                <Button variant="secondary">Back to Openings</Button>
              </Link>
            </div>
          </div>

          <div className="w-[400px] h-[700px] flex flex-col bg-white dark:bg-black rounded-lg border shadow-sm">
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
                    Move {currentOpeningMove + 1} of {openingMoves.length + 1}
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

            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
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
                        className={`relative max-w-[85%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-black text-white dark:text-black dark:bg-white"
                            : "bg-muted dark:text-white text-black"
                        }`}
                      >
                        {message.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
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

            <div className="p-4 border-t">
              <form onSubmit={handleChatSubmit} className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about the opening..."
                  disabled={isGameOver || isSendingMessage}
                  className="text-black dark:text-white flex-1"
                />
                <Button
                  type="submit"
                  disabled={
                    isGameOver || isSendingMessage || inputMessage.trim() === ""
                  }
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

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
    </motion.div>
  );
}
