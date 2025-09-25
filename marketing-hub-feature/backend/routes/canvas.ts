import express, { Request, Response } from 'express';
import { 
  CanvasProject, 
  CanvasVersion, 
  ApiResponse, 
  PaginationParams, 
  CreateProjectRequest,
  UpdateProjectRequest,
  SaveCanvasRequest 
} from '../src/types';

const router = express.Router();

// Mock data stores (in production, this would be a database)
const projects: CanvasProject[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'My First Project',
    description: 'A test canvas project',
    template_id: '1',
    tags: ['test', 'demo'],
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 200,
          height: 200,
          fill: '#ff0000'
        }
      ],
      background: '#ffffff'
    },
    is_public: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Marketing Campaign',
    description: 'Social media campaign design',
    template_id: '2',
    tags: ['marketing', 'social'],
    canvas_data: {
      objects: [
        {
          type: 'textbox',
          left: 200,
          top: 200,
          width: 300,
          height: 100,
          text: 'Campaign Title',
          fontSize: 32,
          fill: '#333333'
        }
      ],
      background: '#ffffff'
    },
    is_public: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updated_at: new Date().toISOString()
  }
];

const versions: CanvasVersion[] = [
  {
    id: 'v1-1',
    project_id: '1',
    version_number: 1,
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 200,
          height: 200,
          fill: '#ff0000'
        }
      ],
      background: '#ffffff'
    },
    change_description: 'Initial version',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'v1-2',
    project_id: '1',
    version_number: 2,
    canvas_data: {
      objects: [
        {
          type: 'rect',
          left: 100,
          top: 100,
          width: 200,
          height: 200,
          fill: '#00ff00'
        }
      ],
      background: '#ffffff'
    },
    change_description: 'Changed color to green',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Helper function to create API response
const createResponse = <T>(success: boolean, data?: T, error?: string, message?: string, pagination?: any): ApiResponse<T> => {
  return { success, data, error, message, pagination };
};

