import ExcelJS from 'exceljs';
import { Order, Product, Customer } from '@/types/admin';

export interface KPIItem {
    label: string;
    value: string | number;
}

export interface ColumnDef<T> {
    header: string;
    key: string;
    width?: number;
    alignment?: 'left' | 'center' | 'right';
    format?: (value: any, item: T) => string | number;
    type?: 'string' | 'number' | 'currency' | 'date' | 'status';
}

const PALETTE = {
    brandNavy: 'FF0F172A',
    headerNavy: 'FF1E293B',
    accentTeal: 'FF0D9488',
    tableHeaderBg: 'FF1E293B',
    tableHeaderText: 'FFFFFFFF',
    cardLabelBg: 'FFF1F5F9',
    cardLabelText: 'FF475569',
    cardValueBg: 'FFFFFFFF',
    cardValueText: 'FF0F172A',
    zebraBg: 'FFF8FAFC',
    borderColor: 'FFE2E8F0',
    totalBg: 'FFF1F5F9',
    totalText: 'FF0F172A',

    // Status colors (Fill + Text)
    statusSuccessBg: 'FFDCFCE7',
    statusSuccessText: 'FF15803D',
    statusWarningBg: 'FFFEF3C7',
    statusWarningText: 'FFB45309',
    statusDangerBg: 'FFFEE2E2',
    statusDangerText: 'FFB91C1C',
    statusInfoBg: 'FFDBEAFE',
    statusInfoText: 'FF1D4ED8',
    statusNeutralBg: 'FFF1F5F9',
    statusNeutralText: 'FF64748B',
};

const getStatusStyle = (statusStr: string) => {
    const s = String(statusStr || '').toLowerCase();
    if (['delivered', 'completed', 'received', 'approved', 'paid', 'active'].some(k => s.includes(k))) {
        return { fill: PALETTE.statusSuccessBg, font: PALETTE.statusSuccessText };
    }
    if (['pending', 'pending_cod', 'in progress', 'testing'].some(k => s.includes(k))) {
        return { fill: PALETTE.statusWarningBg, font: PALETTE.statusWarningText };
    }
    if (['cancelled', 'failed', 'failed_rto', 'rejected', 'rto', 'refunded', 'blocked'].some(k => s.includes(k))) {
        return { fill: PALETTE.statusDangerBg, font: PALETTE.statusDangerText };
    }
    if (['confirmed', 'shipped', 'processing'].some(k => s.includes(k))) {
        return { fill: PALETTE.statusInfoBg, font: PALETTE.statusInfoText };
    }
    return { fill: PALETTE.statusNeutralBg, font: PALETTE.statusNeutralText };
};

