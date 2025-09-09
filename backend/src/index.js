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

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("App API is running 🚀");
});

app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/bloodmetals", bloodMetalsRoutes);

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
