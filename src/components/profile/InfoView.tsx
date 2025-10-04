
'use client';

import { motion } from 'framer-motion';
import {
    Card, CardContent, CardHeader, CardTitle, CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';

interface InfoViewProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

const OverlayView = ({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) => (
    <motion.div
        key={title}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <Card className="max-h-[80vh]">{children}</Card>
        </motion.div>
    </motion.div>
);

export const InfoView = ({ title, children, onClose }: InfoViewProps) => {
    return (
        <OverlayView onClose={onClose} title={title}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            <CardFooter>
                <Button variant="ghost" onClick={onClose} className="w-full">Volver</Button>
            </CardFooter>
        </OverlayView>
    );
};
