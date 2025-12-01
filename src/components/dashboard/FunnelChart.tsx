import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { Lead } from '../../types';

interface FunnelChartProps {
    leads: Lead[];
    title?: string;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ leads, title = 'Sales Funnel' }) => {
    // Calculate funnel metrics
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
    const converted = leads.filter(l => l.stage === 'CONVERTED').length;

    const stages = [
        { label: 'Lead', value: totalLeads, color: '#3b82f6', width: 100 },
        { label: 'Demo', value: demoShowed, color: '#8b5cf6', width: 75 },
        { label: 'Quotation', value: quotationSent, color: '#f59e0b', width: 55 },
        { label: 'Negotiation', value: inNegotiation, color: '#10b981', width: 40 },
        { label: 'Converted', value: converted, color: '#22c55e', width: 25 },
    ];

    console.log('FunnelChart rendering with stages:', stages);

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
                                    ? 'polygon(0 0, 100% 0, 50% 100%)'  // Triangle for last stage
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
                                <Typography variant="h5" fontWeight="bold">
                                    {stage.value}
                                </Typography>
                            </Box>

                            {/* Label on the right side */}
                            <Box sx={{
                                position: 'absolute',
                                right: `-${120 - stage.width}px`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                whiteSpace: 'nowrap',
                                color: 'text.primary',
                                fontWeight: 500,
                                fontSize: '0.95rem'
                            }}>
                                {stage.label}({stage.value})
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default FunnelChart;