const triggerDownload = async (workbook: ExcelJS.Workbook, filename: string) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export async function exportWorkbookTemplate<T>({
    sheetName,
    reportTitle,
    subtitle,
    kpis = [],
    columns,
    data,
    filename,
    totals,
}: {
    sheetName: string;
    reportTitle: string;
    subtitle?: string;
    kpis?: KPIItem[];
    columns: ColumnDef<T>[];
    data: T[];
    filename: string;
    totals?: { [colKey: string]: number | string };
}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VorionMart Admin';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }],
    });

    const totalCols = Math.max(columns.length, kpis.length > 0 ? kpis.length * 2 : 6);

    // Row 1: Brand & Report Title Banner
    const titleRow = worksheet.addRow([`VORIONMART  |  ${reportTitle.toUpperCase()}`]);
    worksheet.mergeCells(1, 1, 1, totalCols);
    titleRow.height = 36;
    titleRow.getCell(1).font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.brandNavy } };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Metadata / Subtitle Banner
    const generatedDateStr = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const metaText = subtitle
        ? `${subtitle}   •   Generated: ${generatedDateStr}   •   Total Records: ${data.length}`
        : `Generated: ${generatedDateStr}   •   Total Records: ${data.length}   •   System: VorionMart E-Commerce`;

    const metaRow = worksheet.addRow([metaText]);
    worksheet.mergeCells(2, 1, 2, totalCols);
    metaRow.height = 22;
    metaRow.getCell(1).font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF94A3B8' } };
    metaRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.headerNavy } };
    metaRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Blank separator
    const emptyRow1 = worksheet.addRow([]);
    emptyRow1.height = 10;

    // Optional KPI Summary Cards Block (Rows 4 & 5)
    let currentDataRowIdx = 4;
    if (kpis && kpis.length > 0) {
        const kpiColsSpan = Math.max(1, Math.floor(totalCols / kpis.length));
        
        const labelRowVals: string[] = [];
        const valRowVals: (string | number)[] = [];

        kpis.forEach((kpi) => {
            labelRowVals.push(kpi.label.toUpperCase());
            valRowVals.push(kpi.value);
            for (let i = 1; i < kpiColsSpan; i++) {
                labelRowVals.push('');
                valRowVals.push('');
            }
        });

        const kpiLabelRow = worksheet.addRow(labelRowVals);
        kpiLabelRow.height = 18;
        const kpiValRow = worksheet.addRow(valRowVals);
        kpiValRow.height = 26;

        let colPointer = 1;
        kpis.forEach((kpi, idx) => {
            const startCol = colPointer;
            const endCol = idx === kpis.length - 1 ? totalCols : colPointer + kpiColsSpan - 1;
            colPointer = endCol + 1;

            if (startCol < endCol) {
                worksheet.mergeCells(kpiLabelRow.number, startCol, kpiLabelRow.number, endCol);
                worksheet.mergeCells(kpiValRow.number, startCol, kpiValRow.number, endCol);
            }

            const lblCell = kpiLabelRow.getCell(startCol);
            lblCell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: PALETTE.cardLabelText } };
            lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardLabelBg } };
            lblCell.alignment = { vertical: 'middle', horizontal: 'center' };
            lblCell.border = {
                top: { style: 'thin', color: { argb: PALETTE.borderColor } },
                left: { style: 'thin', color: { argb: PALETTE.borderColor } },
                right: { style: 'thin', color: { argb: PALETTE.borderColor } },
            };

            const valCell = kpiValRow.getCell(startCol);
            valCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: PALETTE.cardValueText } };
            valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.cardValueBg } };
            valCell.alignment = { vertical: 'middle', horizontal: 'center' };
            valCell.border = {
                bottom: { style: 'medium', color: { argb: PALETTE.accentTeal } },
                left: { style: 'thin', color: { argb: PALETTE.borderColor } },
                right: { style: 'thin', color: { argb: PALETTE.borderColor } },
            };
        });

        const emptyRow2 = worksheet.addRow([]);
        emptyRow2.height = 12;
        currentDataRowIdx = emptyRow2.number + 1;
    }

    // Table Header Row
    const headerRowValues = columns.map(col => col.header);
    const tableHeaderRow = worksheet.addRow(headerRowValues);
    tableHeaderRow.height = 28;

    tableHeaderRow.eachCell((cell, colIndex) => {
        const colDef = columns[colIndex - 1];
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.tableHeaderText } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.tableHeaderBg } };
        cell.alignment = {
            vertical: 'middle',
            horizontal: colDef?.alignment || (colDef?.type === 'currency' || colDef?.type === 'number' ? 'right' : 'left'),
            wrapText: false,
        };
        cell.border = {
            top: { style: 'medium', color: { argb: PALETTE.headerNavy } },
            bottom: { style: 'medium', color: { argb: PALETTE.headerNavy } },
            left: { style: 'thin', color: { argb: 'FF334155' } },
            right: { style: 'thin', color: { argb: 'FF334155' } },
        };
    });

    const headerRowNumber = tableHeaderRow.number;

    // Data Rows
    data.forEach((item, rowIdx) => {
        const rowValues = columns.map((col) => {
            const rawVal = (item as any)[col.key];
            if (col.format) {
                return col.format(rawVal, item);
            }
            if (rawVal === null || rawVal === undefined) return '-';
            return rawVal;
        });

        const dataRow = worksheet.addRow(rowValues);
        dataRow.height = 22;

        const isZebra = rowIdx % 2 === 1;
        const rowBg = isZebra ? PALETTE.zebraBg : 'FFFFFFFF';

        dataRow.eachCell((cell, colIndex) => {
            const colDef = columns[colIndex - 1];
            cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
            cell.border = {
                top: { style: 'thin', color: { argb: PALETTE.borderColor } },
                bottom: { style: 'thin', color: { argb: PALETTE.borderColor } },
                left: { style: 'thin', color: { argb: PALETTE.borderColor } },
                right: { style: 'thin', color: { argb: PALETTE.borderColor } },
            };

            const alignment = colDef?.alignment ||
                (colDef?.type === 'currency' || colDef?.type === 'number'
                    ? 'right'
                    : colDef?.type === 'date' || colDef?.type === 'status'
                    ? 'center'
                    : 'left');

            cell.alignment = {
                vertical: 'middle',
                horizontal: alignment,
            };

            if (colDef?.type === 'status') {
                const statusStyle = getStatusStyle(String(cell.value || ''));
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusStyle.fill } };
                cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: statusStyle.font } };
            } else {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            }

            if (colDef?.type === 'currency' && typeof cell.value === 'number') {
                cell.numFmt = '"₹"#,##0.00';
            }
        });
    });

    // Optional Totals Row at the bottom
    if (totals && Object.keys(totals).length > 0) {
        const totalRowValues = columns.map((col, idx) => {
            if (idx === 0) return 'TOTAL';
            if (totals[col.key] !== undefined) return totals[col.key];
            return '';
        });

        const totalsRow = worksheet.addRow(totalRowValues);
        totalsRow.height = 26;

        totalsRow.eachCell((cell, colIndex) => {
            const colDef = columns[colIndex - 1];
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: PALETTE.totalText } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.totalBg } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF64748B' } },
                bottom: { style: 'double', color: { argb: 'FF0F172A' } },
                left: { style: 'thin', color: { argb: PALETTE.borderColor } },
                right: { style: 'thin', color: { argb: PALETTE.borderColor } },
            };

            const alignment = colIndex === 1
                ? 'left'
                : colDef?.alignment ||
                  (colDef?.type === 'currency' || colDef?.type === 'number' ? 'right' : 'left');

            cell.alignment = { vertical: 'middle', horizontal: alignment };

            if (colDef?.type === 'currency' && typeof cell.value === 'number') {
                cell.numFmt = '"₹"#,##0.00';
            }
        });
    }

    // Calculate auto column widths
    columns.forEach((col, idx) => {
        const colNum = idx + 1;
        const column = worksheet.getColumn(colNum);
        let maxLen = col.header.length;

        data.forEach(item => {
            const val = col.format ? col.format((item as any)[col.key], item) : (item as any)[col.key];
            const strVal = val !== null && val !== undefined ? String(val) : '';
            if (strVal.length > maxLen) {
                maxLen = strVal.length;
            }
        });

        const calculatedWidth = Math.max(col.width || 12, Math.min(maxLen + 3, 50));
        column.width = calculatedWidth;
    });

    // Enable Excel Auto-Filter on the table header
    worksheet.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: columns.length },
    };

    // Freeze panes: Keep headers above the table in view
    worksheet.views = [
        {
            state: 'frozen',
            ySplit: headerRowNumber,
            showGridLines: true,
        },
    ];

    await triggerDownload(workbook, filename);
}

