import path from 'node:path'
import {loadLibrary} from '../src/main/library'
async function main() {
const root = path.resolve(process.argv[2] || 'library')
const library = await loadLibrary(root)
const quizzes = library.categories.flatMap(c => c.units.flatMap(u => u.quizzes))
console.log(`${library.categories.length} categories, ${library.categories.reduce((n, c) => n + c.units.length, 0)} units, ${quizzes.length} quizzes, ${quizzes.reduce((n, q) => n + q.questions.length, 0)} questions`)
for (const issue of library.issues) console.error(`\n${issue.file}\n${issue.message}`)
if (library.issues.length || !quizzes.length) {if (!quizzes.length) console.error('No quizzes found.'); process.exitCode = 1}
else console.log('Library is valid.')
}
main().catch(error => {console.error(error); process.exitCode = 1})
