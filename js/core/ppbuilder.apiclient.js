/**
 * ============================================================================
 * PP BUILDER - DATAVERSE WEB API CLIENT
 * ============================================================================
 *
 * Complete client for interacting with Dataverse Web API from Power Pages.
 * Handles all CRUD operations for pp_page, pp_version, and pp_block.
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

export class PPBuilderAPIClient {
  constructor() {
    this.baseURL = '/_api';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Generic fetch wrapper with error handling
   */
  async _fetch(url, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      },
      credentials: 'include' // Include Power Pages session cookies
    };

    try {
      const response = await fetch(url, config);

      // Handle different response statuses
      if (response.status === 204) {
        // No content (successful DELETE/PATCH)
        return { success: true };
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Build OData query string
   */
  _buildQuery(options = {}) {
    const params = [];

    if (options.filter) params.push(`$filter=${options.filter}`);
    if (options.select) params.push(`$select=${options.select}`);
    if (options.expand) params.push(`$expand=${options.expand}`);
    if (options.orderby) params.push(`$orderby=${options.orderby}`);
    if (options.top) params.push(`$top=${options.top}`);
    if (options.skip) params.push(`$skip=${options.skip}`);

    return params.length > 0 ? `?${params.join('&')}` : '';
  }

  // ==========================================================================
  // PP_PAGE OPERATIONS
  // ==========================================================================

  /**
   * Get all pages
   */
  async getPages(options = {}) {
    const query = this._buildQuery({
      filter: options.filter || 'statecode eq 0',
      orderby: options.orderby || 'pp_title',
      ...options
    });

    const result = await this._fetch(`${this.baseURL}/pp_pages${query}`);
    return result.value || [];
  }

  /**
   * Get single page by ID
   */
  async getPage(pageId) {
    const result = await this._fetch(`${this.baseURL}/pp_pages(${pageId})`);
    return result;
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug) {
    const pages = await this.getPages({
      filter: `pp_slug eq '${slug}' and statecode eq 0`,
      top: 1
    });
    return pages.length > 0 ? pages[0] : null;
  }

  /**
   * Create new page
   */
  async createPage(pageData) {
    const payload = {
      pp_title: pageData.title || pageData.name,
      pp_slug: pageData.slug,
      pp_metadescription: pageData.metaDescription || '',
      pp_status: 125600000 // Default to Draft
    };

    return await this._fetch(`${this.baseURL}/pp_pages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update page
   */
  async updatePage(pageId, updates) {
    const payload = {};
    if (updates.name) payload.pp_title = updates.name;
    if (updates.slug) payload.pp_slug = updates.slug;
    if (updates.title) payload.pp_title = updates.title;
    if (updates.metaDescription !== undefined) payload.pp_metadescription = updates.metaDescription;
    if (updates.status !== undefined) payload.pp_status = updates.status; // 125600000=Draft, 125600001=Published, 125600002=Archived

    return await this._fetch(`${this.baseURL}/pp_pages(${pageId})`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Delete page
   */
  async deletePage(pageId) {
    return await this._fetch(`${this.baseURL}/pp_pages(${pageId})`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // pp_version OPERATIONS
  // ==========================================================================

  /**
   * Get all versions for a page
   */
  async getPageVersions(pageId, options = {}) {
    const query = this._buildQuery({
      filter: `_pp_page_value eq ${pageId} and statecode eq 0`,
      orderby: options.orderby || 'pp_createdon desc',
      ...options
    });

    const result = await this._fetch(`${this.baseURL}/pp_versions${query}`);
    return result.value || [];
  }

  /**
   * Get active version for page (Published > Draft)
   */
  async getActivePageVersion(pageId) {
    const versions = await this.getPageVersions(pageId, {
      orderby: 'pp_state desc, pp_createdon desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Get draft version for page
   */
  async getDraftPageVersion(pageId) {
    const versions = await this.getPageVersions(pageId, {
      filter: `_pp_page_value eq ${pageId} and pp_state eq 125600000 and statecode eq 0`,
      orderby: 'pp_createdon desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Get published version for page
   */
  async getPublishedPageVersion(pageId) {
    const versions = await this.getPageVersions(pageId, {
      filter: `_pp_page_value eq ${pageId} and pp_state eq 125600001 and statecode eq 0`,
      orderby: 'pp_createdon desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Create new page version
   */
  async createPageVersion(versionData) {
    const payload = {
      'pp_Page@odata.bind': `/pp_pages(${versionData.pageId})`,
      pp_label: versionData.name,
      pp_state: versionData.state || 125600000 // 125600000=Draft, 125600001=Published
    };

    if (versionData.settings) {
      payload.pp_settings = JSON.stringify(versionData.settings);
    }

    return await this._fetch(`${this.baseURL}/pp_versions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update page version
   */
  async updatePageVersion(versionId, updates) {
    const payload = {};
    if (updates.name) payload.pp_label = updates.name;
    if (updates.state !== undefined) {
      payload.pp_state = updates.state; // 125600000=Draft, 125600001=Published
    }
    if (updates.settings) payload.pp_settings = JSON.stringify(updates.settings);

    return await this._fetch(`${this.baseURL}/pp_versions(${versionId})`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Delete page version
   */
  async deletePageVersion(versionId) {
    return await this._fetch(`${this.baseURL}/pp_versions(${versionId})`, {
      method: 'DELETE'
    });
  }

  // ==========================================================================
  // PP_BLOCK OPERATIONS
  // ==========================================================================

  /**
   * Get all blocks for a version
   */
  async getBlocks(versionId, options = {}) {
    const query = this._buildQuery({
      filter: `_pp_versionid_value eq ${versionId} and statecode eq 0`,
      orderby: options.orderby || 'pp_order',
      ...options
    });

    const result = await this._fetch(`${this.baseURL}/pp_blocks${query}`);
    return result.value || [];
  }

  /**
   * Get single block by ID
   */
  async getBlock(blockId) {
    return await this._fetch(`${this.baseURL}/pp_blocks(${blockId})`);
  }

  /**
   * Create new block
   */
  async createBlock(blockData) {
    const payload = {
      'pp_versionid@odata.bind': `/pp_versions(${blockData.pageversionId})`,
      pp_title: blockData.name,
      pp_type: blockData.templateName,
      pp_blocktype: blockData.blockType,
      pp_order: blockData.sortOrder || 0,
      pp_data: blockData.settings ? JSON.stringify(blockData.settings) : '{}'
    };

    if (blockData.parentBlockId) {
      payload['pp_parentblockid@odata.bind'] = `/pp_blocks(${blockData.parentBlockId})`;
    }

    if (blockData.zone) {
      payload.pp_zone = blockData.zone;
    }

    return await this._fetch(`${this.baseURL}/pp_blocks`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update block
   */
  async updateBlock(blockId, updates) {
    const payload = {};
    if (updates.name) payload.pp_title = updates.name;
    if (updates.sortOrder !== undefined) payload.pp_order = updates.sortOrder;
    if (updates.settings) payload.pp_data = JSON.stringify(updates.settings);
    if (updates.zone !== undefined) payload.pp_zone = updates.zone;

    return await this._fetch(`${this.baseURL}/pp_blocks(${blockId})`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Delete block
   */
  async deleteBlock(blockId) {
    return await this._fetch(`${this.baseURL}/pp_blocks(${blockId})`, {
      method: 'DELETE'
    });
  }

  /**
   * Delete all blocks for a version
   */
  async deleteAllBlocks(versionId) {
    const blocks = await this.getBlocks(versionId);

    // Delete in reverse order to handle parent-child relationships
    const sortedBlocks = blocks.sort((a, b) => b.pp_order - a.pp_order);

    for (const block of sortedBlocks) {
      await this.deleteBlock(block.pp_blockid);
    }

    return { success: true, deletedCount: blocks.length };
  }

  // ==========================================================================
  // COMPOSITE OPERATIONS
  // ==========================================================================

  /**
   * Load complete page data for editing
   */
  async loadPageForEditing(pageSlug) {
    // Get page
    const page = await this.getPageBySlug(pageSlug);
    if (!page) {
      throw new Error(`Page not found: ${pageSlug}`);
    }

    // Get active version (Draft > Published)
    const version = await getActivePageVersion(page.pp_pageid);
    if (!version) {
      throw new Error(`No active version found for page: ${pageSlug}`);
    }

    // Get all blocks
    const blocks = await this.getBlocks(version.pp_versionid);

    // Parse settings JSON
    const parsedVersion = {
      ...version,
      settings: version.pp_settings ? JSON.parse(version.pp_settings) : {}
    };

    const parsedBlocks = blocks.map(block => ({
      ...block,
      settings: block.pp_data ? JSON.parse(block.pp_data) : {}
    }));

    return {
      page,
      version: parsedVersion,
      blocks: parsedBlocks
    };
  }

  /**
   * Save draft (delete old blocks + create new)
   */
  async saveDraft(versionId, blocks) {
    // Delete all existing blocks
    await this.deleteAllBlocks(versionId);

    // Create new blocks
    const createdBlocks = [];
    for (const block of blocks) {
      const created = await this.createBlock({
        ...block,
        pageversionId: versionId
      });
      createdBlocks.push(created);
    }

    return {
      success: true,
      versionId,
      blocksCreated: createdBlocks.length
    };
  }

  /**
   * Publish page (clone draft → published)
   */
  async publishPage(pageId, draftVersionId) {
    // Get draft version
    const draftVersion = await this._fetch(`${this.baseURL}/pp_versions(${draftVersionId})`);
    const draftBlocks = await this.getBlocks(draftVersionId);

    // Simply update the draft version to published (no archiving since you only have Draft/Published states)
    await this.updatePageVersion(draftVersionId, {
      state: 125600001 // Published
    });

    return {
      success: true,
      versionId: draftVersionId,
      blocksCount: draftBlocks.length
    };
  }

  /**
   * Clone version (create new draft from published)
   */
  async cloneVersion(sourceVersionId, pageId) {
    // Get source version
    const sourceVersion = await this._fetch(`${this.baseURL}/pp_versions(${sourceVersionId})`);
    const sourceBlocks = await this.getBlocks(sourceVersionId);

    // Create new draft version
    const newVersion = await this.createPageVersion({
      pageId,
      name: `${sourceVersion.pp_label} - Copy`,
      state: 125600000, // Draft
      settings: sourceVersion.pp_settings ? JSON.parse(sourceVersion.pp_settings) : {}
    });

    // Clone all blocks from source to new version
    const blockIdMap = {}; // Map old IDs to new IDs for parent relationships

    // First pass: create blocks without parent references
    for (const sourceBlock of sourceBlocks.filter(b => !b.pp_parentblockid)) {
      const newBlock = await this.createBlock({
        pageversionId: newVersion.pp_VersionId,
        name: sourceBlock.pp_title,
        templateName: sourceBlock.pp_type,
        blockType: sourceBlock.pp_blocktype,
        sortOrder: sourceBlock.pp_order,
        zone: sourceBlock.pp_region,
        settings: sourceBlock.pp_data ? JSON.parse(sourceBlock.pp_data) : {}
      });

      blockIdMap[sourceBlock.pp_BlockId] = newBlock.pp_BlockId;
    }

    // Second pass: create child blocks with parent references
    for (const sourceBlock of sourceBlocks.filter(b => b.pp_parentblockid)) {
      const newBlock = await this.createBlock({
        pageversionId: newVersion.pp_VersionId,
        parentBlockId: blockIdMap[sourceBlock.pp_parentblockid],
        name: sourceBlock.pp_title,
        templateName: sourceBlock.pp_type,
        blockType: sourceBlock.pp_blocktype,
        sortOrder: sourceBlock.pp_order,
        zone: sourceBlock.pp_region,
        settings: sourceBlock.pp_data ? JSON.parse(sourceBlock.pp_data) : {}
      });

      blockIdMap[sourceBlock.pp_BlockId] = newBlock.pp_BlockId;
    }

    return {
      success: true,
      newVersionId: newVersion.pp_VersionId,
      blocksCloned: sourceBlocks.length
    };
  }
}

// Export singleton instance
export const apiClient = new PPBuilderAPIClient();
