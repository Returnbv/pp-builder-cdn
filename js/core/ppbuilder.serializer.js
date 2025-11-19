/**
 * ============================================================================
 * PP BUILDER - GRAPES

JS ↔ DATAVERSE SERIALIZER
 * ============================================================================
 *
 * Converts between GrapesJS component format and Dataverse block format.
 *
 * Handles:
 * - GrapesJS components → Dataverse blocks (save)
 * - Dataverse blocks → GrapesJS components (load)
 * - Nested structures
 * - Settings/traits JSON
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

export class PPBuilderSerializer {
  constructor() {
    this.blockTypeMap = {
      'pp_layout': 1,
      'pp_content': 2,
      'pp_media': 3,
      'pp_nav': 4,
      'pp_dv': 5
    };
  }

  // ==========================================================================
  // DATAVERSE → GRAPES

JS (LOAD)
  // ==========================================================================

  /**
   * Convert flat Dataverse blocks to nested GrapesJS component tree
   */
  dataverseToGrapesJS(dataverseBlocks, editor) {
    // Build hierarchy
    const blockMap = new Map();
    const rootBlocks = [];

    // First pass: create map
    dataverseBlocks.forEach(block => {
      const parsed = this._parseDataverseBlock(block);
      blockMap.set(block.pp_blockid, {
        ...parsed,
        children: []
      });
    });

    // Second pass: build tree
    dataverseBlocks.forEach(block => {
      const current = blockMap.get(block.pp_blockid);

      if (block.pp_parentblockid) {
        const parent = blockMap.get(block.pp_parentblockid);
        if (parent) {
          parent.children.push(current);
        }
      } else {
        rootBlocks.push(current);
      }
    });

    // Convert to GrapesJS components
    const grapesComponents = rootBlocks.map(block =>
      this._blockToGrapesComponent(block, editor)
    );

    return grapesComponents;
  }

  /**
   * Parse Dataverse block record
   */
  _parseDataverseBlock(block) {
    return {
      id: block.pp_blockid,
      name: block.pp_name,
      templateName: block.pp_type,
      blockType: block.pp_blocktype,
      sortOrder: block.pp_order,
      zone: block.pp_zone,
      parentBlockId: block.pp_parentblockid,
      settings: block.pp_data ? JSON.parse(block.pp_data) : {},
      isActive: block.pp_isactive
    };
  }

  /**
   * Convert block to GrapesJS component
   */
  _blockToGrapesComponent(block, editor) {
    const component = {
      type: block.templateName,
      attributes: {
        'data-block-id': block.id,
        'data-template': block.templateName,
        'data-block-type': block.blockType
      },
      traits: this._settingsToTraits(block.settings),
      components: block.children.map(child =>
        this._blockToGrapesComponent(child, editor)
      )
    };

    // Apply settings to component
    if (block.settings) {
      component.attributes = {
        ...component.attributes,
        ...this._settingsToAttributes(block.settings, block.templateName)
      };

      // Set component content if it has a 'text' or 'content' setting
      if (block.settings.text) {
        component.content = block.settings.text;
      } else if (block.settings.content) {
        component.content = block.settings.content;
      }
    }

    return component;
  }

  /**
   * Convert settings object to GrapesJS traits
   */
  _settingsToTraits(settings) {
    return Object.entries(settings).map(([key, value]) => ({
      name: key,
      value: value
    }));
  }

  /**
   * Convert settings to HTML attributes
   */
  _settingsToAttributes(settings, templateName) {
    const attributes = {};

    // Apply Tailwind classes based on settings
    const classes = this._settingsToClasses(settings, templateName);
    if (classes.length > 0) {
      attributes.class = classes.join(' ');
    }

    // Add custom class if provided
    if (settings.customClass) {
      attributes.class = `${attributes.class || ''} ${settings.customClass}`.trim();
    }

    // Add ID if provided
    if (settings.id) {
      attributes.id = settings.id;
    }

    return attributes;
  }

  /**
   * Convert settings to Tailwind CSS classes
   */
  _settingsToClasses(settings, templateName) {
    const classes = [];

    // Background color
    if (settings.backgroundColor) {
      if (settings.backgroundColor === 'transparent') {
        classes.push('tw-bg-transparent');
      } else if (settings.backgroundColor === 'primary') {
        classes.push('tw-bg-primary');
      } else {
        classes.push(`tw-bg-${settings.backgroundColor}-${settings.backgroundShade || '600'}`);
      }
    }

    // Text color
    if (settings.color) {
      if (settings.color === 'white') {
        classes.push('tw-text-white');
      } else {
        classes.push(`tw-text-${settings.color}-${settings.colorShade || '900'}`);
      }
    }

    // Padding
    if (settings.padding) {
      const paddingMap = {
        'none': 'tw-p-0',
        'small': 'tw-p-4',
        'medium': 'tw-p-8',
        'large': 'tw-p-16',
        'xlarge': 'tw-p-24'
      };
      classes.push(paddingMap[settings.padding] || '');
    }

    // Margin
    if (settings.margin) {
      const marginMap = {
        'none': 'tw-m-0',
        'small': 'tw-m-4',
        'medium': 'tw-m-8',
        'large': 'tw-m-16'
      };
      classes.push(marginMap[settings.margin] || '');
    }

    // Text alignment
    if (settings.align) {
      classes.push(`tw-text-${settings.align}`);
    }

    // Font size
    if (settings.fontSize) {
      classes.push(`tw-text-${settings.fontSize}`);
    }

    // Font weight
    if (settings.fontWeight) {
      classes.push(`tw-font-${settings.fontWeight}`);
    }

    // Container width
    if (settings.containerWidth) {
      if (settings.containerWidth === 'container') {
        classes.push('tw-container tw-mx-auto tw-px-4');
      } else if (settings.containerWidth === 'narrow') {
        classes.push('tw-max-w-4xl tw-mx-auto tw-px-4');
      } else if (settings.containerWidth === 'wide') {
        classes.push('tw-max-w-7xl tw-mx-auto tw-px-4');
      } else if (settings.containerWidth === 'full') {
        classes.push('tw-w-full');
      }
    }

    return classes.filter(c => c);
  }

  // ==========================================================================
  // GRAPESJS → DATAVERSE (SAVE)
  // ==========================================================================

  /**
   * Convert GrapesJS components to flat Dataverse blocks
   */
  grapesJSToDataverse(grapesComponents, versionId) {
    const blocks = [];
    let sortOrder = 0;

    // Recursively process components
    const processComponent = (component, parentBlockId = null) => {
      const block = this._grapesComponentToBlock(component, versionId, parentBlockId, sortOrder++);
      blocks.push(block);

      // Process children
      const children = component.get('components');
      if (children && children.length > 0) {
        children.forEach(child => {
          processComponent(child, block.id);
        });
      }
    };

    grapesComponents.forEach(component => {
      processComponent(component);
    });

    return blocks;
  }

  /**
   * Convert single GrapesJS component to Dataverse block
   */
  _grapesComponentToBlock(component, versionId, parentBlockId, sortOrder) {
    const templateName = component.get('type');
    const attributes = component.getAttributes();
    const traits = component.getTraits();

    // Extract settings from traits
    const settings = {};
    traits.forEach(trait => {
      const name = trait.get('name');
      const value = trait.getValue();
      if (value !== undefined && value !== null && value !== '') {
        settings[name] = value;
      }
    });

    // Also extract from attributes (for backwards compatibility)
    if (attributes['data-settings']) {
      try {
        const attrSettings = JSON.parse(attributes['data-settings']);
        Object.assign(settings, attrSettings);
      } catch (e) {
        console.warn('Failed to parse data-settings:', e);
      }
    }

    // Determine block type from template name
    const blockType = this._getBlockTypeFromTemplate(templateName);

    // Generate block ID (use existing or generate new)
    const blockId = attributes['data-block-id'] || this._generateGUID();

    return {
      id: blockId,
      pageversionId: versionId,
      parentBlockId,
      name: component.getName() || templateName,
      templateName,
      blockType,
      sortOrder,
      zone: attributes['data-zone'] || null,
      settings,
      isActive: true
    };
  }

  /**
   * Determine block type from template name
   */
  _getBlockTypeFromTemplate(templateName) {
    if (templateName.startsWith('pp_layout')) return 1;
    if (templateName.startsWith('pp_content')) return 2;
    if (templateName.startsWith('pp_media')) return 3;
    if (templateName.startsWith('pp_nav')) return 4;
    if (templateName.startsWith('pp_dv')) return 5;
    return 2; // Default to content
  }

  /**
   * Generate GUID (simplified version)
   */
  _generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Build nested block tree from flat list
   */
  buildBlockTree(flatBlocks) {
    const blockMap = new Map();
    const rootBlocks = [];

    // Create map
    flatBlocks.forEach(block => {
      blockMap.set(block.id || block.pp_blockid, {
        ...block,
        children: []
      });
    });

    // Build tree
    flatBlocks.forEach(block => {
      const id = block.id || block.pp_blockid;
      const parentId = block.parentBlockId || block.pp_parentblockid;
      const current = blockMap.get(id);

      if (parentId) {
        const parent = blockMap.get(parentId);
        if (parent) {
          parent.children.push(current);
        }
      } else {
        rootBlocks.push(current);
      }
    });

    return rootBlocks;
  }

  /**
   * Flatten block tree to list
   */
  flattenBlockTree(rootBlocks) {
    const flatBlocks = [];
    let sortOrder = 0;

    const traverse = (block, parentId = null) => {
      const flat = {
        ...block,
        parentBlockId: parentId,
        sortOrder: sortOrder++
      };
      delete flat.children;

      flatBlocks.push(flat);

      if (block.children && block.children.length > 0) {
        block.children.forEach(child => {
          traverse(child, block.id);
        });
      }
    };

    rootBlocks.forEach(block => traverse(block));

    return flatBlocks;
  }

  /**
   * Validate block structure
   */
  validateBlocks(blocks) {
    const errors = [];

    blocks.forEach((block, index) => {
      if (!block.templateName) {
        errors.push(`Block ${index}: Missing templateName`);
      }
      if (block.blockType === undefined) {
        errors.push(`Block ${index}: Missing blockType`);
      }
      if (block.sortOrder === undefined) {
        errors.push(`Block ${index}: Missing sortOrder`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const serializer = new PPBuilderSerializer();
