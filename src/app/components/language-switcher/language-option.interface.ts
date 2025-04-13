export interface LanguageOption {
    code: string;
    name: string;
    flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
    {
        code: 'ja',
        name: '日本語',
        flag: '🇯🇵',
    },
    {
        code: 'en',
        name: 'English',
        flag: '🇺🇸',
    },
];
