import * as vscode from 'vscode';
import * as yamlutils from '../utils/yamlutils';
import { ObjectType, keyAliases, EnumInfo, EnumType, ObjectInfo } from '../../objectInfos';
import { getAllAttributes, getMechanicDataByName } from '../utils/mechanicutils';
import { getObjectLinkedToAttribute } from '../utils/cursorutils';
import { checkShouldComplete } from '../utils/completionhelper';


export function attributeCompletionProvider() {
    const attributeCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (!checkShouldComplete(document, position, context, ["{", ";"])) {
                    return undefined;
                }

                const charBefore = document.getText(new vscode.Range(position.translate(0, -2), position));
                if (charBefore === ";;" || charBefore === "{;") {
                    const edit = new vscode.WorkspaceEdit();
                    edit.delete(document.uri, new vscode.Range(position.translate(0, -1), position));
                    await vscode.workspace.applyEdit(edit);
                    vscode.commands.executeCommand('editor.action.triggerSuggest');
                    return undefined;
                }
                else if (charBefore === "- ") {
                    return undefined;
                }
                
                const keys = yamlutils.getParentKeys(document, position.line);
                const completionItems: vscode.CompletionItem[] = [];
                let mechanic = null;
                let type = ObjectType.MECHANIC;

                const object = getObjectLinkedToAttribute(document, position);
                if (!object) {
                    return null;
                }
                else if (object?.startsWith('@')) {
                    mechanic = getMechanicDataByName(object.replace("@", ""), ObjectType.TARGETER);
                    type = ObjectType.TARGETER;
                }
                else if (object?.startsWith('~')) {
                    return null
                }
                else if (object?.startsWith('?')) {
                    mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), ObjectType.CONDITION);
                    type = ObjectType.INLINECONDITION;
                }
                else if (keyAliases["Conditions"].includes(keys[0])) {
                    mechanic = getMechanicDataByName(object, ObjectType.CONDITION);
                    type = ObjectType.CONDITION;
                }
                else {
                    mechanic = getMechanicDataByName(object, ObjectType.MECHANIC);
                    type = ObjectType.MECHANIC;
                }

                if (!mechanic) {
                    return null;
                }

                const attributes = getAllAttributes(mechanic, type);
                let index = 10000;

                const config = vscode.workspace.getConfiguration('MythicScribe');
                const attributeAliasUsedInCompletions = config.get<string>('attributeAliasUsedInCompletions', "main");

                attributes.forEach((attribute: any) => {
                    let mainname = attribute.name[0];
                    let aliases = attribute.name;

                    if (attributeAliasUsedInCompletions === "shorter") {
                        mainname = attribute.name.reduce((a: string, b: string) => a.length < b.length ? a : b);
                        aliases = [mainname];
                        attribute.name.forEach((name: string) => {
                            if (name !== mainname) {
                                aliases.push(name);
                            }
                        });
                    }

                    const attributeType = attribute.type;
                    const attributeEnum = attribute.enum ? attribute.enum.toUpperCase() : null;
                    const completionItem = new vscode.CompletionItem(mainname, vscode.CompletionItemKind.Field);
                    completionItem.label = `${aliases.join(", ")}`;
                    completionItem.detail = `${attribute.description}`;
                    completionItem.kind = vscode.CompletionItemKind.Field;


                    if (attributeType === "Boolean") {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=" + "${1|true,false|}");
                    }
                    else if (attributeEnum && Object.keys(EnumType).includes(attributeEnum)) {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=" + "${1|"+ EnumInfo[EnumType[attributeEnum as keyof typeof EnumType]].commalist +"|}");
                    }
                    else {
                        completionItem.insertText = new vscode.SnippetString(mainname + "=");
                    }
                    completionItem.sortText = index.toString();
                    index++;
                    completionItems.push(completionItem);
                });

                return completionItems;
            }
        }, "{", ";"
    );
    return attributeCompletionProvider;
}


export function attributeValueCompletionProvider() {
    const attributeValueCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'yaml',
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

                if (!checkShouldComplete(document, position, context, ["=", ","])) {
                    return undefined;
                }

                const keys = yamlutils.getParentKeys(document, position.line);
                const completionItems: vscode.CompletionItem[] = [];
                let mechanic = null;
                let type = ObjectType.MECHANIC;

                const object = getObjectLinkedToAttribute(document, position);
                if (!object) {
                    return null;
                }
                else if (object?.startsWith('@')) {
                    mechanic = getMechanicDataByName(object.replace("@", ""), ObjectType.TARGETER);
                    type = ObjectType.TARGETER;
                }
                else if (object?.startsWith('~')) {
                    return null
                }
                else if (object?.startsWith('?')) {
                    mechanic = getMechanicDataByName(object.replace("?", "").replace("!", "").replace("~", ""), ObjectType.CONDITION);
                    type = ObjectType.INLINECONDITION;
                }
                else if (keyAliases["Conditions"].includes(keys[0])) {
                    mechanic = getMechanicDataByName(object, ObjectType.CONDITION);
                    type = ObjectType.CONDITION;
                }
                else {
                    mechanic = getMechanicDataByName(object, ObjectType.MECHANIC);
                    type = ObjectType.MECHANIC;
                }

                if (!mechanic) {
                    return null;
                }


                const attribute = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).match(ObjectInfo[ObjectType.ATTRIBUTE].regex)?.pop();

                if (!attribute) {
                    return null;
                }

                const attributeInfo = getAllAttributes(mechanic, type).find((attr: { name: string[]; }) => attr.name.includes(attribute));

                if (!attributeInfo) {
                    return null;
                }

                const charBefore0 = document.getText(new vscode.Range(position.translate(0, -1), position));

                const attributeType = attributeInfo.type;
                const attributeEnum = attributeInfo.enum ? attributeInfo.enum.toUpperCase() : null;
                const attributeList = attributeInfo.list;

                if (charBefore0 === ",") {
                    if (!attributeList) {
                        return undefined;
                    }
                }

                if (attributeType === "Boolean") {
                    completionItems.push(new vscode.CompletionItem("true", vscode.CompletionItemKind.Value));
                    completionItems.push(new vscode.CompletionItem("false", vscode.CompletionItemKind.Value));
                }
                else if (attributeEnum && Object.keys(EnumType).includes(attributeEnum)) {
                    EnumInfo[EnumType[attributeEnum as keyof typeof EnumType]].commalist.split(",").forEach((value: string) => {
                        completionItems.push(new vscode.CompletionItem(value, vscode.CompletionItemKind.Value));
                    });
                }
                else {
                    return undefined;
                }

                return completionItems;
            }
        }, "=", ","
    );
    return attributeValueCompletionProvider;
}