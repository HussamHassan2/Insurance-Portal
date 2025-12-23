import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CAR_PARTS, CarPart } from './models/car-parts.model';
import { DamageSelection } from './models/damage-selection.model';

@Component({
    selector: 'app-car-damage-selector',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './car-damage-selector.component.html',
    styleUrls: ['./car-damage-selector.component.scss']
})
export class CarDamageSelectorComponent implements OnInit {
    @Output() partsSelected = new EventEmitter<string[]>();
    @Output() selectionCleared = new EventEmitter<void>();

    selectedParts: string[] = [];
    currentView: string = 'front';
    hoveredPart: string | null = null;

    readonly carParts: CarPart[] = CAR_PARTS;

    readonly views = [
        { id: 'front', name: 'Front View', icon: 'Front' },
        { id: 'rear', name: 'Rear View', icon: 'Rear' },
        { id: 'left', name: 'Left Side', icon: 'Left' },
        { id: 'right', name: 'Right Side', icon: 'Right' },
        { id: 'top', name: 'Top View', icon: 'Top' },
    ];

    zoomLevel: number = 1;
    readonly MIN_ZOOM = 1;
    readonly MAX_ZOOM = 3;
    readonly ZOOM_STEP = 0.5;

    constructor() { }

    zoomIn(): void {
        if (this.zoomLevel < this.MAX_ZOOM) {
            this.zoomLevel = Math.min(this.zoomLevel + this.ZOOM_STEP, this.MAX_ZOOM);
        }
    }

    zoomOut(): void {
        if (this.zoomLevel > this.MIN_ZOOM) {
            this.zoomLevel = Math.max(this.zoomLevel - this.ZOOM_STEP, this.MIN_ZOOM);
        }
    }

    resetZoom(): void {
        this.zoomLevel = 1;
    }

    changeView(viewId: string): void {
        this.currentView = viewId;
        this.resetZoom(); // Reset zoom when changing views
    }

    ngOnInit(): void {
    }

    // Toggle part selection
    selectPart(partId: string): void {
        if (this.selectedParts.includes(partId)) {
            this.selectedParts = this.selectedParts.filter(id => id !== partId);
        } else {
            this.selectedParts.push(partId);
        }
        this.partsSelected.emit(this.selectedParts);
    }

    // Clear all selections
    clearSelection(): void {
        this.selectedParts = [];
        this.selectionCleared.emit();
        this.partsSelected.emit(this.selectedParts);
    }

    // Get part name helper
    getPartName(partId: string): string {
        return this.carParts.find(p => p.id === partId)?.name || partId;
    }

    // Get part style (for SVG styling)
    // Get part style (for SVG styling)
    getPartStyle(partId: string): object {
        const isSelected = this.selectedParts.includes(partId);
        const isHovered = this.hoveredPart === partId;

        return {
            // If selected: Red transparent. If hovered: Blue transparent. If inactive: Almost fully transparent to show image.
            fill: isSelected ? 'rgba(239, 68, 68, 0.6)' : (isHovered ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.01)'),
            stroke: isSelected ? '#dc2626' : (isHovered ? '#2563eb' : 'transparent'),
            'stroke-width': isSelected ? '3' : (isHovered ? '2' : '0'),
            cursor: 'pointer',
            transition: 'all 0.2s'
        };
    }

    // Export selected parts (for form submission)
    getSelectedPartsData(): DamageSelection[] {
        return this.selectedParts.map(partId => ({
            partId,
            partName: this.getPartName(partId),
            timestamp: new Date() // In a real app, this might be when it was selected
        }));
    }
}
