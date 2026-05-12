using System;
using System.Collections.Generic;

namespace BizCore.Application.DTOs.Report
{
    public class VatReportDto
    {
        // VAT Collected (Output VAT)
        public decimal TotalSalesAmount { get; set; }
        public decimal TaxableSalesAmount { get; set; }
        public decimal VatCollected { get; set; }
        public int SalesInvoiceCount { get; set; }
        
        // VAT Paid (Input VAT)
        public decimal TotalPurchaseAmount { get; set; }
        public decimal TaxablePurchaseAmount { get; set; }
        public decimal VatPaid { get; set; }
        public int PurchaseInvoiceCount { get; set; }
        
        // Net VAT
        public decimal NetVatPayable { get; set; } // VatCollected - VatPaid
        
        public int Month { get; set; }
        public int Year { get; set; }
        public string FiscalYear { get; set; } = string.Empty;
        
        public List<VatTransactionDto> SalesTransactions { get; set; } = new();
        public List<VatTransactionDto> PurchaseTransactions { get; set; } = new();
    }

    public class VatTransactionDto
    {
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public string? PartyPAN { get; set; }
        public decimal Amount { get; set; }
        public decimal TaxableAmount { get; set; }
        public decimal VatAmount { get; set; }
        public string Type { get; set; } = string.Empty; // Sales / Purchase
    }
}
