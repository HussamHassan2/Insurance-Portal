import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicRoutingModule } from './public-routing.module';
import { SharedModule } from '../shared/shared.module';
import {
    LucideAngularModule, Phone, Mail, MapPin, Clock, Loader2, Send, Check,
    Rocket, FileText, AlertCircle, ShieldCheck, ChevronRight, PlayCircle, Image,
    HelpCircle, MessageCircle, BookOpen, ChevronDown
} from 'lucide-angular';

// Pages
import { HomeComponent } from './pages/home/home.component';
import { WataniyaHomeComponent } from './pages/home/wataniya-home.component';
import { LoginComponent } from './pages/login/login.component';
import { WataniyaLoginComponent } from './pages/login/wataniya-login.component';
import { RegisterComponent } from './pages/register/register.component';
import { WataniyaRegisterComponent } from './pages/register/wataniya-register.component';
import { ContactComponent } from './pages/contact/contact.component';
import { WataniyaContactComponent } from './pages/contact/wataniya-contact.component';
import { SupportComponent } from './pages/support/support.component';
import { MotorInsuranceComponent } from './pages/products/motor-insurance/motor-insurance.component';
import { MedicalInsuranceComponent } from './pages/products/medical-insurance/medical-insurance.component';
import { TravelInsuranceComponent } from './pages/products/travel-insurance/travel-insurance.component';
import { PropertyInsuranceComponent } from './pages/products/property-insurance/property-insurance.component';
import { MarineInsuranceComponent } from './pages/products/marine-insurance/marine-insurance.component';
import { EngineeringInsuranceComponent } from './pages/products/engineering-insurance/engineering-insurance.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyOtpComponent } from './pages/forgot-password/verify-otp.component';
import { ResetPasswordComponent } from './pages/forgot-password/reset-password.component';
import { FaqComponent } from './pages/support/faq.component';
import { GuideComponent } from './pages/support/guide.component';

@NgModule({
    declarations: [
        HomeComponent,
        WataniyaHomeComponent,
        LoginComponent,
        WataniyaLoginComponent,
        RegisterComponent,
        WataniyaRegisterComponent,
        ContactComponent,
        WataniyaContactComponent,
        SupportComponent,
        MotorInsuranceComponent,
        MedicalInsuranceComponent,
        TravelInsuranceComponent,
        PropertyInsuranceComponent,
        MarineInsuranceComponent,
        EngineeringInsuranceComponent,
        ForgotPasswordComponent,
        VerifyOtpComponent,
        ResetPasswordComponent,
        FaqComponent,
        GuideComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PublicRoutingModule,
        PublicRoutingModule,
        SharedModule,
        LucideAngularModule.pick({
            Phone, Mail, MapPin, Clock, Loader2, Send, Check,
            Rocket, FileText, AlertCircle, ShieldCheck, ChevronRight, PlayCircle, Image,
            HelpCircle, MessageCircle, BookOpen, ChevronDown
        })
    ]
})
export class PublicModule { }
