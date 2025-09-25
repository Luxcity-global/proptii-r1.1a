import express, { Request, Response } from 'express';
import { 
  Template, 
  ApiResponse, 
  PaginationParams, 
  TemplateSearchParams,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateCategory,
  PlatformTarget,
  ContentType 
} from '../src/types';

const router = express.Router();

// Mock data store (in production, this would be a database)
const templates: Template[] = [
  {
    id: '1',
    name: 'Instagram Post Template',
    description: 'Modern Instagram post template with clean design',
    category: TemplateCategory.SOCIAL_MEDIA,
    subcategory: 'instagram',
    tags: ['social', 'instagram', 'modern', 'clean'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 300,
          height: 300,
          fill: '#ffffff',
          stroke: '#e0e0e0'
        },
        {
          type: 'textbox',
          left: 150,
          top: 200,
          width: 200,
          height: 50,
          text: 'Your Text Here',
          fontSize: 24,
          fill: '#333333'
        }
      ]
    },
    thumbnail_url: '/thumbnails/template1.jpg',
    metadata: {
      platform_target: PlatformTarget.INSTAGRAM,
      content_type: ContentType.POST,
      dimensions: { width: 1080, height: 1080 },
      color_scheme: ['#ffffff', '#333333', '#e0e0e0'],
      font_requirements: ['Arial', 'Helvetica'],
      estimated_time: '5 minutes',
      difficulty_level: 'beginner'
    },
    usage_count: 1250,
    rating: 4.5,
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Facebook Cover Photo',
    description: 'Professional Facebook cover photo template',
    category: TemplateCategory.SOCIAL_MEDIA,
    subcategory: 'facebook',
    tags: ['social', 'facebook', 'cover', 'professional'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1200,
          height: 315,
          fill: '#3b5998'
        },
        {
          type: 'textbox',
          left: 100,
          top: 150,
          width: 1000,
          height: 100,
          text: 'Your Company Name',
          fontSize: 48,
          fill: '#ffffff'
        }
      ]
    },
    thumbnail_url: '/thumbnails/template2.jpg',
    metadata: {
      platform_target: PlatformTarget.FACEBOOK,
      content_type: ContentType.BANNER,
      dimensions: { width: 1200, height: 315 },
      color_scheme: ['#3b5998', '#ffffff'],
      font_requirements: ['Arial', 'Helvetica'],
      estimated_time: '3 minutes',
      difficulty_level: 'beginner'
    },
    usage_count: 890,
    rating: 4.2,
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'LinkedIn Post Template',
    description: 'Professional LinkedIn post template for business content',
    category: TemplateCategory.SOCIAL_MEDIA,
    subcategory: 'linkedin',
    tags: ['social', 'linkedin', 'professional', 'business'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 600,
          height: 600,
          fill: '#ffffff',
          stroke: '#0077b5'
        },
        {
          type: 'textbox',
          left: 100,
          top: 300,
          width: 500,
          height: 100,
          text: 'Professional Content',
          fontSize: 28,
          fill: '#0077b5'
        }
      ]
    },
    thumbnail_url: '/thumbnails/template3.jpg',
    metadata: {
      platform_target: PlatformTarget.LINKEDIN,
      content_type: ContentType.POST,
      dimensions: { width: 700, height: 700 },
      color_scheme: ['#ffffff', '#0077b5'],
      font_requirements: ['Arial', 'Helvetica'],
      estimated_time: '4 minutes',
      difficulty_level: 'intermediate'
    },
    usage_count: 650,
    rating: 4.7,
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Twitter Header Template',
    description: 'Eye-catching Twitter header template',
    category: TemplateCategory.SOCIAL_MEDIA,
    subcategory: 'twitter',
    tags: ['social', 'twitter', 'header', 'branding'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 1500,
          height: 500,
          fill: '#1da1f2'
        },
        {
          type: 'textbox',
          left: 200,
          top: 200,
          width: 1100,
          height: 100,
          text: 'Your Brand',
          fontSize: 64,
          fill: '#ffffff'
        }
      ]
    },
    thumbnail_url: '/thumbnails/template4.jpg',
    metadata: {
      platform_target: PlatformTarget.TWITTER,
      content_type: ContentType.BANNER,
      dimensions: { width: 1500, height: 500 },
      color_scheme: ['#1da1f2', '#ffffff'],
      font_requirements: ['Arial', 'Helvetica'],
      estimated_time: '3 minutes',
      difficulty_level: 'beginner'
    },
    usage_count: 420,
    rating: 4.3,
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(), // 45 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Marketing Flyer Template',
    description: 'Professional marketing flyer template',
    category: TemplateCategory.MARKETING,
    subcategory: 'flyer',
    tags: ['marketing', 'flyer', 'print', 'professional'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 0,
          top: 0,
          width: 612,
          height: 792,
          fill: '#ffffff'
        },
        {
          type: 'textbox',
          left: 50,
          top: 100,
          width: 512,
          height: 80,
          text: 'MARKETING FLYER',
          fontSize: 36,
          fill: '#333333'
        }
      ]
    },
    thumbnail_url: '/thumbnails/template5.jpg',
    metadata: {
      platform_target: PlatformTarget.FACEBOOK,
      content_type: ContentType.POST,
      dimensions: { width: 612, height: 792 },
      color_scheme: ['#ffffff', '#333333'],
      font_requirements: ['Arial', 'Helvetica'],
      estimated_time: '8 minutes',
      difficulty_level: 'intermediate'
    },
    usage_count: 780,
    rating: 4.6,
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(), // 20 days ago
    updated_at: new Date().toISOString()
  }
];

