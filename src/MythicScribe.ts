import * as vscode from 'vscode';

import * as SubscriptionHelper from './subscriptions/SubscriptionHelper';
import { getFormatter } from './formatter/formatter';
import { addCustomDataset } from './datasets/customDatasets';
import { ScribeMechanicHandler } from './datasets/ScribeMechanic';
import { ScribeEnumHandler } from './datasets/ScribeEnum';
import { doVersionSpecificMigrations } from './migration/migration';
import { showInfoMessageWithOptions } from './utils/logger';

export let ctx: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
    ctx = context;

    // Check if the extension has been updated
    if (checkExtensionVersion()) {
        // Run migrations if so
        await doVersionSpecificMigrations();
    }

    ScribeEnumHandler.initializeEnums();
    ScribeMechanicHandler.loadDatasets();

    context.subscriptions.push(
        // Subscription Handler
        SubscriptionHelper.extensionEnabler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),

        // Formatter
        getFormatter()
    );

    if (vscode.window.activeTextEditor) {
        SubscriptionHelper.updateEnabled(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}

function checkExtensionVersion(): boolean {
    const version = ctx.extension.packageJSON.version;
    const savedVersion = ctx.globalState.get<string>('extensionVersion');
    if (version && version !== savedVersion) {
        const checkExtensionVersionOptions: { [key: string]: string } = {
            'Check Changelogs': 'https://github.com/Lxlp38/MythicScribe/blob/master/CHANGELOG.md',
        };
        showInfoMessageWithOptions(
            `Updated MythicScribe to version ${version}`,
            checkExtensionVersionOptions
        );
        ctx.globalState.update('extensionVersion', version);
        return true;
    }
    return false;
}
