import jwt from "jsonwebtoken";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const sendTokenCookie = (res, user) => {
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // requires HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: THIRTY_DAYS_MS,
  });

  return token;
};
