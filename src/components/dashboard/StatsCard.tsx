import React from 'react';
import { Paper, Typography } from '@mui/material';

interface StatsCardProps {
    title: string;
    value: number | string;
    color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, color = 'primary.main' }) => {
    return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>
                {value}
            </Typography>
        </Paper>
    );
};

export default StatsCard;
