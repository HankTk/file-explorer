import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { FileThemeService, ThemeVariant } from '../../services/file-theme.service';

@Component({
    selector: 'app-theme-switcher',
    standalone: true,
    imports: [CommonModule, FormsModule, MatSlideToggleModule, TranslateModule],
    templateUrl: './theme-switcher.component.html',
    styleUrls: ['./theme-switcher.component.scss'],
    host: {
        '[class.dark-theme]': 'themeService.themeVariant === "dark"'
    }
})
export class ThemeSwitcherComponent implements OnInit
{
    readonly themeService = inject(FileThemeService);

    isDarkMode = false;

    ngOnInit(): void 
    {
        this.isDarkMode = this.themeService.themeVariant === 'dark';
    }

    onThemeChange(isDark: boolean): void 
    {
        this.isDarkMode = isDark;
        this.themeService.setThemeVariant(isDark ? 'dark' : 'light');
    }
}
