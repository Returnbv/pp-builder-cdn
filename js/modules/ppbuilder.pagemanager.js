/**
 * ============================================================================
 * PP BUILDER - PAGE MANAGER
 * ============================================================================
 *
 * Manages page list, creation, deletion, and selection.
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

import { apiClient } from '../core/ppbuilder.apiclient.js';

class PPBuilderPageManager {
  constructor() {
    this.editor = null;
    this.app = null;
    this.pages = [];
  }

  /**
   * Initialize page manager
   */
  async init(editor, app) {
    this.editor = editor;
    this.app = app;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Page selector dropdown
    const pageSelector = document.getElementById('pp-page-selector');
    if (pageSelector) {
      pageSelector.addEventListener('change', (e) => {
        const slug = e.target.value;
        if (slug) {
          this.app.loadPage(slug);
        }
      });
    }

    // Create page button
    const createPageBtn = document.getElementById('pp-create-page');
    if (createPageBtn) {
      createPageBtn.addEventListener('click', () => {
        this.showCreatePageDialog();
      });
    }
  }

  /**
   * Load pages list
   */
  async loadPagesList() {
    try {
      this.pages = await apiClient.getPages({
        orderby: 'pp_name'
      });

      this.renderPagesList();
      this.renderPagesDropdown();

      console.log(`✅ Loaded ${this.pages.length} pages`);
    } catch (error) {
      console.error('❌ Failed to load pages:', error);
      this.app.showError('Failed to load pages list');
    }
  }

  /**
   * Render pages list in sidebar
   */
  renderPagesList() {
    const listElement = document.getElementById('pp-pages-list');
    if (!listElement) return;

    listElement.innerHTML = '';

    if (this.pages.length === 0) {
      listElement.innerHTML = '<li class="pp-empty-state">No pages yet. Create one!</li>';
      return;
    }

    this.pages.forEach(page => {
      const li = document.createElement('li');
      li.className = 'pp-page-item';

      li.innerHTML = `
        <div class="pp-page-item-content">
          <span class="pp-page-name">${this.escapeHtml(page.pp_name)}</span>
          <span class="pp-page-slug">${this.escapeHtml(page.pp_slug)}</span>
        </div>
        <div class="pp-page-actions">
          <button class="pp-btn-icon" data-action="edit" data-slug="${page.pp_slug}" title="Edit">
            ✏️
          </button>
          <button class="pp-btn-icon" data-action="delete" data-id="${page.pp_pageid}" title="Delete">
            🗑️
          </button>
        </div>
      `;

      // Edit button
      li.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.app.loadPage(page.pp_slug);
      });

      // Delete button
      li.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePage(page.pp_pageid, page.pp_name);
      });

      listElement.appendChild(li);
    });
  }

  /**
   * Render pages dropdown
   */
  renderPagesDropdown() {
    const dropdown = document.getElementById('pp-page-selector');
    if (!dropdown) return;

    // Clear existing options (except placeholder)
    dropdown.innerHTML = '<option value="">Select a page...</option>';

    this.pages.forEach(page => {
      const option = document.createElement('option');
      option.value = page.pp_slug;
      option.textContent = page.pp_name;
      dropdown.appendChild(option);
    });
  }

  /**
   * Show create page dialog
   */
  showCreatePageDialog() {
    const dialog = this.createDialog({
      title: 'Create New Page',
      content: `
        <div class="pp-form-group">
          <label for="new-page-name">Page Name *</label>
          <input type="text" id="new-page-name" class="pp-input" placeholder="e.g., About Us" required>
        </div>
        <div class="pp-form-group">
          <label for="new-page-slug">URL Slug *</label>
          <input type="text" id="new-page-slug" class="pp-input" placeholder="e.g., about-us" required>
          <small>Only lowercase letters, numbers, and hyphens</small>
        </div>
        <div class="pp-form-group">
          <label for="new-page-title">Page Title</label>
          <input type="text" id="new-page-title" class="pp-input" placeholder="SEO title (optional)">
        </div>
        <div class="pp-form-group">
          <label for="new-page-description">Meta Description</label>
          <textarea id="new-page-description" class="pp-input" placeholder="SEO description (optional)" rows="3"></textarea>
        </div>
      `,
      buttons: [
        {
          text: 'Cancel',
          className: 'pp-btn-secondary',
          onClick: (dialog) => dialog.close()
        },
        {
          text: 'Create Page',
          className: 'pp-btn-primary',
          onClick: (dialog) => this.createPage(dialog)
        }
      ]
    });

    // Auto-generate slug from name
    const nameInput = document.getElementById('new-page-name');
    const slugInput = document.getElementById('new-page-slug');

    nameInput?.addEventListener('input', (e) => {
      const slug = this.generateSlug(e.target.value);
      if (slugInput) {
        slugInput.value = slug;
      }
    });

    dialog.show();
  }

  /**
   * Create new page
   */
  async createPage(dialog) {
    const name = document.getElementById('new-page-name')?.value.trim();
    const slug = document.getElementById('new-page-slug')?.value.trim();
    const title = document.getElementById('new-page-title')?.value.trim();
    const description = document.getElementById('new-page-description')?.value.trim();

    // Validation
    if (!name) {
      this.app.showError('Page name is required');
      return;
    }

    if (!slug) {
      this.app.showError('URL slug is required');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      this.app.showError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      dialog.close();
      this.app.showLoading('Creating page...');

      // Create page
      const page = await apiClient.createPage({
        name,
        slug,
        title: title || name,
        metaDescription: description,
        isActive: true
      });

      // Create initial draft version
      const version = await apiClient.createPageVersion({
        pageId: page.pp_pageid,
        name: 'v1.0 - Draft',
        versionNumber: 1,
        status: 1, // Draft
        settings: {
          wrapperClass: 'tw-min-h-screen',
          containerClass: ''
        }
      });

      // Reload pages list
      await this.loadPagesList();

      this.app.hideLoading();
      this.app.showSuccess(`Page "${name}" created successfully!`);

      // Load new page in editor
      this.app.loadPage(slug);

      console.log('✅ Page created:', page.pp_pageid);
    } catch (error) {
      console.error('❌ Failed to create page:', error);
      this.app.hideLoading();
      this.app.showError(`Failed to create page: ${error.message}`);
    }
  }

  /**
   * Delete page
   */
  async deletePage(pageId, pageName) {
    if (!confirm(`Are you sure you want to delete "${pageName}"?\n\nThis will delete all versions and blocks. This action cannot be undone.`)) {
      return;
    }

    try {
      this.app.showLoading('Deleting page...');

      // Get all versions
      const versions = await apiClient.getPageVersions(pageId);

      // Delete all blocks for each version
      for (const version of versions) {
        await apiClient.deleteAllBlocks(version.pp_versionid);
        await apiClient.deletePageVersion(version.pp_versionid);
      }

      // Delete page
      await apiClient.deletePage(pageId);

      // Reload pages list
      await this.loadPagesList();

      // Clear editor if this was the active page
      if (this.app.currentPage?.pp_pageid === pageId) {
        this.editor.DomComponents.clear();
        this.app.currentPage = null;
        this.app.currentVersion = null;
      }

      this.app.hideLoading();
      this.app.showSuccess(`Page "${pageName}" deleted successfully`);

      console.log('✅ Page deleted:', pageId);
    } catch (error) {
      console.error('❌ Failed to delete page:', error);
      this.app.hideLoading();
      this.app.showError(`Failed to delete page: ${error.message}`);
    }
  }

  /**
   * Generate slug from text
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create dialog
   */
  createDialog({ title, content, buttons = [] }) {
    const overlay = document.createElement('div');
    overlay.className = 'pp-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'pp-dialog';

    dialog.innerHTML = `
      <div class="pp-dialog-header">
        <h3>${title}</h3>
        <button class="pp-dialog-close">&times;</button>
      </div>
      <div class="pp-dialog-content">
        ${content}
      </div>
      <div class="pp-dialog-footer">
        ${buttons.map((btn, i) => `
          <button class="pp-btn ${btn.className}" data-button="${i}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    `;

    overlay.appendChild(dialog);

    // Close button
    dialog.querySelector('.pp-dialog-close').addEventListener('click', () => {
      overlay.remove();
    });

    // Action buttons
    buttons.forEach((btn, i) => {
      dialog.querySelector(`[data-button="${i}"]`).addEventListener('click', () => {
        btn.onClick({ close: () => overlay.remove() });
      });
    });

    return {
      show: () => document.body.appendChild(overlay),
      close: () => overlay.remove()
    };
  }
}

// Export singleton instance
export const pageManager = new PPBuilderPageManager();
