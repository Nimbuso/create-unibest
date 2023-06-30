#!/usr/bin/env node

import { join } from 'node:path'
import { existsSync, mkdirSync, rmdirSync, unlinkSync } from 'node:fs'
import { dowloadTemplate, printBanner } from './utils'
import { question } from './question'
import type { BaseTemplateList } from './question/template/type'
import { postOrderDirectoryTraverse } from './utils/directoryTraverse'

async function init() {
  printBanner()

  let result: {
    projectName?: string
    shouldOverwrite?: boolean
    templateType?: BaseTemplateList['value']
    needsTypeScript?: boolean
    needsJsx?: boolean
    needsPinia?: boolean
    needsVitest?: boolean
    needsEslint?: boolean
    needsPrettier?: boolean
  } = {}

  try {
    result = await question()
  }
  catch {
    process.exit(1)
  }

  const cwd = process.cwd()
  const root = join(cwd, result.projectName!)

  function emptyDir(dir: string) {
    if (!existsSync(dir))
      return

    postOrderDirectoryTraverse(
      dir,
      dir => rmdirSync(dir),
      file => unlinkSync(file),
    )
  }

  if (existsSync(root) && result.shouldOverwrite)
    emptyDir(root)

  else if (!existsSync(root))
    mkdirSync(root)

  if (result.templateType!.type !== 'custom')
    await dowloadTemplate(result.templateType!.url, root)
}

init()
