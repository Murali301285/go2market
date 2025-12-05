import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Paper, Typography } from '@mui/material';

interface DataPoint {
    name: string;
    value: number;
}

interface AdminBarChartProps {
    data: DataPoint[];
    title: string;
}

const AdminBarChart: React.FC<AdminBarChartProps> = ({ data, title }) => {
    return (
        <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>{title}</Typography>
            {/* Explicit fixed height for the chart container to avoid Recharts 'height(-1)' error */}
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Paper>
    );
};

export default AdminBarChart;
