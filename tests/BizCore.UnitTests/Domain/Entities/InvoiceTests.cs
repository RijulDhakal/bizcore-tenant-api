using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace BizCore.UnitTests.Domain.Entities;

public class InvoiceTests
{
    [Fact]
    public void Invoice_NewInvoice_HasDraftStatus()
    {
        var invoice = new Invoice();
        invoice.Status.Should().Be(InvoiceStatus.Draft);
    }

    [Fact]
    public void Invoice_AddItems_CalculatesTotalCorrectly()
    {
        var invoice = new Invoice { SubTotal = 0, TaxAmount = 0, TotalAmount = 0 };
        var item1 = new InvoiceItem { UnitPrice = 100m, Quantity = 2, Amount = 200m };
        var item2 = new InvoiceItem { UnitPrice = 50m, Quantity = 1, Amount = 50m };

        invoice.Items.Add(item1);
        invoice.Items.Add(item2);
        invoice.SubTotal = 250m;
        invoice.TaxAmount = 25m;
        invoice.TotalAmount = 275m;

        invoice.TotalAmount.Should().Be(275m);
        invoice.Items.Should().HaveCount(2);
    }

    [Theory]
    [InlineData(InvoiceStatus.Draft)]
    [InlineData(InvoiceStatus.Sent)]
    [InlineData(InvoiceStatus.Paid)]
    [InlineData(InvoiceStatus.Overdue)]
    public void Invoice_SetStatus_ReturnsCorrectStatus(InvoiceStatus status)
    {
        var invoice = new Invoice();
        invoice.Status = status;
        invoice.Status.Should().Be(status);
    }

    [Fact]
    public void Invoice_NetPayable_DefaultsToTotalAmount()
    {
        var invoice = new Invoice { TotalAmount = 1000m };
        invoice.NetPayable = invoice.TotalAmount;
        invoice.NetPayable.Should().Be(1000m);
    }
}
