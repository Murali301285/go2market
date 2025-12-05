import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Checkbox,
    ListItemIcon,
    LinearProgress,
    Alert
} from '@mui/material';

interface EditSchoolModalProps {
    open: boolean;
    onClose: () => void;
    initialSchoolName: string;
    onSave: (places: google.maps.places.PlaceResult[]) => void;
}

const EditSchoolModal: React.FC<EditSchoolModalProps> = ({ open, onClose, initialSchoolName, onSave }) => {
    const [inputValue, setInputValue] = useState('');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesService = useRef<google.maps.places.PlacesService | null>(null);

    // Initialize Services
    useEffect(() => {
        if (!autocompleteService.current && window.google) {
            autocompleteService.current = new google.maps.places.AutocompleteService();
        }
        if (!placesService.current && window.google) {
            const mapDiv = document.createElement('div');
            placesService.current = new google.maps.places.PlacesService(mapDiv);
        }
    }, []);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setInputValue(initialSchoolName);
            setPredictions([]);
            setSelectedIds([]);
            setError(null);
            // Trigger initial search if there's a name
            if (initialSchoolName) {
                fetchPredictions(initialSchoolName);
            }
        }
    }, [open, initialSchoolName]);

    const fetchPredictions = (input: string) => {
        if (!input.trim() || !autocompleteService.current) {
            setPredictions([]);
            return;
        }

        setLoading(true);
        autocompleteService.current.getPlacePredictions(
            {
                input: input,
                types: ['school'], // Filter for schools
                componentRestrictions: { country: 'in' }
            },
            (results, status) => {
                setLoading(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results);
                    setError(null);
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    setPredictions([]);
                    // Don't show error for zero results while typing, just empty list
                } else {
                    setPredictions([]);
                    setError('Error fetching suggestions.');
                }
            }
        );
    };

    // Debounce Input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open && inputValue !== initialSchoolName) {
                fetchPredictions(inputValue);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue, open, initialSchoolName]);

    const handleToggleSelect = (placeId: string) => {
        if (selectedIds.includes(placeId)) {
            setSelectedIds(prev => prev.filter(id => id !== placeId));
        } else {
            setSelectedIds(prev => [...prev, placeId]);
        }
    };

    const handleSave = async () => {
        if (selectedIds.length === 0) {
            alert("Please select at least one school.");
            return;
        }

        setFetchingDetails(true);
        const detailsPromises = selectedIds.map(placeId => {
            return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
                if (!placesService.current) {
                    resolve(null);
                    return;
                }
                placesService.current.getDetails(
                    {
                        placeId: placeId,
                        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'vicinity']
                    },
                    (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                            resolve(place);
                        } else {
                            resolve(null);
                        }
                    }
                );
            });
        });

        try {
            const results = await Promise.all(detailsPromises);
            const validPlaces = results.filter((p): p is google.maps.places.PlaceResult => p !== null);

            if (validPlaces.length > 0) {
                onSave(validPlaces);
                onClose();
            } else {
                setError('Failed to fetch details for selected schools.');
            }
        } catch (err) {
            setError('An error occurred while fetching details.');
        } finally {
            setFetchingDetails(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Search & Add Schools</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 1 }}>
                    <TextField
                        fullWidth
                        label="School Name"
                        placeholder="Start typing to search..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                        helperText="Type to see suggestions. Select multiple to add them all."
                    />
                </Box>

                {loading && <LinearProgress sx={{ mt: 1 }} />}
                {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}

                {predictions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Suggestions ({predictions.length}):
                        </Typography>
                        <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                            {predictions.map((prediction) => {
                                const isSelected = selectedIds.includes(prediction.place_id);
                                return (
                                    <ListItem
                                        key={prediction.place_id}
                                        disablePadding
                                    >
                                        <ListItemButton onClick={() => handleToggleSelect(prediction.place_id)} dense>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={prediction.structured_formatting.main_text}
                                                secondary={prediction.structured_formatting.secondary_text}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}

                {!loading && predictions.length === 0 && inputValue.trim() && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                        No suggestions found. Try a different name.
                    </Typography>
                )}

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={selectedIds.length === 0 || fetchingDetails}
                >
                    {fetchingDetails ? 'Fetching Details...' : `Add Selected (${selectedIds.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditSchoolModal;
