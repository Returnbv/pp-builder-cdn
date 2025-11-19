/**
 * ============================================================================
 * PP BUILDER - NAVIGATION BLOCKS
 * ============================================================================
 *
 * Navigation block definitions for GrapesJS:
 * - Menus
 * - Breadcrumbs
 * - Pagination
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

class NavBlocks {
  getBlocks() {
    return [
      {
        id: 'pp_nav_menu_01',
        label: 'Menu',
        category: 'Navigation',
        content: '<nav class="tw-flex tw-gap-4"><a href="#" class="tw-px-4 tw-py-2">Home</a><a href="#" class="tw-px-4 tw-py-2">About</a><a href="#" class="tw-px-4 tw-py-2">Contact</a></nav>',
        attributes: { class: 'gjs-block-nav' }
      }
    ];
  }

  registerComponents(editor) {
    // Extend in future phases
  }
}

export const navBlocks = new NavBlocks();
