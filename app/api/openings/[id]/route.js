// app/api/openings/[id]/route.js
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);
    const { id } = params;
    // Check if opening exists
    const opening = await db.collection("moves").findOne({
      _id: new ObjectId(id),
    });
    // Return error if opening doesn't exist
    if (!opening) {
      return new Response(JSON.stringify({ error: "Opening not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Return opening
    return new Response(JSON.stringify({ opening }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(
      JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
