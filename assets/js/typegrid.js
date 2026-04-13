/**
 * TypeGrid Alpine.js Application
 * Handles global state, routing, Vim-like keyboard navigation, 
 * theme switching, and the zoomable lightbox viewer.
 */

document.addEventListener('alpine:init', () => {
  
  // --------------------------------------------------------
  // THEME STORE
  // Manages Rose Pine Moon (dark) and Rose Pine Dawn (light)
  // --------------------------------------------------------
  Alpine.store('theme', {
    mode: 'dark',
    
    init() {
      // 1. Inherit theme set by FOUC prevention script
      const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      this.set(initialTheme);
      
      // 2. Listen for system preference changes
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          if (!localStorage.getItem('typegrid-theme')) {
            this.set(e.matches ? 'dark' : 'light');
          }
        });
      }
    },
    
    set(val) {
      this.mode = val;
      document.documentElement.setAttribute('data-theme', val);
      localStorage.setItem('typegrid-theme', val);
      
      // Update color-scheme meta tag
      let meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'color-scheme';
        document.head.appendChild(meta);
      }
      meta.content = val === 'dark' ? 'dark light' : 'light dark';
      
      // Update theme-color meta tag for mobile browsers
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        document.head.appendChild(themeColor);
      }
      themeColor.content = val === 'dark' ? '#191724' : '#faf4ed';
    },
    
    toggle() {
      this.set(this.mode === 'dark' ? 'light' : 'dark');
    },
    
    get isDark() {
      return this.mode === 'dark';
    }
  });

  // --------------------------------------------------------
  // LIGHTBOX STORE
  // Fullscreen image viewer with zoom and pan capabilities
  // --------------------------------------------------------
  Alpine.store('lightbox', {
    isOpen: false,
    images: [],
    currentIndex: 0,
    showMetadata: true,
    
    // Zoom & Pan State
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    
    init() {
      // Wheel to zoom
      window.addEventListener('wheel', (e) => {
        if (!this.isOpen) return;
        const main = document.querySelector('.lightbox-main');
        if (main && main.contains(e.target)) {
          e.preventDefault();
          if (e.deltaY < 0) this.zoomIn();
          else this.zoomOut();
        }
      }, { passive: false });

      // Click to zoom
      window.addEventListener('click', (e) => {
        if (!this.isOpen) return;
        if (this.hasDragged) {
          setTimeout(() => this.hasDragged = false, 50);
          return;
        }
        if (e.target.tagName === 'IMG' && e.target.classList.contains('lightbox-image')) {
          if (this.zoom === 1) this.zoomIn();
          else this.resetZoom();
        }
      });
    },

    open(images, index = 0) {
      this.images = images;
      this.currentIndex = index;
      this.isOpen = true;
      this.showMetadata = true;
      this.resetZoom();
      document.body.style.overflow = 'hidden';
    },

    close() {
      this.isOpen = false;
      document.body.style.overflow = '';
    },
    
    next() {
      if (this.currentIndex < this.images.length - 1) {
        this.currentIndex++;
        this.resetZoom();
      }
    },
    
    prev() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.resetZoom();
      }
    },
    
    toggleMetadata() {
      this.showMetadata = !this.showMetadata;
    },
    
    // Zoom & Pan Controls
    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.5, 4);
    },
    
    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.5, 1);
      if (this.zoom === 1) this.resetZoom();
    },
    
    resetZoom() {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
    },
    
    startPan(e) {
      if (this.zoom <= 1) return;
      this.isDragging = true;
      this.hasDragged = false;
      // Handle both mouse and touch events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.initialClientX = clientX;
      this.initialClientY = clientY;
      this.startX = clientX - this.panX;
      this.startY = clientY - this.panY;
    },

    doPan(e) {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      if (Math.abs(clientX - this.initialClientX) > 5 || Math.abs(clientY - this.initialClientY) > 5) {
        this.hasDragged = true;
      }
      
      this.panX = clientX - this.startX;
      this.panY = clientY - this.startY;
    },
    
    endPan() {
      this.isDragging = false;
    },
    
    download() {
      const img = this.currentImage;
      if (!img) return;
      
      const a = document.createElement('a');
      a.href = img.url;
      a.download = img.filename || `image-${this.currentIndex + 1}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    
    get currentImage() {
      return this.images[this.currentIndex] || null;
    },
    
    get transformStyle() {
      return `transform: scale(${this.zoom}) translate(${this.panX / this.zoom}px, ${this.panY / this.zoom}px); cursor: ${this.zoom > 1 ? (this.isDragging ? 'grabbing' : 'grab') : 'zoom-in'}; transition: ${this.isDragging ? 'none' : 'transform 0.2s ease-out'}`;
    }
  });

  // --------------------------------------------------------
  // MAIN APP COMPONENT
  // Handles data loading, routing, and Vim-like shortcuts
  // --------------------------------------------------------
  Alpine.data('typegrid', () => ({
    isLoading: true,
    site: {},
    authors: [],
    socials: {},
    projects: [],
    paginatedProjects: [],
    posts: [],
    pages: [],

    // Routing state
    route: 'grid', // 'grid', 'project', 'tag', 'post', 'page'
    currentProject: null,
    currentPost: null,
    htmlContent: '',
    currentFilter: null,
    availableTags: [],
    
    // Sorting state
    sortField: 'year',
    sortOrder: 'desc',
    
    // Pagination state
    currentPage: 1,
    totalPages: 1,
    
    // UI State
    showHelp: false,
    navOpen: false,
    focusedIndex: -1, // For keyboard navigation on grid
    
    // Key tracking for complex shortcuts (like 'gg')
    _lastKey: '',
    _lastKeyTime: 0,
    
    async init() {
      try {
        // We assume dataLoader from Phase 1 is still available for raw JSON parsing
        if (window.dataLoader) {
          await window.dataLoader.load();
          this.site = window.dataLoader.getSite() || {};
          this.authors = window.dataLoader.getAuthors() || [];
          this.socials = window.dataLoader.getSocials() || {};
          this.posts = window.dataLoader.getPosts() || [];
          this.pages = window.dataLoader.getPages() || [];

          const settings = window.dataLoader.getSettings();
          if (settings && settings.sort) {
            this.sortField = settings.sort.field || 'year';
            this.sortOrder = settings.sort.order || 'desc';
          }
          
          this.projects = window.dataLoader.getProjects() || [];
          if (typeof window.dataLoader.getAllTags === 'function') {
            this.availableTags = window.dataLoader.getAllTags() || [];
          }
          this.applySorting();
        }
        
        this.handleRoute();
        window.addEventListener('hashchange', () => this.handleRoute());
        
        this.isLoading = false;
      } catch (err) {
        console.error("[TypeGrid] Initialization error:", err);
        this.isLoading = false;
      }
    },
    
    parseMarkdown(md) {
      if (!md) return '';
      
      // 1. Normalize line endings
      let text = md.replace(/\r\n/g, '\n');
      text = text.replace(/  \n/g, '<br />\n');
      
      // 2. Pad block elements with double newlines so they isolate properly
      text = text.replace(/^(#{1,6} .*)$/gm, '\n\n$1\n\n');
      text = text.replace(/((?:^> .*$\n?)+)/gm, '\n\n$1\n\n');
      text = text.replace(/^(```[\s\S]*?```)$/gm, '\n\n$1\n\n');
      text = text.replace(/((?:^[-*] .*$\n?)+)/gm, '\n\n$1\n\n');
      
      // 3. Clean up excessive newlines
      text = text.replace(/\n{3,}/g, '\n\n').trim();

      // 4. Inline formatting
      let html = text
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/(?<!\*)\*(.*?)\*(?!\*)/gim, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank'>$1</a>")
        .replace(/^[-*] (.*$)/gim, '<li>$1</li>');

      // 5. Wrap lists
      html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, "<ul>\n$1\n</ul>");

      // 6. Wrap paragraphs
      html = html.split('\n\n').map(p => {
        p = p.trim();
        if (!p) return '';
        if (/^<(h[1-6]|ul|ol|li|pre|blockquote)/i.test(p)) {
          return p;
        }
        return `<p>${p}</p>`;
      }).join('\n');

      return html;
    },

    // --- Routing ---

    handleRoute() {
      const hash = window.location.hash;
      this.focusedIndex = -1; // Reset focus on route change
      this.navOpen = false; // Close mobile nav

      if (hash.startsWith('#/post/')) {
        const slug = hash.replace('#/post/', '');
        this.currentPost = window.dataLoader.getPost(slug);
        this.route = this.currentPost ? 'post' : 'grid';
        this.htmlContent = '<div style="padding: 2rem;">Loading...</div>';
        
        if (this.currentPost) {
          document.title = `${this.currentPost.title} — ${this.site.title || 'TypeGrid'}`;
          if (this.currentPost.file) {
            fetch(this.currentPost.file)
              .then(res => res.ok ? res.text() : Promise.reject('Not found'))
              .then(text => { this.htmlContent = this.parseMarkdown(text); })
              .catch(err => { this.htmlContent = '<p>Error loading content.</p>'; });
          } else {
            this.htmlContent = '<p>No content file specified.</p>';
          }
        }
        window.scrollTo(0, 0);

      } else if (hash.startsWith('#/page/')) {
        const slug = hash.replace('#/page/', '');
        this.currentPost = window.dataLoader.getPage(slug);
        this.route = this.currentPost ? 'page' : 'grid';
        this.htmlContent = '<div style="padding: 2rem;">Loading...</div>';
        
        if (this.currentPost) {
          document.title = `${this.currentPost.title} — ${this.site.title || 'TypeGrid'}`;
          if (this.currentPost.file) {
            fetch(this.currentPost.file)
              .then(res => res.ok ? res.text() : Promise.reject('Not found'))
              .then(text => { this.htmlContent = this.parseMarkdown(text); })
              .catch(err => { this.htmlContent = '<p>Error loading content.</p>'; });
          } else {
            this.htmlContent = '<p>No content file specified.</p>';
          }
        }
        window.scrollTo(0, 0);

      } else if (hash.startsWith('#/project/')) {
        const slug = hash.replace('#/project/', '');
        this.currentProject = window.dataLoader.getProject(slug);
        this.route = this.currentProject ? 'project' : 'grid';
        
        if (this.currentProject) {
          document.title = `${this.currentProject.title} — ${this.site.title || 'TypeGrid'}`;
        }
        window.scrollTo(0, 0);
        
      } else if (hash.startsWith('#/tag/')) {
        this.currentFilter = hash.replace('#/tag/', '');
        this.route = 'tag';
        this.paginatedProjects = window.dataLoader.getProjectsByTag(this.currentFilter);
        document.title = `#${this.currentFilter} — ${this.site.title || 'TypeGrid'}`;
        window.scrollTo(0, 0);
        
      } else if (hash === '#/projects' || hash.startsWith('#/projects?')) {
        this.route = 'projects';
        this.currentFilter = null;
        const pageMatch = window.location.hash.match(/page=(\d+)/) || window.location.search.match(/page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
        const pageData = window.dataLoader.getProjectsPage(page);
        this.paginatedProjects = pageData.projects;
        this.currentPage = pageData.page;
        this.totalPages = pageData.totalPages;
        document.title = `Projects — ${this.site.title || 'TypeGrid'}`;
        
      } else if (hash === '#/posts') {
        this.route = 'posts';
        document.title = `Posts — ${this.site.title || 'TypeGrid'}`;
        
      } else if (hash === '#/pages') {
        this.route = 'pages';
        document.title = `Pages — ${this.site.title || 'TypeGrid'}`;
        
      } else {
        // Default Home
        this.route = 'home';
        this.currentFilter = null;

        const pageMatch = window.location.hash.match(/page=(\d+)/) || window.location.search.match(/page=(\d+)/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;

        const pageData = window.dataLoader.getProjectsPage(page);
        this.paginatedProjects = pageData.projects;
        this.currentPage = pageData.page;
        this.totalPages = pageData.totalPages;
        
        document.title = this.site.title || 'TypeGrid';
      }
    },
    
    // --- Helpers ---
    
    openImage(imageIndex) {
      if (this.currentProject && this.currentProject.images) {
        Alpine.store('lightbox').open(this.currentProject.images, imageIndex);
      }
    },
    
    formatSize(bytes) {
      if (!bytes) return '';
      return (bytes / 1024).toFixed(1) + ' KB';
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        window.location.hash = `#/?page=${this.currentPage + 1}`;
      }
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        window.location.hash = `#/?page=${this.currentPage - 1}`;
      }
    },
    
    applySorting() {
      // Sort projects using dataLoader
      this.projects = window.dataLoader.sortProjects(
        window.dataLoader.getProjects(),
        this.sortField,
        this.sortOrder
      );
      // Update dataLoader's internal projects array so pagination works correctly
      if (window.dataLoader.data) {
        window.dataLoader.data.projects = this.projects;
      }
    },
    
    changeSort(field, order) {
      this.sortField = field;
      this.sortOrder = order;
      this.applySorting();
      this.handleRoute(); // Refresh current view
    },
    
    // --- Vim-like Keyboard Navigation ---
    
    handleKeydown(e) {
      // Ignore if user is typing in an input
      if (e.target && e.target.tagName && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      
      const lb = Alpine.store('lightbox');
      
      // 1. Lightbox Controls
      if (lb.isOpen) {
        switch(e.key) {
          case 'Escape': lb.close(); break;
          case 'h':
          case 'ArrowLeft': lb.prev(); break;
          case 'l':
          case 'ArrowRight': lb.next(); break;
          case 'm': lb.toggleMetadata(); break;
          case '+':
          case '=': lb.zoomIn(); break;
          case '-': lb.zoomOut(); break;
          case 'z': lb.zoom === 1 ? lb.zoomIn() : lb.zoomOut(); break;
          case '0': lb.resetZoom(); break;
          case 'd': lb.download(); break;
        }
        return;
      }
      
      // 2. Help Modal Controls
      if (this.showHelp) {
        if (e.key === 'Escape' || e.key === '?') {
          this.showHelp = false;
          e.preventDefault();
        }
        return;
      }
      
      // 3. Global Shortcuts
      const now = Date.now();
      const isDoubleG = (e.key === 'g' && this._lastKey === 'g' && (now - this._lastKeyTime) < 500);
      
      switch(e.key) {
        case '?': 
          this.showHelp = true; 
          break;
          
        case 'Escape':
          // If in project/tag view, go back to grid
          if (this.route === 'project' || this.route === 'tag' || this.route === 'post' || this.route === 'page') {
            window.location.hash = '#/';
          }
          this.focusedIndex = -1;
          break;
          
        case 't':
          Alpine.store('theme').toggle();
          break;
          
        // Vim Navigation: Down
        case 'j':
        case 'ArrowDown':
          if (this.route === 'grid' || this.route === 'tag') {
            e.preventDefault(); // Prevent default scroll
            this.focusedIndex = Math.min(this.focusedIndex + 1, this.paginatedProjects.length - 1);
            this.scrollToFocused();
          } else {
            window.scrollBy({ top: 100, behavior: 'smooth' });
          }
          break;
          
        // Vim Navigation: Up
        case 'k':
        case 'ArrowUp':
          if (this.route === 'grid' || this.route === 'tag') {
            e.preventDefault(); // Prevent default scroll
            this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
            this.scrollToFocused();
          } else {
            window.scrollBy({ top: -100, behavior: 'smooth' });
          }
          break;
          
        // Vim Navigation: Left / Prev Project
        case 'h':
        case 'ArrowLeft':
          if (this.route === 'project' && this.currentProject) {
            const prev = window.dataLoader.getPrevProject(this.currentProject.id);
            if (prev) window.location.hash = `#/project/${prev.slug}`;
          } else if (this.route === 'grid') {
            this.prevPage();
          }
          break;
          
        // Vim Navigation: Right / Next Project
        case 'l':
        case 'ArrowRight':
          if (this.route === 'project' && this.currentProject) {
            const next = window.dataLoader.getNextProject(this.currentProject.id);
            if (next) window.location.hash = `#/project/${next.slug}`;
          } else if (this.route === 'grid') {
            this.nextPage();
          }
          break;
          
        case 'g':
          if (isDoubleG) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this._lastKey = ''; // Reset
          } else {
            this._lastKey = 'g';
            this._lastKeyTime = now;
          }
          break;
          
        case 'G':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          break;
          
        case 'Enter':
        case 'o':
          if ((this.route === 'grid' || this.route === 'tag') && this.focusedIndex >= 0) {
            const proj = this.paginatedProjects[this.focusedIndex];
            if (proj) window.location.hash = `#/project/${proj.slug}`;
          }
          break;
          
        case '/':
          // Optional: focus search/filter input if added later
          e.preventDefault();
          break;
          
        default:
          // Record key for combo detection
          this._lastKey = e.key;
          this._lastKeyTime = now;
          break;
      }
    },
    
    scrollToFocused() {
      // Small delay to let Alpine render/update DOM bindings
      setTimeout(() => {
        const cards = document.querySelectorAll('.project-card');
        if (cards[this.focusedIndex]) {
          cards[this.focusedIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
          // Highlight visually
          cards.forEach(c => c.classList.remove('ring-focus'));
          cards[this.focusedIndex].classList.add('ring-focus');
        }
      }, 50);
    }
  }));
});