// -------------------------------------------------------------
// DOMAIN EXPORTERS
// -------------------------------------------------------------

export async function exportOrdersToExcel(
    orders: Order[],
    options?: { filename?: string; subtitle?: string }
) {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalCost = orders.reduce((sum, o) => sum + (Number(o.supplier_total_cost) || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);
    const deliveredCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    const kpis: KPIItem[] = [
        { label: 'Total Orders', value: orders.length },
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        { label: 'Total Supplier Cost', value: `₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        { label: 'Net Profit', value: `₹${totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        { label: 'Delivered', value: deliveredCount },
        { label: 'Pending', value: pendingCount },
    ];

    const columns: ColumnDef<Order>[] = [
        { header: 'Order ID', key: 'order_id', width: 16, alignment: 'center' },
        {
            header: 'Date & Time',
            key: 'created_at',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
        },
        {
            header: 'Customer Name',
            key: 'customer',
            width: 22,
            format: (_, o) => o.customer?.name || '-',
        },
        {
            header: 'Customer Phone',
            key: 'customer',
            width: 16,
            format: (_, o) => o.customer?.phone || '-',
        },
        {
            header: 'City',
            key: 'delivery_city',
            width: 16,
            format: (val, o) => val || o.customer?.city || '-',
        },
        {
            header: 'Pincode',
            key: 'delivery_pincode',
            width: 12,
            alignment: 'center',
            format: (val) => val || '-',
        },
        {
            header: 'Products Summary',
            key: 'items',
            width: 32,
            format: (items) => {
                if (!Array.isArray(items) || items.length === 0) return '-';
                return items.map(it => `${it.product_name || it.product?.name || 'Item'} (x${it.quantity || 1})`).join(', ');
            },
        },
        {
            header: 'Items Count',
            key: 'items',
            width: 12,
            alignment: 'center',
            type: 'number',
            format: (items) => Array.isArray(items) ? items.reduce((s, it) => s + (Number(it.quantity) || 1), 0) : 1,
        },
        {
            header: 'Payment Status',
            key: 'payment_status_display',
            width: 18,
            type: 'status',
            format: (val, o) => val || o.payment_status || 'Pending',
        },
        {
            header: 'Order Status',
            key: 'status',
            width: 16,
            type: 'status',
            format: (val, o) => o.status_display || (val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Pending'),
        },
        {
            header: 'Total Amount (₹)',
            key: 'total_amount',
            width: 18,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Cost (₹)',
            key: 'supplier_total_cost',
            width: 16,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Profit (₹)',
            key: 'profit',
            width: 16,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Meesho ID',
            key: 'meesho_order_id',
            width: 16,
            alignment: 'center',
            format: (val) => val || '-',
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Orders_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Orders',
        reportTitle: 'Orders Management Report',
        subtitle: options?.subtitle || 'All confirmed and historical customer orders',
        kpis,
        columns,
        data: orders,
        filename,
        totals: {
            total_amount: totalRevenue,
            supplier_total_cost: totalCost,
            profit: totalProfit,
        },
    });
}

export async function exportPaymentsToExcel(
    orders: Order[],
    stats?: { total_revenue?: number; paid?: number; pending?: number; refunded?: number; failed?: number },
    options?: { filename?: string; subtitle?: string }
) {
    const totalRevenue = stats?.total_revenue ?? orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const paidCount = stats?.paid ?? orders.filter(o => ['received', 'paid', 'received_from_meesho'].includes(o.payment_status || '')).length;
    const pendingCount = stats?.pending ?? orders.filter(o => ['pending', 'pending_cod'].includes(o.payment_status || '')).length;
    const refundedCount = stats?.refunded ?? orders.filter(o => o.payment_status === 'refunded').length;
    const failedCount = stats?.failed ?? orders.filter(o => ['failed_rto', 'cancelled'].includes(o.payment_status || '')).length;

    const kpis: KPIItem[] = [
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        { label: 'Total Records', value: orders.length },
        { label: 'Paid / Received', value: paidCount },
        { label: 'Pending COD / Unpaid', value: pendingCount },
        { label: 'Refunded', value: refundedCount },
        { label: 'Failed (RTO)', value: failedCount },
    ];

    const columns: ColumnDef<Order>[] = [
        { header: 'Order ID', key: 'order_id', width: 16, alignment: 'center' },
        {
            header: 'Date',
            key: 'created_at',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
        },
        {
            header: 'Customer',
            key: 'customer',
            width: 22,
            format: (_, o) => o.customer?.name || '-',
        },
        {
            header: 'Contact',
            key: 'customer',
            width: 16,
            format: (_, o) => o.customer?.phone || '-',
        },
        {
            header: 'Payment Method',
            key: 'is_cod',
            width: 16,
            alignment: 'center',
            format: (isCod, o) => o.payment_method || (isCod ? 'Cash on Delivery (COD)' : 'Prepaid'),
        },
        {
            header: 'Payment Status',
            key: 'payment_status',
            width: 20,
            type: 'status',
            format: (val, o) => o.payment_status_display || val || 'Pending',
        },
        {
            header: 'Order Status',
            key: 'status',
            width: 16,
            type: 'status',
            format: (val, o) => o.status_display || (val ? val.charAt(0).toUpperCase() + val.slice(1) : '-'),
        },
        {
            header: 'Order Amount (₹)',
            key: 'total_amount',
            width: 18,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Meesho Order ID',
            key: 'meesho_order_id',
            width: 18,
            alignment: 'center',
            format: (val) => val || '-',
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Payments_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Payments',
        reportTitle: 'Payment & Financial Reconciliation',
        subtitle: options?.subtitle || 'Order payment collections, COD settlements, and refunds',
        kpis,
        columns,
        data: orders,
        filename,
        totals: {
            total_amount: totalRevenue,
        },
    });
}

export async function exportReturnsToExcel(
    returns: any[],
    options?: { filename?: string; subtitle?: string }
) {
    const totalAmount = returns.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const approvedCount = returns.filter(r => r.status === 'approved').length;
    const pendingCount = returns.filter(r => r.status === 'pending').length;
    const refundedCount = returns.filter(r => r.status === 'refunded').length;
    const rejectedCount = returns.filter(r => r.status === 'rejected').length;

    const kpis: KPIItem[] = [
        { label: 'Total Requests', value: returns.length },
        { label: 'Total Value', value: `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
        { label: 'Pending Approval', value: pendingCount },
        { label: 'Approved', value: approvedCount },
        { label: 'Refunded', value: refundedCount },
        { label: 'Rejected', value: rejectedCount },
    ];

    const columns: ColumnDef<any>[] = [
        { header: 'Order ID', key: 'order_id', width: 16, alignment: 'center' },
        {
            header: 'Requested Date',
            key: 'requested_date',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
        },
        {
            header: 'Customer Name',
            key: 'customer_name',
            width: 22,
            format: (val) => val || '-',
        },
        {
            header: 'Customer Email',
            key: 'customer_email',
            width: 24,
            format: (val) => val || '-',
        },
        {
            header: 'Product Name',
            key: 'product_name',
            width: 28,
            format: (val) => val || '-',
        },
        {
            header: 'Amount (₹)',
            key: 'amount',
            width: 16,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Return Reason',
            key: 'reason',
            width: 30,
            format: (val) => val || 'Not specified',
        },
        {
            header: 'Return Status',
            key: 'status',
            width: 16,
            type: 'status',
            format: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Pending',
        },
        {
            header: 'Payment Status',
            key: 'payment_status_display',
            width: 18,
            type: 'status',
            format: (val, r) => val || r.payment_status || '-',
        },
        {
            header: 'Processed Date',
            key: 'processed_date',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-',
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Returns_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Returns',
        reportTitle: 'Customer Returns & Replacement Claims',
        subtitle: options?.subtitle || 'Product return requests, RMA tracking, and refund status',
        kpis,
        columns,
        data: returns,
        filename,
        totals: {
            amount: totalAmount,
        },
    });
}

export async function exportProductsToExcel(
    products: Product[],
    options?: { filename?: string; subtitle?: string }
) {
    const totalInventoryValue = products.reduce((sum, p) => sum + ((Number(p.our_price ?? p.price) || 0) * (Number(p.stock) || 0)), 0);
    const activeCount = products.filter(p => p.is_active).length;
    const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= 5).length;
    const totalSold = products.reduce((sum, p) => sum + (Number(p.sold_count) || 0), 0);

    const kpis: KPIItem[] = [
        { label: 'Total Products', value: products.length },
        { label: 'Active in Store', value: activeCount },
        { label: 'Low Stock (≤5)', value: lowStockCount },
        { label: 'Total Units Sold', value: totalSold },
        { label: 'Stock Asset Value', value: `₹${totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
    ];

    const columns: ColumnDef<Product>[] = [
        { header: 'Product ID', key: 'id', width: 12, alignment: 'center' },
        { header: 'Product Name', key: 'name', width: 32 },
        { header: 'SKU', key: 'sku', width: 18, alignment: 'center', format: (val) => val || '-' },
        {
            header: 'Category',
            key: 'category_name',
            width: 20,
            format: (val, p) => val || p.category?.name || '-',
        },
        {
            header: 'Shop / Vendor',
            key: 'shop_name',
            width: 22,
            format: (val, p) => val || p.shop?.name || '-',
        },
        {
            header: 'Supplier Price (₹)',
            key: 'supplier_price',
            width: 18,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Our Selling Price (₹)',
            key: 'our_price',
            width: 20,
            type: 'currency',
            format: (val, p) => Number(val ?? p.price) || 0,
        },
        {
            header: 'MRP (₹)',
            key: 'mrp',
            width: 16,
            type: 'currency',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Profit Margin (₹)',
            key: 'profit_margin',
            width: 18,
            type: 'currency',
            format: (val, p) => {
                if (val !== undefined && val !== null) return Number(val);
                const sp = Number(p.our_price ?? p.price) || 0;
                const cp = Number(p.supplier_price) || 0;
                return sp - cp;
            },
        },
        {
            header: 'Stock Qty',
            key: 'stock',
            width: 14,
            alignment: 'center',
            type: 'number',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Status',
            key: 'is_active',
            width: 14,
            type: 'status',
            format: (val) => val ? 'Active' : 'Inactive',
        },
        {
            header: 'Approval',
            key: 'approval_status',
            width: 16,
            type: 'status',
            format: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : 'Approved',
        },
        {
            header: 'Units Sold',
            key: 'sold_count',
            width: 14,
            alignment: 'center',
            type: 'number',
            format: (val) => Number(val) || 0,
        },
        {
            header: 'Page Views',
            key: 'views',
            width: 14,
            alignment: 'center',
            type: 'number',
            format: (val) => Number(val) || 0,
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Products_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Products',
        reportTitle: 'Master Product Catalog',
        subtitle: options?.subtitle || 'Complete SKU inventory, supplier costs, and retail prices',
        kpis,
        columns,
        data: products,
        filename,
    });
}

export async function exportCustomersToExcel(
    customers: Customer[],
    options?: { filename?: string; subtitle?: string }
) {
    const uniqueCities = new Set(customers.map(c => c.city).filter(Boolean)).size;

    const kpis: KPIItem[] = [
        { label: 'Total Customers', value: customers.length },
        { label: 'Cities Covered', value: uniqueCities },
        { label: 'Active Base', value: '100%' },
    ];

    const columns: ColumnDef<Customer>[] = [
        { header: 'Customer ID', key: 'id', width: 14, alignment: 'center' },
        { header: 'Customer Name', key: 'name', width: 26 },
        { header: 'Email Address', key: 'email', width: 28 },
        { header: 'Phone Number', key: 'phone', width: 18, alignment: 'center' },
        { header: 'City', key: 'city', width: 20 },
        {
            header: 'Registered Date',
            key: 'created_at',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleDateString('en-IN') : '-',
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Customers_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Customers',
        reportTitle: 'Customer Directory & Profiles',
        subtitle: options?.subtitle || 'Registered storefront customers and contact directory',
        kpis,
        columns,
        data: customers,
        filename,
    });
}

export interface EnquiryItem {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'pending' | 'responded' | string;
    is_read: boolean;
    created_at: string;
}

export async function exportEnquiriesToExcel(
    enquiries: EnquiryItem[],
    options?: { filename?: string; subtitle?: string }
) {
    const totalCount = enquiries.length;
    const respondedCount = enquiries.filter(e => e.status === 'responded').length;
    const pendingCount = enquiries.filter(e => e.status === 'pending').length;
    const unreadCount = enquiries.filter(e => !e.is_read).length;

    const kpis: KPIItem[] = [
        { label: 'Total Inquiries', value: totalCount },
        { label: 'Pending Action', value: pendingCount },
        { label: 'Responded', value: respondedCount },
        { label: 'Unread', value: unreadCount },
    ];

    const columns: ColumnDef<EnquiryItem>[] = [
        { header: 'ID', key: 'id', width: 10, alignment: 'center' },
        {
            header: 'Date',
            key: 'created_at',
            width: 18,
            type: 'date',
            format: (val) => val ? new Date(val).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-',
        },
        { header: 'Sender Name', key: 'name', width: 22 },
        { header: 'Email Address', key: 'email', width: 28 },
        { header: 'Subject', key: 'subject', width: 28 },
        {
            header: 'Message Preview',
            key: 'message',
            width: 45,
            format: (val) => String(val || '').slice(0, 150),
        },
        {
            header: 'Status',
            key: 'status',
            width: 16,
            alignment: 'center',
            format: (val) => (val === 'responded' ? 'Responded' : 'Pending'),
        },
        {
            header: 'Read State',
            key: 'is_read',
            width: 14,
            alignment: 'center',
            format: (val) => (val ? 'Read' : 'Unread'),
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Enquiries_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Enquiries',
        reportTitle: 'Customer Inquiries & Support Tickets',
        subtitle: options?.subtitle || 'Inbound customer support messages and enquiries',
        kpis,
        columns,
        data: enquiries,
        filename,
    });
}

export async function exportOrderInvoiceToExcel(
    order: Order,
    options?: { filename?: string }
) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VorionMart Admin';
    workbook.created = new Date();

    const orderCode = String(order.order_id || order.id);
    const worksheet = workbook.addWorksheet(`Invoice-${orderCode.slice(0, 20)}`, {
        views: [{ showGridLines: true }],
    });

    const totalCols = 6;

    // Row 1: VorionMart Header
    const row1 = worksheet.addRow(['VORIONMART  |  TAX INVOICE']);
    worksheet.mergeCells(1, 1, 1, totalCols);
    row1.height = 34;
    row1.getCell(1).font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    row1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.brandNavy } };
    row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Subtitle
    const row2 = worksheet.addRow([`Invoice / Order Confirmation  •  Generated: ${new Date().toLocaleString('en-IN')}`]);
    worksheet.mergeCells(2, 1, 2, totalCols);
    row2.height = 20;
    row2.getCell(1).font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF94A3B8' } };
    row2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.headerNavy } };
    row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // Row 3 Blank

    // Order Meta Info Box
    const metaStart = worksheet.rowCount + 1;
    worksheet.addRow(['Order ID:', orderCode, '', 'Order Date:', order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : '-']);
    worksheet.addRow(['Order Status:', (order.status || 'pending').toUpperCase(), '', 'Payment Mode:', order.payment_method || 'COD']);
    worksheet.addRow(['Payment Status:', (order.payment_status || 'Pending').toUpperCase(), '', 'Tracking No:', order.tracking_number || '-']);

    for (let r = metaStart; r <= metaStart + 2; r++) {
        const row = worksheet.getRow(r);
        row.getCell(1).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF475569' } };
        row.getCell(2).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF0F172A' } };
        row.getCell(4).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF475569' } };
        row.getCell(5).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF0F172A' } };
    }

    worksheet.addRow([]); // Blank

    // Customer Shipping Address Section
    const custRow = worksheet.addRow(['BILL TO / SHIP TO:']);
    worksheet.mergeCells(custRow.number, 1, custRow.number, totalCols);
    custRow.getCell(1).font = { name: 'Segoe UI', bold: true, size: 10.5, color: { argb: PALETTE.brandNavy } };
    custRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

    const customerName = order.customer?.name || (order as any).customer_name || 'Customer';
    const customerPhone = order.customer?.phone || (order as any).phone || '-';
    const customerEmail = order.customer?.email || (order as any).email || '-';
    const rawAddr = (order as any).shipping_address || (order.customer?.city ? `${order.customer.city}` : '-');
    const shippingAddr = typeof rawAddr === 'object' && rawAddr !== null
        ? [rawAddr.address_line1 || rawAddr.address, rawAddr.city, rawAddr.state, rawAddr.postal_code || rawAddr.pincode].filter(Boolean).join(', ')
        : String(rawAddr || '-');

    worksheet.addRow(['Customer Name:', customerName, '', 'Phone:', customerPhone]);
    worksheet.addRow(['Email:', customerEmail, '', 'Address:', shippingAddr]);

    worksheet.addRow([]); // Blank

    // Items Table Header
    const itemsHeader = worksheet.addRow(['#', 'Product Description', 'SKU', 'Unit Price (₹)', 'Qty', 'Line Total (₹)']);
    itemsHeader.height = 26;
    itemsHeader.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.headerNavy } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin', color: { argb: PALETTE.borderColor } },
            bottom: { style: 'medium', color: { argb: PALETTE.accentTeal } },
        };
    });
    itemsHeader.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    // Line items
    const items = order.items || [];
    let itemsSubtotal = 0;

    items.forEach((item: any, idx: number) => {
        const itemPrice = Number(item.price || item.unit_price || 0);
        const itemQty = Number(item.quantity || 1);
        const itemTotal = Number(item.total || itemPrice * itemQty);
        itemsSubtotal += itemTotal;

        const row = worksheet.addRow([
            idx + 1,
            item.product_name || item.product?.name || `Product #${item.product_id || item.product || ''}`,
            item.sku || item.product?.sku || '-',
            itemPrice,
            itemQty,
            itemTotal,
        ]);
        row.height = 22;

        const isEven = idx % 2 === 1;
        row.eachCell((cell, colNum) => {
            cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
            if (isEven) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.zebraBg } };
            }
            cell.border = {
                bottom: { style: 'thin', color: { argb: PALETTE.borderColor } },
                left: { style: 'thin', color: { argb: PALETTE.borderColor } },
                right: { style: 'thin', color: { argb: PALETTE.borderColor } },
            };
            if (colNum === 1 || colNum === 5) cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (colNum === 2) cell.alignment = { vertical: 'middle', horizontal: 'left' };
            if (colNum === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if (colNum === 4 || colNum === 6) {
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.numFmt = '₹#,##0.00';
            }
        });
    });

    if (items.length === 0) {
        const emptyRow = worksheet.addRow(['-', 'No line item details recorded', '-', 0, 1, Number(order.total_amount) || 0]);
        emptyRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
        emptyRow.getCell(4).numFmt = '₹#,##0.00';
        emptyRow.getCell(6).numFmt = '₹#,##0.00';
    }

    // Summary Rows
    const grandTotal = Number(order.total_amount) || itemsSubtotal;
    const shipping = Number(order.shipping_charge || 0);
    const discount = Number(order.discount_amount || 0);

    const subtotalRow = worksheet.addRow(['', '', '', '', 'Subtotal:', itemsSubtotal || grandTotal]);
    subtotalRow.getCell(5).font = { name: 'Segoe UI', bold: true };
    subtotalRow.getCell(6).font = { name: 'Segoe UI', bold: true };
    subtotalRow.getCell(6).numFmt = '₹#,##0.00';

    if (shipping > 0) {
        const shipRow = worksheet.addRow(['', '', '', '', 'Shipping:', shipping]);
        shipRow.getCell(5).font = { name: 'Segoe UI' };
        shipRow.getCell(6).numFmt = '₹#,##0.00';
    }
    if (discount > 0) {
        const discRow = worksheet.addRow(['', '', '', '', 'Discount:', -discount]);
        discRow.getCell(5).font = { name: 'Segoe UI', color: { argb: 'FF16A34A' } };
        discRow.getCell(6).font = { name: 'Segoe UI', color: { argb: 'FF16A34A' } };
        discRow.getCell(6).numFmt = '₹#,##0.00';
    }

    const grandRow = worksheet.addRow(['', '', '', '', 'GRAND TOTAL:', grandTotal]);
    grandRow.height = 26;
    grandRow.getCell(5).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: PALETTE.brandNavy } };
    grandRow.getCell(6).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: PALETTE.brandNavy } };
    grandRow.getCell(6).numFmt = '₹#,##0.00';
    grandRow.getCell(5).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
    grandRow.getCell(6).border = { top: { style: 'thin' }, bottom: { style: 'double' } };

    // Column widths
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 36;
    worksheet.getColumn(3).width = 16;
    worksheet.getColumn(4).width = 18;
    worksheet.getColumn(5).width = 16;
    worksheet.getColumn(6).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const filename = options?.filename || `Invoice_${orderCode}.xlsx`;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
}

