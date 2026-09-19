export class ProjectRepository {
  constructor(client) { this.client = client; }
  async create({ id, organizationId, code, name, currency }) {
    const result = id
      ? await this.client.query('insert into projects (id, organization_id, code, name, currency) values ($1,$2,$3,$4,$5) returning *', [id, organizationId, code, name, currency])
      : await this.client.query('insert into projects (organization_id, code, name, currency) values ($1,$2,$3,$4) returning *', [organizationId, code, name, currency]);
    return result.rows[0];
  }
  async listByOrganization(organizationId) {
    const result = await this.client.query('select * from projects where organization_id = $1 order by code', [organizationId]);
    return result.rows;
  }
}
