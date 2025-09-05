"use client";

import React, { useState, useCallback, useEffect, useMemo, useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Coins,
} from "lucide-react";
import {
  generateStoryAction,
  checkUserCredits,
} from "@/lib/actions/generation-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface ActionState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  storyId?: string;
}

interface FormFields {
  [key: string]: string;
}

interface FieldValidation {
  [key: string]: boolean;
}

interface CreateStoryFormProps {
  children: React.ReactNode;
}

interface UserSelectionProps {
  userSelection: (data: {
    fieldName: string;
    fieldValue: string;
    isValid: boolean;
  }) => void;
}

const REQUIRED_FIELDS = [
  "storySubject",
  "storyType",
  "ageGroup",
  "imageStyle",
  "language1",
  "language2",
  "genre",
] as const;

const STEP_FIELD_MAP: Record<number, string> = {
  0: "storySubject",
  1: "storyType", 
  2: "ageGroup",
  3: "imageStyle",
  4: "language1",
  5: "genre",
};

export default function CreateStoryForm({ children }: CreateStoryFormProps) {
  const [formData, setFormData] = useState<FormFields>({});
  const [fieldValidation, setFieldValidation] = useState<FieldValidation>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [hasCredits, setHasCredits] = useState<boolean>(true);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    generateStoryAction,
    {
      success: false,
      message: "",
      errors: {},
    }
  );

  // Load user credits on mount
  useEffect(() => {
    let isMounted = true;

    const loadCredits = async () => {
      try {
        const creditData = await checkUserCredits();
        
        if (isMounted) {
          setUserCredits(creditData.creditCount);
          setHasCredits(creditData.hasCredits);
          
          if (!creditData.hasCredits) {
            toast.error("You don't have enough credits to create stories.");
          }
        }
      } catch (error) {
        console.error("Error checking credits:", error);
        if (isMounted) {
          setHasCredits(false);
          toast.error("Unable to verify credits. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setCreditsLoading(false);
        }
      }
    };

    loadCredits();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle server action response
  useEffect(() => {
    if (!state.message) return;

    if (!state.success && !isPending) {
      if (state.message.includes("longer than expected")) {
        toast.error("Story generation is taking longer than usual. Please try again in a few moments.");
      } else {
        toast.error(state.message);
      }
    }

    if (state.success && state.storyId && !isPending) {
      toast.success("Story created successfully!");
    }
  }, [state.success, state.message, state.storyId, isPending]);

  const handleSelection = useCallback(
    (data: { fieldName: string; fieldValue: string; isValid: boolean }) => {
      setFormData((prev) => ({
        ...prev,
        [data.fieldName]: data.fieldValue,
      }));

      setFieldValidation((prev) => ({
        ...prev,
        [data.fieldName]: data.isValid,
      }));
    },
    []
  );

  const childrenWithProps = useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement<UserSelectionProps>(child)) {
        return React.cloneElement<UserSelectionProps>(child, {
          userSelection: handleSelection,
        });
      }
      return child;
    });
  }, [children, handleSelection]);

  const steps = React.Children.toArray(childrenWithProps) as React.ReactElement[];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / Math.max(totalSteps, 1)) * 100;

  const getCurrentStepField = useCallback(() => {
    return STEP_FIELD_MAP[currentStep];
  }, [currentStep]);

  const isCurrentStepValid = useMemo(() => {
    const currentField = getCurrentStepField();
    
    if (currentStep === 4) {
      const hasLanguage1 = formData.language1 && fieldValidation.language1;
      const hasLanguage2 = formData.language2 && fieldValidation.language2;
      const languagesDifferent = formData.language1 !== formData.language2;
      
      return hasLanguage1 && hasLanguage2 && languagesDifferent;
    }
    
    return currentField && formData[currentField] && fieldValidation[currentField];
  }, [currentStep, formData, fieldValidation, getCurrentStepField]);

  const isFormComplete = useMemo(() => {
    const allFieldsValid = REQUIRED_FIELDS.every((field) => {
      const hasValue = formData[field] && formData[field].trim() !== "";
      const isValid = fieldValidation[field];
      return hasValue && isValid;
    });

    const languagesDifferent = formData.language1 !== formData.language2;
    
    return allFieldsValid && languagesDifferent;
  }, [formData, fieldValidation]);

  const canProceed = isCurrentStepValid;
  const isLastStep = currentStep === totalSteps - 1;
  const canSubmit = isFormComplete && hasCredits && !isPending && !creditsLoading;

  const handlePrevious = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    if (!canSubmit) {
      e.preventDefault();
      toast.error("Please complete all required fields and ensure you have credits.");
      return false;
    }
  }, [canSubmit]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Credit Status Alert */}
      {!hasCredits && !creditsLoading && (
        <Alert className="border-red-200 bg-red-50">
          <Coins className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You don't have enough credits to create stories.
            <Link href="/buy-credits">
              <Button
                variant="link"
                className="p-0 h-auto text-red-800 underline ml-1"
              >
                Purchase more credits
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Server Action Error Alert */}
      {state.message && !state.success && !isPending && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {state.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Header */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Step {currentStep + 1} of {totalSteps}
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete all steps to create your personalized story
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-violet-600" />
              {creditsLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    userCredits > 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {userCredits} coins
                </span>
              )}
            </div>

            {/* Step indicators */}
            <div className="flex gap-1" aria-hidden="true">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-2 w-8 rounded-full transition-all duration-300",
                    idx < currentStep
                      ? "bg-green-500"
                      : idx === currentStep
                      ? "bg-primary"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <Progress
          value={progress}
          className="h-2"
          aria-label={`Progress: ${Math.round(progress)}% complete`}
        />
      </div>

      {/* Current Step Content */}
      <div className="bg-card border rounded-lg p-6 min-h-[400px]">
        <div className="h-full flex flex-col">{steps[currentStep]}</div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 bg-card border rounded-lg p-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isPending}
          className="min-w-[100px]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Creating your story..."
              : canProceed
              ? isLastStep
                ? "Ready to create your story!"
                : "Step complete"
              : "Please complete this step to continue"}
          </p>
          {isLastStep && !canSubmit && !isPending && (
            <p className="text-xs text-red-500 mt-1">
              {!hasCredits 
                ? "Insufficient credits" 
                : !isFormComplete 
                ? "Please complete all fields" 
                : "Please wait..."}
            </p>
          )}
          {isLastStep && isPending && (
            <p className="text-xs text-blue-500 mt-1">
              Story generation can take 1-2 minutes. Please don't close this page.
            </p>
          )}
        </div>

        {!isLastStep ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed || isPending}
            className="min-w-[100px]"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <form action={formAction} onSubmit={handleSubmit}>
            {/* Hidden form fields */}
            {Object.entries(formData)
              .filter(([key]) => REQUIRED_FIELDS.includes(key as any))
             .map(([key, value]) => (
               <input 
                  key={key} 
                  type="hidden" 
                  name={key} 
                  value={String(value || "").slice(0, 1000)} // Limit input length
               />
              ))}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[140px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  <span>Creating Story...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Story (1 credit)
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Form Summary (only visible on last step) */}
      {isLastStep && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <h3 className="font-medium mb-3">Story Summary:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Subject:</span>{" "}
              {formData.storySubject?.slice(0, 50)}
              {(formData.storySubject?.length || 0) > 50 ? "..." : ""}
            </div>
            <div>
              <span className="font-medium">Type:</span> {formData.storyType}
            </div>
            <div>
              <span className="font-medium">Age Group:</span> {formData.ageGroup}
            </div>
            <div>
              <span className="font-medium">Style:</span> {formData.imageStyle}
            </div>
            <div>
              <span className="font-medium">Languages:</span>{" "}
              {formData.language1} → {formData.language2}
            </div>
            <div>
              <span className="font-medium">Genre:</span> {formData.genre}
            </div>
          </div>

          {/* Field validation errors */}
          {state.errors && Object.keys(state.errors).length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please fix these errors:
              </h4>
              {Object.entries(state.errors).map(([field, errors]) => {
                if (Array.isArray(errors) && errors.length > 0) {
                  return (
                    <div key={field} className="text-sm text-red-700">
                      <span className="font-medium capitalize">{field}:</span>{" "}
                      {errors[0]}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}