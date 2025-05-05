document.addEventListener('DOMContentLoaded', function () {
    // We'll populate this dynamically
    let tutorialGroups = {};

    // Function to scan directories and build tutorial groups
    async function buildTutorialGroups() {
        try {
            // Define known tutorial directories to check
            // This list can be expanded as needed
            const directoriesToCheck = [
                'sw.administration',
                'sw.storefront'
                // Add other directories as needed
            ];

            // Process each directory
            for (const dir of directoriesToCheck) {
                try {
                    // Try to fetch the index file
                    const indexResponse = await fetch(`output/${dir}/index.md`);
                    if (!indexResponse.ok) continue; // Skip if index doesn't exist

                    // Fetch the directory listing (this would be a JSON file in a real implementation)
                    // For now, we'll manually scan for chapter files
                    const chapters = await scanChapterFiles(dir);

                    if (chapters.length > 0) {
                        // Use a friendly name for display (remove 'sw.' prefix if present)
                        const displayName = dir.startsWith('sw.') ?
                            dir.substring(3).charAt(0).toUpperCase() + dir.substring(3).slice(1) :
                            dir;

                        tutorialGroups[displayName] = chapters;
                    }
                } catch (error) {
                    console.warn(`Could not process directory ${dir}:`, error);
                }
            }

            // If no tutorial groups were found, show an error
            if (Object.keys(tutorialGroups).length === 0) {
                document.getElementById('markdown-content').innerHTML = `
                    <div class="error">
                        <h2>No Tutorials Found</h2>
                        <p>Could not find any tutorial directories in the output folder. Please check your directory structure.</p>
                    </div>
                `;
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error building tutorial groups:', error);
            document.getElementById('markdown-content').innerHTML = `
                <div class="error">
                    <h2>Error Loading Tutorials</h2>
                    <p>${error.message}</p>
                </div>
            `;
            return false;
        }
    }

    // Function to scan for chapter files in a directory
    async function scanChapterFiles(dir) {
        const chapters = [];

        // First, add the index file
        const indexResponse = await fetch(`output/${dir}/index.md`);
        if (indexResponse.ok) {
            chapters.push({
                id: `${dir.toLowerCase()}-index`,
                title: 'Tutorial Overview',
                path: `output/${dir}/index.md`
            });

            // For each directory, we'll check for specific chapter files based on the directory
            if (dir === 'sw.storefront') {
                // Storefront chapters
                const storefrontChapters = [
                    { num: 1, title: 'Storefront Routing (RequestTransformer, Router)', file: '01_storefront_routing__requesttransformer__router__.md' },
                    { num: 2, title: 'Theme System (ThemeService, ThemeCompiler, StorefrontPluginConfiguration)', file: '02_theme_system__themeservice__themecompiler__storefrontpluginconfiguration__.md' },
                    { num: 3, title: 'StorefrontController', file: '03_storefrontcontroller_.md' },
                    { num: 4, title: 'Page / PageLoader Pattern', file: '04_page___pageloader_pattern_.md' },
                    { num: 5, title: 'Pagelet / PageletLoader Pattern', file: '05_pagelet___pageletloader_pattern_.md' },
                    { num: 6, title: 'Captcha Abstraction', file: '06_captcha_abstraction_.md' },
                    { num: 7, title: 'RouteRequestEvent', file: '07_routerequestevent_.md' },
                    { num: 8, title: 'PageLoadedHook', file: '08_pageloadedhook_.md' }
                ];

                for (const chapter of storefrontChapters) {
                    const chapterPath = `output/${dir}/${chapter.file}`;
                    try {
                        const response = await fetch(chapterPath);
                        if (response.ok) {
                            chapters.push({
                                id: `${dir.toLowerCase()}-ch${chapter.num}`,
                                title: `${chapter.num}. ${chapter.title}`,
                                path: chapterPath
                            });
                        }
                    } catch (e) {
                        console.warn(`Could not fetch chapter: ${chapterPath}`, e);
                    }
                }
            } else if (dir === 'sw.administration') {
                // Administration chapters
                const adminChapters = [
                    { num: 1, title: 'Administration Bundle', file: '01_administration_bundle_.md' },
                    { num: 2, title: 'Administration Controllers', file: '02_administration_controllers_.md' },
                    { num: 3, title: 'Admin Search Service', file: '03_admin_search_service_.md' },
                    { num: 4, title: 'Snippet Management', file: '04_snippet_management_.md' },
                    { num: 5, title: 'User Configuration Service', file: '05_user_configuration_service_.md' },
                    { num: 6, title: 'Admin Extension API & App Interaction', file: '06_admin_extension_api___app_interaction_.md' },
                    { num: 7, title: 'Admin Asset Management & Build Process', file: '07_admin_asset_management___build_process_.md' }
                ];

                for (const chapter of adminChapters) {
                    const chapterPath = `output/${dir}/${chapter.file}`;
                    try {
                        const response = await fetch(chapterPath);
                        if (response.ok) {
                            chapters.push({
                                id: `${dir.toLowerCase()}-ch${chapter.num}`,
                                title: `${chapter.num}. ${chapter.title}`,
                                path: chapterPath
                            });
                        }
                    } catch (e) {
                        console.warn(`Could not fetch chapter: ${chapterPath}`, e);
                    }
                }
            }
            // Add more directory-specific chapters as needed
        }

        // Sort chapters by their number
        chapters.sort((a, b) => {
            // Extract chapter numbers (index is always first)
            const aIsIndex = a.id.endsWith('-index');
            const bIsIndex = b.id.endsWith('-index');

            if (aIsIndex && !bIsIndex) return -1;
            if (!aIsIndex && bIsIndex) return 1;

            const aMatch = a.id.match(/-ch(\d+)$/);
            const bMatch = b.id.match(/-ch(\d+)$/);

            const aNum = aMatch ? parseInt(aMatch[1]) : 0;
            const bNum = bMatch ? parseInt(bMatch[1]) : 0;

            return aNum - bNum;
        });

        return chapters;
    }

    // Helper function to format title from filename
    function formatTitle(name) {
        // Replace underscores with spaces
        name = name.replace(/_/g, ' ');

        // Remove file extension if present
        if (name.endsWith('.md')) {
            name = name.substring(0, name.length - 3);
        }

        // Capitalize the first letter of each word
        return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Function to populate the sidebar with tutorial groups and chapter links
    function populateSidebar() {
        const chapterList = document.getElementById('chapter-list');
        chapterList.innerHTML = ''; // Clear existing content

        // Create tutorial group sections
        Object.keys(tutorialGroups).forEach(groupName => {
            // Create group header with toggle functionality
            const groupHeader = document.createElement('li');
            groupHeader.className = 'tutorial-group-header';

            // Create the header with a toggle icon
            groupHeader.innerHTML = `
                <div class="group-header-toggle">
                    <span class="toggle-icon">►</span>
                    <h3>${groupName}</h3>
                </div>
            `;
            chapterList.appendChild(groupHeader);

            // Create group chapters list
            const groupList = document.createElement('ul');
            groupList.className = 'tutorial-group-chapters collapsed'; // Add collapsed class by default

            // Add chapters to the group
            tutorialGroups[groupName].forEach(chapter => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#' + chapter.id;
                a.textContent = chapter.title;
                a.dataset.path = chapter.path;
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    loadChapter(chapter.path);

                    // Update active state
                    document.querySelectorAll('#chapter-list a').forEach(link => {
                        link.classList.remove('active');
                    });
                    this.classList.add('active');

                    // Update URL hash
                    window.location.hash = chapter.id;
                });
                li.appendChild(a);
                groupList.appendChild(li);
            });

            chapterList.appendChild(groupList);

            // Add toggle functionality
            const toggleElement = groupHeader.querySelector('.group-header-toggle');
            toggleElement.addEventListener('click', function () {
                groupList.classList.toggle('collapsed');
                const icon = this.querySelector('.toggle-icon');
                icon.textContent = groupList.classList.contains('collapsed') ? '►' : '▼';
            });
        });
    }

    // Function to load chapter content
    function loadChapter(path) {
        fetch(path)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(markdown => {
                // Parse markdown to HTML
                const html = marked.parse(markdown);
                document.getElementById('markdown-content').innerHTML = html;

                // Process any mermaid diagrams
                if (typeof mermaid !== 'undefined') {
                    mermaid.init(undefined, document.querySelectorAll('.language-mermaid'));
                }

                // Add link handling for internal markdown links
                document.querySelectorAll('#markdown-content a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.endsWith('.md')) {
                        link.addEventListener('click', function (e) {
                            e.preventDefault();

                            // Find the directory of the current path
                            const currentDir = path.substring(0, path.lastIndexOf('/') + 1);
                            const targetPath = currentDir + href;

                            loadChapter(targetPath);

                            // Try to find and highlight the corresponding sidebar link
                            const sidebarLink = Array.from(document.querySelectorAll('#chapter-list a')).find(
                                a => a.dataset.path === targetPath
                            );

                            if (sidebarLink) {
                                document.querySelectorAll('#chapter-list a').forEach(a => {
                                    a.classList.remove('active');
                                });
                                sidebarLink.classList.add('active');
                                window.location.hash = sidebarLink.getAttribute('href').substring(1);

                                // Ensure the parent group is expanded
                                const parentGroup = sidebarLink.closest('.tutorial-group-chapters');
                                if (parentGroup && parentGroup.classList.contains('collapsed')) {
                                    const toggleIcon = parentGroup.previousElementSibling.querySelector('.toggle-icon');
                                    parentGroup.classList.remove('collapsed');
                                    toggleIcon.textContent = '▼';
                                }
                            }
                        });
                    }
                });
            })
            .catch(error => {
                console.error('Error loading chapter:', error);
                document.getElementById('markdown-content').innerHTML = `
                    <div class="error">
                        <h2>Error Loading Content</h2>
                        <p>Could not load the requested chapter. Please check if the file exists at: ${path}</p>
                    </div>
                `;
            });
    }

    // Load initial chapter based on hash or default to first tutorial's index
    function loadInitialChapter() {
        const hash = window.location.hash.substring(1);

        // Find the chapter that matches the hash across all groups
        let targetChapter = null;
        let targetGroupName = null;

        for (const groupName in tutorialGroups) {
            const foundChapter = tutorialGroups[groupName].find(ch => ch.id === hash);
            if (foundChapter) {
                targetChapter = foundChapter;
                targetGroupName = groupName;
                break;
            }
        }

        // Default to first tutorial's first chapter if no match
        if (!targetChapter) {
            targetGroupName = Object.keys(tutorialGroups)[0];
            targetChapter = tutorialGroups[targetGroupName][0];
        }

        // Find and activate the link
        const link = document.querySelector(`a[href="#${targetChapter.id}"]`);
        if (link) {
            link.classList.add('active');

            // Make sure the group containing the active link is expanded
            const parentGroup = link.closest('.tutorial-group-chapters');
            if (parentGroup) {
                parentGroup.classList.remove('collapsed');
                const toggleIcon = parentGroup.previousElementSibling.querySelector('.toggle-icon');
                if (toggleIcon) {
                    toggleIcon.textContent = '▼';
                }
            }

            loadChapter(targetChapter.path);
        }
    }

    // Add search functionality
    function setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');

        // Function to perform search
        function performSearch() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (!searchTerm) return;

            // Show loading indicator
            document.getElementById('markdown-content').innerHTML = `
                <div class="loading">
                    <h2>Searching...</h2>
                    <p>Looking for "${searchTerm}" in all tutorials.</p>
                </div>
            `;

            // Collect all chapters to search
            const allChapters = [];
            for (const groupName in tutorialGroups) {
                allChapters.push(...tutorialGroups[groupName]);
            }

            // Search through all chapters
            searchInChapters(searchTerm, allChapters);
        }

        // Search in all chapters
        async function searchInChapters(searchTerm, chapters) {
            const results = [];

            for (const chapter of chapters) {
                try {
                    const response = await fetch(chapter.path);
                    if (response.ok) {
                        const content = await response.text();

                        // Check if search term exists in content
                        if (content.toLowerCase().includes(searchTerm)) {
                            // Find the context around matches
                            const matches = findMatchesWithContext(content, searchTerm);

                            results.push({
                                chapter: chapter,
                                matches: matches
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Error searching in ${chapter.path}:`, error);
                }
            }

            // Display results
            displaySearchResults(searchTerm, results);
        }

        // Find matches with surrounding context
        function findMatchesWithContext(content, searchTerm) {
            const matches = [];
            const lowerContent = content.toLowerCase();
            const contextLength = 100; // Characters of context before and after match

            let startPos = 0;
            let pos;

            while ((pos = lowerContent.indexOf(searchTerm, startPos)) !== -1) {
                // Get context around match
                const contextStart = Math.max(0, pos - contextLength);
                const contextEnd = Math.min(content.length, pos + searchTerm.length + contextLength);
                let context = content.substring(contextStart, contextEnd);

                // Add ellipsis if needed
                if (contextStart > 0) context = '...' + context;
                if (contextEnd < content.length) context = context + '...';

                // Calculate position of match within context
                const matchPosInContext = pos - contextStart;

                matches.push({
                    context: context,
                    matchPos: matchPosInContext,
                    matchLength: searchTerm.length
                });

                startPos = pos + searchTerm.length;
            }

            return matches;
        }

        // Display search results
        function displaySearchResults(searchTerm, results) {
            const contentDiv = document.getElementById('markdown-content');

            if (results.length === 0) {
                contentDiv.innerHTML = `
                    <div class="no-results">
                        <h2>No Results Found</h2>
                        <p>Your search for "${searchTerm}" did not match any content in the tutorials.</p>
                    </div>
                `;
                return;
            }

            // Build results HTML
            let html = `
                <h1>Search Results for "${searchTerm}"</h1>
                <p>Found matches in ${results.length} chapter(s).</p>
            `;

            for (const result of results) {
                html += `
                    <div class="search-result">
                        <h2><a href="#${result.chapter.id}" class="chapter-link" data-path="${result.chapter.path}">${result.chapter.title}</a></h2>
                        <ul class="match-list">
                `;

                for (const match of result.matches) {
                    // Highlight the match in the context
                    const beforeMatch = match.context.substring(0, match.matchPos);
                    const matchText = match.context.substring(match.matchPos, match.matchPos + match.matchLength);
                    const afterMatch = match.context.substring(match.matchPos + match.matchLength);

                    html += `
                        <li class="match-context">${beforeMatch}<span class="search-highlight">${matchText}</span>${afterMatch}</li>
                    `;
                }

                html += `
                    </ul>
                </div>
            `;
            }

            contentDiv.innerHTML = html;

            // Add click handlers to chapter links
            document.querySelectorAll('.chapter-link').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    const path = this.dataset.path;
                    const id = this.getAttribute('href').substring(1);

                    // Load the chapter
                    loadChapter(path);

                    // Update active state in sidebar
                    document.querySelectorAll('#chapter-list a').forEach(sidebarLink => {
                        sidebarLink.classList.remove('active');
                        if (sidebarLink.getAttribute('href') === `#${id}`) {
                            sidebarLink.classList.add('active');

                            // Ensure parent group is expanded
                            const parentGroup = sidebarLink.closest('.tutorial-group-chapters');
                            if (parentGroup && parentGroup.classList.contains('collapsed')) {
                                parentGroup.classList.remove('collapsed');
                                const toggleIcon = parentGroup.previousElementSibling.querySelector('.toggle-icon');
                                toggleIcon.textContent = '▼';
                            }
                        }
                    });

                    // Update URL hash
                    window.location.hash = id;
                });
            });
        }

        // Add event listeners
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Initialize the application
    async function init() {
        // Add support for mermaid diagrams
        const mermaidScript = document.createElement('script');
        mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
        document.head.appendChild(mermaidScript);

        // Show loading indicator
        document.getElementById('markdown-content').innerHTML = `
            <div class="loading">
                <h2>Loading Tutorials...</h2>
                <p>Please wait while we scan for available tutorials.</p>
            </div>
        `;

        // Build tutorial groups
        const success = await buildTutorialGroups();

        if (success) {
            // Populate sidebar with the discovered tutorials
            populateSidebar();

            // Setup search functionality
            setupSearch();

            // Initialize mermaid if loaded
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ startOnLoad: true });
            }

            // Load initial chapter
            loadInitialChapter();
        }
    }

    // Start the application
    init();
});




