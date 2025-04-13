import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FileExplorerComponent } from './pages/file-explorer/file-explorer.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, FileExplorerComponent, TranslateModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent 
{
    private readonly translate = inject(TranslateService);

    constructor() 
    {
        // Initialize Translation
        this.translate.setDefaultLang('en');
        this.translate.use('en');
    }
}
