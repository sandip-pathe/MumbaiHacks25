import React from 'react';
import { ComplianceStatus } from '../../types';
import { AlertCircle, CheckCircle2, CircleOff, XCircle } from 'lucide-react';

interface StatusPillProps {
  status: ComplianceStatus;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case ComplianceStatus.PASS:
        return 'bg-success/10 text-success border-success/20';
      case ComplianceStatus.FAIL:
        return 'bg-danger/10 text-danger border-danger/20 animate-pulse';
      case ComplianceStatus.NOT_INTEGRATED:
        return 'bg-accent3/10 text-accent3 border-accent3/20';
      default:
        return 'bg-accent3/10 text-accent3 border-accent3/20';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 12 : 14;
    switch (status) {
      case ComplianceStatus.PASS: return <CheckCircle2 size={iconSize} />;
      case ComplianceStatus.FAIL: return <XCircle size={iconSize} />;
      case ComplianceStatus.NOT_INTEGRATED: return <CircleOff size={iconSize} />;
      default: return <AlertCircle size={iconSize} />;
    }
  };

  const getLabel = () => {
    if (status === ComplianceStatus.NOT_INTEGRATED) return 'NOT INTEGRATED';
    return status;
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full border font-mono font-medium
      ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}
      ${getStyles()}
    `}>
      {getIcon()}
      {getLabel()}
    </span>
  );
};