// GET /canvas/projects - Get all canvas projects
router.get('/projects', (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc',
      is_public,
      query
    } = req.query as any;

    let filteredProjects = [...projects];

    // Apply filters
    if (is_public !== undefined) {
      const isPublic = is_public === 'true';
      filteredProjects = filteredProjects.filter(project => project.is_public === isPublic);
    }

    if (query) {
      const searchTerm = query.toLowerCase();
      filteredProjects = filteredProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredProjects.sort((a, b) => {
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
    
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: filteredProjects.length,
      total_pages: Math.ceil(filteredProjects.length / limitNum)
    };

    return res.json(createResponse(true, paginatedProjects, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /canvas/projects/:id - Get single canvas project
router.get('/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }
    
    return res.json(createResponse(true, project));
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /canvas/projects - Create new canvas project
router.post('/projects', (req: Request, res: Response) => {
  try {
    const projectData: CreateProjectRequest = req.body;
    
    if (!projectData.name) {
      return res.status(400).json(createResponse(false, undefined, 'Project name is required'));
    }

    const newProject: CanvasProject = {
      id: (projects.length + 1).toString(),
      user_id: 'user-1', // In production, get from authenticated user
      name: projectData.name,
      description: projectData.description,
      template_id: projectData.template_id,
      tags: projectData.tags || [],
      canvas_data: projectData.canvas_data || {
        objects: [],
        background: '#ffffff'
      },
      is_public: projectData.is_public || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    projects.push(newProject);
    
    // Create initial version
    const initialVersion: CanvasVersion = {
      id: `v${newProject.id}-1`,
      project_id: newProject.id,
      version_number: 1,
      canvas_data: newProject.canvas_data,
      change_description: 'Initial version',
      created_at: new Date().toISOString()
    };
    
    versions.push(initialVersion);
    
    return res.status(201).json(createResponse(true, newProject, undefined, 'Project created successfully'));
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// PUT /canvas/projects/:id - Update canvas project
router.put('/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateProjectRequest = req.body;
    
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }

    const updatedProject = {
      ...projects[projectIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    projects[projectIndex] = updatedProject;
    
    return res.json(createResponse(true, updatedProject, undefined, 'Project updated successfully'));
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// DELETE /canvas/projects/:id - Delete canvas project
router.delete('/projects/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }

    // Delete all versions for this project
    const versionIndices = versions
      .map((version, index) => version.project_id === id ? index : -1)
      .filter(index => index !== -1)
      .reverse(); // Reverse to delete from end to beginning

    versionIndices.forEach(index => versions.splice(index, 1));

    projects.splice(projectIndex, 1);
    
    return res.json(createResponse(true, null, undefined, 'Project deleted successfully'));
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /canvas/projects/:projectId/versions - Get project versions
router.get('/projects/:projectId/versions', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;
    
    const projectVersions = versions
      .filter(v => v.project_id === projectId)
      .sort((a, b) => b.version_number - a.version_number); // Sort by version number desc

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedVersions = projectVersions.slice(startIndex, endIndex);
    
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: projectVersions.length,
      total_pages: Math.ceil(projectVersions.length / limitNum)
    };

    return res.json(createResponse(true, paginatedVersions, undefined, undefined, pagination));
  } catch (error) {
    console.error('Error fetching project versions:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /canvas/projects/:projectId/save - Save canvas state as new version
router.post('/projects/:projectId/save', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { canvas_data, change_description }: SaveCanvasRequest = req.body;
    
    if (!canvas_data) {
      return res.status(400).json(createResponse(false, undefined, 'Canvas data is required'));
    }

    // Find project
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }

    // Get next version number
    const projectVersions = versions.filter(v => v.project_id === projectId);
    const nextVersionNumber = projectVersions.length > 0 
      ? Math.max(...projectVersions.map(v => v.version_number)) + 1 
      : 1;

    // Create new version
    const newVersion: CanvasVersion = {
      id: `v${projectId}-${nextVersionNumber}`,
      project_id: projectId,
      version_number: nextVersionNumber,
      canvas_data,
      change_description: change_description || `Version ${nextVersionNumber}`,
      created_at: new Date().toISOString()
    };

    versions.push(newVersion);

    // Update project with latest canvas data
    projects[projectIndex].canvas_data = canvas_data;
    projects[projectIndex].updated_at = new Date().toISOString();
    
    return res.status(201).json(createResponse(true, newVersion, undefined, 'Canvas saved successfully'));
  } catch (error) {
    console.error('Error saving canvas:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// GET /canvas/projects/:projectId/versions/:versionId - Get specific version
router.get('/projects/:projectId/versions/:versionId', (req: Request, res: Response) => {
  try {
    const { projectId, versionId } = req.params;
    const version = versions.find(v => v.id === versionId && v.project_id === projectId);
    
    if (!version) {
      return res.status(404).json(createResponse(false, undefined, 'Version not found'));
    }
    
    return res.json(createResponse(true, version));
  } catch (error) {
    console.error('Error fetching version:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /canvas/projects/:projectId/versions/:versionId/restore - Restore version
router.post('/projects/:projectId/versions/:versionId/restore', (req: Request, res: Response) => {
  try {
    const { projectId, versionId } = req.params;
    
    // Find version
    const version = versions.find(v => v.id === versionId && v.project_id === projectId);
    if (!version) {
      return res.status(404).json(createResponse(false, undefined, 'Version not found'));
    }

    // Find project
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }

    // Restore canvas data
    projects[projectIndex].canvas_data = version.canvas_data;
    projects[projectIndex].updated_at = new Date().toISOString();

    // Create new version with restored data
    const projectVersions = versions.filter(v => v.project_id === projectId);
    const nextVersionNumber = Math.max(...projectVersions.map(v => v.version_number)) + 1;

    const restoreVersion: CanvasVersion = {
      id: `v${projectId}-${nextVersionNumber}`,
      project_id: projectId,
      version_number: nextVersionNumber,
      canvas_data: version.canvas_data,
      change_description: `Restored from version ${version.version_number}`,
      created_at: new Date().toISOString()
    };

    versions.push(restoreVersion);
    
    return res.json(createResponse(true, null, undefined, 'Version restored successfully'));
  } catch (error) {
    console.error('Error restoring version:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

// POST /canvas/projects/:projectId/duplicate - Duplicate project
router.post('/projects/:projectId/duplicate', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    
    // Find original project
    const originalProject = projects.find(p => p.id === projectId);
    if (!originalProject) {
      return res.status(404).json(createResponse(false, undefined, 'Project not found'));
    }

    // Create duplicate
    const duplicatedProject: CanvasProject = {
      id: (projects.length + 1).toString(),
      user_id: 'user-1', // In production, get from authenticated user
      name: name || `${originalProject.name} (Copy)`,
      description: originalProject.description,
      template_id: originalProject.template_id,
      tags: [...originalProject.tags],
      canvas_data: JSON.parse(JSON.stringify(originalProject.canvas_data)), // Deep copy
      is_public: false, // Duplicates are always private by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    projects.push(duplicatedProject);

    // Create initial version for duplicate
    const initialVersion: CanvasVersion = {
      id: `v${duplicatedProject.id}-1`,
      project_id: duplicatedProject.id,
      version_number: 1,
      canvas_data: duplicatedProject.canvas_data,
      change_description: 'Duplicated project',
      created_at: new Date().toISOString()
    };
    
    versions.push(initialVersion);
    
    return res.status(201).json(createResponse(true, duplicatedProject, undefined, 'Project duplicated successfully'));
  } catch (error) {
    console.error('Error duplicating project:', error);
    return res.status(500).json(createResponse(false, undefined, 'Internal server error'));
  }
});

export default router;
