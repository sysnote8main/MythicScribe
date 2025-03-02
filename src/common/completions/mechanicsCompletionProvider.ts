import * as vscode from 'vscode';

import { AbstractScribeMechanicRegistry, ScribeMechanicHandler } from '../datasets/ScribeMechanic';
import { attributeSpecialValues } from '../datasets/enumSources';
import { checkShouldKeyComplete, getListCompletionNeededSpaces } from '../utils/completionhelper';
import { getSquareBracketObject } from '../utils/cursorutils';

export function mechanicCompletionProvider(
    registry: AbstractScribeMechanicRegistry,
    keyAliases: string[]
) {
    return vscode.languages.registerCompletionItemProvider(
        ['mythicscript', 'yaml'],
        {
            async provideCompletionItems(
                document: vscode.TextDocument,
                position: vscode.Position,
                _token: vscode.CancellationToken,
                context: vscode.CompletionContext
            ) {
                if (!checkShouldKeyComplete(document, position, keyAliases)) {
                    return undefined;
                }

                const space = getListCompletionNeededSpaces(document, position, context);
                if (space === undefined) {
                    return undefined;
                }
                if (space !== '') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor === undefined) {
                        return [];
                    }
                    editor.insertSnippet(new vscode.SnippetString(space));
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
                }
                const maybeAttribute = getSquareBracketObject(document, position);
                if (maybeAttribute && maybeAttribute[0] && maybeAttribute[1]) {
                    const attribute = registry
                        .getMechanicByName(maybeAttribute[1])
                        ?.getAttributeByName(maybeAttribute[0]);
                    if (attribute && attribute.specialValue === attributeSpecialValues.conditions) {
                        return ScribeMechanicHandler.registry.condition.mechanicCompletions;
                    }
                }
                const completionItems: vscode.CompletionItem[] = registry.mechanicCompletions;
                return completionItems;
            },
        },
        '-',
        ' '
    );
}
