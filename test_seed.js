
function getDailySeed(dateStr) {
    const now = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return (now.getFullYear() * 1000) + dayOfYear + 20;
}

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

console.log(`Yesterday seed:`, getDailySeed(yesterday));
console.log(`Today seed:    `, getDailySeed(today));

function createRNG(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function simpleGenerate(seed) {
    const rng = createRNG(seed);
    // Simulate generating a few numbers like in generateRound
    return [rng(), rng(), rng(), rng(), rng()].map(n => n.toFixed(5));
}

const seedToday = getDailySeed(today);
const seedYest = getDailySeed(yesterday);

console.log('RNG output for Yesterday seed:', simpleGenerate(seedYest));
console.log('RNG output for Today seed:    ', simpleGenerate(seedToday));
