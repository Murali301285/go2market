import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { Lead } from '../../types';

interface SalesFunnelProps {
    leads: Lead[];
    title?: string;
}

const SalesFunnel: React.FC<SalesFunnelProps> = ({ leads, title = 'Conversion Funnel' }) => {
    console.log('🎯 SalesFunnel RENDERING');
    console.log('📊 Leads received:', leads);
    console.log('📊 Leads count:', leads.length);

    // Calculate funnel metrics - with fallback for leads without stage field
    const totalLeads = leads.length;
    const demoShowed = leads.filter(l =>
        l.stage === 'DEMO_SHOWED' ||
        l.stage === 'QUOTATION_SENT' ||
        l.stage === 'NEGOTIATION' ||
        l.stage === 'CONVERTED'
    ).length;
    const quotationSent = leads.filter(l =>
        l.stage === 'QUOTATION_SENT' ||
        l.stage === 'NEGOTIATION' ||
        l.stage === 'CONVERTED'
    ).length;
    const inNegotiation = leads.filter(l =>
        l.stage === 'NEGOTIATION' ||
        l.stage === 'CONVERTED'
    ).length;
    const converted = leads.filter(l => l.stage === 'CONVERTED' || l.status === 'CONVERTED').length;

    const stages = [
        { label: 'Lead', value: totalLeads, color: '#3b82f6', width: 100 },
        { label: 'Demo', value: demoShowed, color: '#8b5cf6', width: 75 },
        { label: 'Quotation', value: quotationSent, color: '#f59e0b', width: 55 },
        { label: 'Negotiation', value: inNegotiation, color: '#10b981', width: 40 },
        { label: 'Converted', value: converted, color: '#22c55e', width: 25 },
    ];

    console.log('📈 Funnel stages calculated:', stages);
    console.log('✅ SalesFunnel will render with title:', title);

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="text.primary">
                {title}
            </Typography>

            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                mt: 3,
                mb: 2
            }}>
                {stages.map((stage, index) => {
                    const nextWidth = index < stages.length - 1 ? stages[index + 1].width : stage.width;

                    return (
                        <Box
                            key={stage.label}
                            sx={{
                                position: 'relative',
                                width: `${stage.width}%`,
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                clipPath: index === stages.length - 1
                                    ? 'polygon(0 0, 100% 0, 50% 100%)'
                                    : `polygon(
                                        ${(100 - stage.width) / 2}% 0,
                                        ${100 - (100 - stage.width) / 2}% 0,
                                        ${100 - (100 - nextWidth) / 2}% 100%,
                                        ${(100 - nextWidth) / 2}% 100%
                                    )`,
                                backgroundColor: stage.color,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    opacity: 0.9,
                                    transform: 'scale(1.02)',
                                },
                            }}
                        >
                            <Box sx={{
                                textAlign: 'center',
                                color: 'white',
                                zIndex: 1,
                                pt: index === stages.length - 1 ? 2 : 0
                            }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                    {stage.label}
                                </Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    {stage.value}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default SalesFunnel;
