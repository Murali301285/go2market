import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeadDetailContent from '../../components/leads/LeadDetailContent';

const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (!id) return null;

    return (
        <LeadDetailContent
            leadId={id}
            onUpdate={() => { }} // Optional: Refresh logic if needed, but component handles its own fetch
            onClose={() => navigate(-1)} // Or navigate to list
        />
    );
};

export default LeadDetail;
