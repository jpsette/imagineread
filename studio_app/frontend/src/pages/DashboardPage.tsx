import React from 'react';
import ProjectManager from '../features/dashboard/ProjectManager';

const DashboardPage: React.FC = () => {
    return (
        <div className="h-full bg-app-bg text-white p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <ProjectManager />
            </div>
        </div>
    );
};

export default DashboardPage;
