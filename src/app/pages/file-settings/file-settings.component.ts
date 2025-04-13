import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        TranslateModule,
        ThemeSwitcherComponent,
        LanguageSwitcherComponent,
    ],
    templateUrl: './file-settings.component.html',
    styleUrl: './file-settings.component.scss',
})
export class FileSettingsComponent 
{
    @Input() isDrawerOpen: boolean = false;
    @Output() toggleDrawer = new EventEmitter<void>();
}
