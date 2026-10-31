import express from "express";
import { requestBranchWork, requestLeave, requestRestock, myRequests, listRequests, resolveRequest } from "../controllers/accessController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);
router.post("/work", restrictTo("manager"), requestBranchWork);
router.post("/leave", restrictTo("manager"), requestLeave);
router.post("/restock", restrictTo("manager"), requestRestock);
router.get("/mine", restrictTo("manager"), myRequests);
router.get("/", restrictTo("admin"), listRequests);
router.patch("/:id/resolve", restrictTo("admin"), resolveRequest);
export default router;