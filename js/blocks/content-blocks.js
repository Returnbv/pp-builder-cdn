/**
 * ============================================================================
 * PP BUILDER - CONTENT BLOCKS
 * ============================================================================
 *
 * Content block definitions for GrapesJS:
 * - Headings
 * - Text/Paragraphs
 * - Buttons
 * - Callouts
 *
 * Author: PP Builder System
 * Version: 1.0
 * Date: 2025-01-19
 *
 * ============================================================================
 */

class ContentBlocks {
  /**
   * Get all content blocks
   */
  getBlocks() {
    return [
      this.getHeadingBlock(),
      this.getTextBlock(),
      this.getButtonBlock(),
      this.getCalloutBlock()
    ];
  }

  /**
   * Register content components
   */
  registerComponents(editor) {
    this.registerHeadingComponent(editor);
    this.registerTextComponent(editor);
    this.registerButtonComponent(editor);
    this.registerCalloutComponent(editor);
  }

  // ==========================================================================
  // HEADING BLOCK
  // ==========================================================================

  getHeadingBlock() {
    return {
      id: 'pp_content_heading_01',
      label: 'Heading',
      category: 'Content',
      content: {
        type: 'pp_content_heading_01',
        content: 'Your Heading Here'
      },
      attributes: { class: 'gjs-block-content' },
      media: `<svg viewBox="0 0 24 24"><text x="2" y="18" font-size="16" font-weight="bold">H</text></svg>`
    };
  }

