import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    ClipboardCheck, Clock, CheckCircle, AlertCircle,
    FileText, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300"
    >
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-navy dark:text-white mt-2">{value}</p>
            </div>
            <div className={`p-4 rounded-xl ${color}`}>
                <Icon className="h-7 w-7 text-white" />
            </div>
        </div>
    </motion.div>
);

const SelectionCard = ({ title, description, icon: Icon, color, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        onClick={onClick}
        className="group relative overflow-hidden bg-gray-50 dark:bg-gray-700/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer text-center flex flex-col items-center justify-center h-full"
    >
        <div className={`p-4 rounded-full ${color.replace('text-', 'bg-').replace('600', '100')} dark:bg-gray-800 mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-8 h-8 ${color}`} />
        </div>

        <h3 className="text-xl font-bold text-navy dark:text-white mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

        <div className="mt-auto flex items-center text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Proceed <ArrowRight className="w-4 h-4 ml-2" />
        </div>
    </motion.div>
);

const SurveyorWizardModal = ({ onClose }) => {
    const navigate = useNavigate();

    const handleSelect = (surveyType) => {
        navigate('/dashboard/surveyor/stages', { state: { surveyType } });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full p-8 overflow-hidden border border-gray-100 dark:border-gray-700"
            >

                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-white mb-2">Select Your Workspace</h2>
                    <p className="text-gray-500 dark:text-gray-400">Choose where you want to start today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectionCard
                        title="Issuance Survey"
                        description="Perform pre-risk inspections for new policies."
                        icon={ClipboardCheck}
                        color="text-blue-600"
                        onClick={() => handleSelect('issuance')}
                        delay={0.1}
                    />
                    <SelectionCard
                        title="Claim Survey"
                        description="Assess damages and validate claims."
                        icon={FileText}
                        color="text-red-600"
                        onClick={() => handleSelect('claim')}
                        delay={0.2}
                    />
                </div>
            </motion.div>
        </div>
    );
};

const SurveyorDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Show wizard if coming from login OR clicking logo
    const [showWizard, setShowWizard] = useState(() => {
        // Check if coming from login or logo click
        if (location.state?.fromLogin || location.state?.fromLogo) {
            // Mark that wizard has been shown in this session
            sessionStorage.setItem('surveyorWizardShown', 'true');
            return true;
        }
        // Don't show if navigating from Overview menu or other navigation
        return false;
    });

    // Mock stats
    const stats = {
        totalSurveys: 12,
        pending: 5,
        completed: 7,
        urgent: 2
    };

    return (
        <DashboardLayout>
            <AnimatePresence>
                {showWizard && <SurveyorWizardModal onClose={() => setShowWizard(false)} />}
            </AnimatePresence>

            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Surveyor Overview</h1>
                            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
                        </div>
                        {/* Option to re-open wizard */}
                        <button
                            onClick={() => setShowWizard(true)}
                            className="hidden md:flex px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
                        >
                            Open Quick Select
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Surveys"
                    value={stats.totalSurveys}
                    icon={ClipboardCheck}
                    color="bg-blue-500"
                    delay={0}
                />
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={Clock}
                    color="bg-yellow-500"
                    delay={0.1}
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="bg-green-500"
                    delay={0.2}
                />
                <StatCard
                    title="Urgent"
                    value={stats.urgent}
                    icon={AlertCircle}
                    color="bg-red-500"
                    delay={0.3}
                />
            </div>
        </DashboardLayout>
    );
};

export default SurveyorDashboard;
