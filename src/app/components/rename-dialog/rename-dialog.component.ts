import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface RenameDialogData {
    currentName: string;
    isDirectory: boolean;
}

@Component({
    selector: 'app-rename-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        TranslateModule,
    ],
    templateUrl: './rename-dialog.component.html',
    styleUrls: ['./rename-dialog.component.scss'],
})
export class RenameDialogComponent 
{
    newName: string;

    constructor(
        public dialogRef: MatDialogRef<RenameDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: RenameDialogData
    ) 
    {
        this.newName = data.currentName;
    }

    onCancel(): void 
    {
        this.dialogRef.close();
    }

    onConfirm(): void 
    {
        if (this.newName && this.newName !== this.data.currentName) 
        {
            this.dialogRef.close(this.newName);
        }
    }
}
