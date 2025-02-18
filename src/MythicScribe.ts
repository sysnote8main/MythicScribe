import * as vscode from 'vscode';

import * as SubscriptionHelper from './subscriptions/SubscriptionHelper';
import { getFormatter } from './formatter/formatter';
import {
    addCustomDataset,
    createBundleDataset,
    removeCustomDataset,
} from './datasets/customDatasets';
import { ScribeMechanicHandler } from './datasets/ScribeMechanic';
import { ScribeEnumHandler } from './datasets/ScribeEnum';
import { doVersionSpecificMigrations } from './migration/migration';
import { logDebug, logsProvider, openLogs, showInfoMessageWithOptions } from './utils/logger';

export let ctx: vscode.ExtensionContext;

export async function activate(context: vscode.ExtensionContext) {
    ctx = context;
    logDebug('Extension Activated');

    // Check if the extension has been updated
    if (checkExtensionVersion()) {
        // Run migrations if so
        logDebug('Running migrations');
        await doVersionSpecificMigrations();
    }

    ScribeEnumHandler.initializeEnums();

    ScribeMechanicHandler.setPathMap(context.extensionUri);
    ScribeMechanicHandler.loadDatasets();

    context.subscriptions.push(
        // Subscription Handler
        SubscriptionHelper.extensionEnabler,

        // Commands
        vscode.commands.registerCommand('MythicScribe.addCustomDataset', addCustomDataset),
        vscode.commands.registerCommand('MythicScribe.removeCustomDataset', removeCustomDataset),
        vscode.commands.registerCommand('MythicScribe.createBundleDataset', createBundleDataset),
        vscode.commands.registerCommand('MythicScribe.openLogs', openLogs),

        // Formatter
        getFormatter(),

        // Logger
        vscode.workspace.registerTextDocumentContentProvider('mythicscribelogs', logsProvider)
    );

    if (vscode.window.activeTextEditor) {
        SubscriptionHelper.updateSubscriptions(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}

export function checkExtensionVersion(): boolean {
    const version = ctx.extension.packageJSON.version;
    const savedVersion = ctx.globalState.get<string>('extensionVersion');
    logDebug(`Current version: ${version}, Saved version: ${savedVersion}`);
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
