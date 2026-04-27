import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import swipesRouter from "./swipes";
import matchesRouter from "./matches";
import exchangesRouter from "./exchanges";
import creditsRouter from "./credits";
import gamificationRouter from "./gamification";
import nudgesRouter from "./nudges";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";
import ledgerRouter from "./ledger";
import chatRouter from "./chat";
import verificationRouter from "./verification";
import onboardingRouter from "./onboarding";
import aiRouter from "./ai";
import sessionsRouter from "./sessions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(swipesRouter);
router.use(matchesRouter);
router.use(exchangesRouter);
router.use(creditsRouter);
router.use(gamificationRouter);
router.use(nudgesRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);
router.use(ledgerRouter);
router.use(chatRouter);
router.use(verificationRouter);
router.use(onboardingRouter);
router.use(aiRouter);
router.use(sessionsRouter);

export default router;
