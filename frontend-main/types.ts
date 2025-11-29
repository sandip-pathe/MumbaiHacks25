export enum ComplianceStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  NOT_INTEGRATED = 'NOT_INTEGRATED'
}

export interface Run {
  id: string;
  commitMessage: string;
  commitSha: string;
  time: string;
  status: ComplianceStatus;
  author: string;
}

export interface Violation {
  id: string;
  file: string;
  rule: string;
  status: ComplianceStatus;
  jiraId: string;
  regulator: 'RBI' | 'SEBI';
}

export interface AgentLogEvent {
  id: number;
  agent: string;
  message: string;
  timestamp: number;
}

export interface RegulatorStats {
  regulator: string;
  critical: number;
  medium: number;
  passed: number;
}
