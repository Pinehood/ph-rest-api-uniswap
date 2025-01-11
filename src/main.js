(async function () {
  const dotenv = await import("dotenv");
  dotenv.config();
})();

import express from "express";
import { balance, trade } from "./utils";

const app = express();
app.use(express.json());
app.get("/ping", (_, res) => res.status(200).json({ pong: true }));
app.get("/balance", async (req, res) => balance(req, res));
app.post("/trade", async (req, res) => trade(req, res, false));
app.post("/preview", async (req, res) => trade(req, res, true));
app.listen(process.env.PORT || 6000);
