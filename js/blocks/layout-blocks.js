/**
 * ============================================================================
 * PP BUILDER - LAYOUT BLOCKS
 * ============================================================================
 *
 * Layout block definitions for GrapesJS:
 * - Sections
 * - Containers
 * - Grids
 * - Columns
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

class LayoutBlocks {
  /**
   * Get all layout blocks
   */
  getBlocks() {
    return [
      this.getSectionBlock(),
      this.getContainerBlock(),
      this.getGridBlock(),
      this.getColumnBlock()
    ];
  }

  /**
   * Register layout components
   */
  registerComponents(editor) {
    this.registerSectionComponent(editor);
    this.registerContainerComponent(editor);
    this.registerGridComponent(editor);
    this.registerColumnComponent(editor);
  }

  // ==========================================================================
  // SECTION BLOCK
  // ==========================================================================

  getSectionBlock() {
    return {
      id: 'pp_layout_section_01',
      label: 'Section',
      category: 'Layout',
      content: {
        type: 'pp_layout_section_01',
        components: []
      },
      attributes: { class: 'gjs-block-layout' },
      media: `<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    };
  }

  registerSectionComponent(editor) {
    editor.DomComponents.addType('pp_layout_section_01', {
      model: {
        defaults: {
          tagName: 'section',
          classes: ['tw-w-full'],
          attributes: {
            'data-template': 'pp_layout_section_01',
            'data-block-type': '1'
          },
          droppable: true,
          traits: [
            {
              type: 'select',
              label: 'Background Color',
              name: 'backgroundColor',
              options: [
                { value: 'transparent', name: 'Transparent' },
                { value: 'white', name: 'White' },
                { value: 'gray', name: 'Gray' },
                { value: 'blue', name: 'Blue' },
                { value: 'primary', name: 'Primary' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Padding',
              name: 'padding',
              options: [
                { value: 'none', name: 'None' },
                { value: 'small', name: 'Small' },
                { value: 'medium', name: 'Medium' },
                { value: 'large', name: 'Large' },
                { value: 'xlarge', name: 'X-Large' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Container Width',
              name: 'containerWidth',
              options: [
                { value: 'full', name: 'Full Width' },
                { value: 'container', name: 'Container' },
                { value: 'narrow', name: 'Narrow' },
                { value: 'wide', name: 'Wide' }
              ],
              changeProp: 1
            },
            {
              type: 'text',
              label: 'Custom Class',
              name: 'customClass'
            },
            {
              type: 'text',
              label: 'ID',
              name: 'id'
            }
          ]
        },

        init() {
          this.on('change:attributes:backgroundColor change:attributes:padding change:attributes:containerWidth', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = ['tw-w-full'];

          // Background color
          if (attrs.backgroundColor && attrs.backgroundColor !== 'transparent') {
            if (attrs.backgroundColor === 'primary') {
              classes.push('tw-bg-primary');
            } else {
              classes.push(`tw-bg-${attrs.backgroundColor}-${attrs.backgroundShade || '600'}`);
            }
          }

          // Padding
          const paddingMap = {
            'none': 'tw-p-0',
            'small': 'tw-p-4',
            'medium': 'tw-p-8',
            'large': 'tw-p-16',
            'xlarge': 'tw-p-24'
          };
          if (attrs.padding) {
            classes.push(paddingMap[attrs.padding] || '');
          }

          // Custom class
          if (attrs.customClass) {
            classes.push(attrs.customClass);
          }

          this.setClass(classes.filter(c => c));
        }
      },

      view: {
        init() {
          this.listenTo(this.model, 'change:attributes', this.render);
        }
      }
    });
  }

  // ==========================================================================
  // CONTAINER BLOCK
  // ==========================================================================

  getContainerBlock() {
    return {
      id: 'pp_layout_container_01',
      label: 'Container',
      category: 'Layout',
      content: {
        type: 'pp_layout_container_01',
        components: []
      },
      attributes: { class: 'gjs-block-layout' },
      media: `<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    };
  }

  registerContainerComponent(editor) {
    editor.DomComponents.addType('pp_layout_container_01', {
      model: {
        defaults: {
          tagName: 'div',
          classes: ['tw-container', 'tw-mx-auto'],
          attributes: {
            'data-template': 'pp_layout_container_01',
            'data-block-type': '1'
          },
          droppable: true,
          traits: [
            {
              type: 'select',
              label: 'Max Width',
              name: 'maxWidth',
              options: [
                { value: 'sm', name: 'Small (640px)' },
                { value: 'md', name: 'Medium (768px)' },
                { value: 'lg', name: 'Large (1024px)' },
                { value: 'xl', name: 'X-Large (1280px)' },
                { value: '2xl', name: '2X-Large (1536px)' },
                { value: 'full', name: 'Full Width' }
              ],
              changeProp: 1
            },
            {
              type: 'checkbox',
              label: 'Center Content',
              name: 'centerContent',
              valueTrue: 'true',
              valueFalse: 'false',
              changeProp: 1
            },
            {
              type: 'text',
              label: 'Custom Class',
              name: 'customClass'
            }
          ]
        },

        init() {
          this.on('change:attributes:maxWidth change:attributes:centerContent', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = [];

          // Max width
          if (attrs.maxWidth && attrs.maxWidth !== 'full') {
            classes.push(`tw-max-w-${attrs.maxWidth}`);
            classes.push('tw-mx-auto');
          } else {
            classes.push('tw-w-full');
          }

          // Center content
          if (attrs.centerContent === 'true') {
            classes.push('tw-flex', 'tw-flex-col', 'tw-items-center', 'tw-justify-center');
          }

          // Padding
          classes.push('tw-px-4');

          // Custom class
          if (attrs.customClass) {
            classes.push(attrs.customClass);
          }

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }

  // ==========================================================================
  // GRID BLOCK
  // ==========================================================================

  getGridBlock() {
    return {
      id: 'pp_layout_grid_01',
      label: 'Grid',
      category: 'Layout',
      content: {
        type: 'pp_layout_grid_01',
        components: []
      },
      attributes: { class: 'gjs-block-layout' },
      media: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/></svg>`
    };
  }

  registerGridComponent(editor) {
    editor.DomComponents.addType('pp_layout_grid_01', {
      model: {
        defaults: {
          tagName: 'div',
          classes: ['tw-grid'],
          attributes: {
            'data-template': 'pp_layout_grid_01',
            'data-block-type': '1'
          },
          droppable: true,
          traits: [
            {
              type: 'select',
              label: 'Columns',
              name: 'columns',
              options: [
                { value: '1', name: '1 Column' },
                { value: '2', name: '2 Columns' },
                { value: '3', name: '3 Columns' },
                { value: '4', name: '4 Columns' },
                { value: '6', name: '6 Columns' },
                { value: '12', name: '12 Columns' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Gap',
              name: 'gap',
              options: [
                { value: '0', name: 'None' },
                { value: '2', name: 'Small' },
                { value: '4', name: 'Medium' },
                { value: '6', name: 'Large' },
                { value: '8', name: 'X-Large' }
              ],
              changeProp: 1
            },
            {
              type: 'checkbox',
              label: 'Responsive',
              name: 'responsive',
              valueTrue: 'true',
              valueFalse: 'false',
              changeProp: 1
            }
          ]
        },

        init() {
          this.on('change:attributes:columns change:attributes:gap change:attributes:responsive', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = ['tw-grid'];

          // Columns
          const cols = attrs.columns || '3';
          if (attrs.responsive === 'true') {
            classes.push(`tw-grid-cols-1 md:tw-grid-cols-${cols}`);
          } else {
            classes.push(`tw-grid-cols-${cols}`);
          }

          // Gap
          const gap = attrs.gap || '4';
          classes.push(`tw-gap-${gap}`);

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }

  // ==========================================================================
  // COLUMN BLOCK
  // ==========================================================================

  getColumnBlock() {
    return {
      id: 'pp_layout_column_01',
      label: 'Column',
      category: 'Layout',
      content: {
        type: 'pp_layout_column_01',
        components: []
      },
      attributes: { class: 'gjs-block-layout' },
      media: `<svg viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="20" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    };
  }

  registerColumnComponent(editor) {
    editor.DomComponents.addType('pp_layout_column_01', {
      model: {
        defaults: {
          tagName: 'div',
          classes: ['tw-col-span-1'],
          attributes: {
            'data-template': 'pp_layout_column_01',
            'data-block-type': '1'
          },
          droppable: true,
          traits: [
            {
              type: 'select',
              label: 'Span',
              name: 'span',
              options: [
                { value: '1', name: '1/12' },
                { value: '2', name: '2/12' },
                { value: '3', name: '3/12' },
                { value: '4', name: '4/12' },
                { value: '6', name: '6/12' },
                { value: '8', name: '8/12' },
                { value: '12', name: 'Full' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Align',
              name: 'align',
              options: [
                { value: 'start', name: 'Top' },
                { value: 'center', name: 'Center' },
                { value: 'end', name: 'Bottom' },
                { value: 'stretch', name: 'Stretch' }
              ],
              changeProp: 1
            }
          ]
        },

        init() {
          this.on('change:attributes:span change:attributes:align', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = [];

          // Span
          const span = attrs.span || '1';
          classes.push(`tw-col-span-${span}`);

          // Align
          if (attrs.align) {
            classes.push(`tw-self-${attrs.align}`);
          }

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }
}

// Export singleton instance
export const layoutBlocks = new LayoutBlocks();
