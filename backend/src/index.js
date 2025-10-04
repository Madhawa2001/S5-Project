// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import passport from "passport";
import "./config/passport.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import bloodMetalsRoutes from "./routes/bloodMetals.js";
import adminRoutes from "./routes/admin.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import mlRoutes from "./routes/ml.js";

const app = express();
//dotenv.config();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// global rate limiter
app.use(globalLimiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "ThisIsASecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("App API is running.");
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/patients", patientRoutes);
app.use("/bloodmetals", bloodMetalsRoutes);
app.use("/ml", mlRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
