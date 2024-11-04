import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import clientPromise from "../../../../lib/mongodb";

// app/api/auth/register/route.js
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(
        JSON.stringify({ message: "Please provide all required fields" }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const client = await clientPromise;
    const db = client.db(process.env.MONGO_DB);
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return new Response(JSON.stringify({ message: "User already exists" }), {
        status: 400,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertedId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return new Response(
      JSON.stringify({
        token,
        userId: result.insertedId,
        message: "Registration successful",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        message: "Server error",
        error: error.message || "Unknown error occurred",
      }),
      { status: 500 }
    );
  }
}
