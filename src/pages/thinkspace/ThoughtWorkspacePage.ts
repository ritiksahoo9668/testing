import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';

export class ThoughtWorkspacePage extends BasePage {
  readonly backLink = this.page.getByRole('link', { name: /Actions & agendas/i });
  readonly exportButton = this.page.locator('.thought-export-btn');
  readonly nodeSearchInput = this.page.getByPlaceholder('Search nodes…');
  readonly manageContributorsButton = this.page.getByRole('button', { name: 'Manage contributors' });
  readonly flowNodes = this.page.locator('.react-flow__node');
  readonly centralNode = this.page.locator('.thought-node-root').first();
  readonly childNodes = this.page.locator('.thought-node-child');
  readonly contextMenu = this.page.locator('.thought-context-menu');
  readonly commentCloud = this.page.locator('.thought-comment-cloud');
  readonly createActionModal = this.page.locator('form').filter({
    has: this.page.getByRole('heading', { name: /Create New Action/i }),
  });
  readonly logsTablist = this.page.getByRole('tablist', { name: 'Log type' });
  readonly logsPanel = this.page.locator('.thought-logs-panel');

  async open(meetingId: string): Promise<void> {
    await this.goto(`/thinkspace/thought/workspace?meeting=${encodeURIComponent(meetingId)}`);
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/thinkspace\/thought\/workspace\?meeting=/, { timeout: 120_000 });
    await expect(this.exportButton).toBeVisible({ timeout: 60_000 });
    await expect(this.page.locator('.thought-workspace-header__title')).toBeVisible({ timeout: 60_000 });
    await expect(this.page.locator('.react-flow__pane')).toBeVisible({ timeout: 60_000 });
  }

  async expectTitleVisible(title: string): Promise<void> {
    await expect(this.page.locator('.thought-workspace-header__title')).toContainText(title, { timeout: 30_000 });
  }

  dockTool(label: 'Canvas' | 'Comment & Action Logs' | 'AI Summary'): Locator {
    return this.page.locator(`button[aria-label="${label}"]`);
  }

  async ensureToolbarOpen(): Promise<void> {
    const openToolbar = this.page.getByRole('button', { name: 'Open toolbar' });
    if (await openToolbar.isVisible().catch(() => false)) {
      await openToolbar.click();
      await expect(openToolbar).toBeHidden({ timeout: 5_000 });
    }
  }

  async selectDockTool(label: 'Canvas' | 'Comment & Action Logs' | 'AI Summary'): Promise<void> {
    await this.ensureToolbarOpen();
    const tool = this.dockTool(label);
    await expect(tool).toBeVisible({ timeout: 15_000 });
    await tool.click();
    await waitForSpinnerToDisappear(this.page);
  }

  async fitCanvasIfVisible(): Promise<void> {
    const fitBtn = this.page.getByRole('button', { name: 'Fit canvas' });
    if (await fitBtn.isVisible().catch(() => false)) {
      await fitBtn.click();
    }
  }

  async waitForCanvasReady(meetingTitle?: string): Promise<void> {
    await expect(this.page.locator('.react-flow__pane')).toBeVisible({ timeout: 60_000 });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.page
        .waitForResponse((res) => res.url().includes('meeting-notes') && res.ok(), { timeout: 30_000 })
        .catch(() => undefined);
      await this.fitCanvasIfVisible();

      if ((await this.flowNodes.count()) > 0) {
        if (meetingTitle) {
          await expect(this.centralNode).toContainText(meetingTitle, { timeout: 20_000 });
        } else {
          await expect(this.centralNode).toBeVisible({ timeout: 20_000 });
        }
        return;
      }

      if (attempt < 3) {
        await this.page.waitForTimeout(2_000);
        if (attempt >= 1) {
          await this.page.reload();
          await waitForPageReady(this.page);
          await waitForSpinnerToDisappear(this.page);
          await expect(this.page.locator('.react-flow__pane')).toBeVisible({ timeout: 60_000 });
        }
      }
    }

    await expect(this.flowNodes.first()).toBeAttached({ timeout: 30_000 });
    await expect(this.centralNode).toBeVisible({ timeout: 30_000 });
  }

  async ensureCanvasView(meetingTitle?: string): Promise<void> {
    await this.selectDockTool('Canvas');
    await this.waitForCanvasReady(meetingTitle);
  }

  async childNodeCount(): Promise<number> {
    return this.childNodes.count();
  }

  async clickUndo(): Promise<void> {
    await this.ensureToolbarOpen();
    const btn = this.page.locator('button[aria-label="Undo"]');
    await expect(btn).toBeEnabled({ timeout: 15_000 });
    await btn.click();
  }

  async clickRedo(): Promise<void> {
    await this.ensureToolbarOpen();
    const btn = this.page.locator('button[aria-label="Redo"]');
    await expect(btn).toBeEnabled({ timeout: 15_000 });
    await btn.click();
  }

  async addChildNode(meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    const before = await this.childNodeCount();
    await this.openContextMenuOnNode(this.centralNode);
    await this.contextMenuAction('Create child node');
    await expect(this.childNodes).toHaveCount(before + 1, { timeout: 20_000 });
  }

  async addChildNodeOn(node: Locator, meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    const before = await this.childNodeCount();
    await this.openContextMenuOnNode(node);
    await this.contextMenuAction('Create child node');
    await expect(this.childNodes).toHaveCount(before + 1, { timeout: 20_000 });
  }

  childNode(index = 0): Locator {
    return this.childNodes.nth(index);
  }

  childNodeWithLabel(label: string): Locator {
    return this.childNodes.filter({ hasText: label }).first();
  }

  async openContextMenuOnNode(node: Locator): Promise<void> {
    await node.scrollIntoViewIfNeeded();
    const box = await node.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await this.page.mouse.click(x, y);
      await this.page.mouse.click(x, y, { button: 'right' });
    } else {
      await node.click({ timeout: 15_000 });
      await node.click({ button: 'right' });
    }
    await expect(this.contextMenu).toBeVisible({ timeout: 10_000 });
  }

  async contextMenuAction(label: string): Promise<void> {
    await this.contextMenu.getByRole('menuitem', { name: label }).click();
    await expect(this.contextMenu).toBeHidden({ timeout: 10_000 });
  }

  async editSelectedNodeLabel(label: string): Promise<void> {
    const editor = this.page.locator('.thought-node-child input, .thought-node-root input').first();
    if (await editor.isVisible().catch(() => false)) {
      await editor.fill(label);
      await editor.press('Enter');
    } else {
      await this.page.keyboard.type(label);
      await this.page.keyboard.press('Enter');
    }
    await expect(this.childNodes.filter({ hasText: label }).first()).toBeVisible({ timeout: 20_000 });
  }

  async addComment(text: string): Promise<void> {
    await expect(this.commentCloud).toBeVisible({ timeout: 10_000 });
    const input = this.commentCloud.locator('textarea.thought-comment-cloud__input');
    await input.fill(text);
    await this.commentCloud.getByRole('button', { name: 'Save' }).click();
    await expect(this.commentCloud).toBeHidden({ timeout: 15_000 });
  }

  async openCreateActionModalFromContext(): Promise<void> {
    await this.contextMenuAction('Create action');
    await expect(this.createActionModal).toBeVisible({ timeout: 15_000 });
  }

  async fillCreateActionTitle(title: string): Promise<void> {
    await this.createActionModal.getByPlaceholder('Action').fill(title);
  }

  async selectFirstAssignee(): Promise<void> {
    const search = this.createActionModal.getByPlaceholder('Search user…');
    await search.click();
    await search.fill('a');
    const option = this.createActionModal.locator('ul button').first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();
  }

  async submitCreateAction(): Promise<void> {
    await this.createActionModal.getByRole('button', { name: /^Create Action$/i }).click();
  }

  async expectCreateActionError(message: RegExp | string): Promise<void> {
    await expect(this.createActionModal.getByText(message)).toBeVisible({ timeout: 10_000 });
  }

  async switchLogsTab(tab: 'Materials' | 'Comments' | 'Actions'): Promise<void> {
    await expect(this.logsTablist).toBeVisible({ timeout: 15_000 });
    await this.logsTablist.getByRole('tab', { name: tab }).click();
  }

  async openExportMenu(): Promise<void> {
    await this.exportButton.click();
    await expect(this.page.getByRole('menu')).toBeVisible();
  }

  async exportMenuItem(label: string): Promise<void> {
    await this.page.getByRole('menuitem', { name: label }).click();
  }

  async expectAiSummaryPanel(): Promise<void> {
    await expect(this.page.getByRole('button', { name: /Enhance with AI/i })).toBeVisible({ timeout: 15_000 });
  }

  async uploadMaterial(filePath: string): Promise<void> {
    await this.selectDockTool('Comment & Action Logs');
    await this.switchLogsTab('Materials');
    await expect(this.page.locator('.thought-materials-panel')).toBeVisible({ timeout: 15_000 });
    await this.openAddMaterialSourceModal();

    const sourceModal = this.page.getByRole('dialog').filter({ hasText: 'Add meeting material' });
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await sourceModal.getByRole('button', { name: /Upload new file/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    const storageModal = this.page.getByRole('dialog').filter({ hasText: 'Where should this file be stored?' });
    await expect(storageModal).toBeVisible({ timeout: 15_000 });
    await storageModal.getByRole('button', { name: /^Upload$/i }).click();
    await waitForSpinnerToDisappear(this.page);
  }

  async openAddMaterialSourceModal(): Promise<void> {
    await this.page.locator('.thought-materials-upload').click();
    const sourceModal = this.page.getByRole('dialog').filter({ hasText: 'Add meeting material' });
    await expect(sourceModal).toBeVisible({ timeout: 10_000 });
    await expect(sourceModal.getByText(/Select from DocFlow/i)).toBeVisible();
    await expect(sourceModal.getByRole('button', { name: /Upload new file/i })).toBeVisible();
  }

  async expectMaterialsTabCount(count: number): Promise<void> {
    const tabCount = this.page.locator('.thought-logs-toggle__btn--materials .thought-logs-toggle__count');
    await expect(tabCount).toHaveText(String(count), { timeout: 60_000 });
  }

  async expectCommentsTabCountAtLeast(count: number): Promise<void> {
    const tabCount = this.page.locator('.thought-logs-toggle__btn--decision .thought-logs-toggle__count').first();
    const text = await tabCount.innerText({ timeout: 20_000 });
    expect(Number.parseInt(text, 10)).toBeGreaterThanOrEqual(count);
  }

  async clickMaterialInList(name: string): Promise<void> {
    await this.page.locator('.thought-materials-files').getByText(name, { exact: false }).click();
  }

  async expectPreviewModeVisible(): Promise<void> {
    await expect(this.page.getByText('Preview Mode')).toBeVisible({ timeout: 15_000 });
  }

  async expectMaterialFilename(name: string): Promise<void> {
    await expect(this.page.locator('.thought-materials-files').getByText(name, { exact: false })).toBeVisible({
      timeout: 60_000,
    });
  }

  async zoomIn(meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    await this.page.getByRole('button', { name: 'Zoom in' }).click();
  }

  async zoomOut(meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    await this.page.getByRole('button', { name: 'Zoom out' }).click();
  }

  async fitCanvas(meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    await this.page.getByRole('button', { name: 'Fit canvas' }).click();
  }

  async searchNodes(query: string): Promise<void> {
    await this.nodeSearchInput.fill(query);
  }

  async openContributorsPanel(): Promise<void> {
    await this.manageContributorsButton.click();
    await expect(this.page.getByText(/Contributors|Meeting setup/i).first()).toBeVisible({ timeout: 15_000 });
  }

  async expectLogEntryText(text: string): Promise<void> {
    await expect(this.logsPanel.getByText(text, { exact: false })).toBeVisible({ timeout: 20_000 });
  }

  async expectActionInLogs(): Promise<void> {
    await this.switchLogsTab('Actions');
    const actionItem = this.logsPanel.locator('.thought-logs-expand-item--action').first();
    await expect(actionItem).toBeVisible({ timeout: 20_000 });
    await actionItem.locator('.thought-logs-expand-item__summary-btn').click();
    await expect(actionItem.getByText(/Synced to ERP|Untitled action/i)).toBeVisible({ timeout: 20_000 });
  }

  async deleteNodeViaContext(node: Locator): Promise<void> {
    await this.openContextMenuOnNode(node);
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.contextMenuAction('Delete');
    await expect(node).toBeHidden({ timeout: 15_000 });
  }

  async addSiblingNodeOn(node: Locator, meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    const before = await this.childNodeCount();
    await this.openContextMenuOnNode(node);
    await this.contextMenuAction('Create sibling node');
    await expect(this.childNodes).toHaveCount(before + 1, { timeout: 20_000 });
  }

  async addParentNodeOn(node: Locator, meetingTitle?: string): Promise<void> {
    await this.ensureCanvasView(meetingTitle);
    const before = await this.flowNodes.count();
    await this.openContextMenuOnNode(node);
    await this.contextMenuAction('Create parent node');
    await expect(this.flowNodes).toHaveCount(before + 1, { timeout: 20_000 });
  }

  async editNodeLabelOn(node: Locator, label: string): Promise<void> {
    await this.openContextMenuOnNode(node);
    await this.contextMenuAction('Edit label');
    await this.editSelectedNodeLabel(label);
  }

  async addCommentOnNode(node: Locator, text: string): Promise<void> {
    await this.openContextMenuOnNode(node);
    await this.contextMenuAction('Add comment');
    await this.addComment(text);
  }

  async expectContextMenuItems(labels: string[]): Promise<void> {
    for (const label of labels) {
      await expect(this.contextMenu.getByRole('menuitem', { name: label })).toBeVisible();
    }
  }

  async expectMaterialPreviewContains(text: string): Promise<void> {
    await expect(this.page.locator('.thought-materials-preview')).toContainText(text, { timeout: 60_000 });
  }

  async openMaterialEditMode(): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit File' }).click();
    await expect(this.page.getByText('Editing Mode')).toBeVisible({ timeout: 15_000 });
  }

  async cancelMaterialEdit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
    await expect(this.page.getByText('Preview Mode')).toBeVisible({ timeout: 15_000 });
  }

  async deleteSelectedMaterial(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.locator('.thought-materials-viewer-toolbar button[title="Delete"]').click();
    await waitForSpinnerToDisappear(this.page);
  }

  async expandFirstCommentInLogs(): Promise<void> {
    await this.selectDockTool('Comment & Action Logs');
    await this.switchLogsTab('Comments');
    const item = this.logsPanel.locator('.thought-logs-expand-item--comment').first();
    await expect(item).toBeVisible({ timeout: 20_000 });
    await item.locator('.thought-logs-expand-item__summary-btn').click();
    await expect(item).toHaveClass(/is-expanded/);
  }

  async createActionFromCommentLogs(actionTitle: string): Promise<void> {
    const item = this.logsPanel.locator('.thought-logs-expand-item--comment.is-expanded').first();
    await item.getByRole('button', { name: 'Create Action' }).click();
    await expect(this.createActionModal).toBeVisible({ timeout: 15_000 });
    await this.fillCreateActionTitle(actionTitle);
    await this.selectFirstAssignee();
    await this.submitCreateAction();
    await expect(this.createActionModal).toBeHidden({ timeout: 30_000 });
  }

  async expectExpandedCommentMetadata(commentText: string): Promise<void> {
    const item = this.logsPanel.locator('.thought-logs-expand-item--comment.is-expanded').first();
    await expect(item.getByText('Comment', { exact: true })).toBeVisible();
    await expect(item.getByText(commentText, { exact: false })).toBeVisible();
    await expect(item.getByText('Added by')).toBeVisible();
    await expect(item.getByText('Tagged')).toBeVisible();
    await expect(item.getByText('When')).toBeVisible();
    await expect(item.getByRole('button', { name: 'View on canvas' })).toBeVisible();
    await expect(item.getByRole('button', { name: 'Create Action' })).toBeVisible();
  }

  async expectExpandedActionMetadata(): Promise<void> {
    const item = this.logsPanel.locator('.thought-logs-expand-item--action.is-expanded').first();
    await expect(item.getByText('Action', { exact: true })).toBeVisible();
    await expect(item.getByText('Owners')).toBeVisible();
  }

  async cycleDockTools(meetingTitle?: string): Promise<void> {
    await this.selectDockTool('Comment & Action Logs');
    await expect(this.logsTablist).toBeVisible();
    await this.selectDockTool('AI Summary');
    await this.expectAiSummaryPanel();
    await this.selectDockTool('Canvas');
    await this.waitForCanvasReady(meetingTitle);
  }

  async viewCommentOnCanvas(): Promise<void> {
    const item = this.logsPanel.locator('.thought-logs-expand-item--comment.is-expanded').first();
    await item.getByRole('button', { name: 'View on canvas' }).click();
    await this.selectDockTool('Canvas');
  }

  async expandFirstActionInLogs(): Promise<void> {
    await this.switchLogsTab('Actions');
    const item = this.logsPanel.locator('.thought-logs-expand-item--action').first();
    await expect(item).toBeVisible({ timeout: 20_000 });
    await item.locator('.thought-logs-expand-item__summary-btn').click();
    await expect(item).toHaveClass(/is-expanded/);
  }
}

export function createThoughtWorkspacePage(page: Page): ThoughtWorkspacePage {
  return new ThoughtWorkspacePage(page);
}
