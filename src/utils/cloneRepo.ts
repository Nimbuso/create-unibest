import { exec } from 'node:child_process'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { bold, green } from 'kolorist'
import type { BaseTemplateList } from '../question/template/type'
import type { Ora } from './loading'
import { replaceProjectName } from './setPackageName'

async function removeGitFolder(localPath: string): Promise<void> {
  const gitFolderPath = join(localPath, '.git')
  await fs.rm(gitFolderPath, { recursive: true, force: true })
}

async function cloneRepo(gitUrls: string[], localPath: string): Promise<void> {
  let lastError = null

  for (const gitUrl of gitUrls) {
    try {
      await new Promise<void>((resolve, reject) => {
        exec(`git clone ${gitUrl} ${localPath}`, async (error) => {
          if (error) {
            reject(error)
            return
          }

          try {
            await removeGitFolder(localPath)
            resolve()
          }
          catch (error) {
            reject(error)
          }
        })
      })
      return
    }
    catch (error) {
      lastError = error
    }
  }

  if (lastError)
    throw new Error('All URLs failed')
}

function getRepoUrlList(url: BaseTemplateList['value']['url']) {
  const { github, gitee } = url
  // 返回一个数组优先使用 gitee，没有则使用 github的镜像地址githubfast.com，最后使用 github
  return [gitee, github?.replace('github.com', 'githubfast.com'), github].filter(Boolean) as string[]
}

export async function dowloadTemplate(data: BaseTemplateList['value'], name: string, root: string, loading: Ora) {
  const repoUrlList = getRepoUrlList(data.url)
  console.log(`${green('获取到的仓库url:')} ${repoUrlList}`)

  try {
    await cloneRepo(repoUrlList, root)
  }
  catch {
    loading.fail(`${bold('模板创建失败！')}`)
    process.exit(1)
  }

  replaceProjectName(root, name)
  data.callBack?.(root)
}
