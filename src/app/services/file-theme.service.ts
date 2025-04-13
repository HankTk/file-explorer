import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeVariant =
    | 'light'
    | 'dark'
    | 'classic'
    | 'ocean'
    | 'forest'
    | 'purple'
    | 'sunset'
    | 'navy'
    | 'midnight'
    | 'emerald'
    | 'crimson'
    | 'sapphire';

@Injectable({
    providedIn: 'root',
})
export class FileThemeService 
{
    private readonly THEME_STORAGE_KEY = 'file-explorer-theme';
    private themeVariantSubject: BehaviorSubject<ThemeVariant>;
    themeVariant$: Observable<ThemeVariant>;

    constructor() 
    {
        const initialTheme = this.getStoredTheme();
        this.themeVariantSubject = new BehaviorSubject<ThemeVariant>(initialTheme);
        this.themeVariant$ = this.themeVariantSubject.asObservable();
        this.applyThemeToDOM(initialTheme);
    }

    private getStoredTheme(): ThemeVariant 
    {
        const storedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
        if (!storedTheme) 
        {
            return 'light';
        }
        return storedTheme as ThemeVariant;
    }

    get themeVariant(): ThemeVariant 
    {
        const value = this.themeVariantSubject.value;
        return value;
    }

    setThemeVariant(variant: ThemeVariant): void 
    {
        localStorage.setItem(this.THEME_STORAGE_KEY, variant);
        this.themeVariantSubject.next(variant);
        this.applyThemeToDOM(variant);
    }

    private applyThemeToDOM(variant: ThemeVariant): void 
    {
        const html = document.documentElement;
        const body = document.body;

        // Remove existing theme classes
        html.classList.remove('dark-theme', 'light-theme');
        html.classList.remove(
            'ocean',
            'forest',
            'purple',
            'sunset',
            'navy',
            'midnight',
            'emerald',
            'crimson',
            'sapphire'
        );
        body.classList.remove('dark-theme', 'light-theme');
        body.classList.remove(
            'ocean',
            'forest',
            'purple',
            'sunset',
            'navy',
            'midnight',
            'emerald',
            'crimson',
            'sapphire'
        );

        // Add new theme classes
        if (variant === 'light') 
        {
            html.classList.add('light-theme');
            body.classList.add('light-theme');
        }
        else 
        {
            html.classList.add('dark-theme');
            body.classList.add('dark-theme');
            if (variant !== 'dark') 
            {
                html.classList.add(variant);
                body.classList.add(variant);
            }
        }

        // Force theme change to take effect
        this.updateThemeVariables();
    }

    private updateThemeVariables(): void 
    {
        const style = getComputedStyle(document.documentElement);
        const variables = [
            '--background-color',
            '--text-color',
            '--primary-color',
            '--secondary-color',
            '--border-color',
            '--card-background',
            '--drawer-background',
            '--hover-color',
            '--error-background',
            '--error-text',
            '--text-secondary',
            '--text-disabled',
            '--tool-icon-color',
        ];
        variables.forEach((variable) => 
        {
            const value = style.getPropertyValue(variable);
            document.documentElement.style.setProperty(variable, value);
        });
    }
}
