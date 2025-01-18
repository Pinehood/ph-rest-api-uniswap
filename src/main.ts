(async function () {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {}
})();

import express, { json } from "express";
import { balance, ping, trade } from "./logic";

const app = express();
app.use(json());

app.get("/ping", ping);
app.get("/balance", balance);
app.post("/trade", async (req, res) => trade(req, res, false));
app.post("/preview", async (req, res) => trade(req, res, true));

app.listen(process.env.PORT ?? 3000, () => console.log("Server is running"));