export async function exportAnalyticsToExcel(
    data: {
        products: Array<{ id: number; name: string; views: number; sold_count: number; current_price?: number | string }>;
        top_partners?: Array<{ name: string; email: string; total_payout: number }>;
    },
    options?: { filename?: string; subtitle?: string }
) {
    const totalVisits = data.products.reduce((s, p) => s + (Number(p.views) || 0), 0);
    const totalSold = data.products.reduce((s, p) => s + (Number(p.sold_count) || 0), 0);
    const avgConversion = totalVisits > 0 ? ((totalSold / totalVisits) * 100).toFixed(1) + '%' : '0.0%';

    const kpis: KPIItem[] = [
        { label: 'Tracked Products', value: data.products.length },
        { label: 'Total Page Visits', value: totalVisits.toLocaleString('en-IN') },
        { label: 'Total Orders', value: totalSold.toLocaleString('en-IN') },
        { label: 'Visit to Order Rate', value: avgConversion },
    ];

    const columns: ColumnDef<any>[] = [
        { header: 'Product ID', key: 'id', width: 14, alignment: 'center' },
        { header: 'Product Name', key: 'name', width: 36 },
        {
            header: 'Price (₹)',
            key: 'current_price',
            width: 16,
            type: 'currency',
            alignment: 'right',
            format: (v) => Number(v) || 0,
        },
        {
            header: 'Page Visits',
            key: 'views',
            width: 16,
            type: 'number',
            alignment: 'right',
            format: (v) => Number(v) || 0,
        },
        {
            header: 'Units Ordered',
            key: 'sold_count',
            width: 16,
            type: 'number',
            alignment: 'right',
            format: (v) => Number(v) || 0,
        },
        {
            header: 'Conversion Rate',
            key: 'views',
            width: 18,
            alignment: 'center',
            format: (_, p) => {
                const views = Number(p.views) || 0;
                const sold = Number(p.sold_count) || 0;
                return views > 0 ? ((sold / views) * 100).toFixed(1) + '%' : '0.0%';
            },
        },
    ];

    const todayStr = new Date().toISOString().slice(0, 10);
    const filename = options?.filename || `VorionMart_Analytics_${todayStr}.xlsx`;

    await exportWorkbookTemplate({
        sheetName: 'Product Analytics',
        reportTitle: 'Product Traffic & Conversion Performance',
        subtitle: options?.subtitle || 'Product engagement, reach, and sales metrics',
        kpis,
        columns,
        data: data.products,
        filename,
    });
}


