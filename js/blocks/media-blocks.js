/**
 * ============================================================================
 * PP BUILDER - MEDIA BLOCKS
 * ============================================================================
 *
 * Media block definitions for GrapesJS:
 * - Images
 * - Videos
 * - Galleries
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

class MediaBlocks {
  getBlocks() {
    return [
      {
        id: 'pp_media_image_01',
        label: 'Image',
        category: 'Media',
        content: { type: 'image' },
        attributes: { class: 'gjs-block-media' }
      }
    ];
  }

  registerComponents(editor) {
    // Use GrapesJS default image component for now
    // Can be extended later
  }
}

export const mediaBlocks = new MediaBlocks();
