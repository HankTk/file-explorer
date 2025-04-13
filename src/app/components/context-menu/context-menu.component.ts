import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
    selector: 'app-context-menu',
    standalone: true,
    imports: [CommonModule, MatMenuModule, MatIconModule, MatDialogModule, TranslateModule],
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.scss'],
})
export class ContextMenuComponent implements AfterViewInit 
{
    @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
    @Input() currentDirectory: string = '';

    constructor(public contextMenuService: ContextMenuService) 
    {}

    // Lifecycle hooks
    ngAfterViewInit(): void 
    {
        this.initializeMenuTrigger();
    }

    // Private methods
    private initializeMenuTrigger(): void 
    {
        if (!this.menuTrigger) 
        {
            console.error('Menu trigger not found');
            return;
        }

        console.log('Menu trigger initialized');

        this.menuTrigger.menuOpened.subscribe(() => 
        {
            console.log('Menu opened at position:', this.contextMenuService.contextMenuPosition);
            this.preventMenuAutoClose();
        });

        this.menuTrigger.menuClosed.subscribe(() => 
        {
            console.log('Menu closed');
        });
    }

    private preventMenuAutoClose(): void 
    {
        if (this.menuTrigger?.menu) 
        {
            this.menuTrigger.menu.focusFirstItem = () => 
            {};
        }
    }

    // Public methods
    public addToFavorites(): void 
    {
        console.log('addToFavorites clicked');
        this.contextMenuService.addToFavorites(this.menuTrigger);
    }

    public copyItem(): void 
    {
        console.log('copyItem clicked');
        this.contextMenuService.copyItem(this.menuTrigger);
    }

    public pasteItem(): void 
    {
        console.log('pasteItem clicked');
        this.contextMenuService.pasteItem(this.currentDirectory, this.menuTrigger);
    }

    public renameItem(): void 
    {
        console.log('renameItem clicked');
        this.contextMenuService.renameItem(this.menuTrigger);
    }

    public deleteItem(): void 
    {
        console.log('deleteItem clicked');
        this.contextMenuService.deleteItem(this.menuTrigger);
    }
}
