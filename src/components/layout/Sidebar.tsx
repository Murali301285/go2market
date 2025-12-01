import React from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import WavesIcon from '@mui/icons-material/Waves';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 240;

interface SidebarProps {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle }) => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = userProfile?.role === 'admin';

    const menuItems = isAdmin
        ? [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
            { text: 'All Leads', icon: <ListAltIcon />, path: '/admin/all-leads' },
            { text: 'Lead Assignment', icon: <AssignmentIndIcon />, path: '/admin/lead-assignment' },
            { text: 'Lead Status', icon: <AssessmentIcon />, path: '/admin/lead-status' },
            { text: 'Pool Leads', icon: <WavesIcon />, path: '/admin/pool' },
            { text: 'Bulk Upload', icon: <CloudUploadIcon />, path: '/admin/bulk-upload' },
            { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
            { text: 'Regions', icon: <MapIcon />, path: '/admin/regions' },
        ]
        : [
            { text: 'Dashboard', icon: <DashboardIcon />, path: '/user/dashboard' },
            { text: 'Create Lead', icon: <AddCircleIcon />, path: '/user/create-lead' },
            { text: 'My Leads', icon: <AssignmentIcon />, path: '/user/leads' },
        ];

    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                // Close drawer on mobile when item is clicked
                                if (mobileOpen) handleDrawerToggle();
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>
            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
