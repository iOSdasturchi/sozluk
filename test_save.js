import { getItemProgress, saveItemProgress, loadAll, getVocabProgress } from './js/db.js';

const p = getItemProgress('A1', 'unit-01', 1);
p.status = 'mastered';
saveItemProgress('A1', 'unit-01', 1, p);
console.log(loadAll());
