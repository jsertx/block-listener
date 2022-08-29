export const ensureDate = (timestamp: number | Date): Date => {
	if (timestamp instanceof Date) {
		return timestamp;
	}
	return new Date(timestamp);
};
