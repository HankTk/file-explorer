import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LANGUAGE_OPTIONS, LanguageOption } from './language-option.interface';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [MatButtonModule, MatFormFieldModule, MatSelectModule, TranslateModule],
    templateUrl: './language-switcher.component.html',
    styleUrls: ['./language-switcher.component.scss'],
})
export class LanguageSwitcherComponent 
{
    readonly translate = inject(TranslateService);
    readonly languageOptions: LanguageOption[] = LANGUAGE_OPTIONS;

    get currentLang(): string 
    {
        return this.translate.currentLang;
    }

    switchLanguage(lang: string): void 
    {
        this.translate.use(lang);
    }
}
