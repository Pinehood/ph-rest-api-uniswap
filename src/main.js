import express from "express";
import { UniswapClient } from "ph-typescript-lib-uniswap";

const app = express();
app.use(express.json());

const defaultChainId = 1;
const defaultRpcUrl = "https://eth.llamarpc.com";
const defaultApiKey = "d9023r892hrwiuhag83tzgqg438ct";

const getClient = (req) => {
  if (req.headers["x-api-key"] !== defaultApiKey) {
    res.status(401).json({ error: "Unauthorized 'x-api-key'" });
    return null;
  }
  const { chainId, rpcUrl, privKey } = req.query;
  if (!privKey) {
    res.status(400).json({ error: "'privKey' is required" });
    return null;
  }
  return new UniswapClient({
    chainId: Number(chainId) || defaultChainId,
    rpcUrl: String(rpcUrl) || defaultRpcUrl,
    privKey: Buffer.from(String(privKey), "base64").toString("utf-8"),
  });
};

app.get("/balance", async (req, res) => {
  try {
    const client = getClient(req);
    if (!client) {
      return;
    }

    const { tokenAddress } = req.query;

    if (!tokenAddress) {
      res.status(400).json({ error: "'tokenAddress' is required" });
      return;
    }

    const balance = await client.getBalance(String(tokenAddress));
    res.status(200).json({ balance });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.post("/trade", async (req, res) => {
  try {
    const {
      tokenInAddress,
      tokenOutAddress,
      amountToSwap,
      needApproval,
      approvalMax,
    } = req.body;

    if (!tokenInAddress || !tokenOutAddress || amountToSwap === undefined) {
      res.status(400).json({
        error:
          "'tokenInAddress', 'tokenOutAddress', and 'amountToSwap' are required",
      });
      return;
    }

    const client = getClient(req);
    if (!client) {
      return;
    }

    const result = await client.swapTokens(
      String(tokenInAddress),
      String(tokenOutAddress),
      Number(amountToSwap),
      false,
      needApproval,
      approvalMax,
    );

    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.post("/preview", async (req, res) => {
  try {
    const client = getClient(req);
    if (!client) {
      return;
    }

    const {
      tokenInAddress,
      tokenOutAddress,
      amountToSwap,
      needApproval,
      approvalMax,
    } = req.body;

    if (!tokenInAddress || !tokenOutAddress || amountToSwap === undefined) {
      res.status(400).send({
        error:
          "'tokenInAddress', 'tokenOutAddress', and 'amountToSwap' are required",
      });
      return;
    }

    const result = await client.swapTokens(
      String(tokenInAddress),
      String(tokenOutAddress),
      Number(amountToSwap),
      true,
      needApproval,
      approvalMax,
    );

    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.listen(process.env.PORT || 6000);
