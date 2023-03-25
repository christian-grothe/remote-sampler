const map = new Map();

map.set("A", { activeUserIndex: 0 });
map.set("B", { activeUserIndex: 2 });

console.log(map.size);

// const vals = Array.from(map.values());
// let freeIndex = 0;

// vals.forEach((val) => {
//   if (freeIndex !== val.activeUserIndex) return;
//   freeIndex++;
// });
// console.log(freeIndex);
//console.log(map.has("A"));

// console.log(set);
