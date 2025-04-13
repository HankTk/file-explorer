// Function to recursively search for files
// In a new file named `fileSearchService.js`
const fs = require('fs');
const path = require('path');

async function searchFilesRecursive(dirPath, query, depth = 0) {
    if (depth > 10) {
        return [];
    }

    const results = [];
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);

        if (item.name.startsWith('.') || item.name === 'node_modules') {
            continue;
        }

        try {
            if (item.name.toLowerCase().includes(query.toLowerCase())) {
                const stats = await fs.promises.stat(fullPath);
                const extension = item.isDirectory() ? '' : path.extname(item.name).toLowerCase();
                results.push({
                    name: item.name,
                    path: fullPath,
                    isDirectory: item.isDirectory(),
                    size: item.isDirectory() ? 0 : stats.size,
                    modifiedDate: stats.mtime,
                    type: item.isDirectory() ? 'folder' : extension
                });
            }

            if (item.isDirectory()) {
                const subResults = await searchFilesRecursive(fullPath, query, depth + 1);
                results.push(...subResults);
            }
        } catch (error) {
            console.error(`Error processing ${fullPath}:`, error);
            continue;
        }
    }

    return results;
}

module.exports = { searchFilesRecursive };
