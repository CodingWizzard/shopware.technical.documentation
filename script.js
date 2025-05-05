document.addEventListener('DOMContentLoaded', function () {
    // We'll populate this dynamically
    let tutorialGroups = {};

    // Function to scan directories and build tutorial groups
    async function buildTutorialGroups() {
        try {
            // Define known tutorial directories to check
            // This list can be expanded as needed
            const directoriesToCheck = [
                'BuergelCheck',
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
        }

        // Try to fetch a list of files
        // In a real implementation, this would be a server-side generated JSON file
        // For now, we'll try to fetch files with common patterns

        // Common patterns for chapter files
        const patterns = [
            { regex: /^(\d+)_(.+)\.md$/, titleFormat: (num, name) => `${parseInt(num)}. ${formatTitle(name)}` },
            { regex: /^chapter(\d+)_(.+)\.md$/, titleFormat: (num, name) => `${parseInt(num)}. ${formatTitle(name)}` }
        ];

        // For each potential chapter number
        for (let i = 1; i <= 20; i++) { // Assume max 20 chapters
            const paddedNum = i.toString().padStart(2, '0');

            // Try different filename patterns
            const filesToTry = [
                `${paddedNum}_*.md`,
                `${i}_*.md`,
                `chapter${i}_*.md`
            ];

            for (const filePattern of filesToTry) {
                try {
                    // In a real implementation, we would get a list of files
                    // For now, we'll try specific common filenames

                    // Examples of specific files to try
                    const specificFiles = [
                        `output/${dir}/${paddedNum}_configuration_management_.md`,
                        `output/${dir}/${paddedNum}_storefront_routing__requesttransformer__router__.md`,
                        `output/${dir}/${paddedNum}_theme_system__themeservice__themecompiler__storefrontpluginconfiguration__.md`,
                        `output/${dir}/${paddedNum}_storefrontcontroller_.md`,
                        `output/${dir}/${paddedNum}_page___pageloader_pattern_.md`,
                        `output/${dir}/${paddedNum}_pagelet___pageletloader_pattern_.md`,
                        `output/${dir}/${paddedNum}_captcha_abstraction_.md`,
                        `output/${dir}/${paddedNum}_routerequestevent_.md`,
                        `output/${dir}/${paddedNum}_pageloadedhook_.md`,
                        `output/${dir}/${paddedNum}_admin_asset_management___build_process_.md`,
                        `output/${dir}/${paddedNum}_snippet_management_.md`,
                        `output/${dir}/${paddedNum}_administration_bundle_.md`,
                        `output/${dir}/${paddedNum}_user_configuration_service_.md`
                    ];

                    for (const filePath of specificFiles) {
                        try {
                            const response = await fetch(filePath);
                            if (response.ok) {
                                // Extract title from filename
                                const fileName = filePath.split('/').pop();
                                let title = `Chapter ${i}`;

                                // Try to extract a better title from the filename
                                for (const pattern of patterns) {
                                    const match = fileName.match(pattern.regex);
                                    if (match) {
                                        title = pattern.titleFormat(match[1], match[2]);
                                        break;
                                    }
                                }

                                // If we couldn't extract from filename, try to get from content
                                if (title === `Chapter ${i}`) {
                                    const content = await response.text();
                                    const titleMatch = content.match(/^#\s+(.+)$/m);
                                    if (titleMatch) {
                                        title = `${i}. ${titleMatch[1]}`;
                                    }
                                }

                                chapters.push({
                                    id: `${dir.toLowerCase()}-ch${i}`,
                                    title: title,
                                    path: filePath
                                });

                                // Found a file for this chapter number, move to next number
                                break;
                            }
                        } catch (e) {
                            // Continue to next file
                        }
                    }
                } catch (error) {
                    // Just continue if we can't find this pattern
                }
            }
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




