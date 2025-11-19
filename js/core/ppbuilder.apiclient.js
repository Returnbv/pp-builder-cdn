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
      filter: options.filter || 'pp_isactive eq true and statecode eq 0',
      orderby: options.orderby || 'pp_name',
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
      filter: `pp_slug eq '${slug}' and pp_isactive eq true and statecode eq 0`,
      top: 1
    });
    return pages.length > 0 ? pages[0] : null;
  }

  /**
   * Create new page
   */
  async createPage(pageData) {
    const payload = {
      pp_name: pageData.name,
      pp_slug: pageData.slug,
      pp_title: pageData.title || pageData.name,
      pp_metadescription: pageData.metaDescription || '',
      pp_isactive: pageData.isActive !== undefined ? pageData.isActive : true
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
    if (updates.name) payload.pp_name = updates.name;
    if (updates.slug) payload.pp_slug = updates.slug;
    if (updates.title) payload.pp_title = updates.title;
    if (updates.metaDescription !== undefined) payload.pp_metadescription = updates.metaDescription;
    if (updates.isActive !== undefined) payload.pp_isactive = updates.isActive;

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
      filter: `_pp_pageid_value eq ${pageId} and statecode eq 0`,
      orderby: options.orderby || 'pp_versionnumber desc',
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
      orderby: 'pp_status desc, pp_versionnumber desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Get draft version for page
   */
  async getDraftPageVersion(pageId) {
    const versions = await this.getPageVersions(pageId, {
      filter: `_pp_pageid_value eq ${pageId} and pp_status eq 1 and statecode eq 0`,
      orderby: 'pp_versionnumber desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Get published version for page
   */
  async getPublishedPageVersion(pageId) {
    const versions = await this.getPageVersions(pageId, {
      filter: `_pp_pageid_value eq ${pageId} and pp_status eq 2 and statecode eq 0`,
      orderby: 'pp_versionnumber desc',
      top: 1
    });

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Create new page version
   */
  async createPageVersion(versionData) {
    const payload = {
      'pp_pageid@odata.bind': `/pp_pages(${versionData.pageId})`,
      pp_name: versionData.name,
      pp_versionnumber: versionData.versionNumber,
      pp_status: versionData.status || 1, // 1=Draft, 2=Published, 3=Archived
      pp_ispublished: versionData.status === 2,
      pp_settings: versionData.settings ? JSON.stringify(versionData.settings) : null
    };

    if (versionData.status === 2) {
      payload.pp_publishedon = new Date().toISOString();
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
    if (updates.name) payload.pp_name = updates.name;
    if (updates.status !== undefined) {
      payload.pp_status = updates.status;
      payload.pp_ispublished = updates.status === 2;
      if (updates.status === 2) {
        payload.pp_publishedon = new Date().toISOString();
      }
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
      filter: `_pp_versionid_value eq ${versionId} and pp_isactive eq true and statecode eq 0`,
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
      pp_name: blockData.name,
      pp_type: blockData.templateName,
      pp_blocktype: blockData.blockType,
      pp_order: blockData.sortOrder || 0,
      pp_data: blockData.settings ? JSON.stringify(blockData.settings) : '{}',
      pp_isactive: blockData.isActive !== undefined ? blockData.isActive : true
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
    if (updates.name) payload.pp_name = updates.name;
    if (updates.sortOrder !== undefined) payload.pp_order = updates.sortOrder;
    if (updates.settings) payload.pp_data = JSON.stringify(updates.settings);
    if (updates.isActive !== undefined) payload.pp_isactive = updates.isActive;
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

    // Get current published version (if exists)
    const existingPublished = await this.getPublishedPageVersion(pageId);

    // Archive existing published version
    if (existingPublished) {
      await this.updatePageVersion(existingPublished.pp_versionid, {
        status: 3 // Archived
      });
    }

    // Create new published version
    const publishedVersion = await this.createPageVersion({
      pageId,
      name: `v${draftVersion.pp_versionnumber} - Published`,
      versionNumber: draftVersion.pp_versionnumber,
      status: 2, // Published
      settings: draftVersion.pp_settings ? JSON.parse(draftVersion.pp_settings) : {}
    });

    // Clone all blocks from draft to published
    const blockIdMap = {}; // Map old IDs to new IDs for parent relationships

    // First pass: create blocks without parent references
    for (const draftBlock of draftBlocks.filter(b => !b.pp_parentblockid)) {
      const newBlock = await this.createBlock({
        pageversionId: publishedVersion.pp_versionid,
        name: draftBlock.pp_name,
        templateName: draftBlock.pp_type,
        blockType: draftBlock.pp_blocktype,
        sortOrder: draftBlock.pp_order,
        zone: draftBlock.pp_zone,
        settings: draftBlock.pp_data ? JSON.parse(draftBlock.pp_data) : {},
        isActive: draftBlock.pp_isactive
      });

      blockIdMap[draftBlock.pp_blockid] = newBlock.pp_blockid;
    }

    // Second pass: create child blocks with parent references
    for (const draftBlock of draftBlocks.filter(b => b.pp_parentblockid)) {
      const newBlock = await this.createBlock({
        pageversionId: publishedVersion.pp_versionid,
        parentBlockId: blockIdMap[draftBlock.pp_parentblockid],
        name: draftBlock.pp_name,
        templateName: draftBlock.pp_type,
        blockType: draftBlock.pp_blocktype,
        sortOrder: draftBlock.pp_order,
        zone: draftBlock.pp_zone,
        settings: draftBlock.pp_data ? JSON.parse(draftBlock.pp_data) : {},
        isActive: draftBlock.pp_isactive
      });

      blockIdMap[draftBlock.pp_blockid] = newBlock.pp_blockid;
    }

    return {
      success: true,
      publishedVersionId: publishedVersion.pp_versionid,
      blocksPublished: draftBlocks.length
    };
  }
}

// Export singleton instance
export const apiClient = new PPBuilderAPIClient();
