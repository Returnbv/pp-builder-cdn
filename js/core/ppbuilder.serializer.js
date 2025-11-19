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

  dataverseToGrapesJS(dataverseBlocks, editor) {
    const blockMap = new Map();
    const rootBlocks = [];

    dataverseBlocks.forEach(block => {
      const parsed = this._parseDataverseBlock(block);
      blockMap.set(block.pp_blockid, {
        ...parsed,
        children: []
      });
    });

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

    const grapesComponents = rootBlocks.map(block =>
      this._blockToGrapesComponent(block, editor)
    );

    return grapesComponents;
  }

  _parseDataverseBlock(block) {
    return {
      id: block.pp_blockid,
      name: block.pp_title,
      templateName: block.pp_type,
      blockType: block.pp_blocktype,
      sortOrder: block.pp_order,
      zone: block.pp_zone,
      parentBlockId: block.pp_parentblockid,
      settings: block.pp_data ? JSON.parse(block.pp_data) : {},
      isActive: block.pp_isactive
    };
  }

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

    if (block.settings) {
      component.attributes = {
        ...component.attributes,
        ...this._settingsToAttributes(block.settings, block.templateName)
      };

      if (block.settings.text) {
        component.content = block.settings.text;
      } else if (block.settings.content) {
        component.content = block.settings.content;
      }
    }

    return component;
  }

  _settingsToTraits(settings) {
    return Object.entries(settings).map(([key, value]) => ({
      name: key,
      value: value
    }));
  }

  _settingsToAttributes(settings, templateName) {
    const attributes = {};

    const classes = this._settingsToClasses(settings, templateName);
    if (classes.length > 0) {
      attributes.class = classes.join(' ');
    }

    if (settings.customClass) {
      attributes.class = `${attributes.class || ''} ${settings.customClass}`.trim();
    }

    if (settings.id) {
      attributes.id = settings.id;
    }

    return attributes;
  }

  _settingsToClasses(settings, templateName) {
    const classes = [];

    if (settings.backgroundColor) {
      if (settings.backgroundColor === 'transparent') {
        classes.push('tw-bg-transparent');
      } else if (settings.backgroundColor === 'primary') {
        classes.push('tw-bg-primary');
      } else {
        classes.push(`tw-bg-${settings.backgroundColor}-${settings.backgroundShade || '600'}`);
      }
    }

    if (settings.color) {
      if (settings.color === 'white') {
        classes.push('tw-text-white');
      } else {
        classes.push(`tw-text-${settings.color}-${settings.colorShade || '900'}`);
      }
    }

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

    if (settings.margin) {
      const marginMap = {
        'none': 'tw-m-0',
        'small': 'tw-m-4',
        'medium': 'tw-m-8',
        'large': 'tw-m-16'
      };
      classes.push(marginMap[settings.margin] || '');
    }

    if (settings.align) {
      classes.push(`tw-text-${settings.align}`);
    }

    if (settings.fontSize) {
      classes.push(`tw-text-${settings.fontSize}`);
    }

    if (settings.fontWeight) {
      classes.push(`tw-font-${settings.fontWeight}`);
    }

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

  grapesJSToDataverse(grapesComponents, versionId) {
    const blocks = [];
    let sortOrder = 0;

    const processComponent = (component, parentBlockId = null) => {
      const block = this._grapesComponentToBlock(component, versionId, parentBlockId, sortOrder++);
      blocks.push(block);

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

  _grapesComponentToBlock(component, versionId, parentBlockId, sortOrder) {
    const templateName = component.get('type');
    const attributes = component.getAttributes();
    const traits = component.getTraits();

    const settings = {};
    traits.forEach(trait => {
      const name = trait.get('name');
      const value = trait.getValue();
      if (value !== undefined && value !== null && value !== '') {
        settings[name] = value;
      }
    });

    if (attributes['data-settings']) {
      try {
        const attrSettings = JSON.parse(attributes['data-settings']);
        Object.assign(settings, attrSettings);
      } catch (e) {
        console.warn('Failed to parse data-settings:', e);
      }
    }

    const blockType = this._getBlockTypeFromTemplate(templateName);

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

  _getBlockTypeFromTemplate(templateName) {
    if (templateName.startsWith('pp_layout')) return 1;
    if (templateName.startsWith('pp_content')) return 2;
    if (templateName.startsWith('pp_media')) return 3;
    if (templateName.startsWith('pp_nav')) return 4;
    if (templateName.startsWith('pp_dv')) return 5;
    return 2;
  }

  _generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  buildBlockTree(flatBlocks) {
    const blockMap = new Map();
    const rootBlocks = [];

    flatBlocks.forEach(block => {
      blockMap.set(block.id || block.pp_blockid, {
        ...block,
        children: []
      });
    });

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

export const serializer = new PPBuilderSerializer();
