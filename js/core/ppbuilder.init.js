

import { apiClient } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/core/ppbuilder.apiclient.js';
import { serializer } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/core/ppbuilder.serializer.js';
import { pageManager } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/modules/ppbuilder.pagemanager.js';

class PPBuilderApp {
  constructor() {
    this.editor = null;
    this.currentPage = null;
    this.currentVersion = null;
    this.isDirty = false;
  }

  async init() {
    console.log('🚀 PP Builder initializing...');

    try {
      this.editor = await this.initGrapesJS();

      await pageManager.init(this.editor, this);

      await pageManager.loadPagesList();

      this.setupEventListeners();

      this.setupAutoSave();

      console.log('✅ PP Builder initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PP Builder:', error);
      this.showError('Failed to initialize editor. Please refresh the page.');
    }
  }

  async initGrapesJS() {
    const editor = grapesjs.init({
      container: '#gjs-editor',
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,

      blockManager: {
        appendTo: '#gjs-blocks'
      },

      layerManager: {
        appendTo: '#gjs-layers'
      },

      traitManager: {
        appendTo: '#gjs-traits'
      },

      styleManager: {
        appendTo: '#gjs-styles'
      },

      panels: {
        defaults: []
      },

      plugins: ['gjs-preset-webpage'],

      pluginsOpts: {
        'gjs-preset-webpage': {}
      }
    });

    this.addCustomCommands(editor);

    this.addCustomPanels(editor);

    return editor;
  }

  addCustomCommands(editor) {
    editor.Commands.add('save-draft', {
      run: async (editor) => {
        await this.saveDraft();
      }
    });

    editor.Commands.add('publish', {
      run: async (editor) => {
        await this.publishPage();
      }
    });

    editor.Commands.add('preview', {
      run: (editor) => {
        this.openPreview();
      }
    });

    editor.Commands.add('load-page', {
      run: async (editor, sender, options) => {
        await this.loadPage(options.pageSlug);
      }
    });
  }

  addCustomPanels(editor) {
    const panelManager = editor.Panels;

    panelManager.addPanel({
      id: 'pp-toolbar',
      el: '.pp-admin-topbar'
    });

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

  setupEventListeners() {
    document.getElementById('pp-btn-save')?.addEventListener('click', () => {
      this.saveDraft();
    });

    document.getElementById('pp-btn-publish')?.addEventListener('click', () => {
      this.publishPage();
    });

    document.getElementById('pp-btn-preview')?.addEventListener('click', () => {
      this.openPreview();
    });

    this.editor.on('component:add component:remove component:update', () => {
      this.isDirty = true;
      this.updateStatus('Unsaved changes');
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    });
  }

  setupAutoSave() {
    setInterval(async () => {
      if (this.isDirty && this.currentVersion) {
        console.log('💾 Auto-saving...');
        await this.saveDraft(true);
      }
    }, 60000);
  }

  async loadPage(pageSlug) {
    try {
      this.showLoading('Loading page...');

      const pageData = await apiClient.loadPageForEditing(pageSlug);

      this.currentPage = pageData.page;
      this.currentVersion = pageData.version;

      const components = serializer.dataverseToGrapesJS(pageData.blocks, this.editor);

      this.editor.DomComponents.clear();

      this.editor.DomComponents.addComponent(components);

      this.updatePageInfo();
      this.isDirty = false;

      this.hideLoading();
      this.showSuccess(`Loaded: ${this.currentPage.pp_title}`);

      console.log('✅ Page loaded:', pageSlug);
    } catch (error) {
      console.error('❌ Failed to load page:', error);
      this.hideLoading();
      this.showError(`Failed to load page: ${error.message}`);
    }
  }

  async saveDraft(silent = false) {
    if (!this.currentVersion) {
      this.showError('No page loaded');
      return;
    }

    try {
      if (!silent) {
        this.showLoading('Saving draft...');
      }

      const components = this.editor.DomComponents.getWrapper().get('components');

      const blocks = serializer.grapesJSToDataverse(
        components.models,
        this.currentVersion.pp_versionid
      );

      const validation = serializer.validateBlocks(blocks);
      if (!validation.valid) {
        throw new Error(`Invalid blocks: ${validation.errors.join(', ')}`);
      }

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

  async publishPage() {
    if (!this.currentPage || !this.currentVersion) {
      this.showError('No page loaded');
      return;
    }

    if (!confirm('Are you sure you want to publish this page? This will make it live on the website.')) {
      return;
    }

    try {
      this.showLoading('Publishing page...');

      await this.saveDraft(true);

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

  openPreview() {
    if (!this.currentPage) {
      this.showError('No page loaded');
      return;
    }

    const previewUrl = `/${this.currentPage.pp_slug}?preview=true`;
    window.open(previewUrl, '_blank', 'width=1200,height=800');
  }

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

  updateStatus(message) {
    console.log('📌', message);
  }

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

  hideLoading() {
    const overlay = document.getElementById('pp-loading-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `pp-notification pp-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
}

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

window.PPBuilder = app;
