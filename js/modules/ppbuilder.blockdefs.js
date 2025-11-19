

import { layoutBlocks } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/blocks/layout-blocks.js';
import { contentBlocks } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/blocks/content-blocks.js';
import { mediaBlocks } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/blocks/media-blocks.js';
import { navBlocks } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/blocks/nav-blocks.js';
import { dvBlocks } from 'https://cdn.statically.io/gh/Returnbv/pp-builder-cdn/main/js/blocks/dv-blocks.js';

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

  getAllBlocks() {
    const allBlocks = [];

    Object.values(this.categories).forEach(category => {
      allBlocks.push(...category.getBlocks());
    });

    return allBlocks;
  }

  getBlocksByCategory(categoryName) {
    return this.categories[categoryName]?.getBlocks() || [];
  }

  registerComponents(editor) {
    Object.values(this.categories).forEach(category => {
      category.registerComponents(editor);
    });

    console.log('✅ All block components registered');
  }
}

export const blockDefinitions = new PPBuilderBlockDefinitions();
