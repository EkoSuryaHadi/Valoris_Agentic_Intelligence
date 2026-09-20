import { createApiServer } from '../packages/api/src/server.js';
import { createJwksVerifier } from '../packages/api/src/auth.js';
import { createPool } from '../packages/db/src/pool.js';
import { ProjectRepository } from '../packages/db/src/repositories.js';
import { HierarchyRepository, BaselineRepository, TransactionRepository, ForecastRepository, EvmRepository, ChangeRepository, RiskRepository, FindingRepository, CashFlowRepository, AuditRepository } from '../packages/db/src/domain-repositories.js';
import { loadDatabaseStores } from '../packages/api/src/database-stores.js';

function createTokenVerifierFromEnvironment() {
  const { AUTH_JWKS_URL, AUTH_ISSUER_URL, AUTH_AUDIENCE } = process.env;
  if (!AUTH_JWKS_URL || !AUTH_ISSUER_URL || !AUTH_AUDIENCE) return undefined;
  return createJwksVerifier({ jwksUrl: AUTH_JWKS_URL, issuer: AUTH_ISSUER_URL, audience: AUTH_AUDIENCE });
}

export function createVercelHandler({
  tokenVerifier = createTokenVerifierFromEnvironment(),
  allowInsecureDevHeaders = process.env.ALLOW_INSECURE_DEV_HEADERS ? process.env.ALLOW_INSECURE_DEV_HEADERS === 'true' : !createTokenVerifierFromEnvironment()
} = {}) {
  let serverPromise;
  const getServer = async () => {
    if (!serverPromise) {
      serverPromise = (async () => {
        if (!process.env.DATABASE_URL) return createApiServer({ tokenVerifier, allowInsecureDevHeaders });
        const pool = createPool({ max: 1 });
        const stores = await loadDatabaseStores(pool);
        const projectRepository = new ProjectRepository(pool);
        const hierarchyRepository = new HierarchyRepository(pool);
        const baselineRepository = new BaselineRepository(pool);
        const transactionRepository = new TransactionRepository(pool);
        const forecastRepository = new ForecastRepository(pool);
        const evmRepository = new EvmRepository(pool);
        const changeRepository = new ChangeRepository(pool);
        const riskRepository = new RiskRepository(pool);
        const findingRepository = new FindingRepository(pool);
        const cashFlowRepository = new CashFlowRepository(pool);
        const auditRepository = new AuditRepository(pool);
        return createApiServer({
          ...stores,
          persistence: {
            project: projectRepository,
            hierarchy: { create: (node) => hierarchyRepository.create('wbs_nodes', node) },
            baseline: {
              create: (baseline) => baselineRepository.create(baseline),
              addLine: (line) => baselineRepository.addLine(line)
            },
            transaction: {
              commitment: (value) => transactionRepository.createCommitment({ id: value.id, projectId: value.projectId, referenceNo: value.referenceNo, vendorName: value.vendor, amount: value.amount }),
              actual: (value) => transactionRepository.postActual(value),
              accrual: (value) => transactionRepository.createAccrual(value)
            },
            forecast: { save: (value) => forecastRepository.save(value) },
            evm: { save: (value) => evmRepository.save(value) },
            change: { create: (value) => changeRepository.create(value), incorporate: (value) => changeRepository.incorporate(value) },
            risk: { create: (value) => riskRepository.create(value) },
            finding: { create: (value) => findingRepository.create(value), review: (value) => findingRepository.review(value) },
            cashFlow: { save: (value) => cashFlowRepository.save(value) },
            audit: { record: (value) => auditRepository.record(value) }
          },
          tokenVerifier,
          allowInsecureDevHeaders
        });
      })();
    }
    return serverPromise;
  };
  return async (request, response) => (await getServer()).emit('request', request, response);
}

const handler = createVercelHandler();
export default handler;
