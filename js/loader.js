/**
 * Loader Module - JSON Data Loading & Management
 * Handles fetching, parsing, validating, and caching typegrid.json
 */

class DataLoader {
  constructor() {
    this.data = null;
    this.cache = new Map();
    this.isLoading = false;
    this.error = null;
    this.dataUrl = './data/typegrid.json';
  }

  /**
   * Load typegrid.json from server
   */
  async load(url = this.dataUrl) {
    if (this.isLoading) {
      return this.data;
    }

    if (this.cache.has(url)) {
      this.data = this.cache.get(url);
      return this.data;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      this.data = this._validate(json);
      this.cache.set(url, this.data);

      return this.data;
    } catch (err) {
      this.error = err;
      console.error('[DataLoader] Error loading data:', err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Validate data structure against schema
   */
  _validate(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format: expected object');
    }

    // Required top-level keys
    const required = ['site', 'projects', 'meta'];
    for (const key of required) {
      if (!(key in data)) {
        throw new Error(`Missing required field: ${key}`);
      }
    }

    // Validate site object
    if (!data.site.title) {
      throw new Error('Site must have a title');
    }

    // Validate projects array
    if (!Array.isArray(data.projects)) {
      throw new Error('Projects must be an array');
    }

    // Validate each project
    for (let i = 0; i < data.projects.length; i++) {
      this._validateProject(data.projects[i], i);
    }

    // Set defaults for optional fields
    data.collections = data.collections || [];
    data.posts = data.posts || [];
    data.pagination = data.pagination || { page_size: 12, total_projects: data.projects.length, total_pages: 1, pages: [] };
    data.pagination.page_size = data.pagination.page_size || 12;
    data.socials = data.socials || { links: [], share_templates: {} };
    data.settings = data.settings || { layout: { columns_desktop: 3, columns_tablet: 2, columns_mobile: 1 }, sort: { field: 'year', order: 'desc' } };

    // Update pagination totals
    data.pagination.total_projects = data.projects.length;
    data.pagination.total_pages = Math.ceil(data.projects.length / (data.pagination.page_size || 12));

    return data;
  }

  /**
   * Validate individual project object
   */
  _validateProject(project, index) {
    if (!project.id || !/^[a-z0-9-]+$/.test(project.id)) {
      throw new Error(`Project ${index}: invalid id "${project.id}". Must match /^[a-z0-9-]+$/`);
    }

    if (!project.title) {
      throw new Error(`Project ${index} (${project.id}): missing title`);
    }

    if (!Array.isArray(project.images) || project.images.length === 0) {
      throw new Error(`Project ${index} (${project.id}): must have at least one image`);
    }

    const primaryCount = project.images.filter(img => img.primary).length;
    if (primaryCount !== 1) {
      throw new Error(`Project ${index} (${project.id}): must have exactly one primary image`);
    }

    if (!project.year || project.year < 1970 || project.year > new Date().getFullYear() + 1) {
      throw new Error(`Project ${index} (${project.id}): invalid year`);
    }

    // Set defaults
    project.tags = project.tags || [];
    project.description = project.description || '';
    project.favorite = project.favorite || false;
    project.draft = project.draft || false;
    project.seo = project.seo || {};
    project.open_graph = project.open_graph || {};
    project.slug = project.slug || project.id;
  }

  /**
   * Get all projects
   */
  getProjects() {
    if (!this.data) return [];
    return this.data.projects || [];
  }

  /**
   * Get projects for current page
   */
  getProjectsPage(pageNumber = 1) {
    if (!this.data) return { projects: [], total: 0, totalPages: 0 };

    const projects = this.getProjects();
    const pageSize = this.data.pagination.page_size || 12;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageProjects = projects.slice(startIndex, endIndex);
    const totalPages = Math.ceil(projects.length / pageSize);

    return {
      projects: pageProjects,
      page: pageNumber,
      pageSize,
      total: projects.length,
      totalPages,
      hasNext: pageNumber < totalPages,
      hasPrev: pageNumber > 1,
    };
  }

  /**
   * Get single project by id/slug
   */
  getProject(idOrSlug) {
    if (!this.data) return null;

    return this.data.projects.find(p => p.id === idOrSlug || p.slug === idOrSlug) || null;
  }

  /**
   * Get project by index
   */
  getProjectByIndex(index) {
    if (!this.data) return null;
    return this.data.projects[index] || null;
  }

  /**
   * Get projects by tag
   */
  getProjectsByTag(tag) {
    if (!this.data) return [];
    return this.data.projects.filter(p => p.tags.includes(tag));
  }

  /**
   * Get projects by year
   */
  getProjectsByYear(year) {
    if (!this.data) return [];
    return this.data.projects.filter(p => p.year === year);
  }

  /**
   * Get all unique tags
   */
  getAllTags() {
    if (!this.data) return [];
    const tags = new Set();
    this.data.projects.forEach(p => {
      p.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get all unique years
   */
  getAllYears() {
    if (!this.data) return [];
    const years = new Set();
    this.data.projects.forEach(p => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Get favorite projects
   */
  getFavorites() {
    if (!this.data) return [];
    return this.data.projects.filter(p => p.favorite);
  }

  /**
   * Get collection by id
   */
  getCollection(id) {
    if (!this.data || !this.data.collections) return null;
    return this.data.collections.find(c => c.id === id) || null;
  }

  /**
   * Get projects in collection
   */
  getCollectionProjects(collectionId) {
    const collection = this.getCollection(collectionId);
    if (!collection) return [];

    return collection.project_ids
      .map(id => this.getProject(id))
      .filter(p => p !== null);
  }

  /**
   * Get site config
   */
  getSite() {
    return this.data?.site || null;
  }

  /**
   * Get settings
   */
  getSettings() {
    return this.data?.settings || {};
  }

  /**
   * Get social links
   */
  getSocials() {
    return this.data?.socials || { links: [], share_templates: {} };
  }

  /**
   * Get authors
   */
  getAuthors() {
    return this.data?.site?.authors || [];
  }

  /**
   * Sort projects by criteria
   */
  sortProjects(projects = null, field = 'year', order = 'desc') {
    const projectsToSort = projects || this.getProjects();
    const sorted = [...projectsToSort];

    sorted.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle different types
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get next project in sequence
   */
  getNextProject(currentId) {
    const projects = this.getProjects();
    const currentIndex = projects.findIndex(p => p.id === currentId || p.slug === currentId);

    if (currentIndex === -1 || currentIndex === projects.length - 1) {
      return null;
    }

    return projects[currentIndex + 1];
  }

  /**
   * Get previous project in sequence
   */
  getPrevProject(currentId) {
    const projects = this.getProjects();
    const currentIndex = projects.findIndex(p => p.id === currentId || p.slug === currentId);

    if (currentIndex <= 0) {
      return null;
    }

    return projects[currentIndex - 1];
  }

  /**
   * Export data as JSON string
   */
  export() {
    if (!this.data) {
      throw new Error('No data loaded');
    }
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import and merge new data
   */
  import(newData) {
    if (!this.data) {
      this.data = this._validate(newData);
      return this.data;
    }

    const validated = this._validate(newData);

    // Merge projects with conflict resolution
    const existingIds = new Map(this.data.projects.map(p => [p.id, p]));

    for (const newProject of validated.projects) {
      if (existingIds.has(newProject.id)) {
        const existing = existingIds.get(newProject.id);
        // Replace if newer
        if (new Date(newProject.updated_at) > new Date(existing.updated_at)) {
          Object.assign(existing, newProject);
        }
      } else {
        this.data.projects.push(newProject);
      }
    }

    // Merge other collections
    this.data.collections = [...new Set([...this.data.collections, ...validated.collections])];
    this.data.posts = [...new Set([...this.data.posts, ...validated.posts])];

    // Update pagination
    this.data.pagination.total_projects = this.data.projects.length;
    this.data.pagination.total_pages = Math.ceil(this.data.projects.length / (this.data.pagination.page_size || 12));

    return this.data;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset loader state
   */
  reset() {
    this.data = null;
    this.error = null;
    this.isLoading = false;
    this.clearCache();
  }
}

// Export singleton instance
const dataLoader = new DataLoader();
window.dataLoader = dataLoader;