import {
  generatePrivateKeyAndContractAddress,
  UniswapClient,
} from "ph-typescript-lib-uniswap";

const defaultChainId = process.env.DEFAULT_CHAIN_ID || 1;
const defaultRpcUrl = process.env.DEFAULT_RPC_URL || "https://eth.llamarpc.com";
const defaultApiKey =
  process.env.DEFAULT_API_KEY || "d9023r892hrwiuhag83tzgqg438ct";

const getClient = (req, privKey) => {
  try {
    if (req.headers["x-api-key"] !== defaultApiKey) {
      res.status(401).json({ error: "Unauthorized 'x-api-key'" });
      return null;
    }
    const { chainId, rpcUrl } = req.query;
    return new UniswapClient({
      chainId: Number(chainId) || defaultChainId,
      rpcUrl: String(rpcUrl) || defaultRpcUrl,
      privKey,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
  return null;
};

const getInfoAndClient = async (req) => {
  try {
    const { mnemonic, tokenIn } = req.query;
    if (!mnemonic || !tokenIn) {
      res.status(400).json({ error: "'mnemonic' and 'tokenIn' are required" });
      return null;
    }

    const info = await generatePrivateKeyAndContractAddress(
      Buffer.from(String(mnemonic), "base64").toString("utf-8"),
      String(tokenIn),
    );

    const client = getClient(req, info.key);
    if (!client) {
      return null;
    }

    if (!info.key) {
      res
        .status(400)
        .json({ error: `Private key was not generated for ${tokenIn}` });
      return null;
    }

    if (!info.address) {
      res
        .status(400)
        .json({ error: `Contract address was not generated for ${tokenIn}` });
      return null;
    }

    return { info, client };
  } catch (error) {
    res.status(500).json({ error });
  }
  return null;
};

export const balance = async (req, res) => {
  try {
    const { info, client } = await getInfoAndClient(req);
    if (!info || !client) {
      return;
    }
    res.status(200).json({ balance: await client.getBalance(info.address) });
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const trade = async (req, res, preview) => {
  try {
    const { tokenIn, tokenOut, amountToSwap, needApproval, approvalMax } =
      req.body;

    if (!tokenIn || !tokenOut || amountToSwap === undefined) {
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

    if (!tokenIn.key || !tokenOut.key) {
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

    const client = getClient(req, infoIn.address);
    if (!client) {
      return;
    }

    const result = await client.swapTokens(
      infoIn.address,
      infoOut.address,
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
