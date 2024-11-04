import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";
import { authenticateToken } from "../../../lib/auth";
import { NextResponse } from "next/server";
// GET /api/user
async function handler(req) {
  const { searchParams } = new URL(req.url);
  const _id = searchParams.get("id");
  // Check if user id is provided
  if (!_id) {
    return NextResponse.json(
      { message: "Missing id parameter" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);
    // Check if user exists
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(_id) });
    // Return saved game state or null if not found
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    // Return saved game state or null if not found
    return NextResponse.json({ username: user.email, _id: user._id });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export const GET = authenticateToken(handler);
