import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { FileThemeService } from '../../services/file-theme.service';

interface Device {
    name: string;
    path: string;
}

@Component({
    selector: 'app-device-list',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatListModule, TranslateModule],
    templateUrl: './list-device.component.html',
    styleUrl: './list-device.component.scss',
})
export class ListDeviceComponent implements OnInit 
{
    @Input() devices: Device[] = [];
    @Output() deviceSelect = new EventEmitter<Device>();

    private fileThemeService = inject(FileThemeService);

    ngOnInit(): void 
    {
        // Apply initial theme
        this.fileThemeService.setThemeVariant(this.fileThemeService.themeVariant);
    }

    onDeviceClick(device: Device): void 
    {
        this.deviceSelect.emit(device);
    }

}
