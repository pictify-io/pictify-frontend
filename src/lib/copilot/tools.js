/**
 * Copilot Tool Definitions
 *
 * Defines available tools for the AI copilot to interact with the canvas.
 * Uses a simplified Zod-like validation pattern for runtime type checking.
 */

// =============================================================================
// Simple Runtime Validation (Zod-like pattern without dependency)
// =============================================================================

/**
 * Simple schema validators
 */
const validators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  boolean: (value) => typeof value === 'boolean',
  array: (itemValidator) => (value) =>
    Array.isArray(value) && value.every(itemValidator),
  object: (shape) => (value) => {
    if (typeof value !== 'object' || value === null) return false;
    for (const key of Object.keys(shape)) {
      if (shape[key].required && !(key in value)) return false;
      if (key in value && !shape[key].validate(value[key])) return false;
    }
    return true;
  },
  enum: (values) => (value) => values.includes(value),
  optional: (validator) => (value) => value === undefined || validator(value)
};

/**
 * Create a schema definition
 */
function createSchema(definition) {
  return {
    ...definition,
    validate: (input) => {
      const errors = [];
      for (const [key, schema] of Object.entries(definition.properties || {})) {
        const value = input?.[key];
        if (schema.required && value === undefined) {
          errors.push(`Missing required field: ${key}`);
        } else if (value !== undefined && !schema.validate(value)) {
          errors.push(`Invalid value for field: ${key}`);
        }
      }
      return { valid: errors.length === 0, errors };
    },
    parse: (input) => {
      const result = definition.validate ? definition.validate(input) : { valid: true, errors: [] };
      if (!result.valid) {
        throw new Error(`Validation failed: ${result.errors.join(', ')}`);
      }
      return input;
    }
  };
}

// =============================================================================
// Tool Input Schemas
// =============================================================================

export const ModifyElementSchema = createSchema({
  properties: {
    element_id: {
      validate: validators.string,
      required: true,
      description: 'The ID of the element to modify'
    },
    properties: {
      validate: validators.object({
        fill: { validate: validators.optional(validators.string) },
        stroke: { validate: validators.optional(validators.string) },
        fontSize: { validate: validators.optional(validators.number) },
        left: { validate: validators.optional(validators.number) },
        top: { validate: validators.optional(validators.number) },
        width: { validate: validators.optional(validators.number) },
        height: { validate: validators.optional(validators.number) },
        opacity: { validate: validators.optional(validators.number) },
        scaleX: { validate: validators.optional(validators.number) },
        scaleY: { validate: validators.optional(validators.number) },
        angle: { validate: validators.optional(validators.number) },
        text: { validate: validators.optional(validators.string) },
        fontFamily: { validate: validators.optional(validators.string) },
        fontWeight: { validate: validators.optional(validators.string) }
      }),
      required: true,
      description: 'Properties to modify on the element'
    }
  }
});

export const CreateElementSchema = createSchema({
  properties: {
    type: {
      validate: validators.enum(['text', 'rect', 'circle', 'ellipse', 'line', 'image', 'group', 'textbox']),
      required: true,
      description: 'The type of element to create'
    },
    properties: {
      validate: (v) => typeof v === 'object' && v !== null,
      required: true,
      description: 'Initial properties for the new element'
    }
  }
});

export const DeleteElementsSchema = createSchema({
  properties: {
    element_ids: {
      validate: validators.array(validators.string),
      required: true,
      description: 'Array of element IDs to delete'
    }
  }
});

export const SelectElementsSchema = createSchema({
  properties: {
    selector: {
      validate: validators.string,
      required: true,
      description: 'Element ID, type, label, or description to select'
    },
    mode: {
      validate: validators.enum(['replace', 'add', 'remove']),
      required: false,
      description: 'Selection mode'
    }
  }
});

export const LabelElementSchema = createSchema({
  properties: {
    element_id: {
      validate: validators.string,
      required: true,
      description: 'The ID of the element to label'
    },
    label: {
      validate: validators.string,
      required: true,
      description: 'Human-readable label for the element'
    }
  }
});

export const AnalyzeDesignSchema = createSchema({
  properties: {
    checks: {
      validate: validators.array(
        validators.enum(['hierarchy', 'accessibility', 'color', 'spacing', 'typography'])
      ),
      required: true,
      description: 'Types of analysis to perform'
    }
  }
});

// =============================================================================
// Tool Definitions (Claude Tool Use Format)
// =============================================================================

/**
 * Core canvas manipulation tools
 */
