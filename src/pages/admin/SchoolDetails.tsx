import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    FormControlLabel,
    Switch,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    OutlinedInput,
    Chip,
    type SelectChangeEvent,
    Grid,
    IconButton,
    LinearProgress,
    TableSortLabel,
    InputAdornment,
    Card,
    CardContent,
    Radio,
    RadioGroup,
    FormLabel
} from '@mui/material';
import { Search, Download, Info, Upload, Edit, Delete, CheckCircle, Error as ErrorIcon, Clear, Description, Person, SearchOutlined, AutoAwesome } from '@mui/icons-material';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import * as XLSX from 'xlsx';
import { indianStatesAndDistricts } from '../../data/indianStatesDistricts';
import EditSchoolModal from '../../components/admin/EditSchoolModal';

const libraries: ("places")[] = ["places"];

type SourceType = 'EXCEL_NOT_FOUND' | 'EXCEL_MATCHED' | 'GOOGLE_AUTO_INSERT' | 'MANUAL' | 'SEARCH';

interface SchoolResult {
    id: string;
    name: string;
    address: string;
    city: string;
    pincode: string;
    rating?: number;
    userRatingsTotal?: number;
    status?: 'FOUND' | 'NOT_FOUND';
    originalQuery?: string;
    source: SourceType;
    remarks: string;
}

const FILTER_OPTIONS = [
    'CBSE',
    'Matriculation',
    'Primary',
    'Government',
    'Educational Institute'
];

const SOURCE_FILTER_OPTIONS: { value: SourceType | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'All Sources' },
    { value: 'EXCEL_MATCHED', label: 'Original - Matched' },
    { value: 'EXCEL_NOT_FOUND', label: 'Original - Not Found' },
    { value: 'GOOGLE_AUTO_INSERT', label: 'Google Auto-Inserted' },
    { value: 'MANUAL', label: 'Manually Added' },
    { value: 'SEARCH', label: 'Search Results' }
];

