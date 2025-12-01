export const STAGE_COLORS: Record<string, string> = {
    NEW: '#2196f3',
    CONTACTED: '#03a9f4',
    DEMO_SCHEDULED: '#00bcd4',
    DEMO_SHOWED: '#9c27b0',
    QUOTATION_SENT: '#673ab7',
    NEGOTIATION: '#ff9800',
    CONVERTED: '#4caf50',
    CANCELLED: '#f44336',
    EXPIRED: '#9e9e9e',
};

export const getStageColor = (stage: string): string => {
    return STAGE_COLORS[stage] || '#757575'; // Default grey
};

export const getStageMuiColor = (stage: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (stage) {
        case 'CONVERTED': return 'success';
        case 'NEGOTIATION': return 'warning'; // Changed to warning for visibility
        case 'QUOTATION_SENT': return 'primary';
        case 'DEMO_SHOWED': return 'secondary';
        case 'CANCELLED': return 'error';
        case 'NEW': return 'info';
        case 'CONTACTED': return 'info';
        default: return 'default';
    }
};
