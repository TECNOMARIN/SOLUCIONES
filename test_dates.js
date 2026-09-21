const today = new Date('2026-08-14T12:00:00');
const y = today.getFullYear();
const m = today.getMonth();
const d = today.getDate();
const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

console.log("todayStr:", todayStr);
console.log("dStr:", dStr);
console.log(todayStr === dStr);
