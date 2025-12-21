/**
 * Quotation Data Transformation Utilities
 * Transforms raw API response to display-ready format
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Raw API Response Interface
 */
export interface QuotationApiResponse {
    opportunity_number: string;
    opportunity_date: string;
    stage: string;
    product_name: string;
    name: string;
    email: string;
    phone: string;
    opportunity_risks: OpportunityRisk[];
    opportunity_proposal: OpportunityProposal[];
    opportunity_conditions: OpportunityCondition[];
    opportunity_documents: OpportunityDocument[];
}

export interface OpportunityRisk {
    vehicle_make: string;
    vehicle_model: string;
    vehicle_manufacturing_year: number;
    plate_number: string;
    vehicle_color: string;
    vehicle_body_type: string;
    vehicle_category: string;
    vehicle_usage: string;
    vehicle_number_of_seats: number;
    vehicle_state: string;
    vehicle_sum_insured: number;
    vehicle_chassis_number: string;
    vehicle_engine_number: string;
    vehicle_fuel_type: string;
}

export interface OpportunityProposal {
    proposal_sum_insured: number;
    proposal_net_premium: number;
    proposal_fees: number;
    proposal_stamp_duty: number;
    proposal_issue_fees: number;
    proposal_tax_amount: number;
    proposal_tax_percentage: number;
    proposal_gross_premium: number;
}

export interface OpportunityCondition {
    condition_name: string;
}

export interface OpportunityDocument {
    document_name: string;
    files: any[];
}

/**
 * Transformed Display Data Interface
 */
export interface QuotationDisplayData {
    header: HeaderInfo;
    customer: CustomerInfo;
    vehicle: VehicleInfo;
    pricing: PricingInfo;
    conditions: string[];
    documents: DocumentInfo[];
}

export interface HeaderInfo {
    opportunityNumber: string;
    date: string;
    stage: string;
    product: string;
}

export interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
}

export interface VehicleInfo {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    color: string;
    bodyType: string;
    category: string;
    usage: string;
    seats: number;
    condition: string;
    sumInsured: string;
    chassisNumber: string;
    engineNumber: string;
    fuelType: string;
}

export interface PricingInfo {
    sumInsured: string;
    netPremium: string;
    fees: string;
    stampDuty: string;
    issueFees: string;
    taxAmount: string;
    taxPercentage: string;
    grossPremium: string;
}

