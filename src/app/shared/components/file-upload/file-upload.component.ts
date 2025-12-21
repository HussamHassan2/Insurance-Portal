import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
    @Input() accept = '*/*';
    @Input() multiple = false;
    @Input() maxSize = 5242880; // 5MB default
    @Output() filesSelected = new EventEmitter<File[]>();
    @Output() error = new EventEmitter<string>();

    selectedFiles: File[] = [];
    isDragging = false;

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.handleFiles(Array.from(input.files));
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragging = false;
        if (event.dataTransfer?.files) {
            this.handleFiles(Array.from(event.dataTransfer.files));
        }
    }

    handleFiles(files: File[]): void {
        const validFiles = files.filter(file => {
            if (file.size > this.maxSize) {
                this.error.emit(`File ${file.name} exceeds maximum size of ${this.maxSize / 1024 / 1024}MB`);
                return false;
            }
            return true;
        });

        if (this.multiple) {
            this.selectedFiles = [...this.selectedFiles, ...validFiles];
        } else {
            this.selectedFiles = validFiles.slice(0, 1);
        }

        this.filesSelected.emit(this.selectedFiles);
    }

    removeFile(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.filesSelected.emit(this.selectedFiles);
    }

    getFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }
}
