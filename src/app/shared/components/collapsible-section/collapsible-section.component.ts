import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-collapsible-section',
  templateUrl: './collapsible-section.component.html',
  styleUrls: ['./collapsible-section.component.css']
})
export class CollapsibleSectionComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() expanded: boolean = false;
  @Input() isComplete: boolean = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() closeSection = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) { }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.expanded && this.isComplete) {
      if (this.closeSection.observers.length > 0) {
        this.closeSection.emit();
      } else {
        this.toggle.emit();
      }
    }
  }

  onToggle(): void {
    this.toggle.emit();
  }

  getIconClass(): string {
    return this.isComplete ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30';
  }

  getSectionClass(): string {
    return this.expanded ? 'bg-gray-50 dark:bg-gray-700/50' : '';
  }
}
