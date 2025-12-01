import React, { useEffect, useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, IconButton, Chip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { getPoolLeads } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const GeneralPool: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const data = await getPoolLeads();
                setLeads(data);
            } catch (error) {
                console.error("Failed to fetch pool leads", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, []);

    if (loading) return <PageLoading />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                General Pool
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Leads available to claim.
            </Typography>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="pool table">
                    <TableHead>
                        <TableRow>
                            <TableCell>School Name</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No leads in the pool.</TableCell>
                            </TableRow>
                        ) : (
                            leads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    hover
                                    onClick={() => navigate(`/user/leads/${lead.id}`)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                        {lead.schoolName}
                                    </TableCell>
                                    <TableCell>{lead.regionName}</TableCell>
                                    <TableCell>{lead.address}</TableCell>
                                    <TableCell>
                                        <Chip label="POOL" color="default" size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small">
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default GeneralPool;
