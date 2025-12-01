import React from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { TextField, CircularProgress, Box, Alert } from '@mui/material';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
    onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
    error?: string;
    helperText?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    onPlaceSelected,
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
                onPlaceSelected(place);
            }
        }
    };

    if (loadError) {
        return (
            <Alert severity="warning" sx={{ mb: 2 }}>
                Google Maps failed to load. Please enter address manually.
            </Alert>
        );
    }

    if (!isLoaded) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <TextField
                    fullWidth
                    label="School Address (Loading...)"
                    disabled
                />
            </Box>
        );
    }

    if (!apiKey) {
        return (
            <TextField
                fullWidth
                label="School Address"
                placeholder="Enter address manually (Google Maps not configured)"
                error={!!error}
                helperText={helperText || "Google Maps API key not configured. Enter address manually."}
            />
        );
    }

    return (
        <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                componentRestrictions: { country: ['in', 'us'] }, // Restrict to India and US
                fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name'],
                types: ['establishment', 'geocode']
            }}
        >
            <TextField
                fullWidth
                label="School Address (Google Autocomplete)"
                placeholder="Start typing to search..."
                error={!!error}
                helperText={helperText || "Select from suggestions or enter manually"}
            />
        </Autocomplete>
    );
};

export default AddressAutocomplete;
