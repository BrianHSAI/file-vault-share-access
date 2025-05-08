
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccessCodeInputProps {
  codes: string[];
  onChange: (codes: string[]) => void;
  maxCodes?: number;
  readOnly?: boolean;
}

const AccessCodeInput: React.FC<AccessCodeInputProps> = ({ 
  codes, 
  onChange, 
  maxCodes = 3,
  readOnly = false
}) => {
  const [generatingCode, setGeneratingCode] = useState<number | null>(null);

  const generateUniqueCode = () => {
    // Generate a random 8-character string
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleGenerateCode = (index: number) => {
    setGeneratingCode(index);
    setTimeout(() => {
      const newCode = generateUniqueCode();
      const newCodes = [...codes];
      newCodes[index] = newCode;
      onChange(newCodes);
      setGeneratingCode(null);
    }, 500);
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCodes = [...codes];
    newCodes[index] = value;
    onChange(newCodes);
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: maxCodes }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="grow">
            <Label htmlFor={`code-${index}`} className="text-xs text-gray-500 mb-1">
              Access Code {index + 1}
            </Label>
            <Input
              id={`code-${index}`}
              value={codes[index] || ""}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              placeholder="Enter or generate access code"
              className="w-full"
              readOnly={readOnly || generatingCode === index}
            />
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-6"
              onClick={() => handleGenerateCode(index)}
              disabled={generatingCode === index}
            >
              {generatingCode === index ? "Generating..." : "Generate"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AccessCodeInput;
