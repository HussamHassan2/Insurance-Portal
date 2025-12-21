import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ContactComponent } from './pages/contact/contact.component';
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

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'support', component: SupportComponent },
    { path: 'products/motor', component: MotorInsuranceComponent },
    { path: 'products/medical', component: MedicalInsuranceComponent },
    { path: 'products/travel', component: TravelInsuranceComponent },
    { path: 'products/property', component: PropertyInsuranceComponent },
    { path: 'products/marine', component: MarineInsuranceComponent },
    { path: 'products/engineering', component: EngineeringInsuranceComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'forgot-password/verify-otp', component: VerifyOtpComponent },
    { path: 'forgot-password/reset', component: ResetPasswordComponent },
    { path: 'support/faq', component: FaqComponent },
    { path: 'support/guide', component: GuideComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PublicRoutingModule { }
