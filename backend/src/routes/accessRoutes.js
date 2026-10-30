import express from "express";
import { requestBranchWork, myRequests, listRequests, resolveRequest } from "../controllers/accessController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/work", restrictTo("manager"), requestBranchWork);
router.get("/mine", restrictTo("manager"), myRequests);
router.get("/", restrictTo("admin"), listRequests);
router.patch("/:id/resolve", restrictTo("admin"), resolveRequest);
export default router;