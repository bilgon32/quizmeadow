import {writeFile} from 'node:fs/promises'
import {z} from 'zod'
import {quizSchema, categorySchema, unitSchema} from '../src/shared/schema'
async function main() {
for (const [name, schema] of Object.entries({quiz: quizSchema, category: categorySchema, unit: unitSchema})) {
 const json = z.toJSONSchema(schema, {io: 'input'})
 await writeFile(`docs/${name}.schema.json`, JSON.stringify(json, null, 2) + '\n')
 await writeFile(`library/${name}.schema.json`, JSON.stringify(json, null, 2) + '\n')
}
console.log('Generated JSON schemas from the runtime validators.')
}
main().catch(error => {console.error(error); process.exitCode = 1})