type SortKey = keyof SchoolResult;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const SchoolDetails: React.FC = () => {
    // Location State
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [area, setArea] = useState('');
    const [pincode, setPincode] = useState('');

    // Search State
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SchoolResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [paginationLoading, setPaginationLoading] = useState(false);
    const [deepScan, setDeepScan] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

    // Table State (Search & Sort)
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [sourceFilter, setSourceFilter] = useState<SourceType | 'ALL'>('ALL');

    // Bulk Upload State
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkUploadMode, setBulkUploadMode] = useState<'ONLY_MATCH' | 'MATCH_AND_INSERT'>(() => {
        const saved = localStorage.getItem('bulkUploadMode');
        return (saved === 'MATCH_AND_INSERT' ? 'MATCH_AND_INSERT' : 'ONLY_MATCH') as 'ONLY_MATCH' | 'MATCH_AND_INSERT';
    });

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingSchool, setEditingSchool] = useState<SchoolResult | null>(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const searchService = useRef<google.maps.places.PlacesService | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset district when state changes
    useEffect(() => {
        setSelectedDistrict('');
    }, [selectedState]);

    // Calculate Statistics
    const statistics = useMemo(() => {
        const stats = {
            totalUploaded: 0,
            excelMatched: 0,
            excelNotFound: 0,
            googleAutoInsert: 0,
            manual: 0,
            search: 0
        };

        results.forEach(r => {
            switch (r.source) {
                case 'EXCEL_MATCHED':
                    stats.excelMatched++;
                    stats.totalUploaded++;
                    break;
                case 'EXCEL_NOT_FOUND':
                    stats.excelNotFound++;
                    stats.totalUploaded++;
                    break;
                case 'GOOGLE_AUTO_INSERT':
                    stats.googleAutoInsert++;
                    break;
                case 'MANUAL':
                    stats.manual++;
                    break;
                case 'SEARCH':
                    stats.search++;
                    break;
            }
        });

        return stats;
    }, [results]);

    const extractDetails = (place: google.maps.places.PlaceResult) => {
        let city = '';
        let pin = '';

        if (place.formatted_address) {
            const pinMatch = place.formatted_address.match(/\b\d{6}\b/);
            if (pinMatch) pin = pinMatch[0];

            const parts = place.formatted_address.split(',').map(p => p.trim());
            if (parts.length >= 3) {
                const partWithPinIndex = parts.findIndex(p => p.includes(pin));
                if (partWithPinIndex > 0) {
                    city = parts[partWithPinIndex - 1];
                } else if (parts.length > 2) {
                    city = parts[parts.length - 3];
                }
            }
        }
        else if (place.vicinity) {
            const pinMatch = place.vicinity.match(/\b\d{6}\b/);
            if (pinMatch) pin = pinMatch[0];
        }

        return { city: city || 'Unknown', pincode: pin || 'Unknown' };
    };

    const getSearchLocation = () => {
        const parts = [];
        if (area) parts.push(area);
        if (selectedDistrict) parts.push(selectedDistrict);
        if (selectedState) parts.push(selectedState);
        if (pincode) parts.push(pincode);
        return parts.join(', ');
    };

    const performSearch = () => {
        const locationQuery = getSearchLocation();
        if (!locationQuery.trim()) {
            setError('Please select at least a State and District.');
            return;
        }
        if (!isLoaded) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setScanProgress(0);

        const mapDiv = document.createElement('div');
        searchService.current = new google.maps.places.PlacesService(mapDiv);

        if (deepScan) {
            performDeepGridSearch(locationQuery);
        } else {
            performStandardSearch(locationQuery);
        }
    };

    const performStandardSearch = (locationQuery: string) => {
        if (!searchService.current) return;

        const filterString = selectedFilters.join(' ');
        const query = `Schools in ${locationQuery} ${filterString}`;

        const request: google.maps.places.TextSearchRequest = {
            query: query.trim(),
            type: 'school',
        };

        searchService.current.textSearch(request, (places, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                processResults(places, 'SEARCH', 'Search Result');

                if (pagination && pagination.hasNextPage) {
                    setPaginationLoading(true);
                    setTimeout(() => {
                        pagination.nextPage();
                    }, 2000);
                } else {
                    setLoading(false);
                    setPaginationLoading(false);
                }
            } else {
                setLoading(false);
                setPaginationLoading(false);
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        setError('No schools found matching your criteria.');
                    } else {
                        setError(`Search failed: ${status}`);
                    }
                }
            }
        });
    };

    const performDeepGridSearch = (locationQuery: string) => {
        if (!searchService.current) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: locationQuery }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const geometry = results[0].geometry;
                const bounds = geometry.viewport;

                if (bounds) {
                    executeGridSearch(bounds);
                } else if (geometry.location) {
                    executeRadiusSearch(geometry.location);
                }
            } else {
                setLoading(false);
                setError('Could not locate the area for Deep Scan.');
            }
        });
    };

    const executeGridSearch = async (bounds: google.maps.LatLngBounds) => {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const latSpan = ne.lat() - sw.lat();
        const lngSpan = ne.lng() - sw.lng();

        const steps = 4;
        const latStep = latSpan / steps;
        const lngStep = lngSpan / steps;

        const points: google.maps.LatLng[] = [];

        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < steps; j++) {
                const lat = sw.lat() + (i * latStep) + (latStep / 2);
                const lng = sw.lng() + (j * lngStep) + (lngStep / 2);
                points.push(new google.maps.LatLng(lat, lng));
            }
        }

        let completed = 0;
        const allPlaces = new Map<string, google.maps.places.PlaceResult>();
        const filterKeyword = selectedFilters.join(' ');

        const processPoint = (index: number) => {
            if (index >= points.length) {
                setLoading(false);
                setScanProgress(100);
                return;
            }

            const point = points[index];
            const request: google.maps.places.PlaceSearchRequest = {
                location: point,
                radius: 2000,
                type: 'school',
                keyword: filterKeyword || undefined
            };

            searchService.current?.nearbySearch(request, (places, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                    places.forEach(p => {
                        if (p.place_id && !allPlaces.has(p.place_id)) {
                            allPlaces.set(p.place_id, p);
                            const details = extractDetails(p);

                            setResults(prev => {
                                const exists = prev.some(r => r.id === p.place_id);
                                if (exists) return prev;

                                return [...prev, {
                                    id: p.place_id!,
                                    name: p.name || 'Unknown',
                                    address: p.vicinity || p.formatted_address || '',
                                    city: details.city,
                                    pincode: details.pincode,
                                    rating: p.rating,
                                    userRatingsTotal: p.user_ratings_total,
                                    status: 'FOUND',
                                    source: 'SEARCH',
                                    remarks: 'Deep Scan Result'
                                }];
                            });
                        }
                    });
                }

                completed++;
                setScanProgress(Math.round((completed / points.length) * 100));
                setTimeout(() => processPoint(index + 1), 300);
            });
        };

        processPoint(0);
    };

    const executeRadiusSearch = (location: google.maps.LatLng) => {
        const filterKeyword = selectedFilters.join(' ');
        const request: google.maps.places.PlaceSearchRequest = {
            location: location,
            radius: 5000,
            type: 'school',
            keyword: filterKeyword || undefined
        };

        searchService.current?.nearbySearch(request, (places, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && places) {
                processResults(places, 'SEARCH', 'Search Result');
            }
            setLoading(false);
        });
    };

    const processResults = (places: google.maps.places.PlaceResult[], source: SourceType, remarks: string) => {
        const newResults = places.map(place => {
            const details = extractDetails(place);
            return {
                id: place.place_id || Math.random().toString(),
                name: place.name || 'Unknown School',
                address: place.formatted_address || place.vicinity || '',
                city: details.city,
                pincode: details.pincode,
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total,
                status: 'FOUND' as const,
                source,
                remarks
            };
        });

        setResults(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const uniqueNew = newResults.filter(r => !existingIds.has(r.id));
            return [...prev, ...uniqueNew];
        });
    };

    // --- Bulk Upload Logic ---

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { 'School Name': 'Delhi Public School', 'State Name': 'Karnataka' },
            { 'School Name': 'Kendriya Vidyalaya', 'State Name': 'Maharashtra' }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'School_Upload_Template.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws) as any[];

            if (data.length > 0) {
                processBulkData(data);
            } else {
                setError('Excel file is empty or invalid.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const processBulkData = (data: any[]) => {
        if (!searchService.current) {
            const mapDiv = document.createElement('div');
            searchService.current = new google.maps.places.PlacesService(mapDiv);
        }

        setIsBulkProcessing(true);
        setResults([]);
        setBulkProgress(0);

        let processedCount = 0;

        const processRow = (index: number) => {
            if (index >= data.length) {
                setIsBulkProcessing(false);
                return;
            }

            const row = data[index];
            const schoolName = row['School Name'];
            const stateName = row['State Name'];

            if (!schoolName || !stateName) {
                setResults(prev => [...prev, {
                    id: `error_${Date.now()}_${index}`,
                    name: schoolName || 'Unknown',
                    address: 'Missing Name or State',
                    city: stateName || '-',
                    pincode: '-',
                    status: 'NOT_FOUND',
                    originalQuery: 'Invalid Entry',
                    source: 'EXCEL_NOT_FOUND',
                    remarks: 'Invalid Entry'
                }]);

                processedCount++;
                setBulkProgress(Math.round((processedCount / data.length) * 100));
                processRow(index + 1);
                return;
            }

            const query = `${schoolName} in ${stateName}`;
            const request: google.maps.places.TextSearchRequest = {
                query: query,
                type: 'school'
            };

            searchService.current?.textSearch(request, (places, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && places && places.length > 0) {
                    // Filter places based on upload mode
                    const placesToAdd = bulkUploadMode === 'ONLY_MATCH' ? [places[0]] : places;

                    const newResults = placesToAdd.map((p, idx) => {
                        const details = extractDetails(p);

                        // First match = EXCEL_MATCHED, rest = GOOGLE_AUTO_INSERT (only in MATCH_AND_INSERT mode)
                        const isFirstMatch = idx === 0;

                        return {
                            id: p.place_id || Math.random().toString(),
                            name: p.name || schoolName,
                            address: p.formatted_address || '',
                            city: details.city,
                            pincode: details.pincode,
                            rating: p.rating,
                            userRatingsTotal: p.user_ratings_total,
                            status: 'FOUND' as const,
                            originalQuery: schoolName,
                            source: isFirstMatch ? 'EXCEL_MATCHED' as const : 'GOOGLE_AUTO_INSERT' as const,
                            remarks: isFirstMatch ? 'Original Data - Matched with Google' : 'Auto-Inserted by Google'
                        };
                    });

                    setResults(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        const uniqueNew = newResults.filter(r => !existingIds.has(r.id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setResults(prev => [...prev, {
                        id: `temp_${Date.now()}_${index}`,
                        name: schoolName,
                        address: 'Not Found',
                        city: stateName,
                        pincode: '-',
                        status: 'NOT_FOUND' as const,
                        originalQuery: schoolName,
                        source: 'EXCEL_NOT_FOUND' as const,
                        remarks: 'Original Upload Data - Not Found'
                    }]);
                }

                processedCount++;
                setBulkProgress(Math.round((processedCount / data.length) * 100));
                setTimeout(() => processRow(index + 1), 500);
            });
        };

        processRow(0);
    };

    // --- Edit Logic ---

    const handleEditClick = (school: SchoolResult) => {
        setEditingSchool(school);
        setEditModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('Are you sure you want to delete this school?')) {
            setResults(prev => prev.filter(r => r.id !== id));
        }
    };

    const handleUpdateSchool = (places: google.maps.places.PlaceResult[]) => {
        if (!editingSchool || places.length === 0) return;

        const firstPlace = places[0];
        const firstDetails = extractDetails(firstPlace);

        const updatedSchool: SchoolResult = {
            id: firstPlace.place_id || Math.random().toString(),
            name: firstPlace.name || editingSchool.name,
            address: firstPlace.formatted_address || '',
            city: firstDetails.city,
            pincode: firstDetails.pincode,
            rating: firstPlace.rating,
            userRatingsTotal: firstPlace.user_ratings_total,
            status: 'FOUND',
            originalQuery: editingSchool.originalQuery,
            source: 'MANUAL',
            remarks: 'Manually Updated'
        };

        setResults(prev => {
            let newResults = prev.map(r => r.id === editingSchool.id ? updatedSchool : r);

            if (places.length > 1) {
                const additionalPlaces = places.slice(1);
                const existingIds = new Set(newResults.map(r => r.id));

                const newRows = additionalPlaces.map(p => {
                    const d = extractDetails(p);
                    return {
                        id: p.place_id || Math.random().toString(),
                        name: p.name || 'Unknown',
                        address: p.formatted_address || '',
                        city: d.city,
                        pincode: d.pincode,
                        rating: p.rating,
                        userRatingsTotal: p.user_ratings_total,
                        status: 'FOUND' as const,
                        originalQuery: editingSchool.originalQuery,
                        source: 'MANUAL' as const,
                        remarks: 'Manually Added'
                    };
                }).filter(r => !existingIds.has(r.id));

                newResults = [...newResults, ...newRows];
            }
            return newResults;
        });

        setEditingSchool(null);
    };

    const handleDownload = () => {
        const data = results.map((r, index) => ({
            'S.No': index + 1,
            'Status': r.status === 'FOUND' ? 'OK' : 'Error',
            'Source': r.source,
            'Remarks': r.remarks,
            'School Name': r.name,
            'City': r.city,
            'Pincode': r.pincode,
            'Full Address': r.address,
            'Original Query': r.originalQuery || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Schools');
        XLSX.writeFile(wb, `Schools_Export_${new Date().getTime()}.xlsx`);
    };

    const handleFilterChange = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;
        setSelectedFilters(typeof value === 'string' ? value.split(',') : value);
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.name) {
                setArea(place.name);
            }
        }
    };

    // --- Sorting & Filtering ---

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedResults = useMemo(() => {
        let processed = [...results];

        // Skip sorting/filtering during bulk upload for performance
        if (isBulkProcessing) {
            return processed;
        }

        // Source Filter
        if (sourceFilter !== 'ALL') {
            processed = processed.filter(r => r.source === sourceFilter);
        }

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processed = processed.filter(r =>
                r.name.toLowerCase().includes(lowerTerm) ||
                r.city.toLowerCase().includes(lowerTerm) ||
                r.address.toLowerCase().includes(lowerTerm) ||
                (r.pincode && r.pincode.includes(lowerTerm))
            );
        }

        // Sort
        processed.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || bValue === undefined) return 0;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return processed;
    }, [results, searchTerm, sortConfig, sourceFilter, isBulkProcessing]);

    const getSourceIcon = (source: SourceType) => {
        switch (source) {
            case 'EXCEL_NOT_FOUND':
                return <Description fontSize="small" sx={{ color: '#9e9e9e' }} />;
            case 'EXCEL_MATCHED':
                return <CheckCircle fontSize="small" sx={{ color: '#4caf50' }} />;
            case 'GOOGLE_AUTO_INSERT':
                return <AutoAwesome fontSize="small" sx={{ color: '#2196f3' }} />;
            case 'MANUAL':
                return <Person fontSize="small" sx={{ color: '#9c27b0' }} />;
            case 'SEARCH':
                return <SearchOutlined fontSize="small" sx={{ color: '#ff9800' }} />;
        }
    };

    if (loadError) return <Alert severity="error">Error loading Google Maps API</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
                School Details Search
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Search for schools in a specific State, District, or Area.
            </Typography>

            {/* Statistics Dashboard */}
            {results.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    Total Uploaded: {statistics.totalUploaded}
                                </Typography>
                                <Box sx={{ pl: 2 }}>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircle fontSize="small" sx={{ color: '#4caf50' }} />
                                        Matched with Google: {statistics.excelMatched}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ErrorIcon fontSize="small" sx={{ color: '#9e9e9e' }} />
                                        Not Found: {statistics.excelNotFound}
                                    </Typography>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AutoAwesome fontSize="small" sx={{ color: '#2196f3' }} />
                                        Google Auto-Inserted: {statistics.googleAutoInsert}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="secondary" gutterBottom>
                                    Manually Added: {statistics.manual}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Schools added or updated by users
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: '#ff9800' }} gutterBottom>
                                    Search Results: {statistics.search}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    From standard/deep scan searches
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>State</InputLabel>
                            <Select
                                value={selectedState}
                                label="State"
                                onChange={(e) => setSelectedState(e.target.value)}
                            >
                                {Object.keys(indianStatesAndDistricts).map((state) => (
                                    <MenuItem key={state} value={state}>{state}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth disabled={!selectedState}>
                            <InputLabel>District</InputLabel>
                            <Select
                                value={selectedDistrict}
                                label="District"
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                            >
                                {selectedState && indianStatesAndDistricts[selectedState]?.map((district) => (
                                    <MenuItem key={district} value={district}>{district}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        {isLoaded ? (
                            <Autocomplete
                                onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                                onPlaceChanged={onPlaceChanged}
                                restrictions={{ country: 'in' }}
                            >
                                <TextField
                                    fullWidth
                                    label="Area (Optional)"
                                    placeholder="e.g. Indiranagar"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                    disabled={!selectedDistrict}
                                />
                            </Autocomplete>
                        ) : (
                            <TextField fullWidth label="Area" disabled />
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            fullWidth
                            label="Pincode (Optional)"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            inputProps={{ maxLength: 6 }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl sx={{ minWidth: 200, flex: 1 }}>
                            <InputLabel>School Type Filters</InputLabel>
                            <Select
                                multiple
                                value={selectedFilters}
                                onChange={handleFilterChange}
                                input={<OutlinedInput label="School Type Filters" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {FILTER_OPTIONS.map((name) => (
                                    <MenuItem key={name} value={name}>{name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={performSearch}
                            disabled={loading || paginationLoading || !selectedState || !selectedDistrict || isBulkProcessing}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Search />}
                            sx={{ minWidth: 120, height: 56 }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={deepScan}
                                    onChange={(e) => setDeepScan(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography fontWeight="bold">Deep Scan (City Grid)</Typography>
                                    <Tooltip title="Divides the area into a grid and searches each section to overcome the 60-result limit. Slower but finds more schools.">
                                        <Info fontSize="small" color="action" />
                                    </Tooltip>
                                </Box>
                            }
                        />
                    </Box>

                    <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Bulk Upload (Excel)
                            </Typography>
                            <Tooltip title="Choose how to handle Google Maps matches during bulk upload">
                                <Info fontSize="small" color="action" />
                            </Tooltip>
                        </Box>

                        <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>Upload Mode:</FormLabel>
                            <RadioGroup
                                row
                                value={bulkUploadMode}
                                onChange={(e) => {
                                    const newMode = e.target.value as 'ONLY_MATCH' | 'MATCH_AND_INSERT';
                                    setBulkUploadMode(newMode);
                                    localStorage.setItem('bulkUploadMode', newMode);
                                }}
                            >
                                <FormControlLabel
                                    value="ONLY_MATCH"
                                    control={<Radio size="small" />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="body2">Only Match (1:1)</Typography>
                                            <Tooltip title="Match each Excel row with only the best Google result. Prevents duplicate entries.">
                                                <Info fontSize="small" sx={{ fontSize: 16 }} color="action" />
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="MATCH_AND_INSERT"
                                    control={<Radio size="small" />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="body2">Match and Insert (All Matches)</Typography>
                                            <Tooltip title="Include all Google matches. May create multiple rows per Excel entry.">
                                                <Info fontSize="small" sx={{ fontSize: 16 }} color="action" />
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={handleDownloadTemplate}
                            >
                                Download Template
                            </Button>
                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<Upload />}
                                disabled={isBulkProcessing}
                            >
                                Upload & Process
                                <input
                                    type="file"
                                    hidden
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </Button>
                            {isBulkProcessing && (
                                <Box sx={{ flex: 1, ml: 2 }}>
                                    <Typography variant="caption">Processing... {bulkProgress}%</Typography>
                                    <LinearProgress variant="determinate" value={bulkProgress} />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>

                {(loading || paginationLoading) && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 0.5 }}>
                            {deepScan
                                ? `Scanning area grid... ${scanProgress}% complete`
                                : "Fetching results..."}
                        </Typography>
                        {deepScan && <CircularProgress variant="determinate" value={scanProgress} size={20} />}
                    </Box>
                )}
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {results.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h6">
                            Results: {filteredAndSortedResults.length} Schools
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Filter by Source</InputLabel>
                                <Select
                                    value={sourceFilter}
                                    label="Filter by Source"
                                    onChange={(e) => setSourceFilter(e.target.value as SourceType | 'ALL')}
                                >
                                    {SOURCE_FILTER_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                size="small"
                                placeholder="Search in results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                                <Clear fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />
                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={<Download />}
                                onClick={handleDownload}
                            >
                                Download Excel
                            </Button>
                        </Box>
                    </Box>

                    <TableContainer component={Paper} sx={{ maxHeight: '60vh' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>S.No</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortConfig.key === 'name'}
                                            direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('name')}
                                        >
                                            School Name
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortConfig.key === 'city'}
                                            direction={sortConfig.key === 'city' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('city')}
                                        >
                                            City (Est.)
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortConfig.key === 'pincode'}
                                            direction={sortConfig.key === 'pincode' ? sortConfig.direction : 'asc'}
                                            onClick={() => handleSort('pincode')}
                                        >
                                            Pincode
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Full Address</TableCell>
                                    <TableCell>Remarks</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAndSortedResults.map((row, index) => (
                                    <TableRow key={row.id} sx={{ backgroundColor: row.status === 'NOT_FOUND' ? '#fff0f0' : 'inherit' }}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{row.name}</TableCell>
                                        <TableCell>{row.city}</TableCell>
                                        <TableCell>{row.pincode}</TableCell>
                                        <TableCell sx={{ maxWidth: 300 }}>
                                            <Typography variant="body2" noWrap title={row.address}>
                                                {row.address}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Tooltip title={row.remarks}>
                                                    {getSourceIcon(row.source)}
                                                </Tooltip>
                                                <Typography variant="caption" color="textSecondary">
                                                    {row.remarks}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {row.status === 'FOUND' ? (
                                                <Chip
                                                    label="OK"
                                                    color="success"
                                                    size="small"
                                                    icon={<CheckCircle />}
                                                />
                                            ) : (
                                                <Tooltip title={`Original Query: ${row.originalQuery || 'Unknown'}`}>
                                                    <Chip
                                                        label="Error"
                                                        color="error"
                                                        size="small"
                                                        icon={<ErrorIcon />}
                                                    />
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton size="small" onClick={() => handleEditClick(row)} color="primary">
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error">
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {editingSchool && (
                <EditSchoolModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    initialSchoolName={editingSchool.name}
                    onSave={handleUpdateSchool}
                />
            )}
        </Box>
    );
};

export default SchoolDetails;
