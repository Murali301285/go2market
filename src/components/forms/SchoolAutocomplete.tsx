import React from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { TextField, CircularProgress, Box, Alert, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const libraries: ("places")[] = ["places"];

interface SchoolAutocompleteProps {
    onSchoolSelected: (place: google.maps.places.PlaceResult) => void;
    error?: string;
    helperText?: string;
}

const SchoolAutocomplete: React.FC<SchoolAutocompleteProps> = ({
    onSchoolSelected,
    error,
    helperText
}) => {
    const [autocomplete, setAutocomplete] = React.useState<google.maps.places.Autocomplete | null>(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || '',
        libraries,
    });

    const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                onSchoolSelected(place);
            }
        }
    };

    if (loadError) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                Google Maps failed to load. Please enter school details manually.
            </Alert>
        );
    }

    if (!isLoaded) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <TextField
                    fullWidth
                    label="Search School (Loading...)"
                    disabled
                />
            </Box>
        );
    }

    if (!apiKey) {
        return (
            <TextField
                fullWidth
                label="School Name"
                placeholder="Enter school name manually (Google Maps not configured)"
                error={!!error}
                helperText={helperText || "Google Maps API key not configured. Enter manually."}
            />
        );
    }

    return (
        <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                componentRestrictions: { country: ['in', 'us'] }, // Restrict to India and US
                fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name', 'types'],
                // Restrict to schools and educational institutions
                types: ['school', 'university', 'secondary_school', 'primary_school']
            }}
        >
            <TextField
                fullWidth
                label="🔍 Search School Name"
                placeholder="Start typing school name..."
                error={!!error}
                helperText={helperText || "Select from suggestions to auto-fill all details"}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="primary" />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.02)',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        }
                    }
                }}
            />
        </Autocomplete>
    );
};

export default SchoolAutocomplete;
