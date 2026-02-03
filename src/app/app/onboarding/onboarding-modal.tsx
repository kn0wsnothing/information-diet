"use client";

import { useState, useEffect } from "react";
import { Step1Welcome } from "./step-1-welcome";
import { Step2TimeFramework } from "./step-2-time-framework";
import { Step3ConnectSources } from "./step-3-connect-sources";
import { Step4AddItems } from "./step-4-add-items";
import { Step5Tutorial } from "./step-5-tutorial";
import { updateOnboardingStep, completeOnboarding, skipOnboarding } from "./actions";

interface OnboardingModalProps {
  initialStep?: number;
  onClose: () => void;
}

export function OnboardingModal({ initialStep = 0, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleNext = async () => {
    const nextStep = currentStep + 1;
    await updateOnboardingStep(nextStep);
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = Math.max(0, currentStep - 1);
    updateOnboardingStep(prevStep);
    setCurrentStep(prevStep);
  };

  const handleSkip = async () => {
    await skipOnboarding();
    handleClose();
  };

  const handleComplete = async () => {
    await completeOnboarding();
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
        isVisible ? "bg-opacity-50" : "bg-opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={`relative mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-50 p-8 shadow-2xl transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <Step1Welcome onNext={handleNext} onSkip={handleSkip} />
          )}
          {currentStep === 1 && (
            <Step2TimeFramework
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 2 && (
            <Step3ConnectSources
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 3 && (
            <Step4AddItems
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 4 && (
            <Step5Tutorial onComplete={handleComplete} onBack={handleBack} />
          )}
        </div>
      </div>
    </div>
  );
}
