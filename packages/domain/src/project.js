const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateProject({ code, name, currency, startDate, endDate }) {
  if (!code?.trim()) throw new Error('project code is required');
  if (!name?.trim()) throw new Error('project name is required');
  if (!/^[A-Z]{3}$/.test(currency ?? '')) throw new Error('currency must be a three-letter ISO code');
  if ((startDate && !ISO_DATE.test(startDate)) || (endDate && !ISO_DATE.test(endDate))) throw new Error('date must use YYYY-MM-DD');
  if (startDate && endDate && startDate > endDate) throw new Error('start date cannot be after end date');
  return { code: code.trim(), name: name.trim(), currency };
}
