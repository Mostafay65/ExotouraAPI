import { CronJob } from "cron";
import { reauthorizePayments } from "../controllers/paymentController.js";

new CronJob(
  "0 0 8 * * *",
  async () => {
    await reauthorizePayments();
    console.log("Reauthorizing process completed at", new Date().toISOString());
  },
  null,
  true,
  "Africa/Cairo"
);
