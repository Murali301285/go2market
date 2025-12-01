import React, { useState, useEffect, useRef, forwardRef } from 'react';
import {
    Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
    Tooltip, LinearProgress, TablePagination, InputAdornment,
    Select, FormControl, InputLabel, TableSortLabel
} from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { CloudUpload, Delete, Edit, Download, Cancel, Search, SaveAlt, RestartAlt } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getUsers } from '../../services/userService';
import { getRegions } from '../../services/regionService';
import type { User, Region, BulkUploadRow, Lead } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const libraries: ("places")[] = ["places"];

// Wrapper to forward ref to the actual input element for Google Autocomplete
const AutocompleteInput = forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => {
    return <TextField {...props} inputRef={ref} />;
});

const BulkUpload: React.FC = () => {
    const { userProfile } = useAuth();
    const [rows, setRows] = useState<BulkUploadRow[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const cancelRef = useRef(false);

    // Pagination, Filter & Sort State
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('');

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<BulkUploadRow | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [rowToDelete, setRowToDelete] = useState<string | null>(null);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersData, regionsData] = await Promise.all([
                    getUsers(),
                    getRegions()
                ]);
                setUsers(usersData);
                setRegions(regionsData);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchData();
    }, []);

    // --- Actions ---

    const handleDownloadTemplate = () => {
        const headers = [['Contact Person', 'School Name', 'Designation', 'Incharge Person']];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(headers);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'lead_upload_template.xlsx');
    };

    const handleExportData = () => {
        const dataToExport = rows.map((row, index) => ({
            'SNo': index + 1,
            'School Name': row.verifiedData.schoolName,
            'Original School Name': row.originalData.schoolName,
            'Address': row.verifiedData.address,
            'Zip Code': row.verifiedData.zipCode,
            'Region': row.verifiedData.regionName,
            'Contact Person': row.verifiedData.contactPerson,
            'Designation': row.verifiedData.designation,
            'Contact Phone': row.verifiedData.contactPhone,
            'Incharge': row.verifiedData.assignedToUserName,
            'Status': row.status,
            'Message': row.message
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Bulk_Upload_Data');
        XLSX.writeFile(wb, `bulk_upload_export_${new Date().getTime()}.xlsx`);
    };

    const handleClearData = () => {
        if (rows.length > 0 && !window.confirm('Are you sure you want to clear all data?')) {
            return;
        }
        setRows([]);
        setPage(0);
        setSearchQuery('');
        setStatusFilter('ALL');
        setOrderBy('');
        setOrder('asc');
    };

    const handleCancel = () => {
        cancelRef.current = true;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset data before new upload
        setRows([]);
        setPage(0);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Skip header row (assuming row 0 is header)
            const rowsData = data.slice(1).map((row: any, index) => {
                // Map columns: A=Name, B=School, C=Designation, D=Incharge
                const contactPerson = row[0] || '';
                const schoolName = row[1] || '';
                const designation = row[2] || '';
                const inchargeName = row[3] || '';

                if (!schoolName) return null; // Skip empty rows

                return {
                    id: `row-${Date.now()}-${index}`,
                    originalData: { contactPerson, schoolName, designation, inchargePersonName: inchargeName },
                    verifiedData: {
                        schoolName: schoolName,
                        address: '',
                        zipCode: '',
                        landmark: '',
                        regionId: '',
                        regionName: '',
                        contactPerson: contactPerson,
                        designation: designation,
                        contactPhone: '00000 00000',
                        contactEmail: '',
                        assignedToUserId: '',
                        assignedToUserName: '',
                    },
                    status: 'PENDING',
                    uploadDate: Date.now()
                } as BulkUploadRow;
            }).filter(Boolean) as BulkUploadRow[];

            setRows(rowsData);
            // Start verification process
            verifyRows(rowsData);
        };
        reader.readAsBinaryString(file);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const verifyRows = async (initialRows: BulkUploadRow[]) => {
        setProcessing(true);
        cancelRef.current = false;
        const placesService = new google.maps.places.PlacesService(document.createElement('div'));
        const autocompleteService = new google.maps.places.AutocompleteService();

        const updatedRows = [...initialRows];

        for (let i = 0; i < updatedRows.length; i++) {
            if (cancelRef.current) {
                setProcessing(false);
                return;
            }

            setProgress(Math.round(((i + 1) / updatedRows.length) * 100));
            const row = updatedRows[i];

            // 1. User Lookup
            const inchargeUser = users.find(u =>
                u.fullName.toLowerCase() === row.originalData.inchargePersonName.toLowerCase() ||
                u.email.toLowerCase() === row.originalData.inchargePersonName.toLowerCase()
            );

            if (inchargeUser) {
                row.verifiedData.assignedToUserId = inchargeUser.id;
                row.verifiedData.assignedToUserName = inchargeUser.fullName;

                // Region Logic
                if (inchargeUser.assignedRegions && inchargeUser.assignedRegions.length === 1) {
                    const region = regions.find(r => r.id === inchargeUser.assignedRegions[0]);
                    if (region) {
                        row.verifiedData.regionId = region.id;
                        row.verifiedData.regionName = region.name;
                    }
                } else if (!inchargeUser.assignedRegions || inchargeUser.assignedRegions.length === 0) {
                    row.status = 'ERROR';
                    row.message = 'User has no assigned regions';
                } else {
                    // Multiple regions - default to first but mark for review
                    const region = regions.find(r => r.id === inchargeUser.assignedRegions[0]);
                    if (region) {
                        row.verifiedData.regionId = region.id;
                        row.verifiedData.regionName = region.name;
                        row.message = 'Multiple regions assigned - Defaulted to first';
                    }
                }
            } else {
                row.status = 'USER_NOT_FOUND';
                row.message = `User '${row.originalData.inchargePersonName}' not found`;
            }

            // 2. Google Verification (Using Autocomplete Logic + Region Filtering)
            if (row.status !== 'USER_NOT_FOUND') {
                try {
                    await new Promise<void>((resolve) => {
                        autocompleteService.getPlacePredictions({ input: row.originalData.schoolName }, (predictions, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {

                                let targetPrediction: google.maps.places.AutocompletePrediction | null = null;
                                let matchMessage = '';

                                if (predictions.length === 1) {
                                    // Exact 1 match
                                    targetPrediction = predictions[0];
                                } else {
                                    // Multiple matches - Strategy:
                                    // 1. Filter by Region
                                    // 2. If still multiple, Filter by Exact Name Match

                                    let candidates = predictions;

                                    // Filter by Region if available
                                    if (row.verifiedData.regionName) {
                                        const regionNameLower = row.verifiedData.regionName.toLowerCase();
                                        const regionMatches = predictions.filter(p =>
                                            p.description.toLowerCase().includes(regionNameLower)
                                        );
                                        // Only narrow down if we actually found region matches
                                        if (regionMatches.length > 0) {
                                            candidates = regionMatches;
                                        }
                                    }

                                    // Check results after Region filter
                                    if (candidates.length === 1) {
                                        targetPrediction = candidates[0];
                                        matchMessage = ' (Auto-selected via Region)';
                                    } else if (candidates.length > 1) {
                                        // Still multiple? Try Exact Name Match
                                        const inputNameLower = row.originalData.schoolName.toLowerCase().trim();
                                        const exactMatches = candidates.filter(p =>
                                            p.structured_formatting.main_text.toLowerCase() === inputNameLower
                                        );

                                        if (exactMatches.length === 1) {
                                            targetPrediction = exactMatches[0];
                                            matchMessage = ' (Auto-selected via Region + Exact Name)';
                                        }
                                    }
                                }

                                if (targetPrediction) {
                                    // Fetch Details for the selected prediction
                                    placesService.getDetails({
                                        placeId: targetPrediction.place_id,
                                        fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components', 'formatted_phone_number']
                                    }, (place, detailStatus) => {
                                        if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place) {
                                            row.verifiedData.schoolName = place.name || row.originalData.schoolName;
                                            row.verifiedData.address = place.formatted_address || '';
                                            row.verifiedData.googlePlaceId = place.place_id || '';

                                            // Map Phone Number if available
                                            if (place.formatted_phone_number) {
                                                row.verifiedData.contactPhone = place.formatted_phone_number;
                                            }

                                            // Extract Zip & Landmark
                                            const zipComponent = place.address_components?.find(c => c.types.includes('postal_code'));
                                            if (zipComponent) {
                                                row.verifiedData.zipCode = zipComponent.long_name;
                                            } else {
                                                const zipMatch = place.formatted_address?.match(/\b\d{6}\b/);
                                                if (zipMatch) row.verifiedData.zipCode = zipMatch[0];
                                            }

                                            row.status = 'VERIFIED';
                                            if (matchMessage) row.message = 'Verified' + matchMessage;
                                        } else {
                                            row.status = 'ERROR';
                                            row.message = 'Details fetch failed';
                                        }
                                        resolve();
                                    });
                                } else {
                                    row.status = 'MULTIPLE_MATCHES';
                                    row.message = `Found ${predictions.length} matches - Please refine`;
                                    resolve();
                                }
                            } else {
                                row.status = 'NO_MATCH';
                                row.message = 'No suggestions found';
                                resolve();
                            }
                        });
                    });
                } catch (e) {
                    console.error("Google verify error", e);
                    row.status = 'ERROR';
                    row.message = 'Google verification failed';
                }
            }

            // 3. Duplicate Check (if verified)
            if (row.status === 'VERIFIED') {
                const q = query(
                    collection(db, 'leads'),
                    where('schoolName', '==', row.verifiedData.schoolName),
                    where('zipCode', '==', row.verifiedData.zipCode)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const existingLead = querySnapshot.docs[0].data() as Lead;
                    if (existingLead.stage === 'NEW') {
                        row.status = 'DUPLICATE'; // We will handle update logic in upload
                        row.message = 'Lead exists (NEW stage) - Will Update';
                    } else {
                        row.status = 'DUPLICATE';
                        row.message = `Lead exists (${existingLead.stage}) - Will Skip`;
                    }
                }
            }

            // Artificial delay to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        }

        setRows(updatedRows);
        setProcessing(false);
    };

    const handleUploadAll = async () => {
        setProcessing(true);
        cancelRef.current = false;
        const updatedRows = [...rows];
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < updatedRows.length; i++) {
            if (cancelRef.current) {
                setProcessing(false);
                alert(`Upload Cancelled!\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}`);
                return;
            }

            const row = updatedRows[i];

            // STRICT VALIDATION: Only upload VERIFIED or valid DUPLICATE updates
            const isValid = row.status === 'VERIFIED' || (row.status === 'DUPLICATE' && row.message?.includes('Will Update'));

            if (!isValid) {
                // Skip invalid rows silently or count them as skipped
                failCount++;
                continue;
            }

            try {
                const now = new Date();
                const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

                const leadData = {
                    schoolName: row.verifiedData.schoolName,
                    address: row.verifiedData.address,
                    zipCode: row.verifiedData.zipCode,
                    landmark: row.verifiedData.landmark,
                    regionId: row.verifiedData.regionId,
                    regionName: row.verifiedData.regionName,
                    contactPerson: row.verifiedData.contactPerson,
                    designation: row.verifiedData.designation,
                    contactPhone: row.verifiedData.contactPhone,
                    contactEmail: row.verifiedData.contactEmail,
                    googlePlaceId: row.verifiedData.googlePlaceId,
                    assignedToUserId: row.verifiedData.assignedToUserId,
                    assignedToName: row.verifiedData.assignedToUserName,
                    status: 'LOCKED', // Auto-approved -> LOCKED to the user
                    stage: 'NEW',
                    createdAt: Date.now(),
                    createdBy: row.verifiedData.assignedToUserId, // Lead by -> Same User name (Assigned)
                    remarks: `Added via bulk upload by ${userProfile?.fullName} on ${formattedDate}. Browser: ${navigator.userAgent}`,
                    updates: []
                };

                if (row.status === 'DUPLICATE' && row.message?.includes('Will Update')) {
                    // Find and update
                    const q = query(
                        collection(db, 'leads'),
                        where('schoolName', '==', row.verifiedData.schoolName),
                        where('zipCode', '==', row.verifiedData.zipCode)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        await updateDoc(doc(db, 'leads', snapshot.docs[0].id), leadData);
                        row.status = 'UPLOADED';
                        row.message = 'Updated existing lead';
                    }
                } else {
                    // Create new
                    await addDoc(collection(db, 'leads'), leadData);
                    row.status = 'UPLOADED';
                    row.message = 'Successfully uploaded';
                }
                successCount++;
            } catch (e: any) {
                console.error("Upload error", e);
                row.status = 'ERROR';
                row.message = e.message || 'Upload failed';
                failCount++;
            }
        }

        setRows(updatedRows);
        setProcessing(false);
        alert(`Upload Complete!\nSuccess: ${successCount}\nFailed/Skipped: ${failCount}`);
    };

    // --- Helpers ---

    const getRowColor = (status: string) => {
        switch (status) {
            case 'UPLOADED': return '#e8f5e9'; // Green
            case 'VERIFIED': return '#e3f2fd'; // Blue
            case 'ERROR':
            case 'USER_NOT_FOUND':
            case 'NO_MATCH': return '#ffebee'; // Red
            case 'DUPLICATE': return '#fff3e0'; // Orange
            case 'MULTIPLE_MATCHES': return '#fff8e1'; // Yellow
            default: return 'inherit';
        }
    };

    const handleSaveEdit = () => {
        if (!editingRow) return;

        setRows(prev => prev.map(r => r.id === editingRow.id ? editingRow : r));
        setEditDialogOpen(false);
        setEditingRow(null);
    };

    const handleDeleteClick = (id: string) => {
        setRowToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (rowToDelete) {
            setRows(prev => prev.filter(r => r.id !== rowToDelete));
        }
        setDeleteConfirmOpen(false);
        setRowToDelete(null);
    };

    const onPlaceSelected = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();

            // Ensure a valid place was selected
            if (!place.geometry) {
                return;
            }

            setEditingRow(prev => {
                if (!prev) return null;

                const newData = { ...prev.verifiedData };
                newData.schoolName = place.name || newData.schoolName;
                newData.address = place.formatted_address || '';
                newData.googlePlaceId = place.place_id;

                // Map Phone Number if available
                if (place.formatted_phone_number) {
                    newData.contactPhone = place.formatted_phone_number;
                }

                // Extract Zip Code
                const zipComponent = place.address_components?.find(c => c.types.includes('postal_code'));
                if (zipComponent) {
                    newData.zipCode = zipComponent.long_name;
                } else {
                    // Fallback regex
                    const zipMatch = place.formatted_address?.match(/\b\d{6}\b/);
                    if (zipMatch) newData.zipCode = zipMatch[0];
                }

                return {
                    ...prev,
                    verifiedData: newData,
                    status: 'VERIFIED', // Assume verified if manually selected
                    message: 'Manually verified via Google'
                };
            });
        }
    };

    // --- Pagination, Filtering & Sorting Logic ---

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const compare = (a: any, b: any, orderBy: string) => {
        let valA = '';
        let valB = '';

        switch (orderBy) {
            case 'schoolName': valA = a.verifiedData.schoolName || ''; valB = b.verifiedData.schoolName || ''; break;
            case 'contactPerson': valA = a.verifiedData.contactPerson || ''; valB = b.verifiedData.contactPerson || ''; break;
            case 'assignedToUserName': valA = a.verifiedData.assignedToUserName || ''; valB = b.verifiedData.assignedToUserName || ''; break;
            case 'regionName': valA = a.verifiedData.regionName || ''; valB = b.verifiedData.regionName || ''; break;
            case 'status': valA = a.status || ''; valB = b.status || ''; break;
            default: return 0;
        }

        // Case insensitive comparison
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();

        if (valB < valA) {
            return -1;
        }
        if (valB > valA) {
            return 1;
        }
        return 0;
    };

    const filteredRows = rows.filter(row => {
        const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
        const matchesSearch = searchQuery === '' ||
            row.verifiedData.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.verifiedData.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.verifiedData.assignedToUserName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const sortedRows = [...filteredRows].sort((a, b) => {
        if (!orderBy) return 0;
        return order === 'asc' ? compare(a, b, orderBy) : -compare(a, b, orderBy);
    });

    const paginatedRows = rowsPerPage > 0
        ? sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : sortedRows;

    if (!isLoaded) return <CircularProgress />;

    return (
        <Box sx={{ p: 3 }}>
            {/* Force Google Autocomplete to appear above Dialog */}
            <style>{`
                .pac-container {
                    z-index: 10000 !important;
                }
            `}</style>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">Bulk Lead Upload</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleDownloadTemplate}
                        sx={{ mr: 2 }}
                    >
                        Template
                    </Button>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        sx={{ mr: 2 }}
                        disabled={processing}
                    >
                        Upload Excel
                        <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </Button>
                    {processing ? (
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleUploadAll}
                            disabled={rows.length === 0}
                        >
                            Upload All Valid
                        </Button>
                    )}
                </Box>
            </Box>

            {processing && (
                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="caption" align="center" display="block">
                        Processing rows... {progress}%
                    </Typography>
                </Box>
            )}

            {/* Toolbar: Search, Filter, Export, Clear */}
            <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status Filter"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="ALL">All Statuses</MenuItem>
                        <MenuItem value="VERIFIED">Verified</MenuItem>
                        <MenuItem value="UPLOADED">Uploaded</MenuItem>
                        <MenuItem value="ERROR">Error</MenuItem>
                        <MenuItem value="DUPLICATE">Duplicate</MenuItem>
                        <MenuItem value="MULTIPLE_MATCHES">Multiple Matches</MenuItem>
                        <MenuItem value="NO_MATCH">No Match</MenuItem>
                        <MenuItem value="USER_NOT_FOUND">User Not Found</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={<SaveAlt />}
                    onClick={handleExportData}
                    disabled={rows.length === 0}
                >
                    Export
                </Button>

                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<RestartAlt />}
                    onClick={handleClearData}
                    disabled={rows.length === 0}
                >
                    Clear Data
                </Button>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>SNo</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'schoolName'}
                                    direction={orderBy === 'schoolName' ? order : 'asc'}
                                    onClick={() => handleRequestSort('schoolName')}
                                >
                                    School Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'contactPerson'}
                                    direction={orderBy === 'contactPerson' ? order : 'asc'}
                                    onClick={() => handleRequestSort('contactPerson')}
                                >
                                    Contact
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'assignedToUserName'}
                                    direction={orderBy === 'assignedToUserName' ? order : 'asc'}
                                    onClick={() => handleRequestSort('assignedToUserName')}
                                >
                                    Incharge
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'regionName'}
                                    direction={orderBy === 'regionName' ? order : 'asc'}
                                    onClick={() => handleRequestSort('regionName')}
                                >
                                    Region
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Address (Google)</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={orderBy === 'status'}
                                    direction={orderBy === 'status' ? order : 'asc'}
                                    onClick={() => handleRequestSort('status')}
                                >
                                    Status
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedRows.map((row, index) => (
                            <TableRow key={row.id} sx={{ bgcolor: getRowColor(row.status) }}>
                                <TableCell>
                                    {page * rowsPerPage + index + 1}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{row.verifiedData.schoolName}</Typography>
                                    <Typography variant="caption" color="textSecondary">Orig: {row.originalData.schoolName}</Typography>
                                </TableCell>
                                <TableCell>
                                    {row.verifiedData.contactPerson}
                                    <Typography variant="caption" display="block">{row.verifiedData.designation}</Typography>
                                </TableCell>
                                <TableCell>
                                    {row.verifiedData.assignedToUserName || <Typography color="error">Not Assigned</Typography>}
                                </TableCell>
                                <TableCell>
                                    {row.verifiedData.regionName || '-'}
                                </TableCell>
                                <TableCell sx={{ maxWidth: 200 }}>
                                    <Tooltip title={row.verifiedData.address}>
                                        <Typography noWrap variant="body2">{row.verifiedData.address || '-'}</Typography>
                                    </Tooltip>
                                    <Typography variant="caption">Zip: {row.verifiedData.zipCode}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.message || row.status}
                                        size="small"
                                        color={row.status === 'UPLOADED' ? 'success' : row.status === 'ERROR' ? 'error' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small" onClick={() => {
                                        setEditingRow({ ...row });
                                        setEditDialogOpen(true);
                                    }}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(row.id)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    No data. Upload an Excel file to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.length > 0 && paginatedRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    No rows match the current filter/search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 20, 50, { label: 'All', value: -1 }]}
                component="div"
                count={filteredRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Edit Row Details
                    {editingRow && (
                        <Chip
                            label={editingRow.status}
                            color={editingRow.status === 'VERIFIED' ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 2 }}
                        />
                    )}
                </DialogTitle>
                <DialogContent>
                    {editingRow && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Autocomplete
                                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                onPlaceChanged={onPlaceSelected}
                            >
                                <AutocompleteInput
                                    label="School Name (Search Google)"
                                    fullWidth
                                    value={editingRow.verifiedData.schoolName}
                                    onChange={(e) => setEditingRow({
                                        ...editingRow,
                                        verifiedData: { ...editingRow.verifiedData, schoolName: e.target.value }
                                    })}
                                    helperText="Type to search for a school on Google Maps"
                                />
                            </Autocomplete>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Contact Person"
                                    fullWidth
                                    value={editingRow.verifiedData.contactPerson}
                                    onChange={(e) => setEditingRow({
                                        ...editingRow,
                                        verifiedData: { ...editingRow.verifiedData, contactPerson: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="Designation"
                                    fullWidth
                                    value={editingRow.verifiedData.designation}
                                    onChange={(e) => setEditingRow({
                                        ...editingRow,
                                        verifiedData: { ...editingRow.verifiedData, designation: e.target.value }
                                    })}
                                />
                            </Box>
                            <TextField
                                label="Region"
                                select
                                fullWidth
                                value={editingRow.verifiedData.regionId}
                                onChange={(e) => {
                                    const region = regions.find(r => r.id === e.target.value);
                                    setEditingRow({
                                        ...editingRow,
                                        verifiedData: {
                                            ...editingRow.verifiedData,
                                            regionId: e.target.value,
                                            regionName: region?.name || ''
                                        }
                                    });
                                }}
                            >
                                {regions.map((option) => (
                                    <MenuItem key={option.id} value={option.id}>
                                        {option.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Address"
                                fullWidth
                                multiline
                                rows={2}
                                value={editingRow.verifiedData.address}
                                onChange={(e) => setEditingRow({
                                    ...editingRow,
                                    verifiedData: { ...editingRow.verifiedData, address: e.target.value }
                                })}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Zip Code"
                                    value={editingRow.verifiedData.zipCode}
                                    onChange={(e) => setEditingRow({
                                        ...editingRow,
                                        verifiedData: { ...editingRow.verifiedData, zipCode: e.target.value }
                                    })}
                                />
                                <TextField
                                    label="Contact Phone"
                                    value={editingRow.verifiedData.contactPhone}
                                    onChange={(e) => setEditingRow({
                                        ...editingRow,
                                        verifiedData: { ...editingRow.verifiedData, contactPhone: e.target.value }
                                    })}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this row?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>No</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">Yes, Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BulkUpload;
