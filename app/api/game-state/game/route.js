import { ObjectId } from "mongodb";
import clientPromise from "../../../../lib/mongodb";
import { authenticateToken } from "../../../../lib/auth";
import { NextResponse } from "next/server";

// GET /api/game-state
async function getHandler(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  // Check if user id is provided
  if (!userId) {
    return NextResponse.json(
      { message: "Missing user id parameter" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    // Check if user exists
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    // Return saved game state or null if not found
    return NextResponse.json({
      savedGameState: user.savedGameState || null,
      lastGameTimestamp: user.lastGameTimestamp || null,
    });
  } catch (error) {
    console.error("Error fetching saved game:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

async function postHandler(req) {
  try {
    const { userId, gameState } = await req.json();

    if (!userId || !gameState) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          savedGameState: gameState,
          lastGameTimestamp: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Game state saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving game state:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export const GET = authenticateToken(getHandler);
export const POST = authenticateToken(postHandler);
