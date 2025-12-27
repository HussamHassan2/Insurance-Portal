import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClaimService } from 'src/app/core/services/claim.service';

@Component({
  selector: 'app-add-estimation-item-modal',
  templateUrl: './add-estimation-item-modal.component.html',
  styleUrls: ['./add-estimation-item-modal.component.css']
})
export class AddEstimationItemModalComponent implements OnInit, OnChanges {
  @Input() estimationId!: number;
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() itemAdded = new EventEmitter<{ item: any, action: 'new' | 'close' }>();

  itemForm!: FormGroup;
  itemTypes: any[] = [];
  availableItems: any[] = [];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private claimService: ClaimService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      console.log('Modal visible changed:', changes['visible'].currentValue);
    }
  }

  ngOnInit(): void {
    console.log('Modal Initialized');
    this.initForm();
    this.fetchTypes();
    this.fetchAvailableItems();
  }

  fetchTypes(): void {
    this.claimService.getEstimationItemTypes().subscribe({
      next: (res) => this.itemTypes = res.data || res,
      error: (err) => console.error('Error loading types', err)
    });
  }

  fetchAvailableItems(): void {
    this.loading = true;
    this.claimService.listEstimationItems(100, 0).subscribe({
      next: (res) => {
        this.availableItems = res.data || res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading items', err);
        this.loading = false;
      }
    });
  }

  initForm(): void {
    this.itemForm = this.fb.group({
      id: [null],
      estimation_id: [this.estimationId],
      estimation_item_type: [''],
      estimation_item_type_id: [null],
      estimation_item_type_symbol: [''],
      spare_part_type: [''],
      estimation_item_description: ['', Validators.required],
      estimation_item_state: ['Accepted'],
      salvage_state: ['pending_collection'],
      estimation_item: [''],
      estimation_item_id: [null],
      estimation_unit_amount: [0, [Validators.required, Validators.min(0)]],
      adjustment_unit_amount: [0],
      estimation_amount: [0],
      adjustment_amount: [0],
      taxed_adjustment_amount: [0],
      taxed_estimation_amount: [0],
      difference_amount: [0],
      quantity: [1, [Validators.required, Validators.min(1)]],
      apply_tax: [false],
      post_comment: [false],
      pre_comment: [false],
      depreciation: [0],
      apply_depreciation_calculations: [false],
      apply_panorama_calculations: [false],
      is_excluded: [false],
      special_discount: [0],
      apply_damage_calculations: [false],
      apply_airbag_calculations: [false],
      pre_pics: [[]],
      post_pics: [[]]
    });
  }

  onItemSelect(event: any): void {
    const selectedId = event.target.value;
    if (!selectedId || selectedId === "null") return;

    const selectedItem = this.availableItems.find(i => i.id == selectedId);
    if (selectedItem) {
      // Auto-fill fields
      this.itemForm.patchValue({
        estimation_item_description: selectedItem.name || selectedItem.description,
        estimation_item_id: selectedItem.id,
        estimation_unit_amount: selectedItem.price || selectedItem.unit_price || 0,
        estimation_item_type_id: selectedItem.estimation_spare_part_type_id || selectedItem.type_id || null,
        spare_part_type: selectedItem.code || selectedItem.reference || ''
      });
    }
  }

  onSave(action: 'new' | 'close'): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const formValue = this.itemForm.value;
    // Map dropdown ID to type string if needed for display, 
    // but usually API handles saving by ID.
    // For now we just emit the form value.

    // In a real scenario, we might call an API here to save.
    // Since the user didn't give a "Create" API but said "use list-estimation-items",
    // IF that API was for Creating (unlikely), we'd call it.
    // Assuming we emit to parent to handle or just mock it.

    console.log('Adding Item:', formValue);
    this.itemAdded.emit({ item: formValue, action });

    if (action === 'new') {
      this.itemForm.reset({
        estimation_id: this.estimationId,
        estimation_item_state: 'Accepted',
        quantity: 1,
        estimation_unit_amount: 0,
        depreciation: 0,
        special_discount: 0,
        apply_tax: false
      });
    } else {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.visible = false;
    this.close.emit();
  }
}
