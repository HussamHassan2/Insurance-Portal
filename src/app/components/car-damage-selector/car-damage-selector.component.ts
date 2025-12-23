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
        { id: 'interior', name: 'Interior', icon: 'Inside' },
    ];

    constructor() { }

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

    // Change view
    changeView(viewId: string): void {
        this.currentView = viewId;
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
    getPartStyle(partId: string): object {
        const isSelected = this.selectedParts.includes(partId);
        const isHovered = this.hoveredPart === partId;

        return {
            fill: isSelected ? '#ef4444' : (isHovered ? '#60a5fa' : 'rgba(255, 255, 255, 0.4)'),
            stroke: isSelected ? '#dc2626' : (isHovered ? '#2563eb' : '#1e40af'),
            'stroke-width': isSelected ? '3' : (isHovered ? '2.5' : '2'),
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
