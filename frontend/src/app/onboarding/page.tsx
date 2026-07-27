import { Metadata } from "next";
import OnboardingWizard from "./components/OnboardingWizard";

export const metadata: Metadata = {
  title: "Onboarding - RevFlow AI",
  description: "Set up your clinic on RevFlow AI",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <OnboardingWizard />
      </div>
    </div>
  );
}
