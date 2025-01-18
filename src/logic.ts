import { Request, Response } from "express";
import { generatePrivateKeyAndContractAddress } from "ph-typescript-lib-uniswap";
import { getInfoAndClient, getClient } from "./utils";

export const balance = async (req: Request, res: Response) => {
  try {
    const { info, client } = (await getInfoAndClient(req, res)) ?? {};
    if (!info || !client || !info.address) {
      return;
    }
    res.status(200).json({ balance: await client.getBalance(info.address) });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const trade = async (req: Request, res: Response, preview: boolean) => {
  try {
    const { tokenIn, tokenOut, amountToSwap, needApproval, approvalMax } =
      req.body;
    const mnemonic = req.query.mnemonic as string;
    if (!mnemonic || !tokenIn || !tokenOut || amountToSwap === undefined) {
      res.status(400).json({
        error:
          "'mnemonic', 'tokenIn', 'tokenOut', and 'amountToSwap' are required",
      });
      return;
    }

    const infoIn = await generatePrivateKeyAndContractAddress(
      Buffer.from(mnemonic, "base64").toString("utf-8"),
      String(tokenIn),
    );

    const infoOut = await generatePrivateKeyAndContractAddress(
      Buffer.from(mnemonic, "base64").toString("utf-8"),
      String(tokenOut),
    );

    if (!infoIn.key || !infoOut.key) {
      res
        .status(400)
        .json({ error: "Private keys were not properly generated" });
      return;
    }

    if (!infoIn.address || !infoOut.address) {
      res
        .status(400)
        .json({ error: "Token addresses were not properly generated" });
      return;
    }

    const client = getClient(req, res, infoIn.key);
    if (!client) {
      return;
    }

    const result = await client.swapTokens(
      infoIn.contract ?? infoIn.address,
      infoOut.contract ?? infoOut.address,
      Number(amountToSwap),
      Boolean(preview),
      Boolean(needApproval),
      Boolean(approvalMax),
    );

    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const ping = (_: Request, res: Response) => {
  res.status(200).json({ pong: true });
};
