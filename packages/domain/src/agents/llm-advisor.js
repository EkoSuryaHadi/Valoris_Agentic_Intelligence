/**
 * Sumopod OpenAI-compatible LLM Advisory Adapter
 * Strictly non-mutating / read-only: Explain & Recommend only.
 */
export class SumopodLlmAdvisor {
  constructor({
    apiKey = process.env.SUMOPOD_API_KEY || process.env.LLM_API_KEY || '',
    baseUrl = process.env.LLM_BASE_URL || 'https://ai.sumopod.com/v1',
    model = process.env.LLM_MODEL || 'gpt-4o-mini',
    fetcher = fetch
  } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.fetcher = fetcher;
  }

  /**
   * Advise on project questions using ledger context.
   * @param {Object} params
   * @param {string} params.question
   * @param {Object} params.ledgerContext Project metrics, EVM, commitments, baselines
   * @returns {Promise<{ answer: string, evidence: Object }>}
   */
  async advise({ question, ledgerContext }) {
    const systemPrompt = `You are Valoris Agentic Intelligence — a Senior Project Controls & Cost Engineering Advisor.
Your responsibilities:
1. Explain variances, performance indexes (CPI, SPI, TCPI), and commitment gaps using provided ledger data.
2. Formulate rigorous, defensible recommendations for human-in-the-loop review.
3. STRICT CONSTRAINT: You are purely an ADVISORY, READ-ONLY agent. NEVER execute or claim to have executed mutations or database updates.
4. Always cite specific figures, control accounts, and variance deltas from the ledger evidence.`;

    const userPrompt = `Project Ledger Context:
${JSON.stringify(ledgerContext, null, 2)}

User Inquiry:
"${question}"

Provide a concise, professional engineering assessment explaining the root causes and proposing concrete human-approved corrective actions.`;

    if (!this.apiKey) {
      // Return structured offline advisory if no API key is set in environment
      return {
        answer: `[Sumopod Advisor - Offline Mode] Based on active project ledgers, CPI is currently ${ledgerContext?.evm?.cpi ?? '0.91'}. Primary drivers include commitment pressure against CBS budget lines. Corrective recommendation: Review open change orders and execute a EAC forecast recalibration.`,
        evidence: {
          metricsEvaluated: ['CPI', 'SPI', 'BAC', 'EAC'],
          offlineSimulated: true
        }
      };
    }

    const response = await this.fetcher(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Sumopod LLM API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response generated.';

    return {
      answer,
      evidence: {
        model: this.model,
        ledgerSnapshot: {
          cpi: ledgerContext?.evm?.cpi,
          spi: ledgerContext?.evm?.spi,
          bac: ledgerContext?.evm?.bac,
          eac: ledgerContext?.evm?.eac
        }
      }
    };
  }
}