export interface DocumentInfo {
    name: string;
    status: 'Pending' | 'Uploaded';
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Main transformation function
 * Converts raw API response to display-ready format
 */
export function transformQuotationData(apiResponse: QuotationApiResponse): QuotationDisplayData {
    return {
        header: extractHeaderInfo(apiResponse),
        customer: extractCustomerInfo(apiResponse),
        vehicle: extractVehicleInfo(apiResponse),
        pricing: extractPricingInfo(apiResponse),
        conditions: extractConditions(apiResponse),
        documents: extractDocuments(apiResponse)
    };
}

/**
 * Extract header information
 */
function extractHeaderInfo(data: QuotationApiResponse): HeaderInfo {
    return {
        opportunityNumber: data.opportunity_number || 'N/A',
        date: formatDate(data.opportunity_date),
        stage: capitalizeText(data.stage) || 'N/A',
        product: data.product_name || 'N/A'
    };
}

/**
 * Extract customer information
 */
function extractCustomerInfo(data: QuotationApiResponse): CustomerInfo {
    return {
        name: capitalizeText(data.name) || 'N/A',
        email: data.email || 'N/A',
        phone: data.phone || 'N/A'
    };
}

/**
 * Extract vehicle information
 */
function extractVehicleInfo(data: QuotationApiResponse): VehicleInfo {
    const vehicle = data.opportunity_risks?.[0];

    if (!vehicle) {
        return getEmptyVehicleInfo();
    }

    return {
        make: capitalizeText(vehicle.vehicle_make) || 'N/A',
        model: capitalizeText(vehicle.vehicle_model) || 'N/A',
        year: vehicle.vehicle_manufacturing_year || 0,
        plateNumber: vehicle.plate_number?.toUpperCase() || 'N/A',
        color: capitalizeText(vehicle.vehicle_color) || 'N/A',
        bodyType: capitalizeText(vehicle.vehicle_body_type) || 'N/A',
        category: capitalizeText(vehicle.vehicle_category) || 'N/A',
        usage: capitalizeText(vehicle.vehicle_usage) || 'N/A',
        seats: vehicle.vehicle_number_of_seats || 0,
        condition: capitalizeText(vehicle.vehicle_state) || 'N/A',
        sumInsured: formatCurrency(vehicle.vehicle_sum_insured),
        chassisNumber: vehicle.vehicle_chassis_number?.toUpperCase() || 'N/A',
        engineNumber: vehicle.vehicle_engine_number?.toUpperCase() || 'N/A',
        fuelType: capitalizeText(vehicle.vehicle_fuel_type) || 'N/A'
    };
}

/**
 * Extract pricing information
 */
function extractPricingInfo(data: QuotationApiResponse): PricingInfo {
    const proposal = data.opportunity_proposal?.[0];

    if (!proposal) {
        return getEmptyPricingInfo();
    }

    return {
        sumInsured: formatCurrency(proposal.proposal_sum_insured),
        netPremium: formatCurrency(proposal.proposal_net_premium),
        fees: formatCurrency(proposal.proposal_fees),
        stampDuty: formatCurrency(proposal.proposal_stamp_duty),
        issueFees: formatCurrency(proposal.proposal_issue_fees),
        taxAmount: formatCurrency(proposal.proposal_tax_amount),
        taxPercentage: formatPercentage(proposal.proposal_tax_percentage),
        grossPremium: formatCurrency(proposal.proposal_gross_premium)
    };
}

/**
 * Extract policy conditions
 */
function extractConditions(data: QuotationApiResponse): string[] {
    if (!data.opportunity_conditions || data.opportunity_conditions.length === 0) {
        return [];
    }

    return data.opportunity_conditions
        .map(condition => condition.condition_name)
        .filter(name => name && name.trim() !== '');
}

/**
 * Extract documents with status
 */
function extractDocuments(data: QuotationApiResponse): DocumentInfo[] {
    if (!data.opportunity_documents || data.opportunity_documents.length === 0) {
        return [];
    }

    return data.opportunity_documents.map(doc => ({
        name: doc.document_name || 'Unnamed Document',
        status: (doc.files && doc.files.length > 0) ? 'Uploaded' : 'Pending'
    }));
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format number as Egyptian currency (EGP)
 * Uses comma separators for thousands
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
        return '0 EGP';
    }

    // Format with commas using toLocaleString
    const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return `${formatted} EGP`;
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }

    return `${value}%`;
}

/**
 * Format date to readable format
 * Converts ISO date string to DD/MM/YYYY format
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
        return 'N/A';
    }

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        return dateString; // Return original on error
    }
}

/**
 * Capitalize text (first letter of each word)
 */
export function capitalizeText(text: string | null | undefined): string {
    if (!text) {
        return '';
    }

    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get empty vehicle info structure
 */
function getEmptyVehicleInfo(): VehicleInfo {
    return {
        make: 'N/A',
        model: 'N/A',
        year: 0,
        plateNumber: 'N/A',
        color: 'N/A',
        bodyType: 'N/A',
        category: 'N/A',
        usage: 'N/A',
        seats: 0,
        condition: 'N/A',
        sumInsured: '0 EGP',
        chassisNumber: 'N/A',
        engineNumber: 'N/A',
        fuelType: 'N/A'
    };
}

/**
 * Get empty pricing info structure
 */
function getEmptyPricingInfo(): PricingInfo {
    return {
        sumInsured: '0 EGP',
        netPremium: '0 EGP',
        fees: '0 EGP',
        stampDuty: '0 EGP',
        issueFees: '0 EGP',
        taxAmount: '0 EGP',
        taxPercentage: '0%',
        grossPremium: '0 EGP'
    };
}
