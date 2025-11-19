/**
 * ============================================================================
 * PP BUILDER - BLOCK DEFINITIONS
 * ============================================================================
 *
 * Centralized block definitions for GrapesJS.
 * Imports all block categories and provides unified access.
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

import { layoutBlocks } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@81ae729/js/blocks/layout-blocks.js';
import { contentBlocks } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@81ae729/js/blocks/content-blocks.js';
import { mediaBlocks } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@81ae729/js/blocks/media-blocks.js';
import { navBlocks } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@81ae729/js/blocks/nav-blocks.js';
import { dvBlocks } from 'https://cdn.jsdelivr.net/gh/Returnbv/pp-builder-cdn@81ae729/js/blocks/dv-blocks.js';

class PPBuilderBlockDefinitions {
  constructor() {
    this.categories = {
      layout: layoutBlocks,
      content: contentBlocks,
      media: mediaBlocks,
      nav: navBlocks,
      dv: dvBlocks
    };
  }

  /**
   * Get all blocks for GrapesJS Block Manager
   */
  getAllBlocks() {
    const allBlocks = [];

    Object.values(this.categories).forEach(category => {
      allBlocks.push(...category.getBlocks());
    });

    return allBlocks;
  }

  /**
   * Get blocks by category
   */
  getBlocksByCategory(categoryName) {
    return this.categories[categoryName]?.getBlocks() || [];
  }

  /**
   * Register all components with GrapesJS editor
   */
  registerComponents(editor) {
    Object.values(this.categories).forEach(category => {
      category.registerComponents(editor);
    });

    console.log('✅ All block components registered');
  }
}

// Export singleton instance
export const blockDefinitions = new PPBuilderBlockDefinitions();
