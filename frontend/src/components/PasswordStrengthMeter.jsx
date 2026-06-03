import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

export default function PasswordStrengthMeter({ password, onValidityChange }) {
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    const reqs = {
      length: password.length >= 10,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>\-_\+=/\[\]~]/.test(password)
    };

    setRequirements(reqs);

    let score = 0;
    if (reqs.length) score++;
    if (reqs.uppercase && reqs.lowercase) score++;
    if (reqs.number) score++;
    if (reqs.special) score++;

    setStrength(score);

    const isValid = Object.values(reqs).every(Boolean);
    if (onValidityChange) {
      onValidityChange(isValid);
    }
  }, [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (strength === 0 || strength === 1) return 'Weak';
    if (strength === 2 || strength === 3) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (password.length === 0) return 'bg-gray-200';
    if (strength === 0 || strength === 1) return 'bg-red-500';
    if (strength === 2 || strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const ReqItem = ({ met, label }) => (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? <Check size={12} /> : <X size={12} />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="w-full mt-2">
      {password.length > 0 && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-500">Password Strength</span>
          <span className={`text-xs font-bold ${strength >= 4 ? 'text-green-600' : strength >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
            {getStrengthLabel()}
          </span>
        </div>
      )}
      <div className="flex gap-1 h-1.5 mb-3">
        {[1, 2, 3, 4].map(level => (
          <div 
            key={level} 
            className={`flex-1 rounded-full transition-colors duration-300 ${password.length > 0 && strength >= level ? getStrengthColor() : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-y-1">
        <ReqItem met={requirements.length} label="10+ characters" />
        <ReqItem met={requirements.uppercase} label="Uppercase letter" />
        <ReqItem met={requirements.lowercase} label="Lowercase letter" />
        <ReqItem met={requirements.number} label="Number" />
        <ReqItem met={requirements.special} label="Special character" />
      </div>
    </div>
  );
}