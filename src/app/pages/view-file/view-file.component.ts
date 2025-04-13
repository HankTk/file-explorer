import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { FileItem } from '../../models/file-item.model';
import { ViewListComponent } from '../view-list/view-list.component';

@Component({
    selector: 'app-file-view',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslateModule,
        ViewListComponent,
    ],
    templateUrl: './view-file.component.html',
    styleUrl: './view-file.component.scss',
})
export class ViewFileComponent 
{
    @Input() items: FileItem[] = [];
    @Input() loading: boolean = false;
    @Input() error: string | null = null;
    @Input() isSearching: boolean = false;
    @Input() isListView: boolean = true;

    @Output() itemClick = new EventEmitter<FileItem>();
}
