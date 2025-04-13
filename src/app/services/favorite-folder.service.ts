import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FavoriteFolderService 
{
    private favorites = new BehaviorSubject<string[]>([]);
    favorites$ = this.favorites.asObservable();

    constructor() 
    {
        // Load favorites from localStorage on initialization
        const savedFavorites = localStorage.getItem('favoriteFolders');
        if (savedFavorites) 
        {
            this.favorites.next(JSON.parse(savedFavorites));
        }
    }

    addFavorite(folderPath: string): void 
    {
        const currentFavorites = this.favorites.value;
        if (!currentFavorites.includes(folderPath)) 
        {
            const newFavorites = [...currentFavorites, folderPath];
            this.favorites.next(newFavorites);
            localStorage.setItem('favoriteFolders', JSON.stringify(newFavorites));
        }
    }

    removeFavorite(folderPath: string): void 
    {
        const currentFavorites = this.favorites.value;
        const newFavorites = currentFavorites.filter((path) => path !== folderPath);
        this.favorites.next(newFavorites);
        localStorage.setItem('favoriteFolders', JSON.stringify(newFavorites));
    }

    isFavorite(folderPath: string): boolean 
    {
        return this.favorites.value.includes(folderPath);
    }
}
