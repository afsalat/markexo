'use client';

import { CheckCircle } from 'lucide-react';

interface ProductBenefitsProps {
    benefits?: string[];
    className?: string;
}

export default function ProductBenefits({ benefits = [], className = '' }: ProductBenefitsProps) {
    if (!benefits || benefits.length === 0) {
        return null;
    }

    return (
        <div className={`product-benefits ${className}`}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-accent-500" />
                Key Benefits
            </h3>
            <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                    <li 
                        key={index} 
                        className="flex items-start gap-3 text-gray-700 dark:text-silver-300"
                    >
                        <span className="text-accent-500 mt-0.5 flex-shrink-0">✅</span>
                        <span className="text-sm leading-relaxed">{benefit}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
