import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
    ClipboardCheck, FileText, Clock, CheckCircle,
    XCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import surveyorService from '../../../services/surveyor.service';

const StageCard = ({ title, count, icon: Icon, color, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        onClick={onClick}
        className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} dark:bg-gray-700`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
        </div>
        <h3 className="text-lg font-bold text-navy dark:text-white mb-1">{title}</h3>
        <p className="text-3xl font-bold text-primary">{count}</p>
    </motion.div>
);

const SurveyStagesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        issuance: { pending: 0, inProgress: 0, completed: 0, rejected: 0 },
        claim: { pending: 0, inProgress: 0, completed: 0, rejected: 0 }
    });

    // Get survey type from location state or default to 'issuance'
    const surveyType = location.state?.surveyType || 'issuance';

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch surveys based on type
                const service = surveyType === 'issuance'
                    ? surveyorService.listSurveys
                    : surveyorService.listClaims;

                const response = await service({
                    identification_codes: user.identification_code ? JSON.stringify([user.identification_code]) : '[]',
                    limit: 100
                });

                // Extract data
                let resultData;
                if (response.data?.surveys) {
                    resultData = response.data;
                } else if (response.data?.result?.data) {
                    resultData = response.data.result.data;
                } else if (response.data?.data) {
                    resultData = response.data.data;
                } else {
                    resultData = response.data || {};
                }

                const data = resultData.surveys || resultData;
                const surveys = Array.isArray(data) ? data : [];

                // Calculate stats by status
                const statusCounts = {
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                    rejected: 0
                };

                surveys.forEach(survey => {
                    const status = (survey.state || '').toLowerCase();
                    if (status === 'pending' || status === 'surveyor') {
                        statusCounts.pending++;
                    } else if (status === 'in progress' || status === 'in_progress') {
                        statusCounts.inProgress++;
                    } else if (status === 'completed' || status === 'approved' || status === 'done') {
                        statusCounts.completed++;
                    } else if (status === 'rejected' || status === 'cancelled') {
                        statusCounts.rejected++;
                    }
                });

                setStats(prev => ({
                    ...prev,
                    [surveyType]: statusCounts
                }));
            } catch (error) {
                console.error('Error fetching survey stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, surveyType]);

    const handleStageClick = (stage) => {
        const basePath = surveyType === 'issuance'
            ? '/dashboard/surveyor/issuance-survey'
            : '/dashboard/surveyor/claims';

        navigate(basePath, { state: { filterStage: stage } });
    };

    const currentStats = stats[surveyType];
    const title = surveyType === 'issuance' ? 'Issuance Survey Stages' : 'Claim Survey Stages';
    const description = surveyType === 'issuance'
        ? 'Track pre-risk inspections by stage'
        : 'Track claim inspections by stage';

    return (
        <DashboardLayout>
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">{title}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{description}</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/surveyor')}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
                    >
                        Back to Overview
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stages...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StageCard
                        title="Pending"
                        count={currentStats.pending}
                        icon={Clock}
                        color="text-yellow-600"
                        onClick={() => handleStageClick('pending')}
                        delay={0}
                    />
                    <StageCard
                        title="In Progress"
                        count={currentStats.inProgress}
                        icon={AlertCircle}
                        color="text-blue-600"
                        onClick={() => handleStageClick('in_progress')}
                        delay={0.1}
                    />
                    <StageCard
                        title="Completed"
                        count={currentStats.completed}
                        icon={CheckCircle}
                        color="text-green-600"
                        onClick={() => handleStageClick('completed')}
                        delay={0.2}
                    />
                    <StageCard
                        title="Rejected"
                        count={currentStats.rejected}
                        icon={XCircle}
                        color="text-red-600"
                        onClick={() => handleStageClick('rejected')}
                        delay={0.3}
                    />
                </div>
            )}
        </DashboardLayout>
    );
};

export default SurveyStagesPage;
