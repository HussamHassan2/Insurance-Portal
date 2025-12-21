export function extractBirthDateFromNationalId(nationalId: string): string | null {
    if (!nationalId || nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        return null;
    }

    const centuryCode = parseInt(nationalId.substring(0, 1), 10);
    const yearPart = nationalId.substring(1, 3);
    const monthPart = nationalId.substring(3, 5);
    const dayPart = nationalId.substring(5, 7);

    let centuryPrefix = '';
    if (centuryCode === 2) {
        centuryPrefix = '19';
    } else if (centuryCode === 3) {
        centuryPrefix = '20';
    } else {
        return null; // Invalid century code
    }

    const fullYear = `${centuryPrefix}${yearPart}`;
    const birthDateString = `${fullYear}-${monthPart}-${dayPart}`;

    // Validate date is real (e.g. not 2023-02-30)
    const date = new Date(birthDateString);
    const isValidDate = !isNaN(date.getTime()) && date.toISOString().startsWith(birthDateString);

    return isValidDate ? birthDateString : null;
}
