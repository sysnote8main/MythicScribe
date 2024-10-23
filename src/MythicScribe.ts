import * as vscode from 'vscode';

import { enableFileSpecificSuggestions, isEnabled } from './imports/utils/configutils';

import { hoverProvider } from './imports/hovers/hoverprovider';

import { inlineConditionCompletionProvider } from './imports/completions/inlineconditionCompletionProvider';
import { mechanicCompletionProvider } from './imports/completions/mechanicsCompletionProvider';
import { conditionCompletionProvider } from './imports/completions/conditionsCompletionProvider';
import { targeterCompletionProvider } from './imports/completions/targeterCompletionProvider';
import { attributeCompletionProvider } from './imports/completions/attributeCompletionProvider';
import { inlineMetaskillCompletionProvider } from './imports/completions/inlinemetaskillCompletionProvider';

import { mechaniclineCompletionProvider } from './imports/completions/mechaniclineCompletionProvider';

import { SkillFileCompletionProvider } from './imports/completions/metaskillfileCompletionProvider';

import { removeBracketsTextListener } from './imports/textchanges/bracketsremover';
import { shortcutsProvider } from './imports/textchanges/shortcuts';
import { enableEmptyBracketsAutomaticRemoval, enableShortcuts } from './imports/utils/configutils';

export let ctx: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {

	console.log('MythicScribe is active');

	ctx = context;

	// Hovers	
	context.subscriptions.push(hoverProvider);

	// Completions
	context.subscriptions.push(mechanicCompletionProvider);
	context.subscriptions.push(attributeCompletionProvider);
	context.subscriptions.push(targeterCompletionProvider);
	context.subscriptions.push(inlineConditionCompletionProvider);
	context.subscriptions.push(conditionCompletionProvider);

	context.subscriptions.push(inlineMetaskillCompletionProvider);

	context.subscriptions.push(mechaniclineCompletionProvider);

	if (enableFileSpecificSuggestions()) {
		const activeDocument = vscode.window.activeTextEditor?.document;
		const acceptOnEnter = vscode.workspace.getConfiguration('editor').get('acceptSuggestionOnEnter');
		if (
			vscode.workspace.getConfiguration('MythicScribe').get("disableAcceptSuggestionOnEnter") &&
			activeDocument && isEnabled(activeDocument) &&
			acceptOnEnter !== "off") {
			vscode.window.showInformationMessage('`Accept Completions on Enter` is enabled. Would you like to disable it?', 'Yes', 'No', "Don't ask again")
				.then(selection => {
					if (selection === 'Yes') {
						vscode.workspace.getConfiguration('editor').update('acceptSuggestionOnEnter', 'off', vscode.ConfigurationTarget.Workspace);
						context.subscriptions.push(SkillFileCompletionProvider);
					}
					else if (selection === "Don't ask again") {
						vscode.workspace.getConfiguration('MythicScribe').update('disableAcceptSuggestionOnEnter', false, vscode.ConfigurationTarget.Workspace);
					}
				});
		} else {
			context.subscriptions.push(SkillFileCompletionProvider);
		}
	}

	// Text Changes
	if (enableEmptyBracketsAutomaticRemoval()) {
		context.subscriptions.push(removeBracketsTextListener);
	}

	if (enableShortcuts()) {
		context.subscriptions.push(shortcutsProvider);
	}
}

export function deactivate() { }