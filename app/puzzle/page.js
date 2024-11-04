"use client";
import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function PuzzleGallery() {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState([]);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  //   Fetch user data when the component mounts
  useEffect(() => {
    setMounted(true);
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
      fetchUserData(id);
    }
  }, []);

  //   Function to fetch user data
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
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  //   Fetch puzzles on mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/puzzles")
      .then((res) => res.json())
      .then((data) => {
        setPuzzles(data.entries);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching puzzles:", error);
        setIsLoading(false);
      });
  }, []);

  //   Handle puzzle selection on click
  const handlePuzzleSelect = (puzzle) => {
    const encodedData = encodeURIComponent(JSON.stringify(puzzle));
    router.replace(`/puzzle/${puzzle.gameId}?data=${encodedData}`);
  };

  //   Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  //   Loading skeleton
  const LoadingSkeleton = () => (
    <CarouselContent className="h-full">
      {[1, 2, 3].map((index) => (
        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 h-full">
          <Card className="h-full">
            <CardHeader className="space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
              <Skeleton className="w-full aspect-square" />
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
  );

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-black overflow-hidden">
      <nav className="h-16 min-h-[64px] px-6 flex justify-between items-center bg-white dark:bg-black fixed w-full">
        <div
          className="text-2xl font-bold text-black dark:text-white cursor-pointer"
          onClick={() => router.push("/home?id=" + userId)}
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
              <Moon className="h-5 w-5 text-black dark:text-white" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-lg font-semibold text-black dark:text-white"
              >
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

      <div className="flex-1 flex flex-col justify-center items-center pt-8 pb-12 px-6 ">
        <h1 className="text-3xl font-bold mb-8  text-black dark:text-white">
          Puzzles
        </h1>

        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="w-full max-w-[1400px] h-[calc(100vh-220px)] flex justify-center items-center">
            <div className="relative w-full h-full px-12">
              <Carousel className="w-full h-full">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <CarouselContent className="h-full">
                    {puzzles.map((puzzle, index) => (
                      <CarouselItem
                        key={index}
                        className="md:basis-1/2 lg:basis-1/3 h-full"
                      >
                        <Card
                          className="cursor-pointer hover:scale-[1.02] transition-all h-full"
                          onClick={() => handlePuzzleSelect(puzzle)}
                        >
                          <CardHeader>
                            <CardTitle>Puzzle {index + 1}</CardTitle>
                            <CardDescription>
                              Game ID: {puzzle.gameId}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-center">
                              <div className="relative w-full pt-[100%]">
                                <div className="absolute top-0 left-0 right-0 bottom-0">
                                  <Chessboard
                                    id={`puzzle-${index}`}
                                    position={puzzle.fen}
                                    boardWidth={380}
                                    draggable={false}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                )}
                <CarouselPrevious className="absolute -left-24  dark:bg-black dark:text-white dark:hover:bg-black/90 bg-white text-black hover:bg-white/90" />
                <CarouselNext className="absolute -right-24  dark:bg-black dark:text-white dark:hover:bg-black/90 bg-white text-black hover:bg-white/90" />
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
