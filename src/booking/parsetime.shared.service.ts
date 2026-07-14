export function parseDurationToSeconds(durationStr: string): number {
    if (!durationStr) return 0;

    const match = durationStr.trim().match(/([\d.]+)\s*(hour|hr|minute|min|second|sec)?/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    if (isNaN(value)) return 0;

    const unit = (match[2] || 'minute').toLowerCase();

    if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 3600;
    if (unit.startsWith('sec')) return value;
    return value * 60; // default: minutes
}