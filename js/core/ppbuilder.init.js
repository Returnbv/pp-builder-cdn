/**
 * ============================================================================
 * PP BUILDER - GRAPESJS INITIALIZATION
 * ============================================================================
 *
 * Main entry point for PP Builder admin interface.
 * Initializes GrapesJS editor with all configurations.
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

import { apiClient } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@LATEST/js/core/ppbuilder.apiclient.js';
import { serializer } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@LATEST/js/core/ppbuilder.serializer.js';
import { blockDefinitions } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@LATEST/js/modules/ppbuilder.blockdefs.js';
import { pageManager } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@LATEST/js/modules/ppbuilder.pagemanager.js';

class PPBuilderApp {
  constructor() {
    this.editor = null;
    this.currentPage = null;
    this.currentVersion = null;
    this.isDirty = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🚀 PP Builder initializing...');

    try {
      // Initialize GrapesJS editor
      this.editor = await this.initGrapesJS();

      // Initialize page manager
      await pageManager.init(this.editor, this);

      // Load pages list
      await pageManager.loadPagesList();

      // Setup event listeners
      this.setupEventListeners();

      // Setup auto-save
      this.setupAutoSave();

      console.log('✅ PP Builder initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PP Builder:', error);
      this.showError('Failed to initialize editor. Please refresh the page.');
    }
  }

  /**
   * Initialize GrapesJS editor
   */
  async initGrapesJS() {
    const editor = grapesjs.init({
      // Container
      container: '#gjs-editor',

      // Dimensions
      height: '100%',
      width: 'auto',

      // Storage
      storageManager: false, // We handle storage via Dataverse API

      // Panels
      panels: {
        defaults: []
      },

      // Block Manager
      blockManager: {
        appendTo: '#gjs-blocks',
        blocks: blockDefinitions.getAllBlocks()
      },

      // Layer Manager
      layerManager: {
        appendTo: '#gjs-layers'
      },

      // Trait Manager
      traitManager: {
        appendTo: '#gjs-traits'
      },

      // Style Manager
      styleManager: {
        appendTo: '#gjs-styles',
        sectors: this.getStyleSectors()
      },

      // Canvas
      canvas: {
        styles: [
          // Tailwind CSS for preview
          '/admin/css/tailwind-preview.css'
        ],
        scripts: []
      },

      // Device Manager
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: ''
          },
          {
            name: 'Tablet',
            width: '768px',
            widthMedia: '992px'
          },
          {
            name: 'Mobile',
            width: '375px',
            widthMedia: '480px'
          }
        ]
      },

      // Rich Text Editor
      richTextEditor: {
        actions: ['bold', 'italic', 'underline', 'strikethrough', 'link']
      },

      // Plugins
      plugins: [],

      // Plugin options
      pluginsOpts: {}
    });

    // Add custom commands
    this.addCustomCommands(editor);

    // Add custom panels
    this.addCustomPanels(editor);

    return editor;
  }

  /**
   * Get style manager sectors
   */
  getStyleSectors() {
    return [
      {
        name: 'General',
        open: true,
        buildProps: ['width', 'height', 'min-height', 'max-width', 'margin', 'padding']
      },
      {
        name: 'Typography',
        open: false,
        buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow']
      },
      {
        name: 'Background',
        open: false,
        buildProps: ['background-color', 'background-image', 'background-repeat', 'background-position', 'background-size']
      },
      {
        name: 'Border',
        open: false,
        buildProps: ['border', 'border-radius', 'border-width', 'border-style', 'border-color']
      },
      {
        name: 'Extra',
        open: false,
        buildProps: ['opacity', 'transition', 'transform', 'cursor', 'overflow']
      }
    ];
  }

  /**
   * Add custom commands
   */
  addCustomCommands(editor) {
    // Save Draft command
    editor.Commands.add('save-draft', {
      run: async (editor) => {
        await this.saveDraft();
      }
    });

    // Publish command
    editor.Commands.add('publish', {
      run: async (editor) => {
        await this.publishPage();
      }
    });

    // Preview command
    editor.Commands.add('preview', {
      run: (editor) => {
        this.openPreview();
      }
    });

    // Load page command
    editor.Commands.add('load-page', {
      run: async (editor, sender, options) => {
        await this.loadPage(options.pageSlug);
      }
    });
  }

  /**
   * Add custom panels
   */
  addCustomPanels(editor) {
    const panelManager = editor.Panels;

    // Top toolbar
    panelManager.addPanel({
      id: 'pp-toolbar',
      el: '.pp-admin-topbar'
    });

    // Device switcher
    panelManager.addButton('pp-toolbar', {
      id: 'device-desktop',
      command: 'set-device-desktop',
      className: 'fa fa-desktop',
      attributes: { title: 'Desktop' },
      active: true
    });

    panelManager.addButton('pp-toolbar', {
      id: 'device-tablet',
      command: 'set-device-tablet',
      className: 'fa fa-tablet',
      attributes: { title: 'Tablet' }
    });

    panelManager.addButton('pp-toolbar', {
      id: 'device-mobile',
      command: 'set-device-mobile',
      className: 'fa fa-mobile',
      attributes: { title: 'Mobile' }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Save button
    document.getElementById('pp-btn-save')?.addEventListener('click', () => {
      this.saveDraft();
    });

    // Publish button
    document.getElementById('pp-btn-publish')?.addEventListener('click', () => {
      this.publishPage();
    });

    // Preview button
    document.getElementById('pp-btn-preview')?.addEventListener('click', () => {
      this.openPreview();
    });

    // Track changes
    this.editor.on('component:add component:remove component:update', () => {
      this.isDirty = true;
      this.updateStatus('Unsaved changes');
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  /**
   * Setup auto-save
   */
  setupAutoSave() {
    setInterval(async () => {
      if (this.isDirty && this.currentVersion) {
        console.log('💾 Auto-saving...');
        await this.saveDraft(true); // Silent auto-save
      }
    }, 60000); // Auto-save every 60 seconds
  }

  /**
   * Load page into editor
   */
  async loadPage(pageSlug) {
    try {
      this.showLoading('Loading page...');

      // Load page data from Dataverse
      const pageData = await apiClient.loadPageForEditing(pageSlug);

      this.currentPage = pageData.page;
      this.currentVersion = pageData.version;

      // Convert Dataverse blocks to GrapesJS components
      const components = serializer.dataverseToGrapesJS(pageData.blocks, this.editor);

      // Clear editor
      this.editor.DomComponents.clear();

      // Add components to editor
      this.editor.DomComponents.addComponent(components);

      // Update UI
      this.updatePageInfo();
      this.isDirty = false;

      this.hideLoading();
      this.showSuccess(`Loaded: ${this.currentPage.pp_name}`);

      console.log('✅ Page loaded:', pageSlug);
    } catch (error) {
      console.error('❌ Failed to load page:', error);
      this.hideLoading();
      this.showError(`Failed to load page: ${error.message}`);
    }
  }

  /**
   * Save draft version
   */
  async saveDraft(silent = false) {
    if (!this.currentVersion) {
      this.showError('No page loaded');
      return;
    }

    try {
      if (!silent) {
        this.showLoading('Saving draft...');
      }

      // Get components from editor
      const components = this.editor.DomComponents.getWrapper().get('components');

      // Convert to Dataverse blocks
      const blocks = serializer.grapesJSToDataverse(
        components.models,
        this.currentVersion.pp_versionid
      );

      // Validate blocks
      const validation = serializer.validateBlocks(blocks);
      if (!validation.valid) {
        throw new Error(`Invalid blocks: ${validation.errors.join(', ')}`);
      }

      // Save to Dataverse
      await apiClient.saveDraft(this.currentVersion.pp_versionid, blocks);

      this.isDirty = false;

      if (!silent) {
        this.hideLoading();
        this.showSuccess('Draft saved successfully');
      }

      this.updateStatus('Draft saved');

      console.log('✅ Draft saved:', blocks.length, 'blocks');
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      if (!silent) {
        this.hideLoading();
      }
      this.showError(`Failed to save: ${error.message}`);
    }
  }

  /**
   * Publish page
   */
  async publishPage() {
    if (!this.currentPage || !this.currentVersion) {
      this.showError('No page loaded');
      return;
    }

    // Confirm publish
    if (!confirm('Are you sure you want to publish this page? This will make it live on the website.')) {
      return;
    }

    try {
      this.showLoading('Publishing page...');

      // First save draft to ensure latest changes are saved
      await this.saveDraft(true);

      // Publish to live
      await apiClient.publishPage(
        this.currentPage.pp_pageid,
        this.currentVersion.pp_versionid
      );

      this.hideLoading();
      this.showSuccess('Page published successfully! 🚀');
      this.updateStatus('Published');

      console.log('✅ Page published');
    } catch (error) {
      console.error('❌ Failed to publish:', error);
      this.hideLoading();
      this.showError(`Failed to publish: ${error.message}`);
    }
  }

  /**
   * Open preview window
   */
  openPreview() {
    if (!this.currentPage) {
      this.showError('No page loaded');
      return;
    }

    const previewUrl = `/${this.currentPage.pp_slug}?preview=true`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  }

  /**
   * Update page info display
   */
  updatePageInfo() {
    const statusElement = document.getElementById('pp-page-status');
    const pageSelectorElement = document.getElementById('pp-page-selector');

    if (statusElement && this.currentVersion) {
      const statusText = this.currentVersion.pp_status === 1 ? 'Draft' :
                         this.currentVersion.pp_status === 2 ? 'Published' : 'Archived';
      statusElement.textContent = statusText;
      statusElement.className = `pp-status-badge pp-status-${statusText.toLowerCase()}`;
    }

    if (pageSelectorElement && this.currentPage) {
      pageSelectorElement.value = this.currentPage.pp_slug;
    }
  }

  /**
   * Update status message
   */
  updateStatus(message) {
    console.log('📌', message);
    // Could update a status bar element here
  }

  /**
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    const overlay = document.getElementById('pp-loading-overlay');
    const messageEl = document.getElementById('pp-loading-message');

    if (overlay) {
      overlay.classList.add('active');
    }

    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('pp-loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `pp-notification pp-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
}

// Initialize when DOM is ready
let app;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new PPBuilderApp();
    app.init();
  });
} else {
  app = new PPBuilderApp();
  app.init();
}

// Export for debugging
window.PPBuilder = app;
