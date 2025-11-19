/**
 * ============================================================================
 * PP BUILDER - DATAVERSE BLOCKS
 * ============================================================================
 *
 * Dataverse block definitions for GrapesJS:
 * - Entity Lists
 * - Entity Forms
 * - Entity Details
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

class DVBlocks {
  getBlocks() {
    return [
      {
        id: 'pp_dv_list_01',
        label: 'Entity List',
        category: 'Dataverse',
        content: '<div class="tw-p-4 tw-border tw-border-dashed tw-border-gray-400 tw-text-center">Entity List Block<br><small>Configure in settings</small></div>',
        attributes: { class: 'gjs-block-dv' }
      }
    ];
  }

  registerComponents(editor) {
    // Extend in future phases with FetchXML integration
  }
}

export const dvBlocks = new DVBlocks();
