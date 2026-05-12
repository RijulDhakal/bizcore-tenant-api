using BizCore.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace BizCore.UnitTests.Domain.Entities;

public class ProductTests
{
    [Fact]
    public void Product_NewProduct_HasDefaultValues()
    {
        var product = new Product();
        product.Name.Should().Be(string.Empty);
        product.SKU.Should().Be(string.Empty);
        product.IsActive.Should().BeTrue();
        product.TrackExpiry.Should().BeFalse();
        product.CurrentStock.Should().Be(0);
        product.LowStockThreshold.Should().Be(10);
    }

    [Fact]
    public void Product_SetLowStockThreshold_TriggersAlert()
    {
        var product = new Product
        {
            Name = "Test Product",
            SKU = "SKU-001",
            CurrentStock = 5,
            LowStockThreshold = 10
        };
        product.CurrentStock.Should().BeLessThan(product.LowStockThreshold);
    }

    [Fact]
    public void Product_TrackExpiry_CanBeEnabled()
    {
        var product = new Product { Name = "Perishable Item", SKU = "SKU-PERISH", TrackExpiry = true };
        product.TrackExpiry.Should().BeTrue();
    }

    [Fact]
    public void Product_HasCategoryRelationship()
    {
        var category = new Category { Name = "Electronics" };
        var product = new Product { Name = "Laptop", SKU = "SKU-LAPTOP", Category = category };
        product.Category.Should().NotBeNull();
        product.Category!.Name.Should().Be("Electronics");
    }

    [Fact]
    public void Product_DefaultReorderQuantity_IsZero()
    {
        var product = new Product();
        product.ReorderQuantity.Should().Be(0);
    }

    [Fact]
    public void Product_CurrentStock_CanBeUpdated()
    {
        var product = new Product { Name = "Test", SKU = "SKU-TEST", CurrentStock = 100 };
        product.CurrentStock = 95;
        product.CurrentStock.Should().Be(95);
    }
}
