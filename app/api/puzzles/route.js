import clientPromise from "../../../lib/mongodb";
// GET /api/puzzles
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);
    // Check if puzzle exists
    const puzzle = await db.collection("puzzle").findOne({});
    //  Return error if puzzle doesn't exist
    if (!puzzle) {
      return new Response(
        JSON.stringify({ message: "No puzzle found in the collection" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    // Return puzzle
    return new Response(JSON.stringify(puzzle), {
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
