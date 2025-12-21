export interface TableColumn {
    key: string;
    label: string;
    // Visibility & Control
    visible?: boolean;     // Current visibility state
    mandatory?: boolean;   // Columns that cannot be hidden
    width?: string;        // Optional column width

    // Sorting & Filtering
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'text' | 'select' | 'date';

    // Rendering
    render?: (row: any) => string;
}

export interface ColumnPreferences {
    hiddenColumns: string[];
}
