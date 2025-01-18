import { Request, Response } from "express";
import {
  generatePrivateKeyAndContractAddress,
  UniswapClient,
} from "ph-typescript-lib-uniswap";

const defaultChainId = Number(process.env.DEFAULT_CHAIN_ID) || 1;
const defaultRpcUrl =
  String(process.env.DEFAULT_RPC_URL) || "https://eth.llamarpc.com";
const defaultApiKey =
  String(process.env.DEFAULT_API_KEY) || "d9023r892hrwiuhag83tzgqg438ct";
const defaultSlippage = Number(process.env.DEFAULT_SLIPPAGE) || 0.5;
const defaultDeadline = Number(process.env.DEFAULT_DEADLINE) || 15;

export const getClient = (req: Request, res: Response, privKey: string) => {
  try {
    if (req.headers["x-api-key"] !== defaultApiKey) {
      res.status(401).json({ error: "Unauthorized 'x-api-key'" });
      return null;
    }
    const {
      chainId = defaultChainId,
      rpcUrl = defaultRpcUrl,
      slippage = defaultSlippage,
      deadline = defaultDeadline,
    } = req.query;
    return new UniswapClient({
      privKey,
      chainId: Number(chainId),
      rpcUrl: String(rpcUrl),
      slippage: Number(slippage),
      deadline: Number(deadline),
    });
  } catch (error) {
    res.status(500).json({ error });
  }
  return null;
};

export const getInfoAndClient = async (req: Request, res: Response) => {
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

    const client = getClient(req, res, info.key);
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
