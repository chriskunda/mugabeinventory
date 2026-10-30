import Branch from "../models/Branch.js";

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findBranch = async (name) => {
  const clean = String(name || "").trim();
  const branch = clean && (await Branch.findOne({ name: new RegExp(`^${escapeRegex(clean)}$`, "i") }));
  if (!branch) {
    const e = new Error(`Unknown branch "${clean}"`);
    e.statusCode = 400;
    throw e;
  }
  return branch;
};

// Old name kept so existing imports keep working. It no longer creates branches.
export const findOrCreateBranch = findBranch;