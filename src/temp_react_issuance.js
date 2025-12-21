import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Pagination from '../../../components/ui/Pagination';
import DynamicTableWithFilters from '../../../components/ui/DynamicTableWithFilters';
import { Eye, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import surveyorService from '../../../services/surveyor.service';
import usePagination from '../../../hooks/usePagination';

const SurveyorIssuanceSurveyPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);

    // Get filter stage from location state
    const filterStage = location.state?.filterStage;

    useEffect(() => {
        const fetchSurveys = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch list of surveys
                const response = await surveyorService.listSurveys({
                    identification_codes: user.identification_code ? JSON.stringify([user.identification_code]) : '[]',
                    limit: 50
                });

                // Check multiple possible response structures
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

                // Map API response to view model
                const mappedSurveys = (Array.isArray(data) ? data : []).map(item => ({
                    id: item.id,
                    surveyNumber: item.survey_number,
                    customer: item.customer_name || 'N/A',
                    vehicle: `${item.risk_info?.vehicle_make || ''} ${item.risk_info?.vehicle_model || ''}`.trim() || 'N/A',
                    status: item.state || item.status || 'Pending',
                    date: item.assign_date || item.create_date || 'N/A',
                    location: item.survey_location || 'N/A'
                }));

                setSurveys(mappedSurveys);
            } catch (error) {
                console.error('Error fetching surveys:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveys();
    }, [user]);

    // Update filteredData when surveys change or filter stage changes
    useEffect(() => {
        if (!filterStage) {
            setFilteredData(surveys);
        } else {
            // Filter by stage
            const filtered = surveys.filter(survey => {
                const status = survey.status.toLowerCase();
                if (filterStage === 'pending') {
                    return status === 'pending' || status === 'surveyor';
                } else if (filterStage === 'in_progress') {
                    return status === 'in progress' || status === 'in_progress';
                } else if (filterStage === 'completed') {
                    return status === 'completed' || status === 'approved' || status === 'done';
                } else if (filterStage === 'rejected') {
                    return status === 'rejected' || status === 'cancelled';
                }
                return true;
            });
            setFilteredData(filtered);
        }
    }, [surveys, filterStage]);

    // Use pagination hook with filtered items
    const pagination = usePagination(filteredData, 50);

    const columns = [
        { key: 'surveyNumber', label: 'Survey No', filterable: true, filterType: 'text' },
        { key: 'customer', label: 'Customer', filterable: true, filterType: 'text' },
        { key: 'vehicle', label: 'Vehicle', filterable: true, filterType: 'text' },
        { key: 'date', label: 'Assign Date', filterable: true, filterType: 'text' },
        { key: 'status', label: 'Status', filterable: true },
        { key: 'actions', label: 'Actions', filterable: false }
    ];

    const getStatusColor = (status) => {
        const s = status.toLowerCase();
        if (s === 'completed' || s === 'approved') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        if (s === 'pending' || s === 'surveyor') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        if (s === 'in progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        if (s === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const renderCell = (row, columnKey) => {
        switch (columnKey) {
            case 'surveyNumber':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-sm font-medium text-navy dark:text-white">{row.surveyNumber}</span>
                    </div>
                );
            case 'customer':
            case 'vehicle':
                return <span className="text-gray-600 dark:text-gray-300">{row[columnKey]}</span>;
            case 'date':
                return <span className="text-sm text-gray-600 dark:text-gray-300">{row.date}</span>;
            case 'status':
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(row.status)}`}>
                        {row.status}
                    </span>
                );
            case 'actions':
                return (
                    <div className="flex items-center gap-2">
                        <Link to={`/dashboard/surveyor/issuance-survey/${row.id}`} className="p-1 text-gray-400 hover:text-primary transition-all duration-300" title="View Details">
                            <Eye className="w-4 h-4" />
                        </Link>
                    </div>
                );
            default:
                return <span className="text-gray-600 dark:text-gray-300">{row[columnKey]}</span>;
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">Issuance Surveys</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage requested inspections for new policies.</p>
                    </div>
                </div>
            </div>

            {/* Dynamic Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <DynamicTableWithFilters
                    data={surveys}
                    columns={columns}
                    onFilteredDataChange={(filtered) => {
                        setFilteredData(filtered);
                        if (pagination.currentPage !== 1) {
                            pagination.goToPage(1);
                        }
                    }}
                    renderCell={renderCell}
                    loading={loading}
                    renderData={pagination.paginatedItems}
                />

                {/* Pagination Controls */}
                {!loading && pagination.totalItems > 0 && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        startIndex={pagination.startIndex}
                        endIndex={pagination.endIndex}
                        onPageChange={pagination.goToPage}
                        onNextPage={pagination.goToNextPage}
                        onPrevPage={pagination.goToPrevPage}
                        hasNextPage={pagination.hasNextPage}
                        hasPrevPage={pagination.hasPrevPage}
                        itemLabel="surveys"
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default SurveyorIssuanceSurveyPage;
