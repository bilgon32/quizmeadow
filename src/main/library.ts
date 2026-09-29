import {readdir, readFile, lstat} from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {parseDocument} from 'yaml'
import {categorySchema, quizSchema, unitSchema, type Library, type LibraryQuiz} from '../shared/schema'

export async function readYaml(file: string): Promise<unknown> {
 const stat = await lstat(file)
 if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Expected a regular YAML file')
 if (stat.size > 2_000_000) throw new Error('YAML files must be smaller than 2 MB')
 const doc = parseDocument(await readFile(file, 'utf8'), {uniqueKeys: true, schema: 'core'})
 if (doc.errors.length) throw new Error(doc.errors.map(e => e.message).join('; '))
 return doc.toJS({maxAliasCount: 0})
}
async function directories(root: string) {
 return (await readdir(root, {withFileTypes: true})).filter(e => e.isDirectory() && !e.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name)).map(e => path.join(root, e.name))
}
export async function loadLibrary(root: string): Promise<Library> {
 const library: Library = {root, categories: [], issues: [], loadedAt: new Date().toISOString()}
 const issue = (file: string, err: unknown) => library.issues.push({file: path.relative(root, file) || root, message: err instanceof Error ? err.message : String(err)})
 const quizKeys = new Set<string>(), categoryIds = new Set<string>()
 try {
  for (const courseDir of await directories(root)) {
   try {
    const metadata = categorySchema.parse(await readYaml(path.join(courseDir, 'category.yaml')))
    if (categoryIds.has(metadata.id)) throw new Error(`Duplicate category ID: ${metadata.id}`)
    categoryIds.add(metadata.id)
    const category = {...metadata, units: [] as Library['categories'][number]['units']}
    const unitIds = new Set<string>()
    for (const unitDir of await directories(courseDir)) {
     try {
      const unitData = unitSchema.parse(await readYaml(path.join(unitDir, 'unit.yaml')))
      if (unitIds.has(unitData.id)) throw new Error(`Duplicate unit ID: ${unitData.id}`)
      unitIds.add(unitData.id)
      const unit = {...unitData, quizzes: [] as LibraryQuiz[]}
      const files = (await readdir(unitDir, {withFileTypes: true})).filter(e => e.isFile() && /\.ya?ml$/i.test(e.name) && e.name !== 'unit.yaml').sort((a, b) => a.name.localeCompare(b.name))
      for (const file of files) {
       const filePath = path.join(unitDir, file.name)
       try {
        const quiz = quizSchema.parse(await readYaml(filePath))
        const key = `${category.id}/${unit.id}/${quiz.id}`
        if (quizKeys.has(key)) throw new Error(`Duplicate quiz ID in this unit: ${quiz.id}`)
        quizKeys.add(key)
        unit.quizzes.push({...quiz, key, categoryId: category.id, categoryTitle: category.title, unitId: unit.id, unitTitle: unit.title, filePath, revision: createHash('sha256').update(JSON.stringify(quiz)).digest('hex')})
       } catch (err) {issue(filePath, err)}
      }
      category.units.push(unit)
     } catch (err) {issue(path.join(unitDir, 'unit.yaml'), err)}
    }
    category.units.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    library.categories.push(category)
   } catch (err) {issue(path.join(courseDir, 'category.yaml'), err)}
  }
  library.categories.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
 } catch (err) {issue(root, err)}
 return library
}
