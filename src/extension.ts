import * as vscode from 'vscode'
import Client from 'dude-wheres-my-module/Client'
import findRoot from 'find-root'
import jscodeshift from 'jscodeshift'
import addImports from 'jscodeshift-add-imports'
import {
  ImportDeclaration,
  VariableDeclaration,
} from 'dude-wheres-my-module/ASTTypes'
const j = jscodeshift.withParser('babylon')

/* eslint-disable @typescript-eslint/no-explicit-any */

function getSource(ast: ImportDeclaration | VariableDeclaration): string {
  if (ast.type === 'ImportDeclaration') {
    return ast.source.value
  }
  if (ast.type === 'VariableDeclaration') {
    const declaration: any = ast.declarations[0]
    if (declaration && declaration.init.type === 'CallExpression') {
      return declaration.init.arguments[0].value
    }
  }
  return '?'
}

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'extension.autoimport',
    async (): Promise<void> => {
      const { window } = vscode
      const { activeTextEditor: editor } = window
      if (!editor) return
      const code = editor.document.getText()
      const file = editor.document.fileName

      const client = new Client(findRoot(file))

      const suggestions = await window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
        },
        () => client.suggest({ code, file })
      )

      const root = j(code)
      for (const key in suggestions) {
        const { identifier, start, context, suggested } = suggestions[key]
        try {
          if (!suggested.length) {
            continue
          } else if (suggested.length === 1) {
            addImports(root, suggested[0].ast as any)
          } else {
            const selected = await window.showQuickPick(
              suggested.map(({ code, ast }) => ({
                ast,
                label: getSource(ast),
                detail: code,
              }))
            )
            if (selected) addImports(root, selected.ast as any)
          }
        } catch (error) {
          console.error(error.stack) // eslint-disable-line no-console
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

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate(): void {} // eslint-disable-line @typescript-eslint/no-empty-function
