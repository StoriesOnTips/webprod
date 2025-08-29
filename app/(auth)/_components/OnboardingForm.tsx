"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { completeOnboarding } from "@/lib/actions/onboarding-actions";
import { toast } from "@/hooks/use-toast";

interface OnboardingFormProps {
  userId: string;
}

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Russian", "Hindi", "Other",
];

const AGE_GROUPS = [
  { value: "toddlers", label: "Toddlers (2-4)" },
  { value: "kids", label: "Kids (5-8)" },
  { value: "tweens", label: "Tweens (9-12)" },
  { value: "teens", label: "Teens (13-17)" },
  { value: "adults", label: "Adults (18+)" },
];

const PRIMARY_GOALS = [
  { value: "vocabulary", label: "Learn vocabulary" },
  { value: "grammar", label: "Improve grammar" },
  { value: "reading", label: "Practice reading" },
  { value: "cultural", label: "Cultural understanding" },
  { value: "entertainment", label: "Entertainment" },
];

const STORY_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "3-4-weekly", label: "3-4 times a week" },
  { value: "weekly", label: "Weekly" },
  { value: "occasionally", label: "Occasionally" },
];

const IMAGE_STYLES = [
  { value: "realistic", label: "Realistic" },
  { value: "cartoon", label: "Cartoon" },
  { value: "minimalist", label: "Minimalist" },
  { value: "watercolor", label: "Watercolor" },
  { value: "digital-art", label: "Digital art" },
];

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    motherTongue: "",
    preferredAgeGroup: "",
    primaryGoal: "",
    storyFrequency: "",
    preferredImageStyle: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.motherTongue) newErrors.motherTongue = "Mother tongue is required";
    }

    if (step === 2) {
      if (!formData.preferredAgeGroup) newErrors.preferredAgeGroup = "Age group is required";
      if (!formData.primaryGoal) newErrors.primaryGoal = "Primary goal is required";
    }

    if (step === 3) {
      if (!formData.storyFrequency) newErrors.storyFrequency = "Story frequency is required";
      if (!formData.preferredImageStyle) newErrors.preferredImageStyle = "Image style is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    try {
      const result = await completeOnboarding(userId, formData);
      
      if (result.success) {
        toast({
          title: "Onboarding completed successfully!",
          description: "Welcome to your personalized story journey.",
        });
        router.push("/dashboard");
      } else {
        throw new Error(result.error || "Failed to complete onboarding");
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      const errorMessage = error.message || "Failed to complete onboarding. Please try again.";
      
      toast({
        title: "Onboarding Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 bg-background">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Personal Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && (
                  <p className="text-destructive text-sm">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && (
                  <p className="text-destructive text-sm">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherTongue" className="text-foreground">
                What's your native/mother tongue?
              </Label>
              <Select
                value={formData.motherTongue}
                onValueChange={(value) => handleInputChange("motherTongue", value)}
              >
                <SelectTrigger className={errors.motherTongue ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your native language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.motherTongue && (
                <p className="text-destructive text-sm">{errors.motherTongue}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Story Preferences</h2>
              <p className="text-muted-foreground">Customize your learning experience</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageGroup" className="text-foreground">
                What age group are you creating stories for?
              </Label>
              <Select
                value={formData.preferredAgeGroup}
                onValueChange={(value) => handleInputChange("preferredAgeGroup", value)}
              >
                <SelectTrigger className={errors.preferredAgeGroup ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select target age group" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferredAgeGroup && (
                <p className="text-destructive text-sm">{errors.preferredAgeGroup}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryGoal" className="text-foreground">
                What's your primary goal?
              </Label>
              <Select
                value={formData.primaryGoal}
                onValueChange={(value) => handleInputChange("primaryGoal", value)}
              >
                <SelectTrigger className={errors.primaryGoal ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your main learning goal" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_GOALS.map((goal) => (
                    <SelectItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.primaryGoal && (
                <p className="text-destructive text-sm">{errors.primaryGoal}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Final Touches</h2>
              <p className="text-muted-foreground">Almost done! Just a couple more preferences</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyFrequency" className="text-foreground">
                How often do you want to create stories?
              </Label>
              <Select
                value={formData.storyFrequency}
                onValueChange={(value) => handleInputChange("storyFrequency", value)}
              >
                <SelectTrigger className={errors.storyFrequency ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your preferred frequency" />
                </SelectTrigger>
                <SelectContent>
                  {STORY_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.storyFrequency && (
                <p className="text-destructive text-sm">{errors.storyFrequency}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageStyle" className="text-foreground">
                Preferred image style for stories?
              </Label>
              <Select
                value={formData.preferredImageStyle}
                onValueChange={(value) => handleInputChange("preferredImageStyle", value)}
              >
                <SelectTrigger className={errors.preferredImageStyle ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your preferred image style" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferredImageStyle && (
                <p className="text-destructive text-sm">{errors.preferredImageStyle}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="min-h-[400px]">{renderStepContent()}</div>

      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button type="button" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              "Complete Onboarding"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}