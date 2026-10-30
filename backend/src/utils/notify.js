import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const notifyAdmins = async (title, message, kind = "info") => {
  const admins = await User.find({ role: "admin", active: true }).select("_id");
  if (admins.length) await Notification.insertMany(admins.map((a) => ({ user: a._id, title, message, kind })));
};
export const notifyUser = (user, title, message, kind = "info") =>
  Notification.create({ user, title, message, kind });