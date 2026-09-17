export function validateImportRows({ projectId, rows }) {
  const seen = new Set(); const valid = []; const errors = [];
  rows.forEach((row, index) => {
    const reference = row.referenceNo?.trim(); const amount = Number(row.amount);
    let message = null;
    if (!reference) message = 'reference number is required';
    else if (seen.has(reference.toUpperCase())) message = 'duplicate reference in batch';
    else if (row.projectId !== projectId) message = 'row belongs to a different project';
    else if (!Number.isFinite(amount) || amount < 0) message = 'amount must be a non-negative number';
    if (message) errors.push({ row: index + 1, message });
    else { seen.add(reference.toUpperCase()); valid.push({ ...row, referenceNo: reference, amount: Math.round(amount * 100) / 100 }); }
  });
  return { valid, errors, total: rows.length };
}
