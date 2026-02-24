import type { ProductDetails, QuoteCalculations } from '../types';

export const calculateProductTotals = (
    quantity: number,
    rate: number,
    discountPercentage: number
): { amountBeforeDiscount: number; discountAmount: number; finalAmount: number } => {
    const amountBeforeDiscount = quantity * rate;
    const discountAmount = amountBeforeDiscount * (discountPercentage / 100);
    const finalAmount = amountBeforeDiscount - discountAmount;

    return {
        amountBeforeDiscount,
        discountAmount,
        finalAmount,
    };
};

export const calculateQuoteTotals = (
    products: ProductDetails[],
    discountMode: 'INDIVIDUAL' | 'COMMON' | 'GLOBAL',
    globalDiscountValue: number, // percentage for COMMON, amount for GLOBAL
    includeGST: boolean = true,
    gstPercentage: number = 18
): QuoteCalculations => {
    let grossSubtotal = 0;
    let totalItemDiscountAmount = 0;

    products.forEach(product => {
        grossSubtotal += product.rate * product.quantity;
        if (discountMode === 'INDIVIDUAL' || discountMode === 'COMMON') {
            totalItemDiscountAmount += product.discountAmount;
        }
    });

    const subtotal = grossSubtotal - totalItemDiscountAmount;

    let globalDiscountAmount = 0;
    let globalDiscountPercentage = 0;

    if (discountMode === 'GLOBAL') {
        globalDiscountAmount = globalDiscountValue;
        globalDiscountPercentage = subtotal > 0 ? (globalDiscountAmount / subtotal) * 100 : 0;
    } else if (discountMode === 'COMMON') {
        globalDiscountPercentage = globalDiscountValue;
        // In COMMON mode, item discounts are already calculated using this percentage
    }

    const taxableAmount = Math.max(0, subtotal - globalDiscountAmount);

    const totalDiscountAmount = totalItemDiscountAmount + globalDiscountAmount;
    const effectiveDiscountPercentage = grossSubtotal > 0
        ? (totalDiscountAmount / grossSubtotal) * 100
        : 0;

    // Split GST in half for CGST and SGST
    const halfGst = gstPercentage / 2 / 100;
    const cgstAmount = includeGST ? taxableAmount * halfGst : 0;
    const sgstAmount = includeGST ? taxableAmount * halfGst : 0;
    const totalGstAmount = cgstAmount + sgstAmount;

    const grandTotal = taxableAmount + totalGstAmount;

    return {
        grossSubtotal,
        totalItemDiscountAmount,
        subtotal,
        globalDiscountPercentage,
        globalDiscountAmount,
        effectiveDiscountPercentage,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        totalGstAmount,
        grandTotal,
    };
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

export const formatCurrencySimple = (amount: number): string => {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
