export interface WbsNode {
  id: string;
  project_id?: string;
  projectId?: string;
  code: string;
  name: string;
  parent_id?: string | null;
  parentId?: string | null;
  level?: number;
  status?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CostCode {
  id: string;
  project_id?: string;
  projectId?: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Baseline {
  id: string;
  project_id: string;
  code: string;
  name: string;
  version?: number;
  status: 'draft' | 'under_review' | 'approved' | 'active' | 'superseded';
  approved_at?: string | null;
  created_at?: string;
}

export interface BudgetLine {
  id: string;
  baseline_id: string;
  wbs_node_id: string;
  cost_element_code: string;
  amount: number;
  currency: string;
  notes?: string;
}

export interface Commitment {
  id: string;
  project_id: string;
  wbs_node_id?: string;
  vendor_name: string;
  po_number?: string;
  committed_amount: number;
  currency: string;
  status: 'draft' | 'approved' | 'closed' | 'cancelled';
  created_at?: string;
}

export interface ActualCost {
  id: string;
  project_id: string;
  period_id?: string;
  wbs_node_id?: string;
  invoice_reference?: string;
  actual_amount: number;
  currency: string;
  transaction_date?: string;
  created_at?: string;
}

export interface Accrual {
  id: string;
  project_id: string;
  period_id?: string;
  wbs_node_id?: string;
  amount: number;
  currency: string;
  justification?: string;
  status: 'pending' | 'posted' | 'reversed';
  created_at?: string;
}

export interface Forecast {
  id: string;
  project_id: string;
  period_id?: string;
  wbs_node_id?: string;
  method: 'etc_run_rate' | 'etc_cpi' | 'manual' | 'ai_composite';
  etc_amount: number;
  eac_amount: number;
  confidence_score?: number;
  rationale?: string;
  created_at?: string;
}

export interface EvmMetrics {
  id: string;
  project_id: string;
  period_id?: string;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  cv: number;
  sv: number;
  bac: number;
  etc: number;
  eac: number;
  tcpi: number;
  created_at?: string;
}

export interface ChangeOrder {
  id: string;
  project_id?: string;
  projectId?: string;
  title: string;
  description?: string;
  amount_delta?: number;
  amountDelta?: number;
  estimatedCost?: number;
  exposure?: number;
  schedule_delta_days?: number;
  scheduleDeltaDays?: number;
  status: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CashFlow {
  id: string;
  project_id?: string;
  period_label?: string;
  inflow?: number;
  outflow?: number;
  net_cash_flow?: number;
  cumulative_balance?: number;
  created_at?: string;
  [key: string]: any;
}

export interface Risk {
  id: string;
  project_id?: string;
  projectId?: string;
  title: string;
  category?: string;
  probability?: number; // 0-1
  impact_amount?: number;
  impactAmount?: number;
  expected_value?: number;
  expectedValue?: number;
  exposure?: number;
  status: string;
  mitigation_strategy?: string;
  mitigationStrategy?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface AgentFinding {
  id: string;
  project_id?: string;
  projectId?: string;
  agent_name?: string;
  agentName?: string;
  agent_type?: string;
  agentType?: string;
  finding_type?: string;
  findingType?: string;
  severity?: string;
  title?: string;
  explanation?: string;
  statement?: string;
  evidence?: any;
  recommendation?: string;
  suggested_action?: any;
  status?: string;
  review_notes?: string;
  reviewNotes?: string;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface AgentRun {
  id: string;
  project_id?: string;
  agent_name?: string;
  status?: string;
  started_at?: string;
  completed_at?: string;
  findings_count?: number;
  summary?: string;
  error?: string;
  [key: string]: any;
}

export interface AuditEvent {
  id: string;
  project_id?: string;
  event_type?: string;
  action?: string;
  actor_id?: string;
  actorType?: string;
  actorUserId?: string;
  payload?: any;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}
