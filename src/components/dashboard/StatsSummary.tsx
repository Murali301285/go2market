import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import LockIcon from '@mui/icons-material/Lock';

interface StatCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, color }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">
                {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>
                {count}
            </Typography>
        </Box>
        <Box sx={{
            bgcolor: `${color}20`,
            p: 1,
            borderRadius: '50%',
            display: 'flex',
            color: color
        }}>
            {icon}
        </Box>
    </Paper>
);

interface StatsSummaryProps {
    stats: {
        total: number;
        active: number;
        negotiation: number;
        demoShowed: number;
        converted: number;
        cancelled: number;
    };
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ stats }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Total Leads"
                    count={stats.total}
                    icon={<AssignmentIcon />}
                    color="#1976d2"
                />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Active"
                    count={stats.active}
                    icon={<LockIcon />}
                    color="#0288d1"
                />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Negotiation"
                    count={stats.negotiation}
                    icon={<HandshakeIcon />}
                    color="#ed6c02"
                />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Demo Showed"
                    count={stats.demoShowed}
                    icon={<SlideshowIcon />}
                    color="#9c27b0"
                />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Converted"
                    count={stats.converted}
                    icon={<CheckCircleIcon />}
                    color="#2e7d32"
                />
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
                <StatCard
                    title="Cancelled"
                    count={stats.cancelled}
                    icon={<CancelIcon />}
                    color="#d32f2f"
                />
            </Box>
        </Box>
    );
};

export default StatsSummary;
