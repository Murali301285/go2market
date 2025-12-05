import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import type { Lead } from '../../types';

interface RegionPerformanceChartProps {
    leads: Lead[];
}

const RegionPerformanceChart: React.FC<RegionPerformanceChartProps> = ({ leads }) => {
    // Process data
    const regionMap = new Map<string, any>();

    leads.forEach(lead => {
        const region = lead.regionName || 'Unknown';
        if (!regionMap.has(region)) {
            regionMap.set(region, {
                name: region,
                TotalLeads: 0,
                DemoShowed: 0,
                Negotiation: 0,
                Converted: 0,
                Cancelled: 0,
            });
        }
        const data = regionMap.get(region);
        data.TotalLeads++;
        if (lead.stage === 'DEMO_SHOWED') data.DemoShowed++;
        if (lead.stage === 'NEGOTIATION') data.Negotiation++;
        if (lead.status === 'CONVERTED') data.Converted++;
        if (lead.status === 'CANCELLED') data.Cancelled++;
    });

    const data = Array.from(regionMap.values());

    return (
        <Paper sx={{ p: 3, height: '100%', minHeight: 450 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
                Region Performance
            </Typography>
            <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="TotalLeads" fill="#1976d2" name="Total Leads" />
                        <Bar dataKey="DemoShowed" fill="#9c27b0" name="Demo Showed" />
                        <Bar dataKey="Negotiation" fill="#ed6c02" name="Negotiation" />
                        <Bar dataKey="Converted" fill="#2e7d32" name="Converted" />
                        <Bar dataKey="Cancelled" fill="#d32f2f" name="Cancelled" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default RegionPerformanceChart;
