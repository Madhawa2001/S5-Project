// middleware/rateLimit.js
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 10 requests per windowMs (auth endpoints)
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // global upper bound
  message: { error: "Too many requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
