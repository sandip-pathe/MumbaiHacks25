import { ComplianceStatus, Run, Violation, AgentLogEvent, RegulatorStats } from './types';

export const RECENT_RUNS: Run[] = [
  {
    id: '1',
    commitMessage: 'Fix UPI daily limit enforcement',
    commitSha: 'abcd1234',
    time: '2 minutes ago',
    status: ComplianceStatus.FAIL,
    author: 'dev-team-lead'
  },
  {
    id: '2',
    commitMessage: 'Add SEBI risk disclosure banner',
    commitSha: 'ef567890',
    time: '23 minutes ago',
    status: ComplianceStatus.PASS,
    author: 'frontend-ninja'
  },
  {
    id: '3',
    commitMessage: 'Refactor investments service',
    commitSha: 'aa11bb22',
    time: '1 hour ago',
    status: ComplianceStatus.FAIL,
    author: 'backend-guru'
  }
];

export const VIOLATIONS: Violation[] = [
  {
    id: 'v1',
    file: 'payments/upi_flow.ts',
    rule: 'New UPI user limit (clause 4.1)',
    status: ComplianceStatus.FAIL,
    jiraId: 'JIRA-1024',
    regulator: 'RBI'
  },
  {
    id: 'v2',
    file: 'infra/db_location_config.ts',
    rule: 'Data Localization – India Region',
    status: ComplianceStatus.PASS,
    jiraId: '-',
    regulator: 'RBI'
  },
  {
    id: 'v3',
    file: 'kyc/kyc_rules.ts',
    rule: 'Periodic KYC Refresh',
    status: ComplianceStatus.PASS,
    jiraId: '-',
    regulator: 'RBI'
  },
  {
    id: 'v4',
    file: 'investments/trade_execution.ts',
    rule: 'Trade Risk Disclosure',
    status: ComplianceStatus.FAIL,
    jiraId: 'JIRA-2042',
    regulator: 'SEBI'
  },
  {
    id: 'v5',
    file: 'investments/algo_engine.ts',
    rule: 'Algo Trading – Live Risk Alerts',
    status: ComplianceStatus.NOT_INTEGRATED,
    jiraId: 'JIRA-2043',
    regulator: 'SEBI'
  },
  {
    id: 'v6',
    file: 'investments/portfolio_summary.tsx',
    rule: 'Fee Disclosure',
    status: ComplianceStatus.PASS,
    jiraId: '-',
    regulator: 'SEBI'
  }
];

export const AGENT_LOGS: AgentLogEvent[] = [
  { id: 1, agent: 'Orchestrator Agent', message: 'Detected UPI + Investments modules in commit abcd1234.', timestamp: 0 },
  { id: 2, agent: 'Regulation Reader Agent', message: 'Loaded RBI UPI rules (v4.1), SEBI trading rules (v2.3).', timestamp: 800 },
  { id: 3, agent: 'Code Scanner Agent', message: 'Analyzed 3 files: upi_flow.ts, trade_execution.ts, db_location_config.ts.', timestamp: 1800 },
  { id: 4, agent: 'Compliance Matcher Agent', message: 'Found 2 violations and 1 not-integrated rule.', timestamp: 2800 },
  { id: 5, agent: 'Jira Agent', message: 'Created tickets JIRA-1024, JIRA-2042, JIRA-2043.', timestamp: 3800 },
  { id: 6, agent: 'Audit Builder Agent', message: 'Compiling final compliance report and evidence.', timestamp: 4800 },
];

export const REGULATOR_STATS: RegulatorStats[] = [
  { regulator: 'RBI', critical: 1, medium: 0, passed: 3 },
  { regulator: 'SEBI', critical: 1, medium: 1, passed: 2 },
];