import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
    LucideAngularModule, Shield, User, FileText, Calendar, CheckCircle, Download, ChevronRight,
    DollarSign, CreditCard, Phone, Mail, MapPin, Car, Award, TrendingUp,
    History, Clock, AlertCircle, ChevronLeft, Plus, Search, Filter,
    ArrowRight, ArrowLeft, Trash2, Edit, Eye, EyeOff, X, UploadCloud, File, RefreshCw,
    Home, Settings, LogOut, Menu, Bell, AlertTriangle, Paperclip, Building, Loader2,
    ChevronsLeft, ChevronsRight, ChevronDown, Send, MessageCircle, Info, Columns, Lock, Rocket, ShieldCheck, XCircle,
    Heart, Plane, Anchor, Facebook, Twitter, Instagram
} from 'lucide-angular';

// Components
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { ButtonComponent } from './components/button/button.component';
import { CardComponent } from './components/card/card.component';
import { ModalComponent } from './components/modal/modal.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { TextInputComponent } from './components/form-inputs/text-input/text-input.component';
import { SelectInputComponent } from './components/form-inputs/select-input/select-input.component';
import { TextareaInputComponent } from './components/form-inputs/textarea-input/textarea-input.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { WizardComponent } from './components/wizard/wizard.component';
import { ModernStepperComponent } from './components/stepper/stepper.component';
import { CollapsibleSectionComponent } from './components/collapsible-section/collapsible-section.component';
import { CustomerSelectionModalComponent } from './components/customer-selection-modal/customer-selection-modal.component';
import { ChassisValidationModalComponent } from './components/chassis-validation-modal/chassis-validation-modal.component';
import { SelectionModalComponent } from './components/selection-modal/selection-modal.component';
import { DynamicTableWithFiltersComponent } from './components/dynamic-table-with-filters/dynamic-table-with-filters.component';
import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { ColumnToggleComponent } from './components/column-toggle/column-toggle.component';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { ChatBoxModule } from './components/chat-box/chat-box.module';
import { LiveChatComponent } from './components/live-chat/live-chat.component';
// import { ChatBoxComponent } from './components/chat-box/chat-box.component';

// Pages
import { ProfileComponent } from './pages/profile/profile.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { FileClaimComponent } from './pages/file-claim/file-claim.component';
import { DatePickerComponent } from './components/form-inputs/date-picker/date-picker.component';
import { CarDamageSelectorComponent } from '../components/car-damage-selector/car-damage-selector.component';
import { DynamicTranslatePipe } from './pipes/dynamic-translate.pipe';

@NgModule({
    declarations: [
        NavbarComponent,
        DashboardLayoutComponent,
        ButtonComponent,
        CardComponent,
        ModalComponent,
        LoadingSpinnerComponent,
        TextInputComponent,
        DatePickerComponent,
        SelectInputComponent,
        TextareaInputComponent,
        DataTableComponent,
        FileUploadComponent,
        WizardComponent,
        ModernStepperComponent,
        CollapsibleSectionComponent,
        CustomerSelectionModalComponent,
        ChassisValidationModalComponent,
        SelectionModalComponent,
        DynamicTableWithFiltersComponent,
        AuthLayoutComponent,
        PaginationComponent,
        DateRangePickerComponent,
        ColumnToggleComponent,
        ChangePasswordComponent,
        ProfileComponent,
        SettingsComponent,
        FileClaimComponent,
        DynamicTranslatePipe,
        LanguageSwitcherComponent,
        FooterComponent,
        LiveChatComponent,
        // ChatBoxComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        LucideAngularModule.pick({
            Shield, User, FileText, Calendar, CheckCircle, Download, ChevronRight,
            DollarSign, CreditCard, Phone, Mail, MapPin, Car, Award, TrendingUp,
            History, Clock, AlertCircle, ChevronLeft, Plus, Search, Filter,
            ArrowRight, ArrowLeft, Trash2, Edit, Eye, EyeOff, X, UploadCloud, File, RefreshCw,
            Home, Settings, LogOut, Menu, Bell, AlertTriangle, Paperclip, Building, Loader2,
            ChevronsLeft, ChevronsRight, ChevronDown, Send, MessageCircle, Info, Columns, Lock, Rocket, ShieldCheck, XCircle,
            Heart, Plane, Anchor, Facebook, Twitter, Instagram
        }),
        CarDamageSelectorComponent,
        ChatBoxModule
    ],
    exports: [
        NavbarComponent,
        DashboardLayoutComponent,
        ButtonComponent,
        CardComponent,
        ModalComponent,
        LoadingSpinnerComponent,
        TextInputComponent,
        DatePickerComponent,
        SelectInputComponent,
        TextareaInputComponent,
        DataTableComponent,
        FileUploadComponent,
        WizardComponent,
        ModernStepperComponent,
        CollapsibleSectionComponent,
        CustomerSelectionModalComponent,
        ChassisValidationModalComponent,
        SelectionModalComponent,
        DynamicTableWithFiltersComponent,
        AuthLayoutComponent,
        PaginationComponent,
        DateRangePickerComponent,
        ColumnToggleComponent,
        ChangePasswordComponent,
        ProfileComponent,
        SettingsComponent,
        FileClaimComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        LucideAngularModule,
        DynamicTranslatePipe,
        LanguageSwitcherComponent,
        ChatBoxModule,
        LiveChatComponent,
        FooterComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
