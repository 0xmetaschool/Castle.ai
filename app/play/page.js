"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useRouter, useSearchParams } from "next/navigation";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Play() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState("easy");
  const [gameStarted, setGameStarted] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userColor, setUserColor] = useState("white");
  const [toast, setToast] = useState(null);
  const [showResignDialog, setShowResignDialog] = useState(false);
  const [showCheckmateDialog, setShowCheckmateDialog] = useState(false);
  const [opponent, setOpponent] = useState("Castle.ai");
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [quickSave, setQuickSave] = useState(null);
  const [movesSinceQuickSave, setMovesSinceQuickSave] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = searchParams.get("id");
    if (id) {
      setUserId(id);
      fetchUserData(id);
    } else {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        router.push("/");
      } else {
        fetchUserData(null, token);
      }
    }

    // fix this later
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      setShowResignDialog(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [searchParams, router, gameStarted]);

  const saveGameState = async () => {
    try {
      const pgn = game.pgn();

      const response = await fetch("/api/game-state/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({
          userId: userId,
          gameState: {
            pgn: pgn,
            fen: game.fen(),
            userColor: userColor,
            opponent: opponent,
            mode: mode,
            moveHistory: moveHistory,
            gameStarted: gameStarted,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save game state");
      }

      showToast("💾");
    } catch (error) {
      console.error("Error saving game:", error);
      showToast("Error", "Failed to save game state", "destructive");
    }
  };

  const resetGameState = async () => {
    console.log("Reset clicked - 2 ");
    try {
      const newGame = new Chess();
      const pgn = newGame.pgn();

      const response = await fetch("/api/game-state/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({
          userId: userId,
          gameState: {
            pgn: pgn,
            fen: newGame.fen(),
            userColor: userColor,
            opponent: opponent,
            mode: mode,
            moveHistory: [],
            gameStarted: false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset game state");
      }

      showToast("🔃");
    } catch (error) {
      console.error("Error resetting game:", error);
      showToast("Error", "Failed to reset game state", "destructive");
    }
  };

  const loadSavedGame = async () => {
    try {
      const response = await fetch(`/api/game-state/game?id=${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load saved game");
      }

      const data = await response.json();

      if (data.savedGameState) {
        const newGame = new Chess();
        if (data.savedGameState.pgn) {
          try {
            newGame.loadPgn(data.savedGameState.pgn);
          } catch (error) {
            console.error("PGN load failed, falling back to FEN:", error);
            newGame.load(data.savedGameState.fen);
          }
        } else {
          newGame.load(data.savedGameState.fen);
        }

        setGame(newGame);
        setUserColor(data.savedGameState.userColor);
        setOpponent(data.savedGameState.opponent);
        setMode(data.savedGameState.mode);
        setMoveHistory(data.savedGameState.moveHistory);
        setGameStarted(data.savedGameState.gameStarted);
        setMoveIndex(data.savedGameState.moveHistory.length);

        showToast("🛜");
        if (
          newGame.turn() !== data.savedGameState.userColor[0] &&
          data.savedGameState.gameStarted
        ) {
          setTimeout(handleAIMove, 300);
        }
      }
    } catch (error) {
      console.error("Error loading saved game:", error);
      showToast("Error", "Failed to load saved game", "destructive");
    } finally {
      setIsLoadingGame(false);
    }
  };

  useEffect(() => {
    if (userId && isLoadingGame) {
      loadSavedGame();
    }
  }, [userId]);

  const fetchUserData = async (id, token) => {
    try {
      const url = id ? `/api/user?id=${id}` : "/api/user";
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` };

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setUserId(data._id || id);
      } else if (response.status === 401) {
        throw new Error("Authentication failed");
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      showToast(
        "Authentication Error",
        "Your session has expired. Please log in again.",
        "destructive"
      );
      setTimeout(() => router.push("/"), 3000);
    }
  };

  const showToast = (title, description, variant = "default") => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const makeAMove = useCallback(
    async (move) => {
      const gameCopy = new Chess(game.fen());
      let result = null;
      try {
        result = gameCopy.move(move);
      } catch (error) {
        console.log("Result:", result);
      }

      if (result) {
        setGame(gameCopy);
        const moveNotation = `${
          result.color === "w" ? "White" : "Black"
        } moved from ${result.from} to ${result.to}`;

        setMoveHistory((prevMoveHistory) => {
          if (moveIndex < prevMoveHistory.length) {
            return [...prevMoveHistory.slice(0, moveIndex), moveNotation];
          }
          return [...prevMoveHistory, moveNotation];
        });

        setMoveIndex((prevIndex) => prevIndex + 1);

        await saveGameState();

        if (gameCopy.isCheckmate()) {
          setShowCheckmateDialog(true);
        } else if (gameCopy.isCheck()) {
          console.log("Check!");
        }
      }
      return result;
    },
    [game, moveIndex]
  );

  const onDrop = useCallback(
    async (sourceSquare, targetSquare) => {
      if (!gameStarted) {
        showToast(
          "Game not started",
          "Please click the Start button to begin the game.",
          "destructive"
        );
        return false;
      }
      if (game.turn() !== userColor[0]) {
        showToast(
          "Not your turn",
          "Please wait for your opponent's move.",
          "destructive"
        );
        return false;
      }
      const move = await makeAMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      console.log(move);
      if (move === null) {
        showToast(
          "Invalid move",
          "Please try a different move.",
          "destructive"
        );
        return false;
      }
      setTimeout(handleAIMove, 300);
      setMovesSinceQuickSave((prevMoves) => prevMoves + 1);
      return true;
    },
    [gameStarted, game, userColor, makeAMove]
  );

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleGameStart = async () => {
    const newGame = new Chess();
    setGameStarted(true);
    setGame(newGame);
    setMoveHistory([]);
    setMoveIndex(0);
    await saveGameState();

    if (userColor === "black") {
      setTimeout(handleAIMove, 300);
    }
  };

  const handleGameExit = async () => {
    if (gameStarted) {
      await resetGameState();
    }
    router.push(`/home?id=${userId}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  const handleExitClick = async () => {
    if (gameStarted) {
      await saveGameState();
    }
    router.push(`/home?id=${userId}`);
  };

  const handleResignClick = async () => {
    console.log("Resign clicked");
    if (gameStarted) {
      await resetGameState();
    }
    router.push(`/home?id=${userId}`);
  };

  const handleQuickSave = () => {
    setQuickSave(game);
    setMovesSinceQuickSave(1);
  };

  const handleQuickLoad = () => {
    if (quickSave) {
      const newGame = new Chess(quickSave.fen());
      setGame(newGame);
      console.log(movesSinceQuickSave);
      const newMoveHistory = moveHistory.slice(
        0,
        moveHistory.length - 2 * movesSinceQuickSave
      );
      setMoveHistory(newMoveHistory);
      setMovesSinceQuickSave(0);
      console.log(moveHistory);
    }
  };

  const getAIMove = useCallback(async () => {
    console.log("getAIMove()");
    const aiColor = userColor === "white" ? "b" : "w";
    if (game.turn() !== aiColor) return;

    try {
      const possibleMoves = game.moves();
      console.log("Possible moves:", possibleMoves);

      let prompt = `You are a chess AI assistant. The current game state in FEN notation is: ${game.fen()}. 
The available legal moves in this position are: ${possibleMoves.join(", ")}. `;

      if (opponent === "Castle.ai") {
        prompt += `The difficulty level is set to ${mode}. Please provide the next best move for ${
          aiColor === "w" ? "white" : "black"
        } from the list of available moves in standard algebraic notation (e.g., "e4", "Nf3"). For ${mode} difficulty, ${
          mode === "easy"
            ? "choose any legal move from the list, favoring less optimal moves"
            : mode === "medium"
            ? "choose a moderately strong move from the list"
            : "choose the strongest move from the list"
        }. Return ONLY the move in standard algebraic notation, without any additional text.`;
      } else {
        prompt += `You are playing as ${opponent}. Please provide the next best move for ${
          aiColor === "w" ? "white" : "black"
        } from the list of available moves in standard algebraic notation (e.g., "e4", "Nf3"), mimicking ${opponent}'s playing style and typical strategies. 
${
  opponent === "Magnus Carlsen"
    ? "Choose moves that demonstrate positional understanding and technical precision."
    : opponent === "Garry Kasparov"
    ? "Prefer aggressive and tactical moves that create attacking opportunities."
    : opponent === "Bobby Fischer"
    ? "Focus on clear, principled moves with a mix of tactical brilliance."
    : opponent === "Samay Raina"
    ? "Choose entertaining moves that maintain a balance between fun and competitive play."
    : ""
}
Return ONLY the move in standard algebraic notation, without any additional text.`;
      }

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch AI move");
      }

      const data = await res.json();
      const aiMove = data.response.trim();

      if (possibleMoves.includes(aiMove)) {
        console.log("Selected AI move:", aiMove);
        makeAMove(aiMove);
      } else {
        console.error("Invalid AI move received:", aiMove);
        // If somehow we still get an invalid move, fall back to a semi-random move from possible moves
        const fallbackMove =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        console.log("Falling back to:", fallbackMove);
        makeAMove(fallbackMove);
      }
    } catch (error) {
      console.error("Error getting AI move:", error);
      // In case of error, make a move from possible moves to avoid game stuck
      const possibleMoves = game.moves();
      const fallbackMove =
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      console.log("Error fallback move:", fallbackMove);
      makeAMove(fallbackMove);
    }
  }, [game, makeAMove, mode, userColor, opponent]);

  const handleAIMove = useCallback(() => {
    console.log("Handle AI move called");
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setShowCheckmateDialog(true);
      } else {
        showToast(
          "Game over",
          "The game is over. Please start a new game.",
          "destructive"
        );
      }
      return;
    }
    getAIMove();
  }, [game, getAIMove]);

  useEffect(() => {
    if (gameStarted && game.turn() !== userColor[0]) {
      handleAIMove();
    }
  }, [gameStarted, game, userColor, handleAIMove]);

  if (!mounted || isLoadingGame) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 dark:bg-black flex flex-col"
    >
      {toast && (
        <div
          className={`fixed top-20 right-4 p-4 rounded-md shadow-md bg-white border-2 ${
            toast.variant === "destructive"
              ? "border-red-500"
              : "border-blue-500"
          } text-black z-50`}
        >
          <h4 className="font-bold ">{toast.title}</h4>
          <p>{toast.description}</p>
        </div>
      )}

      <nav className="py-4 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800 dark:text-white">
          Castle.ai
        </div>
        <div className="flex items-center justify-center">
          <div className="px-3 py-1 ">Turn :</div>
          <div className="flex space-x-2">
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
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-lg font-semibold">
                {username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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

      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="flex space-x-6">
          <div className="w-[800px]">
            <Chessboard
              id="BasicBoard"
              boardWidth={700}
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation={userColor}
            />
          </div>
          <div className="w-120 space-y-5">
            <h3 className="text-lg font-semibold mb-">Game Controls</h3>
            <div className="mb-4 flex space-x-4 items-center">
              <Toggle
                className="border-2 border-white"
                pressed={userColor === "black"}
                onPressedChange={(pressed) =>
                  setUserColor(pressed ? "black" : "white")
                }
                disabled={gameStarted}
              >
                Play as {userColor === "white" ? "Black" : "White"}
              </Toggle>
              <Select
                value={opponent}
                onValueChange={(value) => {
                  setOpponent(value);
                  if (value !== "Castle.ai") {
                    setMode("hard");
                  }
                }}
                disabled={gameStarted}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select opponent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Castle.ai">Castle.ai</SelectItem>
                  <SelectItem value="Magnus Carlsen">
                    Magnus Carlsen.ai
                  </SelectItem>
                  <SelectItem value="Garry Kasparov">
                    Garry Kasparov.ai
                  </SelectItem>
                  <SelectItem value="Bobby Fischer">
                    Bobby Fischer.ai
                  </SelectItem>
                  <SelectItem value="Samay Raina">Samay Raina.ai</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGameStart} disabled={gameStarted}>
                Start Game
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Select Difficulty</h3>
              <RadioGroup
                defaultValue="easy"
                onValueChange={handleModeChange}
                className={`flex space-x-4 ${
                  gameStarted || opponent !== "Castle.ai"
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <label htmlFor="easy">Easy</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <label htmlFor="medium">Medium</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <label htmlFor="hard">Hard</label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Match Controls</h3>

              <div className="space-x-2">
                <AlertDialog
                  open={showResignDialog}
                  onOpenChange={setShowResignDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Resign</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to resign?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. You will return to the
                        home page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setShowResignDialog(false)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleResignClick}>
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button onClick={handleQuickSave} disabled={moveIndex <= 1}>
                  Quick Save
                </Button>
                <Button onClick={handleQuickLoad} disabled={quickSave === null}>
                  Quick Load
                </Button>
                <AlertDialog
                  open={showExitDialog}
                  onOpenChange={setShowExitDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="secondary">Exit</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Exit Game</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your game progress will be saved automatically. You can
                        continue this game later from the home page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setShowExitDialog(false)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleExitClick}>
                        Exit to Home
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="flex flex-col ">
              <h3 className="text-lg font-semibold mb-2">Moves</h3>
              <ScrollArea className="h-96 rounded-md border whitespace-nowrap">
                <div className="p-4 flex flex-col-reverse">
                  {moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className={`py-1 ${
                        index === moveIndex - 1
                          ? "bg-blue-100 dark:bg-zinc-500 p-4 rounded-md object-cover"
                          : "p-4 object-cover"
                      }`}
                    >
                      {move}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={showCheckmateDialog}
        onOpenChange={setShowCheckmateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checkmate!</AlertDialogTitle>
            <AlertDialogDescription>
              The game has ended in checkmate. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCheckmateDialog(false)}>
              Close
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGameStart}>
              Start New Game
            </AlertDialogAction>
            <AlertDialogAction onClick={handleGameExit}>
              Exit to Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default Play;
