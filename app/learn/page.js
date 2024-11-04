"use client";
import { useState, useEffect, useCallback } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const openingsPerPage = 10;

export default function Learn() {
  const [openings, setOpenings] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [game, setGame] = useState(new Chess());
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState(null);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoadingOpenings, setIsLoadingOpenings] = useState(true);

  // Function to fetch openings
  const fetchOpenings = useCallback(async (currentPage) => {
    setIsLoadingOpenings(true);
    try {
      const res = await fetch(
        `/api/openings?page=${currentPage + 1}&limit=${openingsPerPage}`
      );
      const data = await res.json();
      setOpenings(data.openings);
      setTotalPages(100);
    } catch (error) {
      console.error("Error fetching openings:", error);
      setTotalPages(1);
    } finally {
      setIsLoadingOpenings(false); // Set loading to false when fetch completes
    }
  }, []);

  // Fetch user data when the component mounts
  useEffect(() => {
    setMounted(true);
    const id = searchParams.get("id");
    if (id) {
      setUserId(id);
      fetchUserData(id);
    }

    const currentPage = parseInt(searchParams.get("page") || "0", 10);
    setPage(currentPage);
    fetchOpenings(currentPage);
  }, [searchParams, fetchOpenings]);

  // Fetch user data
  const fetchUserData = async (id) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`/api/user?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
      } else {
        throw new Error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      router.push("/");
    }
  };
  // Handle page change when pagination is clicked
  const handlePageChange = useCallback(
    (newPage) => {
      setPage(newPage);
      router.push(`/learn?id=${userId}&page=${newPage}`);
      fetchOpenings(newPage);
    },
    [userId, router, fetchOpenings]
  );

  // Handle game change when opening is hovered on
  const handleGameChange = (newGame) => {
    setGame(new Chess(newGame.fen()));
  };

  // Handle opening click for an individual opening
  const handleOpeningClick = (opening) => {
    const encodedName = encodeURIComponent(opening.name);
    const encodedFen = encodeURIComponent(opening.fen);
    const encodedId = encodeURIComponent(opening._id);
    router.push(
      `/learn/${encodedName}/${encodedFen}/${encodedId}?id=${userId}`
    );
  };

  //  Handle sign out
  const handleSignOut = () => {
    localStorage.removeItem("jwtToken");
    router.push("/");
  };

  // Show toast
  const showToast = (title, description, variant = "default") => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  // Skeleton UI
  const OpeningsGridSkeleton = () => (
    <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 overflow-y-auto max-h-[calc(100vh-350px)]">
      {[...Array(10)].map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-black shadow rounded-lg p-2 border-2 border-gray-300 dark:border-gray-700"
        >
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );

  // Mount Skeleton UI for the entire page when the component mounts
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col">
        <nav className="py-4 px-6 flex justify-between items-center bg-white dark:bg-black shadow-md fixed">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        </nav>

        <div className="flex-grow flex items-center justify-center p-6">
          <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto gap-8">
            <div className="w-full md:w-1/2 flex items-center justify-center">
              <Skeleton className="h-[550px] w-[550px]" />
            </div>

            <div className="w-full md:w-1/2 flex flex-col">
              <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 overflow-y-auto max-h-[calc(100vh-350px)]">
                {[...Array(10)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-black shadow rounded-lg p-2 border-2 border-gray-300 dark:border-gray-700"
                  >
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>

              <div className="mt-auto flex justify-center">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-10 w-10 rounded-lg" />
                  ))}
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white dark:bg-black flex flex-col"
    >
      <nav className="py-4 px-6 flex justify-between items-center bg-white dark:bg-black fixed w-full">
        <div
          className="text-2xl font-bold text-gray-800 dark:text-white cursor-pointer"
          onClick={() => router.push("/home?id=" + userId)}
        >
          Castle.ai
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 dark:text-white text-black" />
            ) : (
              <Sun className="h-5 w-5" />
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

      <div className="flex-grow flex items-center justify-center p-6">
        <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto gap-8">
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <Chessboard
              id="BasicBoard"
              boardWidth={550}
              position={game.fen()}
              onMove={() => handleGameChange(game)}
            />
          </div>
          <div className="w-full md:w-1/2 flex flex-col">
            {isLoadingOpenings ? (
              <OpeningsGridSkeleton />
            ) : (
              <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 overflow-y-auto max-h-[calc(100vh-350px)]">
                {openings.map((opening, index) => (
                  <div
                    key={`${opening.id}_${index}`}
                    className="bg-white dark:bg-black dark:text-white text-black shadow rounded-lg p-2 transition-transform hover:scale-105 hover:shadow-lg cursor-pointer border-2 border-gray-300 dark:border-gray-700"
                    onClick={() => handleOpeningClick(opening)}
                    onMouseEnter={() => {
                      try {
                        const newGame = new Chess(opening.fen);
                        handleGameChange(newGame);
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    <h3 className="text-md font-medium mb-2 dark:text-white ">
                      {opening.name.length > 50
                        ? `${opening.name.slice(0, 47)}...`
                        : opening.name}
                    </h3>
                  </div>
                ))}
              </div>
            )}
            <Pagination className="mt-auto  dark:text-white text-black">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(0, page - 1))}
                    className={`${
                      page === 0 ? "pointer-events-none opacity-50" : ""
                    } dark:text-white text-black`}
                  />
                </PaginationItem>
                {totalPages > 0 &&
                  [...Array(Math.min(5, totalPages))].map((_, index) => {
                    let pageNumber = index;
                    if (page > 2 && totalPages > 5) {
                      pageNumber = page - 2 + index;
                    }
                    if (pageNumber < totalPages) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={page === pageNumber}
                            className={
                              page === pageNumber
                                ? `bg-white dark:bg-black border-black dark:border-white dark:text-white text-black`
                                : ""
                            }
                          >
                            {pageNumber + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                {totalPages > 5 && (
                  <PaginationEllipsis className="dark:text-white text-black" />
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages - 1, page + 1))
                    }
                    className={`${
                      page === 0 ? "pointer-events-none opacity-50" : ""
                    } dark:text-white text-black`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
