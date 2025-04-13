import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FileThemeService } from '../../services/file-theme.service';
import { FileExplorerService } from '../../services/file-explorer.service';
import { FileItem } from '../../models/file-item.model';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatTooltipModule,
        TranslateModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './file-toolbar.component.html',
    styleUrl: './file-toolbar.component.scss',
})
export class FileToolbarComponent implements OnInit 
{
    @Input() currentPath: string = '';
    @Input() searchQuery: string = '';
    @Input() canGoBack: boolean = false;
    @Input() canGoUp: boolean = false;
    @Input() isDrawerOpen: boolean = false;
    @Input() isSearching: boolean = false;
    @Input() currentItems: FileItem[] = [];

    @Output() goBack = new EventEmitter<void>();
    @Output() goUp = new EventEmitter<void>();
    @Output() goHome = new EventEmitter<void>();
    @Output() selectDirectory = new EventEmitter<void>();
    @Output() navigateToPath = new EventEmitter<string>();
    @Output() searchTriggered = new EventEmitter<void>();
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() pathChanged = new EventEmitter<string>();
    @Output() searchQueryChanged = new EventEmitter<string>();
    @Output() searchResults = new EventEmitter<FileItem[]>();

    private fileThemeService = inject(FileThemeService);
    private fileExplorerService = inject(FileExplorerService);

    ngOnInit(): void 
    {
        // Apply initial theme
        this.fileThemeService.setThemeVariant(this.fileThemeService.themeVariant);
    }

    onPathInputKeyup(event: Event): void 
    {
        const input = event.target as HTMLInputElement;
        if (input) 
        {
            this.navigateToPath.emit(input.value);
        }
    }

    onSearchEnter(): void 
    {
        if (this.searchQuery.trim()) 
        {
            this.searchTriggered.emit();
            this.performSearch();
        }
    }

    onSearchQueryChange(value: string): void 
    {
        this.searchQueryChanged.emit(value);
    }

    private async performSearch(): Promise<void> 
    {
        this.isSearching = true;
        try 
        {
            const results = await this.searchInDirectory(this.currentPath, this.searchQuery);
            this.searchResults.emit(results);
        }
        catch (error) 
        {
            console.error('Search error:', error);
        }
        finally 
        {
            this.isSearching = false;
        }
    }

    private async searchInDirectory(directoryPath: string, query: string): Promise<FileItem[]> 
    {
        const results: FileItem[] = [];
        const normalizedQuery = query.toLowerCase();

        // First search in current directory
        for (const item of this.currentItems) 
        {
            if (item.name.toLowerCase().includes(normalizedQuery)) 
            {
                results.push(item);
            }
        }

        // Then search recursively in subdirectories
        for (const item of this.currentItems) 
        {
            if (item.isDirectory && this.fileExplorerService.isAccessibleDirectory(item.path)) 
            {
                try 
                {
                    const subItems = await this.fileExplorerService.readDirectory(item.path);
                    const subResults = await this.searchInDirectory(item.path, query);
                    results.push(...subResults);
                }
                catch (error) 
                {
                    console.warn(`Skipping inaccessible directory: ${item.path}`);
                    continue;
                }
            }
        }

        return results;
    }
}
