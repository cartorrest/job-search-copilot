'use client';

import { useState } from 'react';
import { STATUS_FLOW, STATUS_STYLES } from '@/lib/constants';
import ConfirmDialog from './ConfirmDialog';

export default function StatusDropdown({ job, onStatusChange }) {
  const [pendingStatus, setPendingStatus] = useState(null);
  const badgeClasses = STATUS_STYLES[job.status]?.badge || '';

  function handleSelect(e) {
    const newStatus = e.target.value;
    if (newStatus === job.status) return;
    setPendingStatus(newStatus);
  }

  function confirm() {
    onStatusChange(job.jobId, pendingStatus);
    setPendingStatus(null);
  }

  function cancel() {
    setPendingStatus(null);
  }

  return (
    <>
      <select
        value={job.status}
        onChange={handleSelect}
        onClick={(e) => e.stopPropagation()}
        className={`text-xs font-medium rounded-md border-none px-2 py-1 outline-none cursor-pointer transition-colors ${badgeClasses}`}
      >
        {STATUS_FLOW.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <ConfirmDialog
        open={pendingStatus !== null}
        message={`Move "${job.company}" from ${job.status} to ${pendingStatus}?`}
        onConfirm={confirm}
        onCancel={cancel}
      />
    </>
  );
}

