import React, { useEffect, useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, Chip, IconButton, TextField, MenuItem, Select, FormControl,
    InputLabel, Button, TablePagination, InputAdornment, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../../hooks/useAuth';
import { getLeadsByUserId } from '../../services/leadService';
import type { Lead } from '../../types';
import PageLoading from '../../components/common/PageLoading';
import { getStageColor } from '../../utils/colors';

const MyLeads: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data State
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
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
                    const assigned = await getLeadsByUserId(user.uid);
                    setLeads(assigned);
                } catch (error: unknown) {
                    console.error("Failed to fetch leads", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchLeads();
    }, [user]);

    // Stats Calculation
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'CONVERTED');
    const failedLeads = leads.filter(l => l.status === 'CANCELLED');
    const conversionRate = totalLeads > 0 ? ((convertedLeads.length / totalLeads) * 100).toFixed(1) : '0';

    // Avg Conversion Days
    let totalDays = 0;
    let countWithDays = 0;
    convertedLeads.forEach(lead => {
        const convertedUpdate = lead.updates?.find(u => u.status === 'CONVERTED');
        if (convertedUpdate) {
            const days = (convertedUpdate.timestamp - lead.createdAt) / (1000 * 60 * 60 * 24);
            totalDays += days;
            countWithDays++;
        }
    });
    const avgConversionDays = countWithDays > 0 ? (totalDays / countWithDays).toFixed(1) : 'N/A';

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

    // Filtering logic
    const filteredLeads = leads.filter(lead => {
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

    const StatBox = ({ title, value, icon, color }: any) => (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
            <Box>
                <Typography variant="body2" color="text.secondary">{title}</Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color }}>{value}</Typography>
            </Box>
            <Box sx={{ p: 1, borderRadius: '50%', bgcolor: `${color}20`, color }}>
                {icon}
            </Box>
        </Paper>
    );

    return (
        <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                My Leads
            </Typography>

            {/* Stats Header */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                    <StatBox title="Assigned" value={totalLeads} icon={<AssignmentIcon />} color="#1976d2" />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                    <StatBox title="Converted" value={convertedLeads.length} icon={<CheckCircleIcon />} color="#2e7d32" />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                    <StatBox title="Failed" value={failedLeads.length} icon={<CancelIcon />} color="#d32f2f" />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                    <StatBox title="Conversion Rate" value={`${conversionRate}%`} icon={<TrendingUpIcon />} color="#ed6c02" />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                    <StatBox title="Avg Conv. Days" value={avgConversionDays} icon={<AccessTimeIcon />} color="#9c27b0" />
                </Box>
            </Box>

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
                            <TableCell>Sl No</TableCell>
                            <TableCell>School Name</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>Contact Person</TableCell>
                            <TableCell>Phone</TableCell>
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
                            paginatedLeads.map((lead, index) => (
                                <TableRow
                                    key={lead.id}
                                    hover
                                    onClick={() => navigate(`/leads/${lead.id}`)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell>
                                        {page * rowsPerPage + index + 1}
                                    </TableCell>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                        {lead.schoolName}
                                    </TableCell>
                                    <TableCell>{lead.regionName}</TableCell>
                                    <TableCell>{lead.contactPerson}</TableCell>
                                    <TableCell>{lead.contactPhone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={lead.stage}
                                            size="small"
                                            sx={{ bgcolor: getStageColor(lead.stage), color: 'white' }}
                                            variant="filled"
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
