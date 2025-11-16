// Utilities to work with IST week (Mon-Sat) ranges and labels

const IST_OFFSET_MINUTES = 5 * 60 + 30; // +05:30

function toIST(date: Date): Date {
	const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
	return new Date(utc + IST_OFFSET_MINUTES * 60_000);
}

function fromIST(ist: Date): Date {
	// ist -> utc -> local
	const utc = ist.getTime() - IST_OFFSET_MINUTES * 60_000;
	return new Date(utc);
}

// Returns Monday 00:00:00.000 IST and Saturday 23:59:59.999 IST for a given date
export function getCurrentIstWeekRange(referenceUtc: Date = new Date()): { startUtc: Date; endUtc: Date; label: string } {
	const ist = toIST(referenceUtc);
	const day = ist.getDay(); // 0 Sun .. 6 Sat
	// We consider Mon (1) to Sat (6)
	// Find Monday
	const diffToMonday = (day + 6) % 7; // Mon=1 -> 0, Tue=2 ->1, ... Sun=0 ->6
	const monday = new Date(ist);
	monday.setDate(ist.getDate() - diffToMonday);
	monday.setHours(0, 0, 0, 0);
	// Saturday end of day
	const saturday = new Date(monday);
	saturday.setDate(monday.getDate() + 5);
	saturday.setHours(23, 59, 59, 999);
	const startUtc = fromIST(monday);
	const endUtc = fromIST(saturday);

	const label = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}_to_${saturday.getFullYear()}-${String(
		saturday.getMonth() + 1,
	).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
	return { startUtc, endUtc, label };
}