// Helper function to create API response
const createResponse = <T>(success: boolean, data?: T, error?: string, message?: string, pagination?: any): ApiResponse<T> => {
  return { success, data, error, message, pagination };
};

// GET /templates - Get all templates with pagination and filtering
router.get('/', (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
      category,
      platform_target,
      content_type,
      difficulty_level,
      min_rating,
      is_public,
      query
    } = req.query as any;

    let filteredTemplates = [...templates];

    // Apply filters
    if (category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }

    if (platform_target) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.platform_target === platform_target
      );
    }

    if (content_type) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.content_type === content_type
      );
    }

    if (difficulty_level) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.difficulty_level === difficulty_level
      );
    }

    if (min_rating) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.rating >= parseFloat(min_rating)
      );
    }

    if (is_public !== undefined) {
      const isPublic = is_public === 'true';
      filteredTemplates = filteredTemplates.filter(template => template.is_public === isPublic);
    }

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredTemplates.sort((a, b) => {
      const aValue = (a as any)[sort_by];
      const bValue = (b as any)[sort_by];
      
      if (sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: filteredTemplates.length,
      total_pages: Math.ceil(filteredTemplates.length / limitNum)
    };

    return res.json(createResponse(true, paginatedTemplates, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /templates/featured - Get featured templates
router.get('/featured', (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);
    
    // Get templates with highest ratings and usage counts
    const featuredTemplates = templates
      .filter(template => template.is_public)
      .sort((a, b) => {
        const aScore = a.rating * Math.log(a.usage_count + 1);
        const bScore = b.rating * Math.log(b.usage_count + 1);
        return bScore - aScore;
      })
      .slice(0, limitNum);

    return res.json(createResponse(true, featuredTemplates));
  } catch (error) {
    console.error('Error fetching featured templates:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /templates/search - Search templates
router.get('/search', (req: Request, res: Response) => {
  try {
    const { 
      query, 
      category, 
      platform_target, 
      content_type, 
      difficulty_level, 
      min_rating, 
      page = 1, 
      limit = 10 
    } = req.query as any;
    
    let filteredTemplates = [...templates];

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description?.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (category) {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }

    if (platform_target) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.platform_target === platform_target
      );
    }

    if (content_type) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.content_type === content_type
      );
    }

    if (difficulty_level) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.metadata.difficulty_level === difficulty_level
      );
    }

    if (min_rating) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.rating >= parseFloat(min_rating)
      );
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: filteredTemplates.length,
      total_pages: Math.ceil(filteredTemplates.length / limitNum)
    };

    return res.json(createResponse(true, paginatedTemplates, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error searching templates:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /templates/:id - Get single template
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json(createResponse(false, undefined, 'Template not found'));
    }
    
    return res.json(createResponse(true, template));
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /templates - Create new template
router.post('/', (req: Request, res: Response) => {
  try {
    const templateData: CreateTemplateRequest = req.body;
    
    if (!templateData.name || !templateData.category || !templateData.canvas_data) {
      return res.status(400).json(createResponse(false, undefined, 'Name, category, and canvas_data are required'));
    }

    const newTemplate: Template = {
      id: (templates.length + 1).toString(),
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      subcategory: templateData.subcategory,
      tags: templateData.tags || [],
      canvas_data: templateData.canvas_data,
      thumbnail_url: undefined, // Would be generated from canvas_data
      metadata: templateData.metadata || {
        dimensions: { width: 1080, height: 1080 },
        color_scheme: [],
        font_requirements: []
      },
      usage_count: 0,
      rating: 0,
      is_public: templateData.is_public || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    templates.push(newTemplate);
    
    return res.status(201).json(createResponse(true, newTemplate, undefined, 'Template created successfully'));
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// PUT /templates/:id - Update template
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateTemplateRequest = req.body;
    
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Template not found'));
    }

    const updatedTemplate = {
      ...templates[templateIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    templates[templateIndex] = updatedTemplate;
    
    return res.json(createResponse(true, updatedTemplate, undefined, 'Template updated successfully'));
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// DELETE /templates/:id - Delete template
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Template not found'));
    }

    templates.splice(templateIndex, 1);
    
    return res.json(createResponse(true, null, undefined, 'Template deleted successfully'));
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /templates/:id/use - Record template usage
router.post('/:id/use', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Template not found'));
    }

    templates[templateIndex].usage_count++;
    templates[templateIndex].updated_at = new Date().toISOString();
    
    return res.json(createResponse(true, null, undefined, 'Template usage recorded'));
  } catch (error) {
    console.error('Error recording template usage:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /templates/:id/rate - Rate template
router.post('/:id/rate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json(createResponse(false, undefined, 'Rating must be between 1 and 5'));
    }

    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Template not found'));
    }

    // Simple average rating calculation (in production, you'd want more sophisticated rating system)
    const currentRating = templates[templateIndex].rating;
    const currentUsageCount = templates[templateIndex].usage_count;
    const newRating = ((currentRating * currentUsageCount) + rating) / (currentUsageCount + 1);
    
    templates[templateIndex].rating = Math.round(newRating * 10) / 10; // Round to 1 decimal place
    templates[templateIndex].updated_at = new Date().toISOString();
    
    return res.json(createResponse(true, null, undefined, 'Template rated successfully'));
  } catch (error) {
    console.error('Error rating template:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

export default router;
