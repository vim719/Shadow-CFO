import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { createClient } from "@supabase/supabase-js";

export interface AuditRequest {
  transactionId: string;
  amount: number;
  senderAddress: string;
  receiverAddress: string;
}

export interface AuditResponse {
  success: boolean;
  riskScore: number;
  verdict: string;
  providerUsed: string;
  modelUsed: string;
}

const RPC_URL = process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc-testnet.0g.ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function executeVerifiableAudit(request: AuditRequest): Promise<AuditResponse> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const privateKey = process.env.ZERO_G_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Critical deployment failure: Zero G private key identifier is completely unconfigured.");
    }

    const wallet = new ethers.Wallet(privateKey, provider);

    // Gas check: abort before spending if wallet is nearly empty.
    const balance = await provider.getBalance(wallet.address);
    if (balance < ethers.parseEther("0.01")) {
      const { data: tokenData } = await supabase.rpc("read_vault_secret", {
        secret_name: "TELEGRAM_BOT_TOKEN",
      });
      const { data: chatData } = await supabase.rpc("read_vault_secret", {
        secret_name: "TELEGRAM_CHAT_ID",
      });
      if (tokenData && chatData) {
        await fetch(`https://api.telegram.org/bot${tokenData}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatData,
            text: "⚠️ URGENT: 0G Compute Wallet is low on gas!",
          }),
        }).catch(() => {});
      }
      throw new Error("0G compute wallet balance below minimum gas threshold (0.01 A0GI)");
    }

    const broker = await createZGComputeNetworkBroker(wallet);

    const rawServices = await broker.inference.listService();
    const availableServices = rawServices.filter(
      (s: any) => s.serviceType === "chatbot" || s.serviceType === "inference"
    );
    if (availableServices.length === 0) {
      throw new Error("Network execution failure: No matching financial reasoning models are available on the 0G compute grid.");
    }

    const targetService = availableServices[0]!;
    const providerAddress = targetService.provider;

    await broker.inference.acknowledgeProviderSigner(providerAddress);
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    const authHeaders = await broker.inference.getRequestHeaders(providerAddress);

    const systemInstruction = "You are a secure, non-logging compliance AI running inside an isolated TEE wrapper. Evaluate all transaction contexts strictly for institutional risk indicators.";
    const userPrompt = `Audit Details: ID=${request.transactionId}, Vol=${request.amount}, Src=${request.senderAddress}, Dst=${request.receiverAddress}. Output valid JSON containing exact keys "riskScore" (0-100) and "verdict" (string).`;

    const networkResponse = await fetch(`${endpoint}/v1/proxy/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.0,
      }),
    });

    if (!networkResponse.ok) {
      throw new Error(`0G Decentralized Node error: Connection dropped with network response status code ${networkResponse.status}`);
    }

    const completionPayload = await networkResponse.json();
    const rawContentString = completionPayload.choices[0].message.content.trim();
    const parsedEvaluation = JSON.parse(rawContentString);
    const numericalRiskScore = Number(parsedEvaluation.riskScore);
    const analyticalVerdict = parsedEvaluation.verdict || "No verdict provided by isolated enclave node.";

    const { error: dbUpdateError } = await supabase
      .from("audited_transactions")
      .insert([{
        transaction_id: request.transactionId,
        risk_score: numericalRiskScore,
        verdict_summary: analyticalVerdict,
        provider_address: providerAddress,
        model_signature: model,
        computed_at: new Date().toISOString(),
      }]);

    if (dbUpdateError) {
      throw new Error(`Database synchronization failure: ${dbUpdateError.message}`);
    }

    return {
      success: true,
      riskScore: numericalRiskScore,
      verdict: analyticalVerdict,
      providerUsed: providerAddress,
      modelUsed: model,
    };

  } catch (globalExecutionError: any) {
    console.error("Fatal 0G Verifiable Compute exception caught:", globalExecutionError);
    return {
      success: false,
      riskScore: 100,
      verdict: `Enclave Execution Crash: ${globalExecutionError.message || "Unknown network processing error."}`,
      providerUsed: "0x0000000000000000000000000000000000000000",
      modelUsed: "fallback-emergency-stub",
    };
  }
}
