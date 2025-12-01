import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Paper, Typography, Box } from '@mui/material';
import type { Lead, User } from '../../types';

interface UserPerformanceChartProps {
    leads: Lead[];
    users: User[];
}

const UserPerformanceChart: React.FC<UserPerformanceChartProps> = ({ leads, users }) => {
    // Process data
    const data = users
        .filter(u => u.role !== 'admin') // Exclude admins usually, or keep if needed
        .map(user => {
            const userLeads = leads.filter(l => l.assignedToUserId === user.id || l.createdBy === user.id);

            return {
                name: user.fullName,
                LeadsGenerated: userLeads.filter(l => l.stage === 'NEW' || l.status === 'PENDING').length,
                DemoShowed: userLeads.filter(l => l.stage === 'DEMO_SHOWED').length,
                QuotationSent: userLeads.filter(l => l.stage === 'QUOTATION_SENT').length,
                Negotiation: userLeads.filter(l => l.stage === 'NEGOTIATION').length,
                Converted: userLeads.filter(l => l.status === 'CONVERTED').length,
                Cancelled: userLeads.filter(l => l.status === 'CANCELLED').length,
                Expired: userLeads.filter(l => l.stage === 'EXPIRED').length,
            };
        })
        .filter(item => (
            item.LeadsGenerated + item.DemoShowed + item.QuotationSent +
            item.Negotiation + item.Converted + item.Cancelled + item.Expired > 0
        )); // Only show users with activity

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
                User Performance
            </Typography>
            <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="LeadsGenerated" stackId="a" fill="#0d47a1" name="Leads Generated" />
                        <Bar dataKey="DemoShowed" stackId="a" fill="#2196f3" name="Demo Showed" />
                        <Bar dataKey="QuotationSent" stackId="a" fill="#7b1fa2" name="Quotation Sent" />
                        <Bar dataKey="Negotiation" stackId="a" fill="#ba68c8" name="Negotiation" />
                        <Bar dataKey="Converted" stackId="a" fill="#2e7d32" name="Converted" />
                        <Bar dataKey="Cancelled" stackId="a" fill="#d32f2f" name="Cancelled" />
                        <Bar dataKey="Expired" stackId="a" fill="#616161" name="Expired" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default UserPerformanceChart;
