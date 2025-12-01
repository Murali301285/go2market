import React, { useEffect, useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Chip, IconButton, Tabs, Tab, TextField, MenuItem, Select, FormControl,
    InputLabel, Button, TablePagination, InputAdornment, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../../hooks/useAuth';
import { getLeadsByUserId, getLeadsCreatedByUser } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';

const MyLeads: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [createdLeads, setCreatedLeads] = useState<Lead[]>([]);
    const [assignedLeads, setAssignedLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        const fetchLeads = async () => {
            if (user) {
                try {
                    const [created, assigned] = await Promise.all([
                        getLeadsCreatedByUser(user.uid),
                        getLeadsByUserId(user.uid)
                    ]);
                    setCreatedLeads(created);
                    setAssignedLeads(assigned);
                } catch (error: unknown) {
                    console.error("Failed to fetch leads", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchLeads();
    }, [user]);

    // Helper functions
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Waiting for Approval';
            case 'LOCKED': return 'Active';
            case 'POOL': return 'In General Pool';
            case 'CONVERTED': return 'Converted';
            case 'CANCELLED': return 'Cancelled';
            case 'EXPIRED': return 'Expired';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'LOCKED': return 'info';
            case 'CONVERTED': return 'success';
            case 'CANCELLED': return 'error';
            case 'POOL': return 'default';
            default: return 'default';
        }
    };

    // Filtering logic
    const currentLeads = tabValue === 0 ? createdLeads : assignedLeads;

    const filteredLeads = currentLeads.filter(lead => {
        // Search Filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            lead.schoolName.toLowerCase().includes(searchLower) ||
            lead.contactPerson.toLowerCase().includes(searchLower) ||
            lead.contactPhone.includes(searchLower);

        // Status Filter
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

        // Date Filter
        let matchesDate = true;
        const leadDate = new Date(lead.createdAt).setHours(0, 0, 0, 0);

        if (fromDate) {
            const from = new Date(fromDate).setHours(0, 0, 0, 0);
            matchesDate = matchesDate && leadDate >= from;
        }

        if (toDate) {
            const to = new Date(toDate).setHours(0, 0, 0, 0);
            matchesDate = matchesDate && leadDate <= to;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination logic
    const paginatedLeads = rowsPerPage > 0
        ? filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : filteredLeads;

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleExport = () => {
        const exportData = filteredLeads.map(lead => ({
            'School Name': lead.schoolName,
            'Region': lead.regionName,
            'Contact Person': lead.contactPerson,
            'Phone': lead.contactPhone,
            'Status': getStatusLabel(lead.status),
            'Stage': lead.stage,
            'Created Date': new Date(lead.createdAt).toLocaleDateString(),
            'Address': lead.address,
            'ZIP Code': lead.zipCode
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, `My_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) return <PageLoading />;

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                My Leads
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_e, v) => { setTabValue(v); setPage(0); }}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab label={`My Created Leads (${createdLeads.length})`} />
                    <Tab label={`Assigned to Me (${assignedLeads.length})`} />
                </Tabs>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ flexGrow: 2, minWidth: { xs: '100%', md: '250px' } }}>
                        <TextField
                            fullWidth
                            placeholder="Search school, contact, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: { xs: '45%', md: '120px' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="PENDING">Waiting Approval</MenuItem>
                                <MenuItem value="LOCKED">Active</MenuItem>
                                <MenuItem value="CONVERTED">Converted</MenuItem>
                                <MenuItem value="POOL">In Pool</MenuItem>
                                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: { xs: '45%', md: '120px' } }}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: { xs: '45%', md: '120px' } }}>
                        <TextField
                            fullWidth
                            label="To Date"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flexGrow: 0, minWidth: { xs: '100%', sm: 'auto' } }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleExport}
                            sx={{ height: '40px' }}
                        >
                            Export
                        </Button>
                    </Box>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="leads table">
                    <TableHead>
                        <TableRow>
                            <TableCell>School Name</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Contact Person</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedLeads.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No leads found matching your filters.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedLeads.map((lead) => (
                                <TableRow
                                    key={lead.id}
                                    hover
                                    onClick={() => navigate(`/leads/${lead.id}`)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                        {lead.schoolName}
                                    </TableCell>
                                    <TableCell>{lead.regionName}</TableCell>
                                    <TableCell>{lead.contactPerson}</TableCell>
                                    <TableCell>{lead.contactPhone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(lead.status)}
                                            color={getStatusColor(lead.status) as any}
                                            size="small"
                                            variant={lead.status === 'PENDING' ? 'outlined' : 'filled'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={lead.stage}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderColor: 'divider' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(lead.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Details">
                                            <IconButton size="small" color="primary">
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 20, 50, { label: 'All', value: -1 }]}
                    component="div"
                    count={filteredLeads.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
};

export default MyLeads;
