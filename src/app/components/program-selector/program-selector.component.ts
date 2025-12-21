import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Shield, Zap, Check, Star, MapPin, Award, Car, Crown } from 'lucide-angular';

export interface Program {
    id: string;
    name: string;
    description: string;
    features: string[];
    popular?: boolean;
    colorClass: string;
    icon: any;
}

@Component({
    selector: 'app-program-selector',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule
    ],
    templateUrl: './program-selector.component.html',
    styleUrls: ['./program-selector.component.css']
})
export class ProgramSelectorComponent {
    @Output() programSelected = new EventEmitter<string>();
    @Output() roadsideToggled = new EventEmitter<boolean>();
    @Output() includeRoadsideChange = new EventEmitter<boolean>();
    @Output() selectedProgramChange = new EventEmitter<string>();

    @Input() includeRoadside = false;
    @Input() selectedProgram = 'egy';

    // Icons for template usage
    readonly Shield = Shield;
    readonly Zap = Zap;
    readonly Check = Check;
    readonly Star = Star;
    readonly MapPin = MapPin;
    readonly Award = Award;
    readonly Car = Car;
    readonly Crown = Crown;

    programs: Program[] = [
        {
            id: 'egy',
            name: 'EGY',
            description: 'Basic roadside assistance for Egypt',
            features: ['24/7 Support', 'Towing Service', 'Battery Jump Start', 'Tire Change', 'Fuel Delivery'],
            colorClass: 'blue',
            icon: Car
        },
        {
            id: 'egy-vip',
            name: 'EGY VIP',
            description: 'Premium protection with extra perks',
            features: ['All EGY Features', 'Hotel Accommodation', 'Replacement Car', 'Unlimited Towing', 'Priority Service', 'Key Replacement', 'International Coverage'],
            popular: true,
            colorClass: 'purple',
            icon: Crown
        },
        {
            id: 'euro',
            name: 'EURO',
            description: 'Standard European coverage',
            features: ['EU Wide Coverage', 'Towing Service', 'Legal Assistance', 'Medical Assistance', 'Repatriation', 'Hotel Stay'],
            colorClass: 'indigo',
            icon: MapPin
        },
        {
            id: 'euro-vip',
            name: 'EURO VIP',
            description: 'Complete peace of mind in Europe',
            features: ['All EURO Features', 'Replacement Luxury Car', 'Flight Tickets', 'VIP Lounge Access', 'Concierge Service', 'Extended Hotel Stay', 'Valet Parking', 'Zero Deductible'],
            colorClass: 'rose',
            icon: Crown
        }
    ];

    onToggleChange() {
        this.includeRoadsideChange.emit(this.includeRoadside);
        this.roadsideToggled.emit(this.includeRoadside);
        if (this.includeRoadside && this.selectedProgram) {
            this.programSelected.emit(this.selectedProgram);
        }
    }

    selectProgram(programId: string) {
        this.selectedProgram = programId;
        this.selectedProgramChange.emit(programId);
        if (!this.includeRoadside) {
            this.includeRoadside = true;
            this.includeRoadsideChange.emit(true);
            this.roadsideToggled.emit(true);
        }
        this.programSelected.emit(programId);
    }
}
