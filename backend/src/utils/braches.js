import Branch from "../models/Branch.js";

export const ALLOWED_BRANCHES = ["Kimironko", "Sonatube", "Kinamba"];

export const findOrCreateBranch = async (name) => {
  const canonical = ALLOWED_BRANCHES.find(
    (b) => b.toLowerCase() === String(name || "").trim().toLowerCase()
  );
  if (!canonical) {
    const e = new Error(`Unknown branch "${name}"`);
    e.statusCode = 400;
    throw e;
  }
  return (await Branch.findOne({ name: canonical })) || Branch.create({ name: canonical });
};