export const CANVAS_TOOLS = [
  {
    name: 'modify_element',
    description: 'Change properties of an existing element on the canvas. Use this for color changes, resizing, repositioning, or updating text.',
    input_schema: {
      type: 'object',
      properties: {
        element_id: {
          type: 'string',
          description: 'The ID of the element to modify'
        },
        properties: {
          type: 'object',
          description: 'Properties to change',
          properties: {
            fill: { type: 'string', description: 'Fill color (hex, rgb, or color name)' },
            stroke: { type: 'string', description: 'Stroke/border color' },
            strokeWidth: { type: 'number', description: 'Stroke width in pixels' },
            fontSize: { type: 'number', description: 'Font size for text elements' },
            fontFamily: { type: 'string', description: 'Font family for text elements' },
            fontWeight: { type: 'string', description: 'Font weight (normal, bold, 100-900)' },
            text: { type: 'string', description: 'Text content for text elements' },
            left: { type: 'number', description: 'X position from left' },
            top: { type: 'number', description: 'Y position from top' },
            width: { type: 'number', description: 'Width in pixels' },
            height: { type: 'number', description: 'Height in pixels' },
            opacity: { type: 'number', description: 'Opacity from 0 to 1' },
            angle: { type: 'number', description: 'Rotation angle in degrees' },
            rx: { type: 'number', description: 'Horizontal corner radius for rectangles' },
            ry: { type: 'number', description: 'Vertical corner radius for rectangles' }
          }
        }
      },
      required: ['element_id', 'properties']
    },
    schema: ModifyElementSchema
  },
  {
    name: 'create_element',
    description: 'Add a new element to the canvas. Use for adding shapes, text, or images.',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['text', 'textbox', 'rect', 'circle', 'ellipse', 'line', 'image'],
          description: 'Type of element to create'
        },
        properties: {
          type: 'object',
          description: 'Initial properties for the element',
          properties: {
            left: { type: 'number', description: 'X position' },
            top: { type: 'number', description: 'Y position' },
            width: { type: 'number', description: 'Width (for rect, image)' },
            height: { type: 'number', description: 'Height (for rect, image)' },
            radius: { type: 'number', description: 'Radius (for circle)' },
            fill: { type: 'string', description: 'Fill color' },
            stroke: { type: 'string', description: 'Stroke color' },
            text: { type: 'string', description: 'Text content (for text/textbox)' },
            fontSize: { type: 'number', description: 'Font size' },
            fontFamily: { type: 'string', description: 'Font family' }
          }
        }
      },
      required: ['type', 'properties']
    },
    schema: CreateElementSchema
  },
  {
    name: 'delete_elements',
    description: 'Remove elements from the canvas. Requires user confirmation for destructive operations.',
    input_schema: {
      type: 'object',
      properties: {
        element_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of element IDs to delete'
        }
      },
      required: ['element_ids']
    },
    schema: DeleteElementsSchema,
    requiresConfirmation: true
  },
  {
    name: 'get_canvas_state',
    description: 'Get the current state of the canvas including all elements and their properties.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Agent-native parity tools (things users can do, agents should too)
 */
export const PARITY_TOOLS = [
  {
    name: 'undo',
    description: 'Undo the last canvas change. Use this to revert mistakes or try a different approach.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'redo',
    description: 'Redo a previously undone change.',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'label_element',
    description: 'Assign a semantic label to an element for easier reference in future conversations.',
    input_schema: {
      type: 'object',
      properties: {
        element_id: {
          type: 'string',
          description: 'The ID of the element to label'
        },
        label: {
          type: 'string',
          description: "Human-readable label like 'hero-button' or 'main-heading'"
        }
      },
      required: ['element_id', 'label']
    },
    schema: LabelElementSchema
  },
  {
    name: 'select_elements',
    description: 'Select elements on the canvas by ID, type, label, or description.',
    input_schema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: "Element ID, type (e.g., 'text', 'rect'), label, or description"
        },
        mode: {
          type: 'string',
          enum: ['replace', 'add', 'remove'],
          description: 'Selection mode: replace current, add to, or remove from selection'
        }
      },
      required: ['selector']
    },
    schema: SelectElementsSchema
  }
];

/**
 * Design intelligence tools
 */
export const ANALYSIS_TOOLS = [
  {
    name: 'analyze_design',
    description: 'Analyze the current canvas for design quality issues including hierarchy, accessibility, color harmony, and spacing.',
    input_schema: {
      type: 'object',
      properties: {
        checks: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['hierarchy', 'accessibility', 'color', 'spacing', 'typography']
          },
          description: 'Types of analysis to perform'
        }
      },
      required: ['checks']
    },
    schema: AnalyzeDesignSchema
  },
  {
    name: 'check_accessibility',
    description: 'Check WCAG 2.1 AA compliance for the canvas, focusing on color contrast and text readability.',
    input_schema: {
      type: 'object',
      properties: {
        element_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific element IDs to check, or empty for all elements'
        }
      }
    }
  },
  {
    name: 'get_suggestions',
    description: 'Get proactive design improvement suggestions for the current canvas.',
    input_schema: {
      type: 'object',
      properties: {
        focus_areas: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['accessibility', 'hierarchy', 'color', 'spacing']
          },
          description: 'Areas to focus suggestions on'
        }
      }
    }
  },
  {
    name: 'explain_decision',
    description: 'Generate an explanation for a design choice made by the AI.',
    input_schema: {
      type: 'object',
      properties: {
        aspect: {
          type: 'string',
          enum: ['color', 'typography', 'layout', 'spacing', 'hierarchy'],
          description: 'Which aspect of the design to explain'
        },
        element_id: {
          type: 'string',
          description: 'Optional specific element to focus the explanation on'
        }
      },
      required: ['aspect']
    }
  }
];

/**
 * All available tools combined
 */
export const COPILOT_TOOLS = [
  ...CANVAS_TOOLS,
  ...PARITY_TOOLS,
  ...ANALYSIS_TOOLS
];

/**
 * Get tool by name
 * @param {string} name
 * @returns {object|undefined}
 */
export function getTool(name) {
  return COPILOT_TOOLS.find(t => t.name === name);
}

/**
 * Validate tool input
 * @param {string} toolName
 * @param {object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateToolInput(toolName, input) {
  const tool = getTool(toolName);
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }
  if (tool.schema) {
    return tool.schema.validate(input);
  }
  return { valid: true, errors: [] };
}

/**
 * Check if tool requires user confirmation
 * @param {string} toolName
 * @returns {boolean}
 */
export function requiresConfirmation(toolName) {
  const tool = getTool(toolName);
  return tool?.requiresConfirmation === true;
}
