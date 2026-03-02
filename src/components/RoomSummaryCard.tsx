import React from 'react';
import type { ProductDetails } from '../types';
import { formatCurrency } from '../utils/calculations';
import { DoorOpen } from 'lucide-react';

interface RoomSummaryCardProps {
    products: ProductDetails[];
    includeGST: boolean;
    gstPercentage: number;
}

export const RoomSummaryCard: React.FC<RoomSummaryCardProps> = ({
    products,
    includeGST,
    gstPercentage,
}) => {
    // Group products by room
    const roomMap: Record<string, ProductDetails[]> = {};
    for (const p of products) {
        const key = p.room?.trim() || 'Unassigned';
        if (!roomMap[key]) roomMap[key] = [];
        roomMap[key].push(p);
    }

    const rooms = Object.keys(roomMap);

    if (products.length === 0 || rooms.length === 0) return null;

    // Use rate*qty - discountAmount per product — same formula as calculateQuoteTotals
    const roomTotals = rooms.map(room => ({
        room,
        subtotal: roomMap[room].reduce((s, p) => s + (p.rate * p.quantity - p.discountAmount), 0),
    }));

    const grandSubtotal = roomTotals.reduce((s, r) => s + r.subtotal, 0);
    const gstAmount = includeGST ? grandSubtotal * (gstPercentage / 100) : 0;
    const grandTotal = grandSubtotal + gstAmount;

    // If only "Unassigned" and nothing else, don't show the card
    if (rooms.length === 1 && rooms[0] === 'Unassigned') return null;

    return (
        <div className="liquid-glass-warm p-4 animate-fade-in-up stagger-3 animate-hover-lift">
            <h3 className="font-bold text-secondary mb-3 uppercase tracking-tight text-sm flex items-center gap-2">
                <DoorOpen size={16} className="text-secondary" />
                Room Summary
            </h3>

            <div className="space-y-1.5">
                {roomTotals.map(({ room, subtotal }) => (
                    <div key={room} className="flex justify-between items-center text-xs">
                        <span
                            className="text-muted font-medium truncate mr-2"
                            style={{ maxWidth: '65%' }}
                        >
                            {room}
                        </span>
                        <span className="font-bold text-primary whitespace-nowrap">
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-3 pt-3 border-t border-current border-opacity-10 space-y-1">
                {includeGST && (
                    <div className="flex justify-between text-xs text-muted">
                        <span>GST ({gstPercentage}%)</span>
                        <span className="font-semibold">{formatCurrency(gstAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">Grand Total</span>
                    <span className="text-sm font-bold text-secondary">{formatCurrency(grandTotal)}</span>
                </div>
            </div>
        </div>
    );
};
