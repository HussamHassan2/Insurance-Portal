import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { ClipboardCheck, FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import surveyorService from '../../../services/surveyor.service';

const SurveyTypeCard = ({ title, count, icon: Icon, bgGradient, iconColor, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        onClick={onClick}
        className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
    >
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 ${bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>

        <div className="relative p-6">
            {/* Header with icon and arrow */}
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${iconColor.bg} shadow-sm`}>
                    <Icon className={`w-7 h-7 ${iconColor.text}`} />
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-5 h-5 text-primary" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-navy dark:text-white">{count}</p>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">pending</span>
                </div>
            </div>

            {/* Bottom indicator */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>Click to view details</span>
                </div>
            </div>
        </div>
    </motion.div>
);

const PendingSurveysPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        issuance: 0,
        claim: 0
    });

    useEffect(() => {
        const fetchPendingSurveys = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const identificationCodes = user.identification_code ? JSON.stringify([user.identification_code]) : '[]';

                // Fetch both issuance and claim surveys
                const [issuanceResponse, claimResponse] = await Promise.all([
                    surveyorService.listSurveys({
                        identification_codes: identificationCodes,
                        limit: 100
                    }),
                    surveyorService.listClaims({
                        identification_codes: identificationCodes,
                        limit: 100
                    })
                ]);

                // Extract issuance surveys
                let issuanceData;
                if (issuanceResponse.data?.surveys) {
                    issuanceData = issuanceResponse.data;
                } else if (issuanceResponse.data?.result?.data) {
                    issuanceData = issuanceResponse.data.result.data;
                } else if (issuanceResponse.data?.data) {
                    issuanceData = issuanceResponse.data.data;
                } else {
                    issuanceData = issuanceResponse.data || {};
                }
                const issuanceSurveys = issuanceData.surveys || issuanceData;
                const issuanceArray = Array.isArray(issuanceSurveys) ? issuanceSurveys : [];

                // Extract claim surveys
                let claimData;
                if (claimResponse.data?.surveys) {
                    claimData = claimResponse.data;
                } else if (claimResponse.data?.result?.data) {
                    claimData = claimResponse.data.result.data;
                } else if (claimResponse.data?.data) {
                    claimData = claimResponse.data.data;
                } else {
                    claimData = claimResponse.data || {};
                }
                const claimSurveys = claimData.surveys || claimData;
                const claimArray = Array.isArray(claimSurveys) ? claimSurveys : [];

                // Count only surveys in 'surveyor' state
                const issuanceCount = issuanceArray.filter(s =>
                    s.state?.toLowerCase() === 'surveyor'
                ).length;

                const claimCount = claimArray.filter(s =>
                    s.state?.toLowerCase() === 'surveyor'
                ).length;

                setStats({
                    issuance: issuanceCount,
                    claim: claimCount
                });
            } catch (error) {
                console.error('Error fetching pending surveys:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPendingSurveys();
    }, [user]);

    const handleCardClick = (surveyType) => {
        const basePath = surveyType === 'issuance'
            ? '/dashboard/surveyor/issuance-survey'
            : '/dashboard/surveyor/claims';

        // Navigate with filter for 'surveyor' state (pending)
        navigate(basePath, { state: { filterStage: 'pending' } });
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Pending Surveys</h1>
                    <p className="text-gray-600 dark:text-gray-400">Surveys awaiting your action, grouped by type</p>
                </motion.div>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading pending surveys...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SurveyTypeCard
                        title="Issuance Surveys"
                        count={stats.issuance}
                        icon={ClipboardCheck}
                        bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
                        iconColor={{ bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }}
                        onClick={() => handleCardClick('issuance')}
                        delay={0}
                    />
                    <SurveyTypeCard
                        title="Claim Surveys"
                        count={stats.claim}
                        icon={FileText}
                        bgGradient="bg-gradient-to-br from-red-500 to-red-600"
                        iconColor={{ bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' }}
                        onClick={() => handleCardClick('claim')}
                        delay={0.1}
                    />
                </div>
            )}
        </DashboardLayout>
    );
};

export default PendingSurveysPage;
