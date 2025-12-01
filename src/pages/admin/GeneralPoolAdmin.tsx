import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Chip, Card, CardContent, CardActions,
    InputAdornment, IconButton, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as XLSX from 'xlsx';
import { getPoolLeads } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import { useNavigate } from 'react-router-dom';

const GeneralPoolAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Apply search filter
    const filteredLeads = leads.filter(lead => {
        if (!searchQuery) return true;
        return lead.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.contactPhone.includes(searchQuery) ||
            lead.regionName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleExportExcel = () => {
        const exportData = filteredLeads.map(lead => ({
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Contact Person': lead.contactPerson,
            'Phone': lead.contactPhone,
            'Email': lead.contactEmail || 'N/A',
            'Address': lead.address,
            'Stage': lead.stage,
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
            'Is Chain': lead.isChain ? 'Yes' : 'No',
            'Chain Name': lead.chainName || 'N/A',
            'Remarks': lead.remarks
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pool Leads');
        XLSX.writeFile(wb, `g2M_Pool_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExportCSV = () => {
        const exportData = filteredLeads.map(lead => ({
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Contact Person': lead.contactPerson,
            'Phone': lead.contactPhone,
            'Email': lead.contactEmail || 'N/A',
            'Address': lead.address,
            'Stage': lead.stage,
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `g2M_Pool_Leads_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'CONVERTED': return 'success';
            case 'NEGOTIATION': return 'info';
            case 'QUOTATION_SENT': return 'primary';
            case 'DEMO_SHOWED': return 'secondary';
            case 'CANCELLED': return 'error';
            case 'EXPIRED': return 'default';
            default: return 'default';
        }
    };

    if (loading) return <PageLoading message="Loading pool leads..." />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4">General Pool - Admin View</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Available leads that can be claimed by distributors
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportExcel}
                    >
                        Export Excel
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search by school, contact, phone, or region..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Showing {filteredLeads.length} of {leads.length} pool leads
                </Typography>
            </Paper>

            {/* Statistics */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{leads.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Pool Leads</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                        {leads.filter(l => l.stage === 'NEW').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">New Leads</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                        {leads.filter(l => l.stage === 'CONTACTED' || l.stage === 'DEMO_SCHEDULED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">In Progress</Typography>
                </Paper>
                <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                        {leads.filter(l => l.stage === 'EXPIRED').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Expired</Typography>
                </Paper>
            </Box>

            {/* Leads Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
                {filteredLeads.map((lead) => (
                    <Card key={lead.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" component="div" noWrap>
                                    {lead.schoolName}
                                </Typography>
                                <Chip
                                    label="POOL"
                                    color="default"
                                    size="small"
                                />
                            </Box>

                            <Chip
                                label={lead.stage.replace('_', ' ')}
                                color={getStageColor(lead.stage)}
                                size="small"
                                sx={{ mb: 1 }}
                            />

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📍 {lead.regionName}
                            </Typography>

                            <Typography variant="body2" gutterBottom>
                                👤 {lead.contactPerson}
                            </Typography>

                            <Typography variant="body2" gutterBottom>
                                📞 {lead.contactPhone}
                            </Typography>

                            {lead.contactEmail && (
                                <Typography variant="body2" gutterBottom noWrap>
                                    ✉️ {lead.contactEmail}
                                </Typography>
                            )}

                            {lead.isChain && (
                                <Chip
                                    label={`Chain: ${lead.chainName}`}
                                    size="small"
                                    color="secondary"
                                    sx={{ mt: 1 }}
                                />
                            )}

                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Created: {new Date(lead.createdAt).toLocaleDateString()}
                            </Typography>

                            {lead.remarks && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Note: {lead.remarks}
                                </Typography>
                            )}
                        </CardContent>

                        <CardActions>
                            <Tooltip title="View Details">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => navigate(`/user/leads/${lead.id}`)}
                                >
                                    <VisibilityIcon />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                ))}
            </Box>

            {filteredLeads.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        {searchQuery ? 'No pool leads found matching your search' : 'No leads in the general pool'}
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default GeneralPoolAdmin;
