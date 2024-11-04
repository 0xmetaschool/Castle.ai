import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../../lib/mongodb";

// app/api/auth/login/route.js
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);

    // Check if user exists
    if (!db) {
      throw new Error("Failed to get database instance");
    }

    const user = await db.collection("users").findOne({ email });

    // Check if password is correct
    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    // Check if password is valid
    if (!isValidPassword) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return new Response(
      JSON.stringify({ token, userId: user._id, message: "Login successful" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        message: "Server error",
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
      }
    );
  }
}
