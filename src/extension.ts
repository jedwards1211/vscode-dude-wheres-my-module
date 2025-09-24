import * as vscode from 'vscode'
import Client from 'dude-wheres-my-module/Client'
import findRoot from 'find-root'
import jscodeshift from 'jscodeshift'
import addImports from 'jscodeshift-add-imports'
import { SuggestedImportsResult } from 'dude-wheres-my-module/getSuggestedImports'
import throttle from 'lodash/throttle'
import chooseJSCodeshiftParser from 'jscodeshift-choose-parser'

/* eslint-disable @typescript-eslint/no-explicit-any */

export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel('dude-wheres-my-module')
  context.subscriptions.push(channel)

  const logErrors = (fn: () => Promise<void>) => async (): Promise<void> => {
    try {
      await fn()
    } catch (e) {
      const error: any = e
      channel.appendLine(error.stack || error.message || String(error))
      throw error
    }
  }

  const disposable = vscode.commands.registerCommand(
    'extension.autoimport',
    logErrors(
      async (): Promise<void> => {
        const { window } = vscode
        const { activeTextEditor: editor } = window
        if (!editor) throw new Error(`no active editor found`)
        const file = editor.document.fileName
        const projectDir = findRoot(file)
        channel.appendLine(
          `running autoimport on ${file} (project directory: ${projectDir})...`
        )

        const client = new Client(projectDir)
        client.on('error', (error: Error) =>
          channel.appendLine(error.stack || error.message || String(error))
        )

        const suggestions = await window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            cancellable: true,
          },
          async (
            progress: vscode.Progress<{ increment?: number; message?: string }>,
            token: vscode.CancellationToken
          ): Promise<SuggestedImportsResult | null> => {
            const message = 'Starting dude-wheres-my-module...'
            let prev = 0
            // work around stupid progress debouncing in VSCode
            // https://github.com/microsoft/vscode/issues/86131
            const handleProgress = throttle(
              (next: { completed: number; total: number }) => {
                const amount = (next.completed / next.total) * 100
                const increment = amount - prev
                prev = amount
                progress.report({
                  increment,
                  message: `Starting dude-wheres-my-module (${next.completed}/${
                    next.total
                  })...`,
                })
              },
              110
            )
            progress.report({ message })
            client.on('progress', handleProgress)
            try {
              return await Promise.race([
                new Promise(
                  (resolve: (value: SuggestedImportsResult | null) => void) => {
                    token.onCancellationRequested(() => resolve(null))
                  }
                ),
                (async (): Promise<SuggestedImportsResult> => {
                  channel.appendLine(`calling client.waitUntilReady...`)
                  await client.waitUntilReady()
                  const code = editor.document.getText()
                  channel.appendLine(`calling client.suggest...`)
                  return await client.suggest({ code, file })
                })(),
              ])
            } finally {
              client.removeListener('progress', handleProgress)
            }
          }
        )
        if (suggestions == null) {
          channel.appendLine(`operation canceled`)
          return
        }
        channel.appendLine(
          `suggestions for ${file}: ${JSON.stringify(suggestions)}`
        )

        const parser = chooseJSCodeshiftParser(file) || 'babylon'
        const j = jscodeshift.withParser(parser)
        const root = j(editor.document.getText())
        for (const key in suggestions) {
          const { suggested } = suggestions[key]
          try {
            if (!suggested.length) {
              continue
            } else if (suggested.length === 1) {
              addImports(root, suggested[0].ast as any)
            } else {
              const selected = await window.showQuickPick(
                suggested.map(({ code, ast }) => ({
                  ast,
                  label: code,
                }))
              )
              if (selected) addImports(root, selected.ast as any)
            }
          } catch (e) {
            const error: any = e
            channel.appendLine(error.stack || error.message || String(error))
          }
        }

        const newText = root.toSource()

        const oldText = editor.document.getText()
        if (newText !== oldText) {
          editor.edit(edit =>
            edit.replace(
              new vscode.Range(
                editor.document.positionAt(0),
                editor.document.positionAt(oldText.length)
              ),
              newText
            )
          )
        }
      }
    )
  )

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
