// utils/generateTokens.js
import jwt from "jsonwebtoken";

export function generateTokens(user) {
  // user may include roles via prisma includes
  const roles = (user.roles || []).map((ur) => ur.role?.name).filter(Boolean);

  const payload = {
    userId: user.id,
    email: user.email,
    roles,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
}