  registerHeadingComponent(editor) {
    editor.DomComponents.addType('pp_content_heading_01', {
      model: {
        defaults: {
          tagName: 'h2',
          classes: ['tw-text-2xl', 'tw-font-bold'],
          attributes: {
            'data-template': 'pp_content_heading_01',
            'data-block-type': '2'
          },
          editable: true,
          droppable: false,
          traits: [
            {
              type: 'select',
              label: 'Level',
              name: 'level',
              options: [
                { value: 'h1', name: 'H1' },
                { value: 'h2', name: 'H2' },
                { value: 'h3', name: 'H3' },
                { value: 'h4', name: 'H4' },
                { value: 'h5', name: 'H5' },
                { value: 'h6', name: 'H6' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Size',
              name: 'fontSize',
              options: [
                { value: 'xs', name: 'Extra Small' },
                { value: 'sm', name: 'Small' },
                { value: 'base', name: 'Base' },
                { value: 'lg', name: 'Large' },
                { value: 'xl', name: 'Extra Large' },
                { value: '2xl', name: '2X Large' },
                { value: '3xl', name: '3X Large' },
                { value: '4xl', name: '4X Large' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Align',
              name: 'align',
              options: [
                { value: 'left', name: 'Left' },
                { value: 'center', name: 'Center' },
                { value: 'right', name: 'Right' }
              ],
              changeProp: 1
            },
            {
              type: 'color',
              label: 'Color',
              name: 'color'
            }
          ]
        },

        init() {
          this.on('change:attributes:level', this.updateTagName);
          this.on('change:attributes:fontSize change:attributes:align change:attributes:color', this.updateClasses);
          this.updateClasses();
        },

        updateTagName() {
          const level = this.getAttributes().level || 'h2';
          this.set('tagName', level);
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = [];

          // Font size
          const size = attrs.fontSize || '2xl';
          classes.push(`tw-text-${size}`);

          // Font weight
          classes.push('tw-font-bold');

          // Align
          if (attrs.align) {
            classes.push(`tw-text-${attrs.align}`);
          }

          // Color
          if (attrs.color) {
            classes.push(`tw-text-${attrs.color}-900`);
          }

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }

  // ==========================================================================
  // TEXT BLOCK
  // ==========================================================================

  getTextBlock() {
    return {
      id: 'pp_content_text_01',
      label: 'Text',
      category: 'Content',
      content: {
        type: 'pp_content_text_01',
        content: 'Your text content here...'
      },
      attributes: { class: 'gjs-block-content' },
      media: `<svg viewBox="0 0 24 24"><text x="2" y="12" font-size="12">T</text><text x="2" y="20" font-size="12">T</text></svg>`
    };
  }

  registerTextComponent(editor) {
    editor.DomComponents.addType('pp_content_text_01', {
      model: {
        defaults: {
          tagName: 'p',
          classes: ['tw-text-base'],
          attributes: {
            'data-template': 'pp_content_text_01',
            'data-block-type': '2'
          },
          editable: true,
          droppable: false,
          traits: [
            {
              type: 'select',
              label: 'Size',
              name: 'fontSize',
              options: [
                { value: 'xs', name: 'Extra Small' },
                { value: 'sm', name: 'Small' },
                { value: 'base', name: 'Base' },
                { value: 'lg', name: 'Large' },
                { value: 'xl', name: 'Extra Large' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Align',
              name: 'align',
              options: [
                { value: 'left', name: 'Left' },
                { value: 'center', name: 'Center' },
                { value: 'right', name: 'Right' },
                { value: 'justify', name: 'Justify' }
              ],
              changeProp: 1
            },
            {
              type: 'color',
              label: 'Color',
              name: 'color'
            }
          ]
        },

        init() {
          this.on('change:attributes:fontSize change:attributes:align change:attributes:color', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = [];

          // Font size
          const size = attrs.fontSize || 'base';
          classes.push(`tw-text-${size}`);

          // Align
          if (attrs.align) {
            classes.push(`tw-text-${attrs.align}`);
          }

          // Color
          if (attrs.color) {
            classes.push(`tw-text-${attrs.color}-700`);
          } else {
            classes.push('tw-text-gray-700');
          }

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }

  // ==========================================================================
  // BUTTON BLOCK
  // ==========================================================================

  getButtonBlock() {
    return {
      id: 'pp_content_button_01',
      label: 'Button',
      category: 'Content',
      content: {
        type: 'pp_content_button_01',
        content: 'Click Me'
      },
      attributes: { class: 'gjs-block-content' },
      media: `<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="4" rx="2" fill="currentColor"/></svg>`
    };
  }

  registerButtonComponent(editor) {
    editor.DomComponents.addType('pp_content_button_01', {
      model: {
        defaults: {
          tagName: 'a',
          classes: ['tw-inline-block', 'tw-px-6', 'tw-py-3', 'tw-bg-blue-600', 'tw-text-white', 'tw-rounded'],
          attributes: {
            'data-template': 'pp_content_button_01',
            'data-block-type': '2',
            'href': '#'
          },
          editable: true,
          droppable: false,
          traits: [
            {
              type: 'text',
              label: 'Link URL',
              name: 'href'
            },
            {
              type: 'select',
              label: 'Target',
              name: 'target',
              options: [
                { value: '_self', name: 'Same Window' },
                { value: '_blank', name: 'New Window' }
              ]
            },
            {
              type: 'select',
              label: 'Style',
              name: 'buttonStyle',
              options: [
                { value: 'primary', name: 'Primary' },
                { value: 'secondary', name: 'Secondary' },
                { value: 'outline', name: 'Outline' },
                { value: 'ghost', name: 'Ghost' }
              ],
              changeProp: 1
            },
            {
              type: 'select',
              label: 'Size',
              name: 'buttonSize',
              options: [
                { value: 'sm', name: 'Small' },
                { value: 'md', name: 'Medium' },
                { value: 'lg', name: 'Large' }
              ],
              changeProp: 1
            }
          ]
        },

        init() {
          this.on('change:attributes:buttonStyle change:attributes:buttonSize', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = ['tw-inline-block'];

          // Button style
          const style = attrs.buttonStyle || 'primary';
          switch (style) {
            case 'primary':
              classes.push('tw-bg-blue-600', 'tw-text-white', 'hover:tw-bg-blue-700');
              break;
            case 'secondary':
              classes.push('tw-bg-gray-600', 'tw-text-white', 'hover:tw-bg-gray-700');
              break;
            case 'outline':
              classes.push('tw-border-2', 'tw-border-blue-600', 'tw-text-blue-600', 'hover:tw-bg-blue-50');
              break;
            case 'ghost':
              classes.push('tw-text-blue-600', 'hover:tw-bg-blue-50');
              break;
          }

          // Button size
          const size = attrs.buttonSize || 'md';
          const sizeClasses = {
            'sm': ['tw-px-4', 'tw-py-2', 'tw-text-sm'],
            'md': ['tw-px-6', 'tw-py-3', 'tw-text-base'],
            'lg': ['tw-px-8', 'tw-py-4', 'tw-text-lg']
          };
          classes.push(...sizeClasses[size]);

          // Rounded
          classes.push('tw-rounded');

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }

  // ==========================================================================
  // CALLOUT BLOCK
  // ==========================================================================

  getCalloutBlock() {
    return {
      id: 'pp_content_callout_01',
      label: 'Callout',
      category: 'Content',
      content: {
        type: 'pp_content_callout_01',
        components: [
          {
            type: 'pp_content_heading_01',
            content: 'Callout Title'
          },
          {
            type: 'pp_content_text_01',
            content: 'Callout description goes here...'
          }
        ]
      },
      attributes: { class: 'gjs-block-content' },
      media: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18" stroke="currentColor" stroke-width="2"/></svg>`
    };
  }

  registerCalloutComponent(editor) {
    editor.DomComponents.addType('pp_content_callout_01', {
      model: {
        defaults: {
          tagName: 'div',
          classes: ['tw-p-6', 'tw-bg-blue-50', 'tw-border-l-4', 'tw-border-blue-500', 'tw-rounded-r'],
          attributes: {
            'data-template': 'pp_content_callout_01',
            'data-block-type': '2'
          },
          droppable: true,
          traits: [
            {
              type: 'select',
              label: 'Type',
              name: 'calloutType',
              options: [
                { value: 'info', name: 'Info (Blue)' },
                { value: 'success', name: 'Success (Green)' },
                { value: 'warning', name: 'Warning (Yellow)' },
                { value: 'error', name: 'Error (Red)' }
              ],
              changeProp: 1
            }
          ]
        },

        init() {
          this.on('change:attributes:calloutType', this.updateClasses);
          this.updateClasses();
        },

        updateClasses() {
          const attrs = this.getAttributes();
          const classes = ['tw-p-6', 'tw-border-l-4', 'tw-rounded-r'];

          // Callout type
          const type = attrs.calloutType || 'info';
          const typeClasses = {
            'info': ['tw-bg-blue-50', 'tw-border-blue-500'],
            'success': ['tw-bg-green-50', 'tw-border-green-500'],
            'warning': ['tw-bg-yellow-50', 'tw-border-yellow-500'],
            'error': ['tw-bg-red-50', 'tw-border-red-500']
          };
          classes.push(...typeClasses[type]);

          this.setClass(classes.filter(c => c));
        }
      }
    });
  }
}

// Export singleton instance
export const contentBlocks = new ContentBlocks();
