import Branch from "../models/Branch.js";

export const ALLOWED_BRANCHES = ["Kimironko", "Sonatube", "Kinamba"];

export const findOrCreateBranch = async (name) => {
  const canonical = ALLOWED_BRANCHES.find(
    (branch) => branch.toLowerCase() === String(name || "").trim().toLowerCase()
  );
  if (!canonical) {
    const error = new Error(`Unknown branch "${name}"`);
    error.statusCode = 400;
    throw error;
  }
  return (await Branch.findOne({ name: canonical })) || Branch.create({ name: canonical });
};
