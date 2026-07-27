"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Building2, Clock, Stethoscope, Users, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const steps = [
  { id: 1, title: "Welcome", icon: Building },
  { id: 2, title: "Clinic Info", icon: Building2 },
  { id: 3, title: "Hours", icon: Clock },
  { id: 4, title: "Services", icon: Stethoscope },
  { id: 5, title: "Doctors", icon: Users },
  { id: 6, title: "Review", icon: ShieldCheck },
  { id: 7, title: "Finish", icon: Check },
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    clinicName: "",
    email: "",
    phone: "",
    address: "",
    timezone: "America/New_York",
    specialty: "General Dentistry",
  });

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
      {/* Header / Progress bar */}
      <div className="bg-muted/30 border-b border-border p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Clinic Setup</h2>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      : isCompleted
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block absolute -bottom-6 whitespace-nowrap ${
                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {currentStep === 1 && (
              <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight">Welcome to RevFlow AI</h3>
                <p className="text-muted-foreground max-w-md">
                  Let's get your clinic configured. This wizard will guide you through setting up your business profile, operating hours, and AI agent preferences.
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-4">Clinic Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => updateForm("clinicName", e.target.value)}
                    placeholder="E.g. Smile Dental Care"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    placeholder="contact@smiledental.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 max-w-lg mx-auto h-full flex flex-col justify-center text-center">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Business Hours</h3>
                <p className="text-muted-foreground">
                  (Placeholder) Here you will configure your Mon-Sun opening and closing hours. AI agents use this to know when to route calls to the front desk vs handling them fully.
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-4">Services & Specialty</h3>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Primary Specialty</Label>
                  <select
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => updateForm("specialty", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>Select specialty</option>
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Endodontics">Endodontics</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6 max-w-lg mx-auto text-center flex flex-col justify-center h-full">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Providers & Staff</h3>
                <p className="text-muted-foreground">
                  (Placeholder) Add your doctors and front desk staff. You can also invite them via email later.
                </p>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6 max-w-lg mx-auto">
                <h3 className="text-2xl font-semibold mb-4">Review Details</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Clinic Name</span>
                    <span className="font-medium text-foreground">{formData.clinicName || "Not set"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-foreground">{formData.email || "Not set"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium text-foreground">{formData.phone || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specialty</span>
                    <span className="font-medium text-foreground">{formData.specialty || "Not set"}</span>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="flex flex-col items-center justify-center text-center h-full gap-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-12 h-12" />
                </motion.div>
                <h3 className="text-3xl font-bold tracking-tight">You're all set!</h3>
                <p className="text-muted-foreground max-w-md">
                  Your clinic workspace has been fully initialized. You can now access your dashboard and configure your AI agent.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Controls */}
      <div className="border-t border-border p-6 flex items-center justify-between bg-muted/10">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || currentStep === steps.length}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext}>
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : currentStep === steps.length - 1 ? (
          <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white">
            Complete Setup
            <Check className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}
