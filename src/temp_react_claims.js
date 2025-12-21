import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Pagination from '../../../components/ui/Pagination';
import DynamicTableWithFilters from '../../../components/ui/DynamicTableWithFilters';
import { Eye, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import surveyorService from '../../../services/surveyor.service';
import usePagination from '../../../hooks/usePagination';

const SurveyorClaimsPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);

    // Get filter stage from location state
    const filterStage = location.state?.filterStage;

    useEffect(() => {
        const fetchClaims = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch list of claims
                const response = await surveyorService.listClaims({
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

                // Extract surveys array
                const data = resultData.surveys || resultData;

                // Map API response to view model
                const mappedClaims = (Array.isArray(data) ? data : []).map(item => ({
                    id: item.id,
                    claimId: item.claim_id,
                    surveyNumber: item.survey_number,
                    policyHolder: item.customer_name || 'N/A',
                    policyNumber: item.product_name || 'N/A',
                    date: item.assign_date || item.create_date || 'N/A',
                    status: item.state || 'Pending',
                    type: item.line_of_business || 'Motor',
                    amount: item.market_value || '0.00'
                }));

                setClaims(mappedClaims);
            } catch (error) {
                console.error('Error fetching claims:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClaims();
    }, [user]);

    // Update filteredData when claims change or filter stage changes
    useEffect(() => {
        if (!filterStage) {
            setFilteredData(claims);
        } else {
            // Filter by stage
            const filtered = claims.filter(claim => {
                const status = claim.status.toLowerCase();
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
    }, [claims, filterStage]);

    // Use pagination hook with filtered items
    const pagination = usePagination(filteredData, 50);

    const columns = [
        { key: 'surveyNumber', label: 'Survey No', filterable: true, filterType: 'text' },
        { key: 'policyHolder', label: 'Policy Holder', filterable: true, filterType: 'text' },
        { key: 'policyNumber', label: 'Product', filterable: true, filterType: 'text' },
        { key: 'date', label: 'Assign Date', filterable: true, filterType: 'text' },
        { key: 'status', label: 'Status', filterable: true },
        { key: 'actions', label: 'Actions', filterable: false }
    ];

    const getStatusColor = (status) => {
        const s = status.toLowerCase();
        if (s === 'approved' || s === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        if (s === 'pending' || s === 'submitted' || s === 'surveyor') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        if (s === 'rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    const renderCell = (row, columnKey) => {
        switch (columnKey) {
            case 'surveyNumber':
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-sm font-medium text-navy dark:text-white">{row.surveyNumber}</span>
                    </div>
                );
            case 'policyHolder':
            case 'policyNumber':
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
                        <Link to={`/dashboard/surveyor/claims/${row.id}`} className="p-1 text-gray-400 hover:text-primary transition-all duration-300" title="View Details">
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
                        <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">Claim Inspections</h1>
                        <p className="text-gray-600 dark:text-gray-400">View and manage assigned claim inspections.</p>
                    </div>
                </div>
            </div>

            {/* Dynamic Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <DynamicTableWithFilters
                    data={claims}
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
                        itemLabel="claims"
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default SurveyorClaimsPage;
